import React from 'react';

interface StoneProps {
  width: number;
  className?: string;
}

export const Stone: React.FC<StoneProps> = ({ 
  width = 100,
  className = '' 
}) => {
  const height = 40; // Fixed height for the stone

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
      {/* Simple stone shape - a rounded rectangle */}
      <path 
        d={`
          M0 ${height/2}
          C0 ${height/4} ${width*0.1} 0 ${width*0.3} 0
          L${width*0.7} 0
          C${width*0.9} 0 ${width} ${height/4} ${width} ${height/2}
          C${width} ${height*0.75} ${width*0.9} ${height} ${width*0.7} ${height}
          L${width*0.3} ${height}
          C${width*0.1} ${height} 0 ${height*0.75} 0 ${height/2}
          Z
        `}
        fill="#8B7355"
      />
      {/* Add some texture/shading */}
      <path 
        d={`
          M${width*0.2} ${height*0.3}
          L${width*0.4} ${height*0.4}
          M${width*0.6} ${height*0.6}
          L${width*0.8} ${height*0.7}
        `}
        stroke="#6B5B45"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}; 