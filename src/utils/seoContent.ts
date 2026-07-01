import {PAGE_META} from './pageMetaDefaults';

export {DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_OG_IMAGE, DEFAULT_TITLE, SITE_NAME, SITE_URL} from './pageMeta';

export const ABOUT_FAQ = [
    {
        question: 'Do I need RuneLite?',
        answer:
            'Yes. Runelogs only reads logs from the Combat Logger plugin on RuneLite. OSRS mobile and the official client are not supported.',
    },
    {
        question: 'Is Runelogs free?',
        answer: 'Yes. Creating an account and uploading logs is free.',
    },
    {
        question: 'How is this different from the in-game damage meter?',
        answer:
            "The plugin's damage meter is live in your client for your last few fights. Runelogs keeps the full log, breaks it into shareable web pages, adds leaderboards, replay, and filters you can use after the fact.",
    },
    {
        question: 'Why does some damage show as "Unknown"?',
        answer:
            'OSRS does not always expose who dealt darker hitsplats. If a party member runs Combat Logger, their damage is usually attributed correctly.',
    },
    {
        question: 'Can I log while playing on a second account?',
        answer:
            'The log records whichever account is logged in on that RuneLite client. Upload it from the Runelogs account you want the log tied to.',
    },
    {
        question: 'What is live logging?',
        answer:
            'Live logging sends events to Runelogs as you play instead of uploading a file afterward. Set it up on the Live Log page with an access key in the plugin settings.',
    },
] as const;

export const ABOUT_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ABOUT_FAQ.map(({question, answer}) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
        },
    })),
};

export const HELP_FAQ = [
    {
        question: 'What is Runelogs?',
        answer:
            'Runelogs is a combat log analysis tool for Old School RuneScape that works with the Combat Logger RuneLite plugin to help players review fights, track performance, and improve strategy. It offers leaderboards, detailed breakdowns, and visualizations powered by parsed in-game data.',
    },
    {
        question: 'Where do I find my combat log files?',
        answer:
            'Open the Combat Logger panel in the RuneLite sidebar, then click the folder icon to open your combat log directory. Log files are saved under .runelite/combat_log on your PC.',
    },
    {
        question: 'What does Unknown damage source mean?',
        answer:
            'Darker tinted hitsplats from in-game show up as Unknown by default. If another player in your RuneLite Party has Combat Logger running, their hitsplats are usually shared and attributed correctly.',
    },
    {
        question: 'Are my thralls showing up as Unknown?',
        answer:
            'No. Your thralls use brighter hitsplats that count as your damage. There is currently no way to separate thrall damage from your own damage.',
    },
    {
        question: "Everyone in my Party has the plugin yet I'm still seeing some Unknown damage sources?",
        answer:
            'Some fights use darker tinted hitsplats whose source the OSRS client does not expose. For example, Zebak breath that kills boulders appears as Unknown. This is a client limitation, not a Runelogs bug.',
    },
] as const;

export const HELP_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HELP_FAQ.map(({question, answer}) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
        },
    })),
};

export const HOME_PAGE_META = PAGE_META.home;
export const ABOUT_PAGE_META = {...PAGE_META.about, jsonLd: ABOUT_JSON_LD};
export const HELP_PAGE_META = {...PAGE_META.help, jsonLd: HELP_JSON_LD};
export const PRIVACY_PAGE_META = PAGE_META.privacy;
export const BLOG_PAGE_META = PAGE_META.blog;
export const UPLOAD_PAGE_META = PAGE_META.upload;
export const LIVE_LOG_PAGE_META = PAGE_META.liveLog;
export const RECENT_ENCOUNTERS_PAGE_META = PAGE_META.recentEncounters;
