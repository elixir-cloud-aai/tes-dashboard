from services.tes_api import TESApiClient
from services.workflow_service import get_workflow_run_by_id, save_workflow_runs, update_workflow_status, _instance_for_tes_url


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


def parse_snakemake_workflow(snakefile_path):
    import re
    steps = []
    try:
        with open(snakefile_path, 'r') as f:
            content = f.read()
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

    if not steps:
        steps = [{'name': 'Workflow Execution', 'command': 'echo running snakemake', 'inputs': [], 'outputs': []}]

    return steps


def submit_real_workflow(run_id, tes_url, snakefile_path, tes_name=None):
    tes_client = TESApiClient(tes_url, tes_name=tes_name)
    inst = _instance_for_tes_url(tes_url)
    instance_id = inst.get('id') if inst else tes_url
    instance_name = inst.get('name') if inst else (tes_name or tes_url)
    raw_steps = parse_snakemake_workflow(snakefile_path)

    steps = sorted(raw_steps, key=lambda x: 1 if x['name'].lower() == 'all' else 0)

    workflow_run = get_workflow_run_by_id(run_id)
    workflow_run['status'] = 'RUNNING'
    workflow_run['steps'] = []
    workflow_run['tes_tasks'] = []

    for step in steps:
        workflow_run['steps'].append({
            'name': step['name'],
            'status': 'pending',
            'tes_task_id': None,
            'tes_instance_id': instance_id,
            'tes_instance_name': instance_name,
            'command_raw': step['command']
        })
    save_workflow_runs()

    first_step = steps[0]
    tes_task = {
        'name': first_step['name'],
        'executors': [{
            'image': 'ubuntu:latest',
            'command': ['/bin/bash', '-c', first_step['command']],
        }],
        'inputs': first_step['inputs'],
        'outputs': first_step['outputs'],
    }

    task_resp = tes_client.submit_task(tes_task)
    task_id = task_resp.get('id')

    workflow_run['steps'][0]['tes_task_id'] = task_id
    workflow_run['steps'][0]['status'] = 'running'
    workflow_run['tes_tasks'].append(task_id)
    save_workflow_runs()
    steps_list = workflow_run['steps']
    workflow_run['data_flow'] = []

    if steps_list:
        workflow_run['data_flow'].append({'from': 'start', 'to': steps_list[0]['tes_instance_id']})

        for i in range(1, len(steps_list)):
            prev_inst = steps_list[i-1]['tes_instance_id']
            curr_inst = steps_list[i]['tes_instance_id']
            if prev_inst != curr_inst:
                workflow_run['data_flow'].append({'from': prev_inst, 'to': curr_inst})

        workflow_run['data_flow'].append({'from': steps_list[-1]['tes_instance_id'], 'to': 'end'})

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
    tes_client = TESApiClient(tes_url, tes_name=tes_name)
    workflow_run = get_workflow_run_by_id(run_id)
    if not workflow_run or not workflow_run.get('steps'):
        return

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
