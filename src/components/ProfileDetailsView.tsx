import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {Box, Link, Typography} from '@mui/material';
import {Icon} from '@iconify/react';
import {PublicUserProfile} from '../utils/avatars';
import {
    CONTACT_FIELDS,
    getContactDisplayText,
    getContactLinkHref,
    isExternalUrl,
} from '../utils/profile';
import {colors, fontSizes} from '../theme';

const sectionTitleSx = {
    color: colors.text.primary,
    fontWeight: 600,
    fontSize: fontSizes.lg,
    mb: 1.5,
} as const;

const readOnlyOutlinedSx = {
    backgroundColor: colors.background.surface,
    border: `1px solid ${colors.border.default}`,
    borderRadius: 1,
    boxSizing: 'border-box',
    userSelect: 'none',
    cursor: 'default',
} as const;

const PUBLIC_BIO_PLACEHOLDER = "This user hasn't added a bio yet.";

interface ProfileDetailsViewProps {
    profile: PublicUserProfile;
}

const ProfileDetailsView: React.FC<ProfileDetailsViewProps> = ({profile}) => {
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 4, width: '100%'}}>
            <Box sx={{width: '100%'}}>
                <Typography sx={sectionTitleSx}>Bio</Typography>
                <Box
                    sx={{
                        ...readOnlyOutlinedSx,
                        px: 1.75,
                        py: 1.5,
                        minHeight: 118,
                    }}
                >
                    {profile.bio ? (
                        <Typography
                            component="p"
                            sx={{
                                m: 0,
                                color: colors.text.primary,
                                fontSize: fontSizes.base,
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {profile.bio}
                        </Typography>
                    ) : (
                        <Typography
                            sx={{
                                color: colors.text.muted,
                                fontSize: fontSizes.base,
                                lineHeight: 1.5,
                            }}
                        >
                            {PUBLIC_BIO_PLACEHOLDER}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{width: '100%', maxWidth: 560}}>
                <Typography sx={sectionTitleSx}>Contact</Typography>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                    {CONTACT_FIELDS.map((field) => {
                        const value = profile[field.key];
                        const href = value ? getContactLinkHref(field.key, value) : '';
                        const label = value ? getContactDisplayText(field.key, value) : '';
                        const isRsn = field.key === 'rsn';
                        const isLink = !!value && (isRsn || isExternalUrl(value));

                        return (
                            <Box
                                key={field.key}
                                sx={{
                                    ...readOnlyOutlinedSx,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.75,
                                    minHeight: 56,
                                }}
                            >
                                {field.imageSrc ? (
                                    <Box
                                        component="img"
                                        src={field.imageSrc}
                                        alt=""
                                        sx={{
                                            width: 22,
                                            height: 22,
                                            flexShrink: 0,
                                            borderRadius: '4px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <Icon
                                        icon={field.icon!}
                                        style={{
                                            width: 22,
                                            height: 22,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                <Box sx={{flex: 1, minWidth: 0, py: 1.25}}>
                                    {isLink ? (
                                        isRsn ? (
                                            <Link
                                                component={RouterLink}
                                                to={href}
                                                underline="hover"
                                                sx={{
                                                    color: colors.text.link,
                                                    fontSize: fontSizes.base,
                                                    cursor: 'pointer',
                                                    userSelect: 'auto',
                                                }}
                                            >
                                                {label}
                                            </Link>
                                        ) : (
                                            <Link
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                underline="hover"
                                                sx={{
                                                    color: colors.text.link,
                                                    fontSize: fontSizes.base,
                                                    cursor: 'pointer',
                                                    userSelect: 'auto',
                                                }}
                                            >
                                                {label}
                                            </Link>
                                        )
                                    ) : value ? (
                                        <Typography
                                            sx={{
                                                color: colors.text.primary,
                                                fontSize: fontSizes.base,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {label}
                                        </Typography>
                                    ) : (
                                        <Typography
                                            sx={{
                                                color: colors.text.muted,
                                                fontSize: fontSizes.base,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {field.placeholder}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default ProfileDetailsView;
