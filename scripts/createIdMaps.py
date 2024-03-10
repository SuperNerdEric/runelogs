import os
import requests
import json

# URLs for the data files
NPCS_URL = "https://chisel.weirdgloop.org/moid/data_files/npcsmin.js"
ITEMS_URL = "https://chisel.weirdgloop.org/moid/data_files/itemsmin.js"

# File paths for the TypeScript maps
NPC_TS_FILE_PATH = "src/lib/npcIdMap.ts"
ITEM_TS_FILE_PATH = "src/lib/itemIdMap.ts"

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
convert_to_ts_map(npcs, "id", "name", NPC_TS_FILE_PATH)

# Fetch item data and convert to TypeScript map
response = requests.get(ITEMS_URL)
js_content = response.text
json_data = js_content[js_content.find("[{"):]

items = json.loads(json_data)
convert_to_ts_map(items, "id", "name", ITEM_TS_FILE_PATH)
