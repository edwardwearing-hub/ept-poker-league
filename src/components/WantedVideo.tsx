'use client';

export default function WantedVideo({ playerName, className }: { playerName: string, className?: string }) {
    return (
        <video
            src={`/videos/${playerName}.mp4`}
            autoPlay
            loop
            muted
            playsInline
            className={className || "absolute inset-0 w-full h-full object-cover grayscale contrast-125 object-top transition-opacity z-10"}
            onError={(e) => {
                // If video fails to load, hide it to reveal the fallback behind it
                (e.target as HTMLVideoElement).style.display = 'none';
            }}
        />
    );
}
