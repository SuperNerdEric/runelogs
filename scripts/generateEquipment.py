"""
    Script to generate an equipment.json of all the equipment on the OSRS Wiki.
    The JSON file is placed in ../src/lib/equipment.json.

    Written for Python 3.9.
"""
import requests
import json
import urllib.parse

FILE_NAME = 'src/lib/equipment.json'
WIKI_BASE = 'https://oldschool.runescape.wiki'
API_BASE = WIKI_BASE + '/api.php'

BUCKET_API_FIELDS = [
    'page_name',
    'page_name_sub',
    'item_id',
    'version_anchor',
    'infobox_bonuses.equipment_slot',
    'infobox_bonuses.weapon_attack_speed',
    'infobox_bonuses.combat_style',
]

def getEquipmentData():
    equipment = []
    offset = 0
    fields_csv = ",".join(map(repr, BUCKET_API_FIELDS))
    while True:
        print('Fetching equipment info: ' + str(offset))
        query = {
            'action': 'bucket',
            'format': 'json',
            'query':
            (
                f"bucket('infobox_item')"
                f".select({fields_csv})"
                f".limit(500).offset({offset})"
                f".where('infobox_bonuses.equipment_slot', '!=', bucket.Null())"
                f".where('item_id', '!=', bucket.Null())"
                f".join('infobox_bonuses', 'infobox_bonuses.page_name_sub', 'infobox_item.page_name_sub')"
                f".orderBy('page_name_sub', 'asc').run()"
            )
        }

        r = requests.get(API_BASE + '?' + urllib.parse.urlencode(query), headers={
            'User-Agent': 'osrs-dps-calc (https://github.com/weirdgloop/osrs-dps-calc)'
        })

        data = r.json()

        if 'bucket' not in data:
            break

        equipment = equipment + data['bucket']

        if len(data['bucket']) == 500:
            offset += 500
        else:
            break

    return equipment


def main():
    wiki_data = getEquipmentData()

    data = []
    seen = set()

    for v in wiki_data:
        page_name_sub = v['page_name_sub']
        if page_name_sub in seen:
            continue
        seen.add(page_name_sub)

        print('Processing ' + page_name_sub)

        try:
            item_id = int(v.get('item_id')[0]) if v.get('item_id') else None
        except ValueError:
            print("Skipping - invalid item ID (not an int)")
            continue

        if item_id is None:
            continue

        equipment = {
            'name': v['page_name'],
            'id': item_id,
            'version': v.get('version_anchor', '') or '',
            'slot': v.get('infobox_bonuses.equipment_slot', '') or '',
            'category': v.get('infobox_bonuses.combat_style', '') or '',
            'isTwoHanded': False
        }

        combat_style = v.get('infobox_bonuses.combat_style', '') or ''
        weapon_speed = int(v.get('infobox_bonuses.weapon_attack_speed', 0) or 0)

        # Subtract weapon speed for ranged weapons assuming using rapid style
        if combat_style in ['Bow', 'Chinchompas', 'Crossbow', 'Salamander', 'Thrown']:
            speed = max(weapon_speed - 1, 0)
        else:
            speed = weapon_speed

        equipment['speed'] = speed

        # Handle 2H weapons
        if equipment['slot'] == '2h':
            equipment['slot'] = 'weapon'
            equipment['isTwoHanded'] = True

        # If this is an item from Nightmare Zone, it will become the main variant for all NMZ/SW/Emir's variants
        if equipment['version'] == 'Nightmare Zone':
            equipment['version'] = ''

        data.append(equipment)

    print('Total equipment: ' + str(len(data)))
    data.sort(key=lambda d: d.get('name'))

    with open(FILE_NAME, 'w') as f:
        print('Saving to JSON at file: ' + FILE_NAME)
        json.dump(data, f, ensure_ascii=False, indent=2)

main()
