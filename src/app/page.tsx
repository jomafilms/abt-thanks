'use client';

import React from 'react';
import { TrailContainer } from '@/components/trail/TrailContainer';
import { TrailSign } from '@/components/trail/markers/TrailSign';
import { motion, useScroll, useTransform } from 'framer-motion';

// Sample data - this will later come from the database
const SAMPLE_NAMES = [
  'John Doe',
  'Jane Smith',
  'Alex Johnson',
  'Maria Garcia',
  'David Wilson',
  'Sarah Lee',
  'Michael Brown',
  'Emma Davis',
  'James Miller',
  'Sophia Anderson',
  'William Taylor',
  'Olivia Martinez',
  'Benjamin White',
  'Isabella Thompson',
  'Lucas Rodriguez'
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const translateX = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', '-75%']
  );

  return (
    <TrailContainer>
      <div className="h-screen flex flex-col justify-center">
        <h1 className="text-4xl font-bold text-[#3d405b] fixed top-8 left-8 z-10">
          Above the Trees
        </h1>
        <motion.div 
          className="flex flex-row items-center gap-4 pl-[50vw]"
          style={{ x: translateX }}
        >
          {SAMPLE_NAMES.map((name, index) => (
            <TrailSign
              key={name}
              name={name}
              position={index % 2 === 0 ? 'top' : 'bottom'}
            />
          ))}
        </motion.div>
      </div>
    </TrailContainer>
  );
}
