import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Tree } from '../elements/Tree';

interface TrailProps {
  names: string[];
}

export const Trail: React.FC<TrailProps> = ({ names }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Transform vertical scroll to horizontal movement
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-100%']);

  return (
    <div className="h-screen overflow-hidden relative">
      <motion.div 
        ref={containerRef}
        className="h-full flex items-center"
        style={{ x }}
      >
        <div className="flex relative min-w-[300vw]"> {/* Adjust width based on content */}
          {/* Background Layer (moves slowest) */}
          <motion.div className="absolute inset-0 flex">
            {[...Array(10)].map((_, i) => (
              <Tree 
                key={`bg-tree-${i}`} 
                size="large" 
                color="#2A4B32"
                className="opacity-50 mx-4"
              />
            ))}
          </motion.div>

          {/* Midground Layer */}
          <motion.div className="absolute inset-0 flex" style={{ x: useTransform(x, value => `${parseFloat(value as string) * 1.2}%`) }}>
            {[...Array(15)].map((_, i) => (
              <Tree 
                key={`mid-tree-${i}`} 
                size="medium"
                color="#3A6B42"
                className="mx-3"
              />
            ))}
          </motion.div>

          {/* Foreground Layer (moves fastest) */}
          <motion.div className="absolute inset-0 flex" style={{ x: useTransform(x, value => `${parseFloat(value as string) * 1.5}%`) }}>
            {[...Array(8)].map((_, i) => (
              <Tree 
                key={`fg-tree-${i}`} 
                size="small"
                color="#4A8B52"
                className="mx-2"
              />
            ))}
          </motion.div>

          {/* Names Layer */}
          <motion.div className="absolute inset-0 flex items-center">
            {names.map((name, i) => (
              <div 
                key={name} 
                className="mx-20 bg-white/90 px-4 py-2 rounded shadow"
              >
                {name}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}; 