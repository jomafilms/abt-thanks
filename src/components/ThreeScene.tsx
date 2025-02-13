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
        // Position camera lower and adjust angle
        camera.position.set(0, 2, 5); // Lowered Y position
        camera.rotation.x = -0.3; // Adjusted angle to look slightly upwards

        const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Create a group for dots
        const dotsGroup = new THREE.Group();
        scene.add(dotsGroup);

        // Create a simple dot
        const createDot = (z: number) => {
            const geometry = new THREE.SphereGeometry(0.1);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: true });
            const dot = new THREE.Mesh(geometry, material);
            dot.position.set(0, -2, z);
            dot.frustumCulled = false; // Prevent disappearing at screen edges
            return dot;
        };

        // Constants for smoother looping
        const LOOP_DISTANCE = 270;  // Total loop distance
        const LOOP_TRIGGER = 100;   // Distance from camera to trigger loop
        const SECTION_OVERLAP = 10; // Overlap between sections

        // Create a line of dots
        const createDotLine = (startZ: number) => {
            const NUM_DOTS = 35; // More dots for smoother transitions
            const SPACING = 3;
            
            for (let i = 0; i < NUM_DOTS; i++) {
                const z = startZ - (i * SPACING);
                dotsGroup.add(createDot(z));
            }
        };

        // Create three sections of dot lines with overlap
        createDotLine(SECTION_OVERLAP);
        createDotLine(-LOOP_DISTANCE/3);
        createDotLine(-LOOP_DISTANCE * 2/3);

        // Create a group for test objects
        const testObjectsGroup = new THREE.Group();
        scene.add(testObjectsGroup);

        // Add a test object (future tree position)
        const createTestObject = () => {
            const geometry = new THREE.SphereGeometry(0.3);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: true });
            const testObject = new THREE.Mesh(geometry, material);
            testObject.position.set(-4, -1.5, -40);
            testObject.frustumCulled = false;
            return testObject;
        };

        // Add a distant test object
        const createDistantObject = () => {
            const geometry = new THREE.SphereGeometry(2);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: true });
            const distantObject = new THREE.Mesh(geometry, material);
            distantObject.position.set(-20, -2, -150);
            distantObject.frustumCulled = false;
            return distantObject;
        };

        // Add an extremely distant object
        const createExtremeDistantObject = () => {
            const geometry = new THREE.SphereGeometry(4);
            const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, depthTest: true, transparent: true, opacity: 0 });
            const extremeObject = new THREE.Mesh(geometry, material);
            extremeObject.position.set(-40, -1, -350);
            extremeObject.frustumCulled = false;
            return extremeObject;
        };

        // Add test objects to the group
        const testObject = createTestObject();
        const distantObject = createDistantObject();
        const extremeDistantObject = createExtremeDistantObject();
        testObjectsGroup.add(testObject);
        testObjectsGroup.add(distantObject);
        testObjectsGroup.add(extremeDistantObject);

        // Function to update dot scale based on distance from camera
        const updateDotScale = (dot: THREE.Mesh) => {
            const distanceFromCamera = Math.abs(dot.position.z - camera.position.z);
            // Further increased minimum scale
            const scale = Math.max(0.6, 1 / (1 + distanceFromCamera * 0.01));
            dot.scale.set(scale, scale, scale);

            // Add fade-in effect
            const material = dot.material as THREE.MeshBasicMaterial;
            material.opacity = Math.min(1, 1 / (1 + distanceFromCamera * 0.05));
            material.transparent = true;
        };

        // Function to handle object looping
        const updateObjectPosition = (obj: THREE.Object3D) => {
            if (obj.position.z > camera.position.z + LOOP_TRIGGER) {
                obj.position.z -= LOOP_DISTANCE + SECTION_OVERLAP;
            } else if (obj.position.z < camera.position.z - LOOP_TRIGGER) {
                obj.position.z += LOOP_DISTANCE + SECTION_OVERLAP;
            }
        };

        // Animation loop with dot scaling
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Update all dot scales
            dotsGroup.children.forEach(dot => {
                updateDotScale(dot as THREE.Mesh);
            });
            
            // Update test objects scale
            testObjectsGroup.children.forEach(child => {
                updateDotScale(child as THREE.Mesh);
            });

            renderer.render(scene, camera);
        };

        // Efficiently manage event listeners
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        let lastScrollY = window.scrollY;
        let cameraZ = 5;

        // Handle scroll
        const handleScroll = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            
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

            // Update all object positions
            dotsGroup.children.forEach(updateObjectPosition);
            testObjectsGroup.children.forEach(updateObjectPosition);
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