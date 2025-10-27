'use client';

import React, { useRef, useEffect } from 'react';

interface VideoSectionProps {
  videoSrc: string;
  title?: string;
  description?: string;
}

const VideoSection: React.FC<VideoSectionProps> = ({
  videoSrc,
  title,
  description
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn('Autoplay prevented:', error);
      });
    }
  }, []);

  return (
    <section className="relative py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Video container with higher z-index */}
        <div className="relative rounded-lg overflow-hidden shadow-xl mb-8 z-10">
          {/* Video element */}
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Optional title and description */}
        {(title || description) && (
          <div className="text-center mt-8">
            {title && <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>}
            {description && <p className="text-lg text-gray-300">{description}</p>}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;