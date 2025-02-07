import React from 'react';

interface PathProps {
  width: number;
  className?: string;
}

export const Path: React.FC<PathProps> = ({ 
  width = 100,
  className = '' 
}) => {
  const height = 12; // Thinner height for a path

  return (
    <svg 
      width={width} 
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main path with slight curve */}
      <path 
        d={`
          M0 ${height/2}
          C${width*0.2} ${height*0.3} ${width*0.4} ${height*0.7} ${width*0.6} ${height*0.4}
          C${width*0.8} ${height*0.1} ${width*0.9} ${height*0.6} ${width} ${height/2}
        `}
        stroke="#D4A373"
        strokeWidth={height}
        strokeLinecap="round"
      />
      {/* Dotted overlay for texture */}
      <path 
        d={`
          M${width*0.1} ${height/2}
          L${width*0.9} ${height/2}
        `}
        stroke="#E9EDC9"
        strokeWidth="1"
        strokeDasharray="4 8"
        opacity="0.6"
      />
    </svg>
  );
}; 