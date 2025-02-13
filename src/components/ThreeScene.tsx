'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeScene() {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        
        // Camera setup with horizon line at center
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Position camera for walking height and angle
        const CAMERA_HEIGHT = 1.7;
        const INITIAL_Z = 10;
        const CAMERA_X = 0;
        camera.position.set(CAMERA_X, CAMERA_HEIGHT, INITIAL_Z);
        
        // Calculate camera rotation to place horizon at vertical center
        const HORIZON_Y = window.innerHeight / 2;
        const verticalFOV = camera.fov * Math.PI / 180;
        const horizontalDistance = (window.innerHeight / 2) / Math.tan(verticalFOV / 2);
        const downwardAngle = Math.atan(CAMERA_HEIGHT / horizontalDistance);
        
        // Lock camera rotation
        camera.rotation.set(-downwardAngle, 0, 0);
        camera.rotation.order = 'XYZ';

        // Sky
        scene.background = new THREE.Color(0x87CEEB);

        // Ground - make it really big so we never see the edge
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x90EE90,
            side: THREE.DoubleSide 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        scene.add(ground);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 10, 0);
        scene.add(directionalLight);

        // Create path sections that will loop
        const pathGroup = new THREE.Group();
        scene.add(pathGroup);

        const createPathSection = (startZ: number) => {
            // Create a tapered path that narrows towards the vanishing point
            const segments = 20; // More segments for smoother tapering
            const points = [];
            const length = 100;
            const startWidth = 4;
            const endWidth = 0.5; // Narrower at the end

            for (let i = 0; i <= segments; i++) {
                const z = (i / segments) * length;
                const width = startWidth + (endWidth - startWidth) * (i / segments);
                points.push(new THREE.Vector3(-width/2, 0, -z));
                points.push(new THREE.Vector3(width/2, 0, -z));
            }

            const pathGeometry = new THREE.BufferGeometry();
            const vertices: number[] = [];
            const indices: number[] = [];

            // Create triangles between points
            for (let i = 0; i < segments; i++) {
                const v0 = i * 2;
                const v1 = v0 + 1;
                const v2 = v0 + 2;
                const v3 = v0 + 3;

                // First triangle
                indices.push(v0, v1, v2);
                // Second triangle
                indices.push(v2, v1, v3);
            }

            points.forEach(p => vertices.push(p.x, p.y, p.z));

            pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            pathGeometry.setIndex(indices);
            pathGeometry.computeVertexNormals();

            const pathMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x808080,
                side: THREE.DoubleSide
            });

            const pathSection = new THREE.Mesh(pathGeometry, pathMaterial);
            pathSection.rotation.x = -Math.PI / 2;
            pathSection.position.y = 0.01;
            pathSection.position.z = startZ;
            pathGroup.add(pathSection);
        };

        // Create more path sections for smoother transitions
        createPathSection(0);
        createPathSection(-100);
        createPathSection(-200);
        createPathSection(-300);

        // Create a group for objects that will loop
        const objectsGroup = new THREE.Group();
        scene.add(objectsGroup);

        // Constants for object placement
        const SECTION_LENGTH = 100;
        const OBJECT_SPACING = 10;
        const NUM_OBJECTS = SECTION_LENGTH / OBJECT_SPACING;

        // Create one section of objects
        const createSection = (startZ: number) => {
            for (let i = 0; i < NUM_OBJECTS; i++) {
                const cube = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.5, 0.5),
                    new THREE.MeshPhongMaterial({ color: 0xff0000 })
                );
                cube.position.set(0, 0.25, startZ - (i * OBJECT_SPACING));
                objectsGroup.add(cube);
            }
        };

        // Create initial object sections
        createSection(0);
        createSection(-SECTION_LENGTH);
        createSection(-SECTION_LENGTH * 2);

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        let lastScrollY = window.scrollY;
        let totalScrollDistance = 0;

        // Handle scroll - true infinite movement
        const handleScroll = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            let deltaY = 0;
            
            // If we're near the bottom or top, reset to middle
            if (window.scrollY > maxScroll * 0.8 || window.scrollY < maxScroll * 0.2) {
                // Save the difference to maintain smooth transition
                deltaY = window.scrollY - lastScrollY;
                
                // Reset to middle of scroll area
                window.scrollTo(0, maxScroll * 0.5);
                lastScrollY = maxScroll * 0.5;
            } else {
                deltaY = window.scrollY - lastScrollY;
                lastScrollY = window.scrollY;
            }

            // Update total scroll distance
            totalScrollDistance += deltaY;

            // Lock camera position and update only Z
            camera.position.set(
                CAMERA_X,
                CAMERA_HEIGHT,
                INITIAL_Z - (totalScrollDistance * 0.05)
            );

            // Lock camera rotation
            camera.rotation.set(-downwardAngle, 0, 0);

            // Update path sections
            pathGroup.children.forEach(section => {
                const sectionLength = 100;
                if (section.position.z > camera.position.z + sectionLength * 2) {
                    section.position.z -= sectionLength * 4;
                } else if (section.position.z < camera.position.z - sectionLength * 2) {
                    section.position.z += sectionLength * 4;
                }
            });

            // Update objects
            objectsGroup.children.forEach(obj => {
                const sectionLength = 100;
                if (obj.position.z > camera.position.z + sectionLength * 2) {
                    obj.position.z -= sectionLength * 4;
                } else if (obj.position.z < camera.position.z - sectionLength * 2) {
                    obj.position.z += sectionLength * 4;
                }
            });
        };

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        // Start animation
        animate();

        // Add event listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);

        // Cleanup
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