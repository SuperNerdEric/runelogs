import React from 'react';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    currentTime: number;
    maxTime: number;
    onSliderChange: (value: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
                                                               isPlaying,
                                                               onPlayPause,
                                                               currentTime,
                                                               maxTime,
                                                               onSliderChange,
                                                           }) => {
    // Helper function to format time in MM:SS.s format
    const formatTime = (timeInSeconds: number): string => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = (timeInSeconds % 60).toFixed(1);
        const secondsNumber = parseFloat(seconds);

        const secondsStr = secondsNumber < 10 ? '0' + seconds : seconds;
        return `${minutes}:${secondsStr}`;
    };

    return (
        <div className="playback-controls">
            <button onClick={onPlayPause} className="play-pause-button">
                {isPlaying ? (
                    // Pause Icon
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="white"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                ) : (
                    // Play Icon
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="white"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <polygon points="6,4 20,12 6,20"/>
                    </svg>
                )}
            </button>
            <input
                type="range"
                min="0"
                max={maxTime}
                value={currentTime}
                step="0.6"
                onChange={(e) => onSliderChange(parseFloat(e.target.value))}
            />
            <span>
        {formatTime(currentTime)} / {formatTime(maxTime)}
      </span>
        </div>
    );
};

export default PlaybackControls;
