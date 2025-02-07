import React from 'react';

interface RollingStoneProps {
  className?: string;
}

export const RollingStone: React.FC<RollingStoneProps> = ({ 
  className = '' 
}) => {
  const size = 40; // Fixed size for the stone

  return (
    <svg 
      width={size} 
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main stone circle */}
      <circle 
        cx={size/2} 
        cy={size/2} 
        r={size/2-2}
        fill="#8B7355"
      />
      {/* Add some texture/detail */}
      <path 
        d={`
          M${size*0.3} ${size*0.3}
          L${size*0.4} ${size*0.4}
          M${size*0.6} ${size*0.6}
          L${size*0.7} ${size*0.7}
        `}
        stroke="#6B5B45"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}; 