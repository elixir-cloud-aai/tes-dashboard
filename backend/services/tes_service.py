import requests
import time
import subprocess
from datetime import datetime, timezone
from utils.tes_utils import load_tes_instances, load_tes_location_data
from utils.auth_utils import get_instance_credentials
from services.task_service import get_submitted_tasks

def get_healthy_instances():
    """Get ONLY instances that are actually responding AND can accept tasks (with caching)"""
    import json
    from pathlib import Path
    import requests
    import time

    # Load all configured instances
    tes_locations_file = Path(__file__).parent.parent / 'tes_instance_locations.json'
    if not tes_locations_file.exists():
        return []

    with open(tes_locations_file, 'r') as f:
        instances = json.load(f)


    healthy_instances = []

    for instance in instances:
        url = instance.get('url', '').rstrip('/')
        instance_id = instance.get('id', url)
        instance_name = instance.get('name', '')


        service_info_endpoints = [
            f"{url}/ga4gh/tes/v1/service-info",
            f"{url}/service-info",
            f"{url}/v1/service-info"
        ]

        service_info_ok = False
        for endpoint in service_info_endpoints:
            try:
                response = requests.get(
                    endpoint,
                    timeout=5,
                    headers={'Accept': 'application/json'}
                )
                if response.status_code == 200:
                    service_info_ok = True
                    break
            except:
                continue


        if not service_info_ok:
            continue


        credentials = get_instance_credentials(instance_name, url)

        headers = {'Accept': 'application/json'}
        auth = None
        has_credentials = False

        if credentials.get('token'):
            headers['Authorization'] = f"Bearer {credentials['token']}"
            has_credentials = True
        elif credentials.get('user') and credentials.get('password'):
            auth = (credentials['user'], credentials['password'])
            has_credentials = True


        tasks_endpoints = [
            f"{url}/ga4gh/tes/v1/tasks?view=MINIMAL",
            f"{url}/v1/tasks?view=MINIMAL"
        ]

        tasks_ok = False
        for tasks_endpoint in tasks_endpoints:
            try:
                tasks_response = requests.get(
                    tasks_endpoint,
                    headers=headers,
                    auth=auth,
                    timeout=5
                )

                if tasks_response.status_code == 200:
                    tasks_ok = True
                    break
            except:
                continue


        if tasks_ok:
            instance['status'] = 'healthy'
            instance['last_checked'] = datetime.now().isoformat()
            healthy_instances.append(instance)

    return healthy_instances

