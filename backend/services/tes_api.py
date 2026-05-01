import requests
from utils.auth_utils import get_instance_credentials


def resolve_tes_tasks_base_url(tes_name, tes_url):
    """
    Discover the TES tasks collection URL (POST target) by probing service-info.
    Deployments differ: e.g. ELIXIR-GR uses /v1/tasks while others use /ga4gh/tes/v1/tasks.
    Same logic as routes/tasks.submit_task endpoint_patterns.
    """
    base_url = (tes_url or "").rstrip("/")
    if not base_url:
        return None
    patterns = [
        (f"{base_url}/ga4gh/tes/v1/service-info", f"{base_url}/ga4gh/tes/v1/tasks"),
        (f"{base_url}/v1/service-info", f"{base_url}/v1/tasks"),
        (f"{base_url}/service-info", f"{base_url}/tasks"),
    ]
    headers, auth = _auth_for_tes(tes_name, base_url)
    probe_headers = {**headers, "Accept": "application/json"}
    for service_info_url, tasks_base in patterns:
        try:
            r = requests.get(
                service_info_url, headers=probe_headers, auth=auth, timeout=15
            )
            if r.status_code == 200:
                return tasks_base.rstrip("/")
        except requests.RequestException:
            continue
    return None


def preflight_tes_endpoint(tes_name, tes_url):
    """
    Validate TES endpoint reachability and auth before accepting workflow submission.
    Returns resolved tasks base URL on success, raises RuntimeError with actionable details on failure.
    """
    base_url = (tes_url or "").rstrip("/")
    if not base_url:
        raise RuntimeError("TES URL is missing")

    patterns = [
        (f"{base_url}/ga4gh/tes/v1/service-info", f"{base_url}/ga4gh/tes/v1/tasks"),
        (f"{base_url}/v1/service-info", f"{base_url}/v1/tasks"),
        (f"{base_url}/service-info", f"{base_url}/tasks"),
    ]
    headers, auth = _auth_for_tes(tes_name, base_url)
    probe_headers = {**headers, "Accept": "application/json"}
    errors = []

    for service_info_url, tasks_base in patterns:
        try:
            r = requests.get(service_info_url, headers=probe_headers, auth=auth, timeout=15)
            if r.status_code == 200:
                return tasks_base.rstrip("/")
            if r.status_code in (401, 403):
                raise RuntimeError(
                    f"TES endpoint reachable but unauthorized ({r.status_code}) at {service_info_url}. "
                    "Configure credentials/token for this instance."
                )
            errors.append(f"{service_info_url} -> HTTP {r.status_code}")
        except requests.exceptions.Timeout:
            errors.append(f"{service_info_url} -> timeout")
        except requests.exceptions.SSLError as exc:
            errors.append(f"{service_info_url} -> SSL error: {exc}")
        except requests.exceptions.ConnectionError as exc:
            errors.append(f"{service_info_url} -> connection error: {exc}")
        except requests.RequestException as exc:
            errors.append(f"{service_info_url} -> request error: {exc}")

    raise RuntimeError(
        "Selected TES instance is not reachable/healthy for workflow submission. "
        + "; ".join(errors[:3])
    )


def _auth_for_tes(tes_name, tes_url):
    creds = get_instance_credentials(tes_name or '', tes_url or '')
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    auth = None
    if creds.get('token'):
        headers['Authorization'] = f"Bearer {creds['token']}"
    elif creds.get('user') and creds.get('password'):
        auth = (creds['user'], creds['password'])
    return headers, auth


class TESApiClient:
    def __init__(self, base_url, tes_name=None):
        self.base_url = base_url.rstrip("/")
        self.tes_name = tes_name
        self._tasks_base_url = None

    def _tasks_base(self):
        if self._tasks_base_url is None:
            resolved = resolve_tes_tasks_base_url(self.tes_name, self.base_url)
            if not resolved:
                raise RuntimeError(
                    f"Could not discover TES API for {self.base_url}: "
                    "no service-info URL returned HTTP 200. Check URL and credentials."
                )
            self._tasks_base_url = resolved
        return self._tasks_base_url

    def submit_task(self, task):
        url = self._tasks_base()
        headers, auth = _auth_for_tes(self.tes_name, self.base_url)
        response = requests.post(url, json=task, headers=headers, auth=auth, timeout=60)
        response.raise_for_status()
        return response.json()

    def get_task(self, task_id):
        base = self._tasks_base()
        url = f"{base}/{task_id}"
        headers, auth = _auth_for_tes(self.tes_name, self.base_url)
        response = requests.get(url, headers=headers, auth=auth, timeout=30)
        if response.status_code == 404:
            url_q = f"{url}?view=FULL"
            response = requests.get(url_q, headers=headers, auth=auth, timeout=30)
        response.raise_for_status()
        return response.json()

    def list_tasks(self):
        url = self._tasks_base()
        headers, auth = _auth_for_tes(self.tes_name, self.base_url)
        response = requests.get(url, headers=headers, auth=auth, timeout=30)
        response.raise_for_status()
        return response.json()
