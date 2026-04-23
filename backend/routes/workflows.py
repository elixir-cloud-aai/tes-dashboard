from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
import os
from services.workflow_service import get_workflow_runs, add_workflow_run, get_workflow_run_by_id, save_workflow_runs
from utils.tes_utils import load_tes_instances
from config import UPLOAD_FOLDER
from services.real_workflow_executor import (
    submit_real_workflow,
    poll_and_update_workflow,
    submit_single_tes_probe_task,
)
import threading
import time
import logging

logger = logging.getLogger(__name__)

workflows_bp = Blueprint('workflows', __name__)

current_workflow_step = 0
latest_workflow_path = []

@workflows_bp.route('/api/workflows', methods=['GET'])
def get_workflows():
    runs = get_workflow_runs()
    sorted_runs = sorted(runs, key=lambda x: x.get('submitted_at', ''), reverse=True)
    return jsonify(sorted_runs)

@workflows_bp.route('/api/submit_workflow', methods=['POST'])
def submit_workflow():
    try:
        workflow_type = request.form.get('wf_type', 'cwl')
        tes_instance = request.form.get('wf_tes_instance')

        run_id = str(uuid.uuid4())

        tes_name = 'Unknown'
        tes_instances = load_tes_instances()
        target_inst = next((inst for inst in tes_instances if inst['url'].rstrip('/') == tes_instance.rstrip('/')), None)
        if target_inst:
            tes_name = target_inst['name']

        uploaded_files = []
        for file_key in request.files:
            file = request.files[file_key]
            if file and file.filename:
                filename = f"{run_id}_{file.filename}"
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                uploaded_files.append({'key': file_key, 'filename': filename, 'path': filepath})

        workflow_run_data = {
            'run_id': run_id,
            'type': workflow_type,
            'tes_url': tes_instance,
            'tes_name': tes_name,
            'status': 'RUNNING',
            'submitted_at': datetime.utcnow().isoformat(),
            'files': uploaded_files
        }

        add_workflow_run(workflow_run_data)

        wf_lower = workflow_type.lower()

        def _monitor_tes():
            while True:
                try:
                    poll_and_update_workflow(run_id, tes_instance, tes_name)
                    wr = get_workflow_run_by_id(run_id)
                    if wr and wr.get('status') in ('COMPLETE', 'FAILED', 'CANCELED'):
                        break
                except Exception as ex:
                    logger.warning('workflow poll %s: %s', run_id, ex)
                time.sleep(5)

        try:
            if wf_lower == 'snakemake' and uploaded_files:
                snakefile_path = uploaded_files[0]['path']
                submit_real_workflow(run_id, tes_instance, snakefile_path, tes_name=tes_name)
                threading.Thread(target=_monitor_tes, daemon=True).start()
            elif wf_lower in ('nextflow', 'cwl'):
                submit_single_tes_probe_task(
                    run_id, tes_instance, tes_name, wf_label=wf_lower
                )
                threading.Thread(target=_monitor_tes, daemon=True).start()
        except Exception as ex:
            logger.exception('TES workflow submission failed for %s', run_id)
            error_msg = str(ex)

            workflow_run = get_workflow_run_by_id(run_id)
            if workflow_run:
                workflow_run['status'] = 'SUBMISSION_ERROR'
                workflow_run['error_message'] = f"Submission Failed: {error_msg}"
                workflow_run['error_type'] = 'SUBMISSION_ERROR'
                workflow_run['error_details'] = error_msg
                if 'steps' in workflow_run and workflow_run['steps']:
                    for step in workflow_run['steps']:
                        step['status'] = 'failed'
                        step['tes_state'] = 'FAILED'
                else:
                    workflow_run['steps'] = [{
                        'name': f'{workflow_type.upper()} execution',
                        'status': 'failed',
                        'tes_state': 'FAILED',
                        'tes_instance_id': 'error-node',
                        'tes_instance_name': tes_name
                    }]
                save_workflow_runs()

            return jsonify({
                'success': False,
                'error': f'Failed to submit {workflow_type.upper()} workflow: {error_msg}',
                'status': 'SUBMISSION_ERROR',
                'run_id': run_id,
                'tes_url': tes_instance,
                'tes_name': tes_name
            }), 500

        global current_workflow_step, latest_workflow_path
        current_workflow_step = 2
        latest_workflow_path = [tes_name] if tes_name != 'Unknown' else []

        return jsonify({
            'success': True,
            'run_id': run_id,
            'message': f'{workflow_type.upper()} workflow submitted successfully to {tes_name}'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@workflows_bp.route('/api/latest_workflow_status', methods=['GET'])
def latest_workflow_status():
    global current_workflow_step, latest_workflow_path
    return jsonify({
        'currentStep': current_workflow_step,
        'latestPath': latest_workflow_path
    })

@workflows_bp.route('/api/workflow_run/<run_id>', methods=['GET'])
def get_workflow_run(run_id):
    from services.workflow_service import get_workflow_run_by_id
    run = get_workflow_run_by_id(run_id)
    if run:
        return jsonify(run)
    else:
        return jsonify({'error': 'Workflow run not found'}), 404

@workflows_bp.route('/api/workflow_run/<run_id>/step/<int:step_index>', methods=['POST'])
def update_workflow_step_status(run_id, step_index):
    from services.workflow_service import update_workflow_step
    data = request.get_json() or {}
    status = data.get('status')
    if not status:
        return jsonify({'error': 'Missing status'}), 400
    if update_workflow_step(run_id, step_index, status):
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Workflow run or step not found'}), 404
