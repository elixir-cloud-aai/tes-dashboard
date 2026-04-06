import json
import threading
from pathlib import Path

CREDENTIALS_FILE = Path(__file__).parent.parent / 'tes_credentials.json'
_lock = threading.Lock()

def _read_credentials():
    if not CREDENTIALS_FILE.exists():
        return {}
    with _lock, open(CREDENTIALS_FILE, 'r') as f:
        try:
            return json.load(f)
        except Exception:
            return {}

def _write_credentials(data):
    with _lock, open(CREDENTIALS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def set_instance_credentials(url, creds):
    url_key = url.rstrip('/').lower()
    data = _read_credentials()
    data[url_key] = creds
    _write_credentials(data)

def get_instance_credentials(url):
    url_key = url.rstrip('/').lower()
    data = _read_credentials()
    return data.get(url_key)

def delete_instance_credentials(url):
    url_key = url.rstrip('/').lower()
    data = _read_credentials()
    if url_key in data:
        del data[url_key]
        _write_credentials(data)
        return True
    return False