def fetch_tes_status(instance):
    try:
        tes_base_url = instance.get("url", "").rstrip("/")
        if not tes_base_url:
            return {**instance, "status": "Error: Missing URL", "status_detail": "No URL provided for this instance."}

        # List of endpoints to check for service-info
        endpoints_to_try = [
            f"{tes_base_url}/v1/service-info",
            f"{tes_base_url}/ga4gh/tes/v1/service-info",
            f"{tes_base_url}/service-info",
            tes_base_url
        ]

        status = "unreachable"
        status_detail = "Instance is not reachable."
        latency_ms = 0
        start_time = time.time()
        http_status = None
        endpoint_checked = None
        error_detail = None
        response_content = None
        best_status = None
        best_detail = None
        best_endpoint = None
        best_http_status = None
        best_content = None

        # Try each endpoint for reachability and info, keep the best/most informative result
        for endpoint in endpoints_to_try:
            try:
                start_time = time.time()
                resp = requests.get(endpoint, timeout=7, headers={'Accept': 'application/json'})
                latency_ms = int((time.time() - start_time) * 1000)
                http_status = resp.status_code
                endpoint_checked = endpoint
                try:
                    response_content = resp.json()
                except Exception:
                    response_content = resp.text
                # Special case: Funnel @ ELIXIR-CZ always requires authentication
                if tes_base_url == "https://funnel.cloud.e-infra.cz":
                    status = "Auth Required (401)"
                    status_detail = f"Authentication required at {endpoint}. (Funnel @ ELIXIR-CZ)"
                    best_status = status
                    best_detail = status_detail
                    best_endpoint = endpoint
                    best_http_status = 401
                    best_content = response_content
                    break
                # Prefer 200, then 401, then 403, then 404, then others
                if http_status == 200:
                    status = "Healthy"
                    status_detail = f"Service-info endpoint responded OK at {endpoint}."
                    best_status = status
                    best_detail = status_detail
                    best_endpoint = endpoint
                    best_http_status = http_status
                    best_content = response_content
                    break
                elif http_status == 401:
                    status = "Auth Required (401)"
                    status_detail = f"Authentication required at {endpoint}."
                    # Prefer 401 over 403/404/other errors, but not over 200
                    if not best_status or best_http_status not in [200, 401]:
                        best_status = status
                        best_detail = status_detail
                        best_endpoint = endpoint
                        best_http_status = http_status
                        best_content = response_content
                elif http_status == 403:
                    status = "Forbidden (403)"
                    status_detail = f"Forbidden: Authentication/authorization required at {endpoint}."
                    # Prefer 403 over 404/other errors, but not over 200/401
                    if not best_status or best_http_status not in [200, 401, 403]:
                        best_status = status
                        best_detail = status_detail
                        best_endpoint = endpoint
                        best_http_status = http_status
                        best_content = response_content
                elif http_status == 404:
                    status = "Not Found (404)"
                    status_detail = f"Service-info endpoint not found at {endpoint}."
                    # Prefer 404 over other errors, but not over 200/401/403
                    if not best_status or best_http_status not in [200, 401, 403, 404]:
                        best_status = status
                        best_detail = status_detail
                        best_endpoint = endpoint
                        best_http_status = http_status
                        best_content = response_content
                else:
                    status = f"HTTP {http_status}"
                    status_detail = f"HTTP {http_status} at {endpoint}."
                    # Only set as best if nothing else has been set
                    if not best_status:
                        best_status = status
                        best_detail = status_detail
                        best_endpoint = endpoint
                        best_http_status = http_status
                        best_content = response_content
            except requests.exceptions.Timeout:
                status = "Timeout"
                status_detail = f"Timeout connecting to {endpoint}."
                if not best_status:
                    best_status = status
                    best_detail = status_detail
                    best_endpoint = endpoint
                    best_http_status = None
                    best_content = None
                continue
            except requests.exceptions.ConnectionError as ce:
                status = "Connection Failed"
                status_detail = f"Connection failed: {ce} at {endpoint}."
                if not best_status:
                    best_status = status
                    best_detail = status_detail
                    best_endpoint = endpoint
                    best_http_status = None
                    best_content = None
                continue
            except Exception as e:
                status = "Error"
                status_detail = f"Error: {str(e)} at {endpoint}."
                if not best_status:
                    best_status = status
                    best_detail = status_detail
                    best_endpoint = endpoint
                    best_http_status = None
                    best_content = None
                continue

        # Compose result
        tasks_for_instance = 0
        try:
            base_url_normalized = tes_base_url.rstrip("/")
            submitted_tasks = get_submitted_tasks()
            tasks_for_instance = sum(
                1
                for t in submitted_tasks
                if isinstance(t, dict)
                and t.get("tes_url", "").rstrip("/") == base_url_normalized
            )
        except Exception as e:
            print(f"Failed to count tasks for instance {tes_base_url}: {e}")

        enriched = {
            **instance,
            "status": best_status or status,
            "status_detail": best_detail or status_detail,
            "http_status": best_http_status,
            "checked_endpoint": best_endpoint,
            "error_detail": error_detail,
            "response_content": best_content,
            "version": best_content.get("version", "") if isinstance(best_content, dict) else "",
            "latency": latency_ms,
            "tasks": tasks_for_instance,
            "taskCount": tasks_for_instance,
            "cpuUsage": 0,
            "memoryUsage": 0,
            "throughput": "N/A",
            "uptime": "N/A",
            "lastChecked": datetime.now(timezone.utc).isoformat(),
        }
        return enriched
    except Exception as e:
        print(f"TES location check failed for {instance.get('url')}: {e}")
        return {
            **instance,
            "status": "unreachable",
            "status_detail": str(e),
            "latency": None,
            "tasks": 0,
            "taskCount": 0,
            "cpuUsage": 0,
            "memoryUsage": 0,
            "throughput": "N/A",
            "uptime": "N/A",
            "lastChecked": datetime.now(timezone.utc).isoformat(),
        }

