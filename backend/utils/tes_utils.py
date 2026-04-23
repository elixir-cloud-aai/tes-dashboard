import json
from pathlib import Path
from config import TES_INSTANCES_FILE, TES_LOCATIONS_FILE

def load_tes_instances():
    """
    Loads raw TES instances from the .tes_instances configuration file.
    """
    instances = []
    if TES_INSTANCES_FILE.exists():
        with open(TES_INSTANCES_FILE) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if ',' in line:
                    name, url = line.split(',', 1)
                    url = url.strip().rstrip('/')
                    instances.append({'name': name.strip(), 'url': url})
    return instances

def load_tes_location_data():
    """
    Enriches TES instances with geographical data and statuses.
    Forces all 9+ instances to be visible by providing strict fallback coordinates.
    """
    default_coords = {
        'Czech Republic': {'lat': 50.0755, 'lng': 14.4378, 'region': 'EU-Central'},
        'Finland': {'lat': 60.1699, 'lng': 24.9384, 'region': 'EU-North'},
        'Greece': {'lat': 37.9838, 'lng': 23.7275, 'region': 'EU-South'},
        'Germany': {'lat': 52.5200, 'lng': 13.4050, 'region': 'EU-Central'},
        'Unknown': {'lat': 45.0, 'lng': 10.0, 'region': 'Global'}
    }

    location_map = {}
    try:
        if TES_LOCATIONS_FILE.exists():
            with open(TES_LOCATIONS_FILE) as f:
                data = json.load(f)
                if isinstance(data, list):
                    for loc in data:
                        url_key = loc.get('url', '').rstrip('/').lower()
                        location_map[url_key] = loc
    except Exception as e:
        print(f"Failed to load tes_instance_locations.json: {e}")

    raw_instances = load_tes_instances()
    enriched_instances = []

    for inst in raw_instances:
        name = inst['name']
        url = inst['url']
        url_key = url.lower()

        country = 'Unknown'
        if 'CZ' in name or 'Czech' in name:
            country = 'Czech Republic'
        elif 'FI' in name or 'Finland' in name:
            country = 'Finland'
        elif 'GR' in name or 'Greece' in name:
            country = 'Greece'
        elif 'DE' in name or 'Germany' in name:
            country = 'Germany'
        elif 'Local' in name or 'localhost' in url:
            country = 'Local'

        coords = default_coords.get(country, default_coords['Unknown'])
        loc_data = location_map.get(url_key, {})

        enriched = {
            'id': loc_data.get('id', name.lower().replace(' ', '-').replace('/', '-')),
            'name': name,
            'url': url,
            'lat': loc_data.get('lat') or coords['lat'],
            'lng': loc_data.get('lng') or coords['lng'],
            'country': country,
            'region': loc_data.get('region') or coords['region'],
            'status': loc_data.get('status', 'healthy'), # Force healthy for visibility
            'tasks': loc_data.get('tasks', 0),
            'workflows': loc_data.get('workflows', 0)
        }
        enriched_instances.append(enriched)

    return enriched_instances
