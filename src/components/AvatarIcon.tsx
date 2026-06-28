import React from 'react';
import {Lock} from 'lucide-react';
import {cn} from '@/lib/utils';
import {AvatarId, AVATAR_IMAGES, isCrownAvatar} from '../utils/avatars';
import {CrownIcon} from './CrownIcon';

export interface AvatarIconProps {
    avatarId: AvatarId;
    size?: number;
    locked?: boolean;
    selected?: boolean;
    className?: string;
}

const AvatarIcon: React.FC<AvatarIconProps> = ({
    avatarId,
    size = 40,
    locked = false,
    selected = false,
    className,
}) => (
    <div
        className={cn(
            'avatar-icon',
            selected ? 'avatar-icon--selected' : 'avatar-icon--default',
            className,
        )}
        style={{width: size, height: size}}
    >
        <div
            className={cn('avatar-icon__inner', locked && 'avatar-icon__inner--locked')}
        >
            {isCrownAvatar(avatarId) ? (
                <CrownIcon size={Math.round(size * 0.78)} />
            ) : (
                <img
                    src={AVATAR_IMAGES[avatarId]}
                    alt=""
                    className="avatar-icon__image"
                />
            )}
        </div>
        {locked && (
            <Lock
                className="avatar-icon__lock"
                size={Math.round(size * 0.38)}
                aria-hidden
            />
        )}
    </div>
);

export default AvatarIcon;
