import React from 'react';

const OSRS = 'Old School RuneScape';
const SUBTITLE = 'Review fights, track performance, and compare ranks.';

export function HomeHeroTagline() {
    return (
        <>
            <span className="home-hero-tagline-logs">Combat analysis</span>
            <span className="home-hero-tagline-muted"> for </span>
            <span className="home-hero-tagline-rune">{OSRS}</span>
        </>
    );
}

export function HomeHeroSubtitle() {
    return <span className="home-hero-subtitle-text">{SUBTITLE}</span>;
}
