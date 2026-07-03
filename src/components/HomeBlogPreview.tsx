import React, {useMemo, useState} from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {Box, Collapse, Link, Typography} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    BlogCategory,
    BlogPost,
    formatBlogDate,
    formatBlogPostRecency,
    getBlogPostHref,
    getBlogPostShortTitle,
    getBlogPostSummary,
    getRecentHomeBlogPosts,
} from '../data/blogPosts';
import {colors, fontSizes, media} from '../theme';

const CATEGORY_LABEL: Record<BlogCategory, string> = {
    'combat-logger': 'Combat Logger',
    runelogs: 'Runelogs',
};

const CATEGORY_ACCENT: Record<BlogCategory, string> = {
    'combat-logger': colors.text.rune,
    runelogs: colors.text.gold,
};

const CARD_SHADOW = '0 1px 2px rgba(1, 4, 9, 0.24)';

function CategoryMark({category}: {category: BlogCategory}) {
    const accent = CATEGORY_ACCENT[category];

    return (
        <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.75, minWidth: 0}}>
            <Box
                sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: accent,
                    flexShrink: 0,
                }}
            />
            <Typography
                component="span"
                sx={{
                    fontSize: fontSizes.xs,
                    fontWeight: 600,
                    color: accent,
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                }}
            >
                {CATEGORY_LABEL[category]}
            </Typography>
        </Box>
    );
}

function RecencyLabel({date}: {date: string}) {
    return (
        <Typography
            component="time"
            dateTime={date}
            title={formatBlogDate(date)}
            sx={{
                flexShrink: 0,
                fontSize: fontSizes.xs,
                color: colors.text.muted,
                whiteSpace: 'nowrap',
            }}
        >
            {formatBlogPostRecency(date)}
        </Typography>
    );
}

function BlogPreviewCard({post}: {post: BlogPost}) {
    const [expanded, setExpanded] = useState(false);
    const accent = CATEGORY_ACCENT[post.category];
    const summary = getBlogPostSummary(post, 150);

    return (
        <Box
            sx={{
                borderRadius: 1.5,
                [media.mobileDown]: {borderRadius: 1},
                border: `1px solid ${expanded ? `${accent}44` : colors.ui.dividerSubtle}`,
                bgcolor: expanded ? colors.background.surfaceAlt : colors.background.surface,
                boxShadow: CARD_SHADOW,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
        >
            <Box
                component="button"
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((current) => !current)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    width: '100%',
                    px: 1.5,
                    py: 1,
                    border: 'none',
                    bgcolor: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                }}
            >
                <CategoryMark category={post.category}/>
                <Typography
                    component="span"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: fontSizes.sm,
                        fontWeight: 600,
                        color: colors.text.primary,
                        lineHeight: 1.35,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {getBlogPostShortTitle(post)}
                </Typography>
                <RecencyLabel date={post.date}/>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: expanded ? `${accent}22` : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${expanded ? `${accent}44` : colors.ui.dividerSubtle}`,
                        transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                        transform: expanded ? 'rotate(180deg)' : 'none',
                    }}
                >
                    <ExpandMoreIcon sx={{fontSize: 18, color: expanded ? accent : colors.text.muted}}/>
                </Box>
            </Box>

            <Collapse in={expanded} timeout={220}>
                <Box
                    sx={{
                        px: 1.5,
                        pb: 1.5,
                        pt: 0,
                        borderTop: `1px solid ${colors.ui.dividerSubtle}`,
                    }}
                >
                    <Typography
                        sx={{
                            m: 0,
                            pt: 1.25,
                            color: colors.text.muted,
                            fontSize: fontSizes.sm,
                            lineHeight: 1.55,
                        }}
                    >
                        {summary}
                    </Typography>
                    <Box
                        component={RouterLink}
                        to={getBlogPostHref(post.slug)}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 1.125,
                            px: 1.125,
                            py: 0.5,
                            borderRadius: 999,
                            fontSize: fontSizes.xs,
                            fontWeight: 600,
                            color: accent,
                            textDecoration: 'none',
                            bgcolor: `${accent}16`,
                            border: `1px solid ${accent}33`,
                            transition: 'background-color 0.15s ease, border-color 0.15s ease',
                            '&:hover': {
                                bgcolor: `${accent}24`,
                                borderColor: `${accent}55`,
                            },
                        }}
                    >
                        Read release notes
                        <ArrowForwardIcon sx={{fontSize: 14}}/>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}

export default function HomeBlogPreview() {
    const posts = useMemo(() => getRecentHomeBlogPosts(), []);

    if (posts.length === 0) {
        return null;
    }

    return (
        <Box component="section" aria-label="Latest blog updates" sx={{mt: 2, mb: 0.5}}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    mb: 0.75,
                }}
            >
                <Typography
                    component="h2"
                    sx={{
                        m: 0,
                        fontSize: fontSizes.sm,
                        fontWeight: 600,
                        color: colors.text.muted,
                    }}
                >
                    What&apos;s new
                </Typography>
                <Link
                    component={RouterLink}
                    to="/blog"
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.25,
                        color: colors.text.link,
                        fontSize: fontSizes.xs,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                            '& .home-blog-preview-all-arrow': {transform: 'translateX(2px)'},
                        },
                    }}
                >
                    All posts
                    <ArrowForwardIcon className="home-blog-preview-all-arrow" sx={{fontSize: 14, transition: 'transform 0.15s ease'}}/>
                </Link>
            </Box>

            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                {posts.map((post) => (
                    <BlogPreviewCard key={post.slug} post={post}/>
                ))}
            </Box>
        </Box>
    );
}
