"use client"

import { useRef, useState } from "react";

export function HeroVideo() {

    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="relative w-full aspect-video sm:aspect-w-16 sm:aspect-h-9">

            <video
                ref={videoRef}
                src="/jisc2024.MP4"
                className="w-full h-full object-cover pointer-events-auto"
                controls
                loop
            />
            <button onClick={togglePlayPause} className="absolute bottom-4 left-4 bg-white p-2 rounded">
                {isPlaying ? 'Pause' : 'Play'}
            </button> 
        </div>
    )
}

