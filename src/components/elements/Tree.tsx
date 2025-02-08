import React from 'react';

interface TreeProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  variant?: 'pine' | 'round' | 'slim';
}

export const Tree: React.FC<TreeProps> = ({ 
  size = 'medium', 
  color = '#4A7B42', 
  className = '',
  variant = 'pine'
}) => {
  const sizes = {
    small: { width: 60, height: 90 },
    medium: { width: 80, height: 120 },
    large: { width: 100, height: 150 }
  };

  const { width, height } = sizes[size];
  const triangleHeight = height - 20; // Leave space for trunk

  const getTreeShape = () => {
    switch (variant) {
      case 'pine':
        return (
          <path 
            d={`
              M${width/2} 0
              L${width*0.8} ${triangleHeight*0.3}
              L${width*0.7} ${triangleHeight*0.3}
              L${width*0.9} ${triangleHeight*0.6}
              L${width*0.8} ${triangleHeight*0.6}
              L${width} ${triangleHeight}
              L0 ${triangleHeight}
              L${width*0.2} ${triangleHeight*0.6}
              L${width*0.1} ${triangleHeight*0.6}
              L${width*0.3} ${triangleHeight*0.3}
              L${width*0.2} ${triangleHeight*0.3}
              Z
            `}
            fill={color}
          />
        );
      case 'round':
        return (
          <path
            d={`
              M${width/2} 0
              C${width*0.8} 0, ${width} ${triangleHeight*0.4}, ${width} ${triangleHeight}
              L0 ${triangleHeight}
              C0 ${triangleHeight*0.4}, ${width*0.2} 0, ${width/2} 0
              Z
            `}
            fill={color}
          />
        );
      case 'slim':
        return (
          <path
            d={`
              M${width/2} 0
              L${width*0.7} ${triangleHeight*0.5}
              L${width*0.6} ${triangleHeight*0.5}
              L${width*0.8} ${triangleHeight}
              L${width*0.2} ${triangleHeight}
              L${width*0.4} ${triangleHeight*0.5}
              L${width*0.3} ${triangleHeight*0.5}
              Z
            `}
            fill={color}
          />
        );
    }
  };

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {getTreeShape()}
      {/* Trunk */}
      <rect 
        x={width/2-8} 
        y={triangleHeight} 
        width={16} 
        height={20} 
        fill="#6B4423" 
      />
      {/* Add subtle texture lines */}
      <path
        d={`
          M${width*0.3} ${triangleHeight*0.4}
          L${width*0.4} ${triangleHeight*0.4}
          M${width*0.6} ${triangleHeight*0.6}
          L${width*0.7} ${triangleHeight*0.6}
        `}
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.5"
      />
    </svg>
  );
}; 