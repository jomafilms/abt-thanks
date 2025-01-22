'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TrailContainerProps {
  children: ReactNode;
}

export function TrailContainer({ children }: TrailContainerProps) {
  return (
    <motion.div 
      className="relative w-full min-h-screen bg-[#f4f1de] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="absolute inset-0 overflow-y-auto scroll-smooth"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut",
          delay: 0.2
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
} 