def get_service_info(tes_url):
    """Get service info from a TES instance with multiple endpoint attempts"""
    try:
        endpoints_to_try = [
            f"{tes_url}/v1/service-info",
            f"{tes_url}/ga4gh/tes/v1/service-info",
            f"{tes_url}/service-info",
            f"{tes_url}/api/service-info",
            f"{tes_url}/api/v1/service-info",
        ]

        last_error = None
        auth_required = False

        for endpoint in endpoints_to_try:
            try:
                print(f"🔍 Trying service-info endpoint: {endpoint}")
                response = requests.get(
                    endpoint,
                    timeout=10,
                    headers={
                        'Accept': 'application/json',
                        'User-Agent': 'TES-Dashboard/1.0'
                    },
                    verify=True
                )

                print(f"📊 Response status: {response.status_code}")

                if response.status_code == 200:
                    try:
                        service_info = response.json()
                        print(f"✅ Successfully got service info from {endpoint}")
                        return service_info
                    except ValueError as json_error:
                        print(f"⚠️ Invalid JSON response: {json_error}")
                        last_error = f"Invalid JSON: {json_error}"
                        continue

                elif response.status_code == 403:
                    print(f"🔒 Endpoint {endpoint} requires authentication")
                    auth_required = True
                    last_error = "Authentication required"
                    break

                else:
                    print(f"⚠️ Status {response.status_code} from {endpoint}")
                    last_error = f"HTTP {response.status_code}"
                    continue

            except requests.exceptions.Timeout:
                print(f"⏱️ Timeout: {endpoint}")
                last_error = "Connection timeout"
                continue

            except requests.exceptions.SSLError as ssl_error:
                print(f"🔐 SSL error: {ssl_error}")
                last_error = f"SSL error: {ssl_error}"
                continue

            except requests.exceptions.ConnectionError as conn_error:
                print(f"🔌 Connection error: {conn_error}")
                last_error = f"Connection failed: {conn_error}"
                continue

            except Exception as e:
                print(f"❌ Error: {type(e).__name__}: {e}")
                last_error = str(e)
                continue

        # Get instance name from config
        instance_name = tes_url
        try:
            instances = load_tes_location_data()
            for instance in instances:
                if instance.get('url', '').rstrip('/') == tes_url.rstrip('/'):
                    instance_name = instance.get('name', tes_url)
                    break
        except:
            pass

        if auth_required:
            print(f"✅ Service is running but requires authentication")
            return {
                'name': instance_name,
                'id': tes_url,
                'organization': {
                    'name': 'GA4GH TES',
                    'url': tes_url
                },
                'description': 'This TES instance requires authentication to view detailed service information.',
                'type': {
                    'group': 'ga4gh',
                    'artifact': 'tes',
                    'version': '1.0'
                },
                'contactUrl': 'Authentication Required',
                'documentationUrl': 'Authentication Required',
                'createdAt': 'Unknown',
                'storage': ['Unknown'],
                'version': '1.0',
                'environment': 'production',
                'auth_required': True,
                'message': 'Service is operational but requires authentication for detailed info',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

        error_message = f"Could not retrieve service info from {tes_url}. Reason: {last_error}"
        print(f"❌ All endpoints failed: {error_message}")

        # Return a proper service info structure even for errors
        return {
            'name': instance_name,
            'id': tes_url,
            'organization': {
                'name': 'GA4GH TES',
                'url': tes_url
            },
            'description': f'Service information unavailable: {last_error}',
            'type': {
                'group': 'ga4gh',
                'artifact': 'tes',
                'version': '1.0'
            },
            'contactUrl': 'Unknown',
            'documentationUrl': 'Unknown',
            'createdAt': 'Unknown',
            'storage': ['Unknown'],
            'version': '1.0',
            'environment': 'production',
            'error': True,
            'error_message': error_message,
            'error_reason': last_error or 'All service-info endpoints failed',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__}: {e}")

        # Get instance name from config
        instance_name = tes_url
        try:
            instances = load_tes_location_data()
            for instance in instances:
                if instance.get('url', '').rstrip('/') == tes_url.rstrip('/'):
                    instance_name = instance.get('name', tes_url)
                    break
        except:
            pass

        return {
            'name': instance_name,
            'id': tes_url,
            'organization': {
                'name': 'GA4GH TES',
                'url': tes_url
            },
            'description': f'Unexpected error: {str(e)}',
            'type': {
                'group': 'ga4gh',
                'artifact': 'tes',
                'version': '1.0'
            },
            'contactUrl': 'Unknown',
            'documentationUrl': 'Unknown',
            'createdAt': 'Unknown',
            'storage': ['Unknown'],
            'version': '1.0',
            'environment': 'production',
            'error': True,
            'error_message': f'Unexpected error: {str(e)}',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
