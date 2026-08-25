'use client';
import { useState } from 'react';

export default function WantedVideo({ playerName, className }: { playerName: string, className?: string }) {
    const [videoError, setVideoError] = useState(false);
    const classes = className || "absolute inset-0 w-full h-full object-cover grayscale contrast-125 object-top transition-opacity z-10";

    if (videoError) {
        return (
            <img 
                src={`/videos/${playerName}.png`}
                alt={playerName}
                className={classes}
                onError={(e) => {
                    // If both MP4 and PNG fail, hide to reveal the 8-bit avatar underneath
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
        );
    }

    return (
        <video
            src={`/videos/${playerName}.mp4`}
            autoPlay
            loop
            muted
            playsInline
            className={classes}
            onError={() => setVideoError(true)}
        />
    );
}
