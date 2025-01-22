'use client';

import React from 'react';

interface TrailSignProps {
  name: string;
  position?: 'left' | 'right';
}

export function TrailSign({ name, position = 'left' }: TrailSignProps) {
  return (
    <div className={`flex items-center ${position === 'left' ? 'justify-start' : 'justify-end'} py-8`}>
      <div className="bg-[#3d405b] text-[#f4f1de] p-4 rounded-lg shadow-lg max-w-[300px]">
        <p className="font-medium text-lg">{name}</p>
      </div>
    </div>
  );
} 