import React from 'react';
import {BarChart3, type LucideIcon} from 'lucide-react';
import {colors} from '../theme';

export type HomeHeroProps = {
    icon?: LucideIcon;
    iconColor: string;
    iconBg?: string;
    iconBorder?: string;
    tagline: React.ReactNode;
    subtitle: React.ReactNode;
};

export function HomeHero({
    icon: Icon = BarChart3,
    iconColor,
    iconBg,
    iconBorder,
    tagline,
    subtitle,
}: HomeHeroProps) {
    const hasIconFrame = Boolean(iconBg || iconBorder);
    const iconFrameStyle: React.CSSProperties | undefined = hasIconFrame
        ? {
            backgroundColor: iconBg,
            border: iconBorder
                ? iconBorder.includes('gradient')
                    ? '2px solid transparent'
                    : `2px solid ${iconBorder}`
                : undefined,
            background: iconBorder?.includes('gradient')
                ? `linear-gradient(${colors.background.page}, ${colors.background.page}) padding-box, ${iconBorder} border-box`
                : iconBg,
        }
        : undefined;

    const icon = (
        <Icon
            className="home-hero__icon"
            style={{color: iconColor}}
            strokeWidth={1.75}
            aria-hidden
        />
    );

    return (
        <div className="home-hero">
            <div className="home-hero__inner">
                <div className="home-hero__icon-wrap">
                    {hasIconFrame ? (
                        <div
                            className="home-hero__icon-wrap--framed"
                            style={iconFrameStyle}
                        >
                            {icon}
                        </div>
                    ) : (
                        icon
                    )}
                </div>
                <h1 className="home-hero__tagline">{tagline}</h1>
            </div>
            <p className="home-hero__subtitle">{subtitle}</p>
        </div>
    );
}
