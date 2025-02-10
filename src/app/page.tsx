'use client';

import React from 'react';
import { TrailContainer } from '@/components/trail/TrailContainer';
import { TrailSign } from '@/components/trail/markers/TrailSign';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Tree } from '@/components/elements/Tree';
import { Path } from '@/components/elements/Path';
import { RollingStone } from '@/components/elements/RollingStone';

// Sample data - this will later come from the database
const SAMPLE_NAMES = [
  'John Doe',
  'Jane Smith',
  'Alex Johnson',
  'Maria Garcia',
  'David Wilson',
  'Emma Thompson',
  'Michael Brown',
  'Sarah Davis',
  'William Taylor',
  'Olivia Martinez',
  'James Anderson',
  'Sophia Lee',
  'Benjamin White',
  'Isabella Clark',
  'Daniel Rodriguez',
  'Victoria Kim',
  'Christopher Moore',
  'Elizabeth Wright',
  'Andrew Scott',
  'Mia Turner',
  'Joseph Phillips',
  'Ava Nelson',
  'Matthew Hill',
  'Grace Baker',
  'Ethan Carter',
  'Chloe Adams',
  'Samuel Green',
  'Zoe Campbell',
  'Nathan Ross',
  'Lily Cooper'
  // More names can be added from Shopify data
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const [windowWidth, setWindowWidth] = React.useState(0);

  // Handle window resize
  React.useEffect(() => {
    // Set initial width
    setWindowWidth(window.innerWidth);

    // Update width on resize
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Main content translation
  const translateX = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', '-600%']
  );

  // Path width animation
  const pathWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ['10vw', '100vw']
  );

  // Background image parallax
  const bgX = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', '-50%']
  );

  // Create repeating sets of trees for each layer
  const createTreeSet = (count: number, props: any) => (
    <>
      {[...Array(count)].map((_, i) => (
        <Tree 
          key={`tree-${i}`} 
          {...props}
        />
      ))}
    </>
  );

  return (
    <TrailContainer>
      <div className="h-screen flex flex-col justify-center bg-[#f4f1de] relative overflow-hidden">
        {/* Static Background Color */}
        <div className="absolute inset-0 bg-[#f4f1de]" />

        {/* Repeating Background Image Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ x: bgX }}
        >
          <div 
            className="h-full w-[400vw]" 
            style={{
              backgroundImage: 'none',
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
              opacity: 0.4
            }}
          />
        </motion.div>

        <h1 className="text-4xl font-bold text-[#3d405b] fixed top-8 left-8 z-50">
          Above the Trees
        </h1>

        {/* Path Layer */}
        <motion.div 
          className="absolute bottom-8 left-0 z-25 px-4"
          style={{ width: pathWidth }}
        >
          <Path width={2000} className="w-full" />
        </motion.div>

        {/* Rolling Stone Layer - Simplified Movement */}
        <motion.div 
          className="absolute bottom-12 left-0 z-26"
          style={{ 
            x: useTransform(scrollYProgress, [0, 1], [0, Math.max(0, windowWidth - 60)])
          }}
        >
          <div className="w-[40px] h-[40px]">
            <motion.div 
              style={{ 
                rotate: useTransform(scrollYProgress, [0, 1], [0, 720])
              }}
            >
              <RollingStone />
            </motion.div>
          </div>
        </motion.div>

        {/* Background Layer (moves slowest) */}
        <motion.div 
          className="absolute inset-0 flex items-center z-10"
          style={{ x: useTransform(scrollYProgress, [0, 1], ['0%', '-300%']) }}
        >
          <div className="flex flex-nowrap">
            {/* Original set */}
            {createTreeSet(30, {
              size: "large",
              color: "#1D3B4A",
              variant: "pine",
              className: "opacity-80 mx-12 transform -translate-y-20 shrink-0"
            })}
            {/* Repeated set */}
            {createTreeSet(30, {
              size: "large",
              color: "#1D3B4A",
              variant: "pine",
              className: "opacity-80 mx-12 transform -translate-y-20 shrink-0"
            })}
          </div>
        </motion.div>

        {/* Midground Layer */}
        <motion.div 
          className="absolute inset-0 flex items-center z-20"
          style={{ x: useTransform(scrollYProgress, [0, 1], ['0%', '-450%']) }}
        >
          <div className="flex flex-nowrap">
            {/* Original set */}
            {createTreeSet(35, {
              size: "medium",
              color: "#2A9D8F",
              variant: "round",
              className: "mx-10 shrink-0"
            })}
            {/* Repeated set */}
            {createTreeSet(35, {
              size: "medium",
              color: "#2A9D8F",
              variant: "slim",
              className: "mx-10 shrink-0"
            })}
            {/* Extra set for longer scroll */}
            {createTreeSet(35, {
              size: "medium",
              color: "#2A9D8F",
              variant: "round",
              className: "mx-10 shrink-0"
            })}
          </div>
        </motion.div>

        {/* Foreground Layer (moves fastest) */}
        <motion.div 
          className="absolute inset-0 flex items-center z-30"
          style={{ x: useTransform(scrollYProgress, [0, 1], ['0%', '-600%']) }}
        >
          <div className="flex flex-nowrap">
            {/* Original set */}
            {createTreeSet(25, {
              size: "small",
              color: "#64C2A6",
              variant: "slim",
              className: "mx-8 transform translate-y-20 shrink-0"
            })}
            {/* Repeated sets */}
            {createTreeSet(25, {
              size: "small",
              color: "#64C2A6",
              variant: "round",
              className: "mx-8 transform translate-y-20 shrink-0"
            })}
            {/* Extra sets for longer scroll */}
            {createTreeSet(25, {
              size: "small",
              color: "#64C2A6",
              variant: "slim",
              className: "mx-8 transform translate-y-20 shrink-0"
            })}
            {createTreeSet(25, {
              size: "small",
              color: "#64C2A6",
              variant: "round",
              className: "mx-8 transform translate-y-20 shrink-0"
            })}
          </div>
        </motion.div>

        {/* Names Layer */}
        <motion.div 
          className="flex flex-row items-center gap-16 pl-[50vw] z-40 relative"
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
