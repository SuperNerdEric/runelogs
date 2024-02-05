// Instructions.tsx
import React from 'react';

const Instructions: React.FC = () => {
    return (
        <div className="instructions-container">
            <ol>
                <li>Install the <a href="https://runelite.net/plugin-hub/show/combat-logger" target="_blank" rel="noopener noreferrer">Combat Logger</a> plugin from the RuneLite plugin hub</li>
                <li>Locate your combat logs stored in <code>.runelite/combat_log</code></li>
                <li>Upload and analyze!</li>
            </ol>
        </div>
    );
};

export default Instructions;
