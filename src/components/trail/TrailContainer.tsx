'use client';

import React, { ReactNode } from 'react';

interface TrailContainerProps {
  children: ReactNode;
}

export function TrailContainer({ children }: TrailContainerProps) {
  return (
    <div className="relative w-full min-h-screen bg-[#f4f1de] overflow-hidden">
      <div className="absolute inset-0 overflow-y-auto scroll-smooth">
        {children}
      </div>
    </div>
  );
} 