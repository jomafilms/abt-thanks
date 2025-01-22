'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TrailSignProps {
  name: string;
  position?: 'left' | 'right';
}

export function TrailSign({ name, position = 'left' }: TrailSignProps) {
  return (
    <motion.div 
      className={`flex items-center ${position === 'left' ? 'justify-start' : 'justify-end'} py-8`}
      initial={{ 
        opacity: 0, 
        x: position === 'left' ? -50 : 50 
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0 
      }}
      viewport={{ 
        once: true,
        margin: "-100px"
      }}
      transition={{ 
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <motion.div 
        className="bg-[#3d405b] text-[#f4f1de] p-4 rounded-lg shadow-lg max-w-[300px]"
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <p className="font-medium text-lg">{name}</p>
      </motion.div>
    </motion.div>
  );
} 