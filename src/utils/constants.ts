export const BOSS_NAMES = [
    "Scurrius",
    "Kree'arra",
    "Commander Zilyana",
    "General Graardor",
    "K'ril Tsutsaroth",
    "Nex",
    "Kalphite Queen",
    "Sarachnis",
    "Scorpia",
    "Abyssal Sire",
    "Kraken",
    "Dagannoth Rex",
    "Dagannoth Supreme",
    "Dagannoth Prime",
    "The Leviathan",
    "The Whisperer",
    "Vardorvis",
    "Duke Sucellus",
    "Tekton",
    "Ice demon",
    "Vanguard",
    "Vespula",
    "Vasa Nistirio",
    "Muttadile",
    "Great Olm",
    "The Maiden of Sugadinti",
    "Pestilent Bloat",
    "Nylocas Vasilias",
    "Sotetseg",
    "Xarpus",
    "Verzik Vitur",
    "Ba-Ba",
    "Akkha",
    "Akkha's Shadow",
    "Kephri",
    "Zebak",
    "Obelisk",
    "Tumeken's Warden",
    "Ahrim the Blighted",
    "Dharok the Wretched",
    "Guthan the Infested",
    "Karil the Tainted",
    "Torag the Corrupted",
    "Verac the Defiled",
    "Corporeal Beast",
    "King Black Dragon",
    "Vorkath",
    "Zulrah",
    "Fragment of Seren",
    "Alchemical Hydra",
    "Bryophyta",
    "Callisto",
    "Cerberus",
    "Chaos Elemental",
    "Chaos Fanatic",
    "Crazy Archaeologist",
    "Crystalline Hunllef",
    "Corrupted Hunllef",
    "Deranged Archaeologist",
    "Giant Mole",
    "Hespori",
    "The Mimic",
    "The Nightmare",
    "Obor",
    "Phantom Muspah",
    "Skotizo",
    "Thermonuclear Smoke Devil",
    "TzTok-Jad",
    "Venenatis",
    "Vet'ion",
    "Blood Moon",
    "Blue Moon",
    "Eclipse Moon",
    "Sol Heredit",
];

// todo: fix this
// I really need to handle this better, but bosses that are unlikely to be an unrelated person's fight
// so we can assume that if we see these names, it's a fight
export const MY_BOSS_NAMES = [
    "Scurrius",
    "Kree'arra",
    "Commander Zilyana",
    "General Graardor",
    "K'ril Tsutsaroth",
    "Nex",
    "Kalphite Queen",
    "Sarachnis",
    "Scorpia",
    "Abyssal Sire",
    // "Kraken", // Removed for now, as the pet is also named Kraken
    "The Leviathan",
    "The Whisperer",
    "Vardorvis",
    "Duke Sucellus",
    "Tekton",
    "Ice demon",
    "Vanguard",
    "Vespula",
    "Vasa Nistirio",
    "Muttadile",
    "Great Olm",
    "The Maiden of Sugadinti",
    "Pestilent Bloat",
    "Nylocas Vasilias",
    "Sotetseg",
    "Xarpus",
    "Verzik Vitur",
    "Ba-Ba",
    "Akkha",
    "Akkha's Shadow",
    "Kephri",
    "Zebak",
    "Obelisk",
    "Tumeken's Warden",
    "Corporeal Beast",
    "King Black Dragon",
    "Vorkath",
    "Zulrah",
    "Fragment of Seren",
    "Alchemical Hydra",
    "Bryophyta",
    "Callisto",
    "Cerberus",
    "Crystalline Hunllef",
    "Corrupted Hunllef",
    "Giant Mole",
    "Hespori",
    "The Mimic",
    "The Nightmare",
    "Obor",
    "Phantom Muspah",
    "Skotizo",
    "TzTok-Jad",
    "Venenatis",
    "Vet'ion",
    "Sol Heredit",
];

export const BOSS_TO_MINIONS = {
    "Nylocas Vasilias": ["Nylocas Hagios", "Nylocas Ischyros", "Nylocas Toxobolos"],
};

export const MINION_TO_BOSS = Object.entries(BOSS_TO_MINIONS).reduce((acc, [boss, minions]) => {
    minions.forEach(minion => {
        acc[minion] = boss;
    });
    return acc;
}, {} as { [key: string]: string });

export const COX_REGIONS = [12889, 13136, 13137, 13138, 13139, 13140, 13141, 13145, 13393, 13394, 13395, 13396, 13397, 13401];
export const TOB_REGIONS = [12611, 12612, 12613, 12867, 12869, 13122, 13123, 13125, 13379];
export const TOA_REGIONS = [14160, 14162, 14164, 14674, 14676, 15184, 15186, 15188, 15696, 15698, 15700];

export const RAID_NAME_REGION_MAPPING: { [key: string]: string } = {};
COX_REGIONS.forEach(region => RAID_NAME_REGION_MAPPING[region] = 'Chambers of Xeric');
TOB_REGIONS.forEach(region => RAID_NAME_REGION_MAPPING[region] = 'Theatre of Blood');
TOA_REGIONS.forEach(region => RAID_NAME_REGION_MAPPING[region] = 'Tombs of Amascut');

export const WAVE_BASED_REGION_MAPPING: {[region: string]: string} = {
    9043: "The Inferno",
};


export const PLAYER_HOUSE_REGION_1 = 7769;
export const PLAYER_HOUSE_REGION_2 = 7770;

export const BLOOD_MOON_REGION = 5526;
export const BLUE_MOON_REGION = 5783;
export const ECLIPSE_MOON_REGION = 6038;
export const NEYPOTZLI_REGION_1 = 5525;
export const NEYPOTZLI_REGION_2 = 5527;
export const NEYPOTZLI_REGION_3 = 6039;