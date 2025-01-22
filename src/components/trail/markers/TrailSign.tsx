'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TrailSignProps {
  name: string;
  position?: 'top' | 'bottom';
}

export function TrailSign({ name, position = 'top' }: TrailSignProps) {
  return (
    <motion.div 
      className={`flex flex-col ${position === 'top' ? '-mt-8' : 'mt-8'} mx-4`}
      initial={{ 
        opacity: 0, 
        y: position === 'top' ? -30 : 30 
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0 
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
        className="bg-[#3d405b] text-[#f4f1de] p-4 rounded-lg shadow-lg w-[200px]"
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <p className="font-medium text-lg text-center">{name}</p>
      </motion.div>
    </motion.div>
  );
} 