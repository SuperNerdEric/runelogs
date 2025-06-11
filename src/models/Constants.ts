export const SECONDS_PER_TICK = 0.6;

export enum Raid {
    None,
    ChambersOfXeric,
    TheatreOfBlood,
    TombsOfAmascut
}

// todo these should really be monster ids
export const COX_MONSTERS = ["Abyssal portal", "Deathly mage", "Deathly ranger", "Glowing crystal", "Great Olm", "Guardian", "Ice demon", "Lizardman shaman", "Muttadile", "Scavenger beast", "Skeletal mystic", "Tekton", "Vanguard", "Vasa Nistirio", "Vespine soldier", "Vespula"];
export const TOA_MONSTERS = ["Ba-Ba", "Akkha", "Akkha's Shadow", "Kephri", "Zebak", "Obelisk", "Tumeken's Warden"];

export const MELEE_ANIMATIONS = [
    390, // Slash, swift blade, Osmumten's fang
    9471, // Osmumten's fang stab
    6118, // Osmumten's fang spec
    8288, // Dragon hunter lance stab, swift blade
    8289, // Dragon hunter lance slash
    8290, // Dragon hunter lance crush
    393, // Staff bash
    395, // Axe
    400, // Pickaxe smash, Inquisitor's mace stab
    4503, // Inquisitor's mace crush
    401, // crush, DWH, ham joint
    406, // 2h crush
    407, // 2h slash
    428, // Spear stab, Chally,  Zamorakian Hasta
    429, // Spear crush
    440, // Spear slash, Chally
    1203, // Chally spec
    1378, // Voidwaker spec
    2323, // Goblin paint cannon
    376, // Dragon dagger stab
    377, // Dragon dagger slash
    1062, // Dragon dagger spec
    245, // Ursine/Viggora mace
    9963, // Ursine mace spec
    422, // Punch
    423, // Kick
    381, // Zamorakian Hasta
    386, // Stab
    414, // Crozier crush
    419, // Keris smash, Zamorakian Hasta pound
    9544, // Keris partisan of corruption spec
    1067, // Claw stab
    7514, // Claw spec
    1658, // Whip
    2890, // Arclight spec
    3294, // Abyssal dagger slash
    3297, // Abyssal dagger stab
    3300, // Abyssal dagger spec
    3298, // Abyssal bludgeon
    3299, // Abyssal bludgeon spec
    7515, // Dragon sword spec
    8145, // Rapier
    1711, // Zamorakian spear
    1712, // Blue moon spear slash
    1710, // Blue moon spear crush
    2062, // Verac's flail, bone mace
    2066, // Dharok's greataxe slash
    2067, // Dharok's greataxe crush
    2068, // Torag's hammer
    2080, // Guthan's warspear stab
    2081, // Guthan's warspear slash
    2082, // Guthan's warspear crush
    4198, // Bone dagger spec
    8056, // Scythe
    8010, // Blisterwood flail
    3852, // Leaf-bladed battleaxe crush
    7004, // Leaf-bladed battleaxe slash
    10171, // Soulreaper Axe crush
    10172, // Soulreaper Axe slash
    10173, // Soulreaper Axe spec
    7045, // Saradomin sword
    7054, // Saradomin sword
    7055, // Saradomin sword, godswords
    7638, // Zamorak godsword spec
    7640, // Saradomin godsword spec
    7642, // Bandos godsword spec
    7643, // Bandos godsword spec
    7644, // Armadyl godsword spec
    2078, // Ahrim's staff bash
    5865, // Barrelchest anchor
    5870, // Barrelchest anchor spec
    7511, // Dinh's bulwark
    6696, // Dragonfire shield spec
    7516, // Maul
    11124, // Elder maul spec
    1665, // Gadderhammer, Granite maul
    1666, // Granite maul block
    1667, // Granite maul spec
    6095, // Wolfbane stab
    1060, // Dragon mace spec
    3157, // Dragon 2h spec
    12033, // Dragon longsword spec
    12031, // Dragon scimitar spec
    405, // Dragon spear spec
    10989 // Dual macuahuitl
]

export const RANGED_ANIMATIONS = [
    426, // Bow
    1074, // Magic shortbow spec
    7617, // Rune knife, thrownaxe
    8194, // Dragon knife
    8195, // Dragon knife poisoned
    8291, // Dragon knife spec
    5061, // Blowpipe
    10656, // Blazing Blowpipe
    7554, // Dart throw
    7618, // Chinchompa
    2075, // Karil's crossbow
    9964, // Webweaver bow spec
    7552, // Crossbow
    9168, // Zaryte crossbow
    9206, // Rune crossbow (or)
    7557, // Dorgeshuun crossbow spec
    7555, // Ballista
    9858, // Venator bow
    11057, // Eclipse atlatl
    11060, // Eclipse atlatl spec
    10916, // Tonalztics of ralos (Uncharged)
    10922, // Tonalztics of ralos
    10923, // Tonalztics of ralos
    10914 // Tonalztics of ralos spec
]

export const MAGE_ANIMATION = [
    710, // Bind, snare, entangle without staff
    1161, // Bind, snare, entangle with staff
    711, // Strike, Bolt, and Blast without staff
    1162, // Strike, Bolt, and Blast with staff
    727, // Wave without staff
    1167, // Wave with staff, Sanguinesti staff, Tridents
    724, // Crumble undead without staff
    1166, // Crumble undead with staff
    1576, // Magic dart
    7855, // Surge
    811, // Flames of Zamorak, Saradomin Strike, Claws of Guthix
    393, // Bone staff
    708, // Iban blast
    8532, // Eldritch/Volatile nightmare staff spec
    1978, // Rush and Blitz
    1979, // Burst and Barrage
    9493, // Tumeken's shadow
    10501, // Warped sceptre
    8972, // Arceuus grasp
    8977 // Arceuus demonbane
]