import os
from config import FUNNEL_SERVER_USER, FUNNEL_SERVER_PASSWORD, TES_TOKEN

def get_instance_credentials(instance_name, instance_url):
    instance_url = (instance_url or '').rstrip('/')
    default_user = FUNNEL_SERVER_USER
    default_pass = FUNNEL_SERVER_PASSWORD
    default_token = TES_TOKEN
    
    if 'funnel.cloud.e-infra.cz' in instance_url:
        return {
            'user': os.getenv('FUNNEL_CZ_USER', default_user),
            'password': os.getenv('FUNNEL_CZ_PASSWORD', default_pass),
            'token': None
        }

    elif 'fip-86-50-228-254.kaj.poutavm.fi' in instance_url:
        return {
            'user': os.getenv('FUNNEL_FI_USER', default_user),
            'password': os.getenv('FUNNEL_FI_PASSWORD', default_pass),
            'token': None
        }

    elif 'tesk-eu.hypatia-comp.athenarc.gr' in instance_url:
        return {
            'user': os.getenv('TESK_GR_USER', default_user),
            'password': os.getenv('TESK_GR_PASSWORD', default_pass),
            'token': None
        }

    elif 'spe4hd.tes.bihealth.org' in instance_url:
        return {
            'user': None,
            'password': None,
            'token': os.getenv('BIHEALTH_TOKEN', default_token)
        }
    else:
        return {
            'user': default_user,
            'password': default_pass,
            'token': default_token
        }
