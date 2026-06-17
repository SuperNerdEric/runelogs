import '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        game: {
            gold: string;
            player: string;
            other: string;
            unknown: string;
            dps: string;
            damage: string;
            heal: string;
            fightSuccess: string;
            fightFailure: string;
        };
    }

    interface PaletteOptions {
        game?: Partial<Palette['game']>;
    }
}
