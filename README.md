# Runelogs

Runelogs is a combat log analysis tool for Old School RuneScape that works with the [Combat Logger](https://runelite.net/plugin-hub/show/combat-logger) plugin to help players review fights, track performance, and improve strategy.
It offers leaderboards, detailed breakdowns, and visualizations powered by parsed in-game data.

Hosted on https://www.runelogs.com/

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
The build is minified and the filenames include the hashes.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Data Sync Scripts

This project relies on regularly updated data files from the [OSRS Wiki](https://oldschool.runescape.wiki/) for equipment and NPC/item ID mappings:

### `npm run generateEquipment`
  Fetches item equipment data from the OSRS Wiki via its [SMW API](https://www.semantic-mediawiki.org/wiki/Help:API) and generates `src/lib/equipment.json`, including item stats and metadata. It also downloads icons for display in the UI.

### `npm run createIdMaps`
  Fetches item and NPC ID mappings from [chisel.weirdgloop.org](https://chisel.weirdgloop.org) and generates:
  - `src/lib/itemIdMap.ts` – maps item IDs to item names
  - `src/lib/npcIdMap.ts` – maps NPC IDs to names and sizes

These scripts run automatically via GitHub Actions:
- Every hour on a scheduled cron job
- On manual dispatch (via the Actions tab)

If any data changes, a pull request is automatically opened with the updated files. You can review and merge these PRs to keep the data fresh without manual intervention.

## Contribute

* [Submit Bugs](https://github.com/SuperNerdEric/combat-logger/issues)
* [Review and submit Pull Requests](https://github.com/SuperNerdEric/combat-logger/pulls)
* Join us in our [Community Discord](https://discord.gg/ZydwX7AJEd) to make suggestions and give feedback
