'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TrailContainerProps {
  children: ReactNode;
}

export function TrailContainer({ children }: TrailContainerProps) {
  return (
    <div className="relative w-full min-h-[800vh] bg-[#f4f1de]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
} 