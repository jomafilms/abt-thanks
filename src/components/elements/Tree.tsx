import React from 'react';

interface TreeProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const Tree: React.FC<TreeProps> = ({ 
  size = 'medium', 
  color = '#4A7B42', 
  className = '' 
}) => {
  const sizes = {
    small: { width: 60, height: 90 },
    medium: { width: 80, height: 120 },
    large: { width: 100, height: 150 }
  };

  const { width, height } = sizes[size];
  const triangleHeight = height - 20; // Leave space for trunk

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simple triangular tree shape */}
      <path 
        d={`M${width/2} 0L${width} ${triangleHeight}L0 ${triangleHeight}Z`} 
        fill={color} 
      />
      {/* Trunk */}
      <rect 
        x={width/2-8} 
        y={triangleHeight} 
        width={16} 
        height={20} 
        fill="#6B4423" 
      />
    </svg>
  );
}; 