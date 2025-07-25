import React from 'react';

export const CrownIcon = ({ size = 24, color = '#FFD700' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color, display: 'inline-block', verticalAlign: 'middle' }}
    >
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14z" />
    </svg>
);
