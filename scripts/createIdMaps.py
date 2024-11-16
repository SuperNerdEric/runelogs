import os
import requests
import json

# URLs for the data files
NPCS_URL = "https://chisel.weirdgloop.org/moid/data_files/npcsmin.js"
ITEMS_URL = "https://chisel.weirdgloop.org/moid/data_files/itemsmin.js"

# File paths for the TypeScript maps
NPC_TS_FILE_PATH = "src/lib/npcIdMap.ts"
ITEM_TS_FILE_PATH = "src/lib/itemIdMap.ts"

# Function to convert NPC data to TypeScript map format
def convert_npcs_to_ts_map(npcs, ts_file_path):
    # Start the TypeScript file with the NPC interface definition
    typescript_content = (
        "export interface NPC {\n"
        "    name: string;\n"
        "    size: number;\n"
        "}\n\n"
        "export const npcIdMap: Record<number, NPC> = {\n"
    )

    for npc in npcs:
        npc_id = npc.get("id")
        name = npc.get("name", "").replace('"', '\\"')  # Escape double quotes
        size = npc.get("size", 1)  # Default size to 1 if not specified

        # Skip entries without an ID or name
        if npc_id is None or not name:
            continue

        typescript_content += f'    {npc_id}: {{ name: "{name}", size: {size} }},\n'

    typescript_content += "};\n"

    with open(ts_file_path, 'w', encoding='utf-8') as file:
        file.write(typescript_content)
    print(f"NPC conversion completed. Output written to {ts_file_path}")

# Function to convert data to TypeScript map format
def convert_to_ts_map(data, id_key, name_key, ts_file_path):
    typescript_map = f"export const {os.path.basename(ts_file_path)[:-3]}: Record<number, string> = {{\n"
    for item in data:
        typescript_map += f'    {item[id_key]}: "{item[name_key]}",\n'
    typescript_map += "};\n"

    with open(ts_file_path, 'w') as file:
        file.write(typescript_map)
    print(f"Conversion completed. Output written to {ts_file_path}")

# Fetch NPC data and convert to TypeScript map
response = requests.get(NPCS_URL)
js_content = response.text
json_data = js_content[js_content.find("[{"):]

npcs = json.loads(json_data)
convert_npcs_to_ts_map(npcs, NPC_TS_FILE_PATH)

# Fetch item data and convert to TypeScript map
response = requests.get(ITEMS_URL)
js_content = response.text
json_data = js_content[js_content.find("[{"):]

items = json.loads(json_data)
convert_to_ts_map(items, "id", "name", ITEM_TS_FILE_PATH)
