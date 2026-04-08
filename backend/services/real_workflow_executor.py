from services.tes_api import TESApiClient
from services.workflow_service import get_workflow_run_by_id, save_workflow_runs, update_workflow_status, _instance_for_tes_url


def _normalize_step_status(tes_state):
    if not tes_state:
        return 'unknown'
    s = str(tes_state).upper()
    if s == 'RUNNING':
        return 'running'
    if s in ('QUEUED', 'INITIALIZING', 'PAUSED'):
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
    fail = {'EXECUTOR_ERROR', 'SYSTEM_ERROR', 'UNKNOWN'}
    if any(s in fail for s in states):
        return 'FAILED'
    if any(s in ('CANCELED', 'CANCELLED') for s in states):
        return 'CANCELED'
    if all(s == 'COMPLETE' for s in states):
        return 'COMPLETE'
    if any(s == 'RUNNING' for s in states):
        return 'RUNNING'
    return 'RUNNING'


# Parse Snakefile — extract rules to create dynamic TES tasks
def parse_snakemake_workflow(snakefile_path):
    import re
    steps = []
    try:
        with open(snakefile_path, 'r') as f:
            content = f.read()
            # Basic regex to find rule names and shell/run commands
            rules = re.findall(r'rule\s+(\w+):.*?(?:shell|run):\s*["\'](.*?)["\']', content, re.DOTALL)
            for name, cmd in rules:
                steps.append({
                    'name': name.replace('_', ' ').title(),
                    'command': cmd.strip(),
                    'inputs': [],
                    'outputs': []
                })
    except Exception as e:
        print(f"Error parsing Snakefile: {e}")

    # Fallback if no rules found or parsing fails
    if not steps:
        steps = [{'name': 'Workflow Execution', 'command': 'echo running snakemake', 'inputs': [], 'outputs': []}]

    return steps


def submit_real_workflow(run_id, tes_url, snakefile_path, tes_name=None):
    tes_client = TESApiClient(tes_url, tes_name=tes_name)
    inst = _instance_for_tes_url(tes_url)
    instance_id = inst.get('id') if inst else tes_url
    instance_name = inst.get('name') if inst else (tes_name or tes_url)
    steps = parse_snakemake_workflow(snakefile_path)
    workflow_run = get_workflow_run_by_id(run_id)
    workflow_run['steps'] = []
    workflow_run['tes_tasks'] = []
    for idx, step in enumerate(steps):
        tes_task = {
            'name': step['name'],
            'executors': [{
                'image': 'ubuntu:latest',
                'command': ['/bin/bash', '-c', step['command']],
            }],
            'inputs': step['inputs'],
            'outputs': step['outputs'],
        }
        task_resp = tes_client.submit_task(tes_task)
        task_id = task_resp.get('id')
        workflow_run['steps'].append({
            'name': step['name'],
            'status': 'pending',
            'tes_task_id': task_id,
            'tes_instance_id': instance_id,
            'tes_instance_name': instance_name,
        })
        workflow_run['tes_tasks'].append(task_id)
        save_workflow_runs()
    steps_list = workflow_run['steps']
    workflow_run['data_flow'] = []
    for i in range(len(steps_list)):
        if i == 0:
            workflow_run['data_flow'].append({'from': 'start', 'to': steps_list[i]['tes_instance_id']})
        else:
            workflow_run['data_flow'].append({'from': steps_list[i-1]['tes_instance_id'], 'to': steps_list[i]['tes_instance_id']})
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
    workflow_run['steps'] = [{
        'name': f'{wf_label.upper()} on TES (live task)',
        'status': task_resp.get('state', 'QUEUED'),
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
        'tes_instance_id': instance_id,
        'tes_instance_name': instance_name,
        'start_time': None,
        'end_time': None,
    })
    workflow_run['data_flow'] = [
        {'from': 'start', 'to': instance_id},
        {'from': instance_id, 'to': instance_id}
    ]
    save_workflow_runs()
    return workflow_run


def poll_and_update_workflow(run_id, tes_url, tes_name=None):
    tes_client = TESApiClient(tes_url, tes_name=tes_name)
    workflow_run = get_workflow_run_by_id(run_id)
    if not workflow_run or not workflow_run.get('steps'):
        return
    raw_states = []
    for idx, step in enumerate(workflow_run['steps']):
        if step.get('tes_task_id'):
            task = tes_client.get_task(step['tes_task_id'])
            st = task.get('state', 'UNKNOWN')
            raw_states.append(st)
            norm_status = _normalize_step_status(st)
            step['status'] = norm_status
            step['tes_state'] = st
            if task.get('creation_time'):
                step.setdefault('start_time', task.get('creation_time'))
            if task.get('end_time'):
                step['end_time'] = task.get('end_time')

            # Sync virtual dashboard steps with the primary task status
            if idx == 0 and len(workflow_run['steps']) > 1:
                workflow_run['steps'][1]['status'] = norm_status
    if raw_states:
        agg = _aggregate_status_from_steps(raw_states)
        update_workflow_status(run_id, agg)
    save_workflow_runs()
