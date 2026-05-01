import os
import shutil
import subprocess
import sys
from datetime import datetime

from services.tes_api import TESApiClient, preflight_tes_endpoint
from services.workflow_service import get_workflow_run_by_id, save_workflow_runs, update_workflow_status, _instance_for_tes_url


_LOCAL_ENGINE_PROCS = {}


def _ensure_snakemake_command():
    snakemake_bin = shutil.which('snakemake')
    if snakemake_bin:
        return [snakemake_bin]

    mod_check = subprocess.run(
        [sys.executable, '-m', 'snakemake', '--version'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if mod_check.returncode == 0:
        return [sys.executable, '-m', 'snakemake']

    install_cmd = [sys.executable, '-m', 'pip', 'install']
    if sys.prefix == sys.base_prefix:
        install_cmd.append('--user')
    install_cmd.append('snakemake')

    install = subprocess.run(
        install_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    if install.returncode != 0:
        raise RuntimeError(
            'snakemake is not installed and automatic installation failed. '
            f'pip output: {install.stdout[-500:]}'
        )

    final_check = subprocess.run(
        [sys.executable, '-m', 'snakemake', '--version'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if final_check.returncode == 0:
        return [sys.executable, '-m', 'snakemake']

    raise RuntimeError('snakemake installation finished but command is still unavailable')


def _normalize_step_status(tes_state):
    if not tes_state:
        return 'pending'
    s = str(tes_state).upper()
    if s == 'RUNNING':
        return 'running'
    if s in ('QUEUED', 'INITIALIZING', 'PAUSED', 'UNKNOWN'):
        return 'pending'
    if s in ('CANCELED', 'CANCELLED'):
        return 'canceled'
    if s in ('EXECUTOR_ERROR', 'SYSTEM_ERROR', 'UNKNOWN'):
        return 'failed'
    return s.lower()


def _aggregate_status_from_steps(step_states_raw):
    states = [str(x or '').upper() for x in step_states_raw]
    if not states:
        return 'RUNNING'

    fail = {'EXECUTOR_ERROR', 'SYSTEM_ERROR', 'UNKNOWN', 'SUBMISSION_ERROR', 'FAILED'}
    non_terminal = {'RUNNING', 'QUEUED', 'INITIALIZING', 'PAUSED', 'PENDING'}

    if any(s in fail for s in states):
        return 'FAILED'

    if any(s in ('CANCELED', 'CANCELLED') for s in states):
        return 'CANCELED'

    if any(s in non_terminal for s in states):
        return 'RUNNING'

    if all(s == 'COMPLETE' for s in states):
        return 'COMPLETE'

    if any(s in ('CANCELED', 'CANCELLED') for s in states):
        return 'CANCELED'

    return 'RUNNING'


def _build_engine_command(workflow_type, workflow_path):
    wf_type = (workflow_type or '').lower()
    if wf_type == 'snakemake':
        snakemake_cmd = _ensure_snakemake_command()
        return [*snakemake_cmd, '--snakefile', workflow_path, '--cores', '1', '--printshellcmds']
    if wf_type == 'nextflow':
        if not shutil.which('nextflow'):
            raise RuntimeError('nextflow is not installed on the backend host')
        return ['nextflow', 'run', workflow_path]
    raise RuntimeError(f'Workflow type "{workflow_type}" does not have a native engine runner')


def submit_real_workflow(run_id, tes_url, workflow_path, workflow_type='snakemake', tes_name=None):
    inst = _instance_for_tes_url(tes_url)
    selected_instance_id = inst.get('id') if inst else tes_url
    selected_instance_name = inst.get('name') if inst else (tes_name or tes_url)
    # Strict gate: selected TES must be reachable/auth-valid before accepting execution.
    preflight_tes_endpoint(selected_instance_name, tes_url)
    engine = (workflow_type or '').lower()
    workflow_path = os.path.abspath(workflow_path)
    command = _build_engine_command(engine, workflow_path)
    log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/workflow_logs'))
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f'{run_id}.log')

    workflow_run = get_workflow_run_by_id(run_id)
    workflow_run['status'] = 'RUNNING'
    workflow_run['execution_backend'] = 'native_engine'
    workflow_run['execution_location'] = 'dashboard-local'
    workflow_run['selected_tes_instance_id'] = selected_instance_id
    workflow_run['selected_tes_instance_name'] = selected_instance_name
    workflow_run['engine'] = engine
    workflow_run['engine_command'] = command
    workflow_run['engine_log_path'] = log_path
    workflow_run['steps'] = [{
        'name': f'{engine.upper()} workflow execution',
        'status': 'running',
        'tes_task_id': None,
        'tes_instance_id': 'dashboard-local',
        'tes_instance_name': 'Dashboard Host (local engine)',
        'start_time': datetime.utcnow().isoformat(),
        'end_time': None,
    }]
    workflow_run['data_flow'] = [
        {'from': 'start', 'to': 'dashboard-local'},
        {'from': 'dashboard-local', 'to': 'end'}
    ]

    with open(log_path, 'w', encoding='utf-8') as log_file:
        proc = subprocess.Popen(
            command,
            cwd=os.path.dirname(workflow_path) or '.',
            stdout=log_file,
            stderr=subprocess.STDOUT,
            text=True,
        )

    _LOCAL_ENGINE_PROCS[run_id] = proc
    workflow_run['engine_pid'] = proc.pid
    save_workflow_runs()
    return workflow_run


def submit_single_tes_probe_task(run_id, tes_url, tes_name, wf_label='workflow'):
    """
    Submit one lightweight TES task so we can poll real task state for Nextflow/CWL runs.
    Running the uploaded workflow engine on TES still requires inputs/staging beyond this dashboard.
    """
    tes_client = TESApiClient(tes_url, tes_name=tes_name)
    inst = _instance_for_tes_url(tes_url)
    instance_id = inst.get('id') if inst else tes_url
    instance_name = inst.get('name') if inst else (tes_name or tes_url)
    workflow_run = get_workflow_run_by_id(run_id)
    workflow_run['status'] = 'RUNNING'
    tes_task = {
        'name': f'{wf_label}-{run_id[:8]}',
        'description': 'Dashboard TES probe task for live status (workflow file is tracked locally).',
        'executors': [{
            'image': 'alpine:latest',
            'command': ['/bin/sh', '-c', 'echo "tes-dashboard-probe-ok"'],
        }],
        'inputs': [],
        'outputs': [],
    }
    task_resp = tes_client.submit_task(tes_task)
    task_id = task_resp.get('id')
    workflow_run['tes_probe_task_id'] = task_id

    initial_tes_state = task_resp.get('state', 'QUEUED')
    initial_norm_status = _normalize_step_status(initial_tes_state)

    workflow_run['steps'] = [{
        'name': f'{wf_label.upper()} on TES (live task)',
        'status': initial_norm_status,
        'tes_task_id': task_id,
        'tes_instance_id': instance_id,
        'tes_instance_name': instance_name,
        'start_time': None,
        'end_time': None,
    }]
    workflow_run['steps'].append({
        'name': 'Results Aggregation (Dashboard Step)',
        'status': 'pending',
        'tes_task_id': None,
        'tes_instance_id': 'dashboard-local',
        'tes_instance_name': 'Dashboard Orchestrator',
        'start_time': None,
        'end_time': None,
    })
    workflow_run['data_flow'] = [
        {'from': 'start', 'to': instance_id},
        {'from': instance_id, 'to': 'dashboard-local'},
        {'from': 'dashboard-local', 'to': 'end'}
    ]
    save_workflow_runs()
    return workflow_run


def poll_and_update_workflow(run_id, tes_url, tes_name=None):
    workflow_run = get_workflow_run_by_id(run_id)
    if not workflow_run or not workflow_run.get('steps'):
        return

    if workflow_run.get('execution_backend') == 'native_engine':
        proc = _LOCAL_ENGINE_PROCS.get(run_id)
        step = workflow_run['steps'][0]
        if not proc:
            if workflow_run.get('status') == 'RUNNING':
                step['status'] = 'failed'
                step['tes_state'] = 'SYSTEM_ERROR'
                step['end_time'] = datetime.utcnow().isoformat()
                workflow_run['error_message'] = 'Workflow process handle unavailable; backend restart may have occurred.'
                update_workflow_status(run_id, 'FAILED')
                save_workflow_runs()
            return

        rc = proc.poll()
        if rc is None:
            step['status'] = 'running'
            step['tes_state'] = 'RUNNING'
            save_workflow_runs()
            return

        if rc == 0:
            step['status'] = 'complete'
            step['tes_state'] = 'COMPLETE'
            update_workflow_status(run_id, 'COMPLETE')
        else:
            step['status'] = 'failed'
            step['tes_state'] = 'FAILED'
            workflow_run['error_message'] = f'Native engine exited with code {rc}. See engine_log_path for details.'
            update_workflow_status(run_id, 'FAILED')
        step['end_time'] = datetime.utcnow().isoformat()
        _LOCAL_ENGINE_PROCS.pop(run_id, None)
        save_workflow_runs()
        return

    tes_client = TESApiClient(tes_url, tes_name=tes_name)
    any_step_changed = False
    for idx, step in enumerate(workflow_run['steps']):
        tid = step.get('tes_task_id')
        if tid:
            try:
                task = tes_client.get_task(tid)
            except Exception as e:
                print(f"⚠️ Task {tid} not found or error fetching: {e}")
                step['status'] = 'failed'
                step['tes_state'] = 'SYSTEM_ERROR'
                any_step_changed = True
                continue

            st = task.get('state', 'UNKNOWN')
            norm_status = _normalize_step_status(st)

            if step.get('status') != norm_status:
                step['status'] = norm_status
                any_step_changed = True

            step['tes_state'] = st
            if task.get('creation_time'):
                step.setdefault('start_time', task.get('creation_time'))
            if task.get('end_time'):
                step['end_time'] = task.get('end_time')

        if step.get('status') == 'complete' and idx + 1 < len(workflow_run['steps']):
            next_step = workflow_run['steps'][idx + 1]
            if next_step.get('status') == 'pending' and not next_step.get('tes_task_id'):
                print(f"Submitting sequential step: {next_step['name']}")
                new_tes_task = {
                    'name': next_step['name'],
                    'executors': [{
                        'image': 'ubuntu:latest',
                        'command': ['/bin/bash', '-c', next_step.get('command_raw', 'echo next step')],
                    }],
                    'inputs': [], 
                    'outputs': [],
                }
                try:
                    resp = tes_client.submit_task(new_tes_task)
                    next_step['tes_task_id'] = resp.get('id')
                    next_step['status'] = 'running'
                    workflow_run['tes_tasks'].append(resp.get('id'))
                    any_step_changed = True
                except Exception as e:
                    print(f"Error submitting sequential step: {e}")
                    next_step['status'] = 'failed'

    if len(workflow_run['steps']) > 1:
        primary_status = workflow_run['steps'][0]['status']
        workflow_run['steps'][1]['status'] = primary_status

    raw_states = []
    for step in workflow_run['steps']:
        st = step.get('tes_state') or step['status'].upper()
        raw_states.append(st)

    if raw_states:
        agg = _aggregate_status_from_steps(raw_states)
        update_workflow_status(run_id, agg)
    save_workflow_runs()
