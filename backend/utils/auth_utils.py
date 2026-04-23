import os
from config import FUNNEL_SERVER_USER, FUNNEL_SERVER_PASSWORD, TES_TOKEN
from utils.credential_store import get_instance_credentials as fetch_creds

try:
    from routes.instances import runtime_tokens
except ImportError:
    runtime_tokens = {}

def get_instance_credentials(instance_name, instance_url):
    default_user = FUNNEL_SERVER_USER
    default_pass = FUNNEL_SERVER_PASSWORD
    default_token = TES_TOKEN

    url_key = instance_url.rstrip('/').lower()
    file_creds = fetch_creds(url_key)
    if file_creds:
        return file_creds
    runtime_token = runtime_tokens.get(url_key)
    if runtime_token:
        return {
            'user': default_user,
            'password': default_pass,
            'token': runtime_token
        }

    if 'tesk-prod.cloud.e-infra.cz' in instance_url:
        return {
            'user': os.getenv('TESK_PROD_USER', default_user),
            'password': os.getenv('TESK_PROD_PASSWORD', default_pass),
            'token': os.getenv('TESK_PROD_TOKEN', default_token)
        }
    elif 'tesk-na.cloud.e-infra.cz' in instance_url:
        return {
            'user': os.getenv('TESK_NA_USER', default_user),
            'password': os.getenv('TESK_NA_PASSWORD', default_pass),
            'token': os.getenv('TESK_NA_TOKEN', default_token)
        }
    else:
        return {
            'user': default_user,
            'password': default_pass,
            'token': default_token
        }
