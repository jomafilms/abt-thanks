'use client';

import React from 'react';
import { TrailContainer } from '@/components/trail/TrailContainer';
import { TrailSign } from '@/components/trail/markers/TrailSign';

// Sample data - this will later come from the database
const SAMPLE_NAMES = [
  'John Doe',
  'Jane Smith',
  'Alex Johnson',
  'Maria Garcia',
  'David Wilson',
];

export default function Home() {
  return (
    <TrailContainer>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center py-8 text-[#3d405b]">
          Above the Trees
        </h1>
        <div className="space-y-4">
          {SAMPLE_NAMES.map((name, index) => (
            <TrailSign
              key={name}
              name={name}
              position={index % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
      </div>
    </TrailContainer>
  );
}
