import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {Icon} from '@iconify/react';
import {PublicUserProfile} from '../utils/avatars';
import {
    CONTACT_FIELDS,
    getContactDisplayText,
    getContactLinkHref,
    isContactLink,
} from '../utils/profile';

const PUBLIC_BIO_PLACEHOLDER = "This user hasn't added a bio yet.";

interface ProfileDetailsViewProps {
    profile: PublicUserProfile;
}

const ProfileDetailsView: React.FC<ProfileDetailsViewProps> = ({profile}) => {
    return (
        <div className="profile-details-form">
            <div className="w-full">
                <h2 className="profile-section-title">Bio</h2>
                <div className="profile-readonly-field px-3.5 py-3 min-h-[118px]">
                    {profile.bio ? (
                        <p className="m-0 whitespace-pre-wrap text-[var(--color-text-primary)] leading-normal">
                            {profile.bio}
                        </p>
                    ) : (
                        <p className="m-0 text-muted select-none">{PUBLIC_BIO_PLACEHOLDER}</p>
                    )}
                </div>
            </div>

            <div className="w-full max-w-[560px]">
                <h2 className="profile-section-title">Contact</h2>
                <div className="flex flex-col gap-3">
                    {CONTACT_FIELDS.map((field) => {
                        const value = profile[field.key];
                        const href = value ? getContactLinkHref(field.key, value) : '';
                        const label = value ? getContactDisplayText(field.key, value) : '';
                        const isRsn = field.key === 'rsn';
                        const isLink = !!value && isContactLink(field.key, value);

                        return (
                            <div
                                key={field.key}
                                className="profile-readonly-field flex min-h-14 items-center gap-2 px-3.5"
                            >
                                {field.imageSrc ? (
                                    <img
                                        src={field.imageSrc}
                                        alt=""
                                        className="profile-contact-icon rounded object-cover"
                                    />
                                ) : (
                                    <span className="profile-contact-icon">
                                        <Icon icon={field.icon!} style={{width: 22, height: 22}}/>
                                    </span>
                                )}
                                <div className="flex min-w-0 flex-1 items-center">
                                    {isLink ? (
                                        isRsn ? (
                                            <RouterLink
                                                to={href}
                                                className="link text-[length:inherit] leading-none"
                                            >
                                                {label}
                                            </RouterLink>
                                        ) : (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="link text-[length:inherit] leading-none"
                                            >
                                                {label}
                                            </a>
                                        )
                                    ) : value ? (
                                        <span className="text-[length:inherit] leading-none text-[var(--color-text-primary)]">
                                            {label}
                                        </span>
                                    ) : (
                                        <span className="text-muted text-[length:inherit] leading-none select-none">
                                            {field.placeholder}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProfileDetailsView;
