import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {History, TrendingUp} from 'lucide-react';
import {useAuth0} from '@auth0/auth0-react';
import Leaderboard from './Leaderboard';
import OverallRecentEncounters from './OverallRecentEncounters';
import {HomeHero} from './HomeHero';
import {HomeHeroSubtitle, HomeHeroTagline} from './homeHeroContent';
import TrophyIcon from './TrophyIcon';
import {colors, contentColumnClass} from '../theme';
import {cn} from '@/lib/utils';

export default function Home() {
    const {isAuthenticated} = useAuth0();

    return (
        <div className={cn(contentColumnClass, 'px-2 pb-0 max-[1279px]:px-1')}>
            <div className="home-hero-wrap">
                <HomeHero
                    icon={TrendingUp}
                    iconColor={colors.text.logs}
                    tagline={<HomeHeroTagline/>}
                    subtitle={<HomeHeroSubtitle/>}
                />
            </div>
            <p className="home-intro">
                Runelogs works with the{' '}
                <a
                    href="https://runelite.net/plugin-hub/show/combat-logger"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Combat Logger
                </a>{' '}
                plugin.{' '}
                {!isAuthenticated ? (
                    <>
                        To upload a log please{' '}
                        <strong>Log In</strong> / <strong>Register</strong> for a free account.
                    </>
                ) : (
                    <>
                        <RouterLink to="/upload">Upload a log</RouterLink>{' '}
                        to get started.
                    </>
                )}
            </p>
            <p className="home-intro">
                We are open to contributions on our{' '}
                <a href="https://discord.gg/ZydwX7AJEd" target="_blank" rel="noopener noreferrer">
                    Discord
                </a>{' '}
                or on our{' '}
                <a href="https://github.com/SuperNerdEric/runelogs" target="_blank" rel="noopener noreferrer">
                    GitHub
                </a>.
            </p>
            <section className="home-section">
                <div className="home-section__header">
                    <span className="home-section__icon">
                        <TrophyIcon size={34}/>
                    </span>
                    <RouterLink to="/leaderboards" className="home-section__title">
                        Leaderboards
                    </RouterLink>
                </div>
                <Leaderboard entriesPerPage={25}/>
            </section>
            <section className="home-section">
                <div className="home-section__header">
                    <span className="home-section__icon">
                        <History size={34} style={{color: colors.text.rune}} aria-hidden/>
                    </span>
                    <RouterLink to="/recent-encounters" className="home-section__title">
                        Recent Encounters
                    </RouterLink>
                </div>
                <OverallRecentEncounters embedded entriesPerPage={10}/>
            </section>
        </div>
    );
}
