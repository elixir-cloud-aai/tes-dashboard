import json
import os
from utils.tes_utils import load_tes_location_data

WORKFLOW_RUNS_FILE = os.path.join(os.path.dirname(__file__), '../data/workflow_runs.json')

# Load workflow runs from file if it exists
if os.path.exists(WORKFLOW_RUNS_FILE):
    with open(WORKFLOW_RUNS_FILE, 'r') as f:
        try:
            workflow_runs = json.load(f)
        except Exception:
            workflow_runs = []
else:
    workflow_runs = []

def save_workflow_runs():
    os.makedirs(os.path.dirname(WORKFLOW_RUNS_FILE), exist_ok=True)
    with open(WORKFLOW_RUNS_FILE, 'w') as f:
        json.dump(workflow_runs, f, indent=2, default=str)

def get_workflow_runs():
    return workflow_runs

def _instance_for_tes_url(tes_url):
    if not tes_url:
        return None
    key = tes_url.rstrip('/').lower()
    for loc in load_tes_location_data():
        if loc.get('url', '').rstrip('/').lower() == key:
            return loc
    return None


def add_workflow_run(workflow):
    """
    Persist a workflow run. Snakemake steps/data_flow are filled by submit_real_workflow.
    Other types get a single step on the TES node the user selected (real topology, not random).
    """
    wf_type = (workflow.get('type') or '').lower()
    if wf_type == 'snakemake':
        workflow.setdefault('steps', [])
        workflow.setdefault('data_flow', [])
    elif not workflow.get('steps'):
        inst = _instance_for_tes_url(workflow.get('tes_url'))
        if inst:
            iid = inst.get('id')
            iname = inst.get('name')
        else:
            iid = (workflow.get('tes_name') or 'unknown').lower().replace(' ', '-').replace('/', '-')[:64]
            iname = workflow.get('tes_name') or 'Unknown'
        label = wf_type.upper() if wf_type else 'Workflow'
        workflow['steps'] = [
            {
                'name': f'{label} execution',
                'status': 'pending',
                'tes_instance_id': iid,
                'tes_instance_name': iname,
                'start_time': None,
                'end_time': None,
            }
        ]
        workflow['data_flow'] = [{'from': 'start', 'to': iid}]
    workflow_runs.append(workflow)
    save_workflow_runs()

def get_workflow_run_by_id(run_id):
    for run in workflow_runs:
        if run.get('run_id') == run_id:
            return run
    return None

def update_workflow_step(run_id, step_index, status):
    run = get_workflow_run_by_id(run_id)
    if run and 'steps' in run and 0 <= step_index < len(run['steps']):
        run['steps'][step_index]['status'] = status
        save_workflow_runs()
        return True
    return False


def update_workflow_status(run_id, status):
    run = get_workflow_run_by_id(run_id)
    if run:
        run['status'] = status
        save_workflow_runs()
        return True
    return False
