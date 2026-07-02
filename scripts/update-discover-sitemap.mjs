import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const leaderboardContentPath = join(__dirname, '..', 'src', 'utils', 'leaderboardContent.ts');
const sitemapPath = join(__dirname, '..', 'public', 'sitemap.xml');
const SITE_URL = 'https://www.runelogs.com';

const DISCOVER_START = '    <!-- generated:discover -->';
const DISCOVER_END = '    <!-- /generated:discover -->';

/** Keep in sync with buildLeaderboardHref in src/utils/leaderboardContent.ts */
function buildLeaderboardHref({mode, leaderboard, playerCount}) {
    const search = new URLSearchParams({
        mode,
        leaderboard,
        playerCount: String(playerCount),
    });
    return `/leaderboards?${search.toString()}`;
}

/** Keep in sync with buildRecentEncountersHref in src/utils/leaderboardContent.ts */
function buildRecentEncountersHref({content, playerCount}) {
    const search = new URLSearchParams();
    search.set('content', content);
    search.set('playerCount', String(playerCount));
    return `/recent-encounters?${search.toString()}`;
}

function parseLeaderboardContentOptions() {
    const content = readFileSync(leaderboardContentPath, 'utf8');
    const constants = Object.fromEntries(
        [...content.matchAll(/export const (\w+) = "([^"]+)";/g)].map((match) => [
            match[1],
            match[2],
        ]),
    );

    const optionsBlock = content.match(
        /export const LEADERBOARD_CONTENT_OPTIONS:[\s\S]*?= \[([\s\S]*?)\n\];/,
    );

    if (!optionsBlock) {
        throw new Error('LEADERBOARD_CONTENT_OPTIONS not found in leaderboardContent.ts');
    }

    const optionPattern =
        /value: (?:"([^"]+)"|(\w+)),\s*\n\s*spriteKey:[\s\S]*?\n\s*defaultPlayerCount: (\d+)/g;
    const options = [];

    for (const match of optionsBlock[1].matchAll(optionPattern)) {
        const value = match[1] ?? constants[match[2]];
        if (!value) {
            throw new Error(`Unable to resolve leaderboard content value: ${match[2] ?? match[1]}`);
        }

        options.push({
            value,
            defaultPlayerCount: Number(match[3]),
        });
    }

    if (options.length === 0) {
        throw new Error('No leaderboard content options parsed from leaderboardContent.ts');
    }

    return options;
}

function buildLeaderboardSitemapUrls(siteUrl, options) {
    return options.map((option) => {
        const path = buildLeaderboardHref({
            mode: 'time',
            leaderboard: option.value,
            playerCount: option.defaultPlayerCount,
        });
        return `${siteUrl}${path}`;
    });
}

function buildRecentEncountersSitemapUrls(siteUrl, options) {
    return options.map((option) => {
        const path = buildRecentEncountersHref({
            content: option.value,
            playerCount: option.defaultPlayerCount,
        });
        return `${siteUrl}${path}`;
    });
}

function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildUrlEntry(loc) {
    return `    <url>
        <loc>${escapeXml(loc)}</loc>
    </url>`;
}

function buildDiscoverSitemapXml({leaderboardUrls, recentEncountersUrls}) {
    const entries = [
        buildUrlEntry(`${SITE_URL}/leaderboards`),
        ...leaderboardUrls.map(buildUrlEntry),
        buildUrlEntry(`${SITE_URL}/recent-encounters`),
        ...recentEncountersUrls.map(buildUrlEntry),
    ];

    return `${DISCOVER_START}
${entries.join('\n')}
${DISCOVER_END}`;
}

function replaceDiscoverSection(sitemap, discoverXml) {
    const pattern =
        /    <!-- generated:discover -->[\s\S]*?    <!-- \/generated:discover -->/;

    if (!pattern.test(sitemap)) {
        throw new Error(
            'Discover sitemap markers not found in sitemap.xml. Expected <!-- generated:discover --> ... <!-- /generated:discover -->',
        );
    }

    return sitemap.replace(pattern, discoverXml);
}

function updateDiscoverSitemap() {
    const contentOptions = parseLeaderboardContentOptions();
    const leaderboardUrls = buildLeaderboardSitemapUrls(SITE_URL, contentOptions);
    const recentEncountersUrls = buildRecentEncountersSitemapUrls(SITE_URL, contentOptions);
    const discoverXml = buildDiscoverSitemapXml({leaderboardUrls, recentEncountersUrls});
    let sitemap = readFileSync(sitemapPath, 'utf8');

    sitemap = replaceDiscoverSection(sitemap, discoverXml);
    writeFileSync(sitemapPath, sitemap, 'utf8');

    console.log(
        `Updated discover sitemap with ${leaderboardUrls.length} leaderboard URLs and ${recentEncountersUrls.length} recent-encounters URLs.`,
    );
}

const isMainModule =
    process.argv[1] &&
    resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
    updateDiscoverSitemap();
}

export {
    buildLeaderboardSitemapUrls,
    buildRecentEncountersSitemapUrls,
    parseLeaderboardContentOptions,
    updateDiscoverSitemap,
};
