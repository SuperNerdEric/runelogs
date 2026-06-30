import React from 'react';
import {Box, Link, Typography} from '@mui/material';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import {Link as RouterLink} from 'react-router-dom';
import {Icon} from '@iconify/react';
import {colors, contentColumnSx, fontSizes, media} from '../theme';
import {
    pageHeaderContainerSx,
    pageHeaderIconBoxSx,
    pageHeaderSubtitleSx,
} from './pageHeaderStyles';

const bodyTextSx = {
    color: colors.text.primary,
    fontSize: fontSizes.base,
    lineHeight: 1.65,
    mb: 1.5,
    '&:last-child': {mb: 0},
};

const listSx = {
    color: colors.text.primary,
    fontSize: fontSizes.base,
    lineHeight: 1.65,
    pl: 3,
    mb: 1.5,
    mt: 0,
    '& li': {
        mb: 0.75,
        '&:last-child': {mb: 0},
    },
};

const sectionTitleSx = {
    fontWeight: 600,
    color: colors.text.primary,
    mt: 3,
    mb: 1,
};

const linkSx = {
    color: colors.text.link,
    textDecoration: 'none',
    '&:hover': {
        color: colors.text.link,
        textDecoration: 'underline',
    },
};

const Privacy: React.FC = () => {
    return (
        <Box sx={{...contentColumnSx, mt: 2, px: 2, pb: 4, [media.mobileDown]: {px: 1}}}>
            <Box sx={pageHeaderContainerSx}>
                <Box sx={pageHeaderIconBoxSx}>
                    <PrivacyTipIcon sx={{fontSize: 32, color: colors.upload.dragActive}}/>
                </Box>
                <Box>
                    <Typography variant="h4" sx={{m: 0, fontWeight: 600, color: colors.text.primary, lineHeight: 1.15}}>
                        Privacy Policy
                    </Typography>
                    <Typography component="span" sx={pageHeaderSubtitleSx}>
                        Effective date: June 30, 2026
                    </Typography>
                </Box>
            </Box>

            <Box sx={{px: 0.5}}>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates{' '}
                    <Link href="https://www.runelogs.com" sx={linkSx}>
                        runelogs.com
                    </Link>
                    , a combat log analysis service for Old School RuneScape. This Privacy Policy
                    explains what information we collect, how we use it, and the choices you have
                    when you use our website and related services.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    1. Information we collect
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Account information.</strong> When you register or log in, we use Auth0
                    (auth.runelogs.com) to authenticate you. Depending on how you sign up, we may
                    receive your email address, username, and basic profile information from your
                    identity provider. We use this to operate your account and provide the service.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Profile information you provide.</strong> If you choose to fill out your
                    profile, we store information such as display name, avatar, bio, and optional
                    contact links (for example Discord, Twitter, or Twitch handles) that you submit.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Combat logs and gameplay data.</strong> When you upload a combat log or
                    use live logging, we process and store log contents and derived fight data
                    (such as encounters, damage, timing, and player names appearing in the log).
                    Uploaded logs may be visible to other visitors depending on how you use the
                    service and the sharing features of the site.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Live log access keys.</strong> If you enable live logging, we generate
                    and store an access key tied to your account so the Combat Logger plugin can
                    submit data on your behalf.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Usage and device information.</strong> We use Google Analytics to
                    collect aggregated usage data such as pages visited, approximate location,
                    browser type, and referral source. Auth0 and our hosting providers may also
                    process technical data (such as IP address and user agent) as part of
                    operating the service.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    2. How we use your information
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    We use the information above to:
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>Provide, maintain, and improve Runelogs</li>
                    <li>Parse, store, and display combat logs and related statistics</li>
                    <li>Operate leaderboards, profiles, and other site features</li>
                    <li>Authenticate users and protect accounts</li>
                    <li>Send transactional emails such as password reset and email verification
                        (via Auth0 and Amazon SES)</li>
                    <li>Monitor site performance, diagnose issues, and understand usage trends</li>
                    <li>Enforce our policies and comply with legal obligations</li>
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    We do not sell your personal information. We do not send marketing or
                    promotional email newsletters.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    3. How we share information
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Public content.</strong> Combat logs, encounter pages, leaderboards,
                    and profile fields you make available may be visible to other users of the
                    site. Player names and statistics contained in uploaded logs may appear in
                    public views.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Service providers.</strong> We use trusted third parties to operate
                    Runelogs, including:
                </Typography>
                <Box component="ul" sx={listSx}>
                    <li>Auth0 for authentication and account-related email delivery</li>
                    <li>Amazon Web Services for hosting, storage, and email infrastructure</li>
                    <li>Google Analytics for aggregated site analytics</li>
                </Box>
                <Typography variant="body1" sx={bodyTextSx}>
                    These providers process data on our behalf subject to their own privacy
                    policies and our instructions where applicable.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    <strong>Legal requirements.</strong> We may disclose information if required
                    by law, regulation, legal process, or to protect the rights, safety, and
                    security of Runelogs, our users, or others.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    4. Cookies and local storage
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    We and our service providers use cookies, local storage, and similar
                    technologies to keep you signed in, remember preferences, and measure site
                    usage. Auth0 stores session and authentication tokens in your browser as part
                    of the login flow. You can control cookies through your browser settings, but
                    disabling them may limit your ability to use authenticated features.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    5. Data retention
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    We retain account and profile information for as long as your account is
                    active. Combat logs and derived data are retained to provide the service
                    unless you delete them or request removal where applicable. We may retain
                    certain records as needed for security, backups, legal compliance, or dispute
                    resolution.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    6. Your choices and rights
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Depending on where you live, you may have rights to access, correct, delete,
                    or export personal information we hold about you, or to object to or restrict
                    certain processing. You can update much of your profile information from your
                    account settings. To delete your account or request help with your data,
                    contact us using the details below.
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    If you receive a transactional email from us (such as a password reset), you
                    can ignore it if you did not request it. We do not use those messages for
                    marketing.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    7. Security
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    We use reasonable technical and organizational measures to protect
                    information, including encrypted connections (HTTPS) and access controls on
                    our infrastructure. No method of transmission or storage is completely
                    secure, and we cannot guarantee absolute security.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    8. Children
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs is not directed at children under 13, and we do not knowingly
                    collect personal information from children under 13. If you believe a child
                    has provided us personal information, please contact us so we can take
                    appropriate action.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    9. International users
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    Runelogs is operated from the United States. If you access the service from
                    outside the United States, your information may be processed and stored in
                    the United States and other countries where our service providers operate.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    10. Changes to this policy
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    We may update this Privacy Policy from time to time. We will post the revised
                    policy on this page and update the effective date above. Continued use of
                    Runelogs after changes become effective means you accept the updated policy.
                </Typography>

                <Typography variant="h6" component="h2" sx={sectionTitleSx}>
                    11. Contact us
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    For privacy-related questions or to exercise your data rights, email us at{' '}
                    <Link href="mailto:privacy@runelogs.com" sx={linkSx}>
                        privacy@runelogs.com
                    </Link>
                    .
                </Typography>
                <Typography variant="body1" sx={bodyTextSx}>
                    For general product support, email{' '}
                    <Link href="mailto:support@runelogs.com" sx={linkSx}>
                        support@runelogs.com
                    </Link>
                    , reach out on{' '}
                    <Link
                        href="https://discord.gg/ZydwX7AJEd"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        <Icon
                            icon="logos:discord-icon"
                            style={{
                                width: '1em',
                                height: '1em',
                                verticalAlign: '-0.125em',
                                marginRight: '0.25em',
                            }}
                        />
                        Discord
                    </Link>
                    , or open an issue on{' '}
                    <Link
                        href="https://github.com/SuperNerdEric/runelogs"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={linkSx}
                    >
                        GitHub
                    </Link>
                    .
                </Typography>
                <Typography variant="body1" sx={{...bodyTextSx, mt: 2, color: colors.text.muted}}>
                    See also our{' '}
                    <Link component={RouterLink} to="/help" sx={linkSx}>
                        Help
                    </Link>{' '}
                    page for FAQs and setup guides.
                </Typography>
            </Box>
        </Box>
    );
};

export default Privacy;
