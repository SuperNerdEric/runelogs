import React from 'react';

type MedalIconProps = {
    size?: number;
    color?: string;
};

const MedalIcon = ({ size = 24, color = '#C0C0C0' }: MedalIconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color, display: 'inline-block', verticalAlign: 'middle' }}
    >
        <path d="M20 2H4v2l5.81 4.36a7.004 7.004 0 0 0-4.46 8.84a6.996 6.996 0 0 0 8.84 4.46a7 7 0 0 0 0-13.3L20 4zm-5.06 17.5L12 17.78L9.06 19.5l.78-3.33l-2.59-2.24l3.41-.29L12 10.5l1.34 3.14l3.41.29l-2.59 2.24z" />
    </svg>
);

export default MedalIcon;
