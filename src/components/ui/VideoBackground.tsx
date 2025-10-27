'use client';

import React from 'react';

interface VideoBackgroundProps {
  overlayOpacity?: number;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ 
  overlayOpacity = 0.4 
}) => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-[-1]">
      {/* Professional dark blue background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ 
          backgroundColor: '#0a2342', // Dark blue professional background
          backgroundImage: 'linear-gradient(135deg, #0a2342 0%, #0e3060 50%, #0a2342 100%)'
        }}
        role="presentation"
        aria-hidden="true"
      />
      
      {/* Subtle pattern overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.05) 1%, transparent 5%), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 1%, transparent 5%)',
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Overlay gradient for better text contrast */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
};

export default VideoBackground;