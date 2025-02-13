'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
 * ⚠️ IMPORTANT SCROLL DIRECTION NOTE ⚠️
 * 
 * SCROLL DIRECTION MUST BE:
 * - Scroll DOWN = Objects move TOWARDS the camera (negative Z)
 * - Scroll UP = Objects move AWAY from the camera (positive Z)
 * 
 * This creates the effect of moving forward into the scene when scrolling down,
 * which is the expected behavior for this visualization.
 */

export default function ThreeScene() {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Basic scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // Black background
        
        const camera = new THREE.PerspectiveCamera(
            60, // Reduced FOV for better perspective
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Position camera higher and angle it down
        camera.position.set(0, 4, 5);
        camera.rotation.x = -0.5; // Angle camera down

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Create a group for dots
        const dotsGroup = new THREE.Group();
        scene.add(dotsGroup);

        // Create a simple dot
        const createDot = (z: number) => {
            const geometry = new THREE.SphereGeometry(0.1); // Base size, will scale dynamically
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const dot = new THREE.Mesh(geometry, material);
            dot.position.set(0, -2, z);
            return dot;
        };

        // Create a line of dots
        const createDotLine = (startZ: number) => {
            const NUM_DOTS = 30;
            const SPACING = 3;
            
            for (let i = 0; i < NUM_DOTS; i++) {
                const z = startZ - (i * SPACING);
                dotsGroup.add(createDot(z));
            }
        };

        // Create three sections of dot lines
        createDotLine(0);
        createDotLine(-90);
        createDotLine(-180);

        // Add a test object (future tree position)
        const createTestObject = () => {
            const geometry = new THREE.SphereGeometry(0.3); // Larger than path dots
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green to distinguish it
            const testObject = new THREE.Mesh(geometry, material);
            // Position it to the left (-x) and slightly higher than our path
            testObject.position.set(-4, -1.5, -40);
            return testObject;
        };

        const testObject = createTestObject();
        scene.add(testObject);

        // Function to update dot scale based on distance from camera
        const updateDotScale = (dot: THREE.Mesh) => {
            const distanceFromCamera = Math.abs(dot.position.z - camera.position.z);
            const scale = Math.max(0.2, 1 - (distanceFromCamera * 0.02));
            dot.scale.set(scale, scale, scale);
        };

        // Animation loop with dot scaling
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Update all dot scales
            dotsGroup.children.forEach(dot => {
                updateDotScale(dot as THREE.Mesh);
            });
            
            // Update test object scale
            updateDotScale(testObject);

            renderer.render(scene, camera);
        };

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        let lastScrollY = window.scrollY;
        let cameraZ = 5;

        // Super simple scroll handling
        const handleScroll = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            
            // Reset scroll position when reaching bounds
            if (window.scrollY > maxScroll * 0.8 || window.scrollY < maxScroll * 0.2) {
                window.scrollTo(0, maxScroll * 0.5);
                lastScrollY = maxScroll * 0.5;
                return;
            }

            const deltaY = window.scrollY - lastScrollY;
            lastScrollY = window.scrollY;
            
            // Move camera
            cameraZ -= deltaY * 0.01;
            camera.position.z = cameraZ;
            camera.position.y = 4;

            // Update dot positions
            dotsGroup.children.forEach(dot => {
                if (dot.position.z > camera.position.z + 90) {
                    dot.position.z -= 270;
                } else if (dot.position.z < camera.position.z - 90) {
                    dot.position.z += 270;
                }
            });

            // Update test object position
            if (testObject.position.z > camera.position.z + 90) {
                testObject.position.z -= 270;
            } else if (testObject.position.z < camera.position.z - 90) {
                testObject.position.z += 270;
            }
        };

        animate();

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
            containerRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <>
            <div ref={containerRef} style={{ 
                position: 'fixed',
                width: '100%',
                height: '100%'
            }} />
            <div ref={scrollAreaRef} style={{
                position: 'absolute',
                width: '100%',
                height: '500vh'
            }} />
        </>
    );
} 