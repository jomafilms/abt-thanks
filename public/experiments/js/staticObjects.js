export default class StaticObjectManager {
    constructor() {
        this.config = null;
        this.baseMaxSize = this.calculateBaseMaxSize();
        this.imageCache = new Map();
        this.CHIP_SCALE = 2;     // Controls overall chip size
        this.OVERLAP_SCALE = .9; // Controls pattern overlap (0.7 = 30% overlap, 0.8 = 20% overlap, etc)
        
        // Default background config
        this.backgroundConfig = {
            maxCurvedLineNumber: 50,
            farLinesBaseSpeed: 0.95,
            farLinesSpacing: 1.2
        };
        
        // Add resize listener
        window.addEventListener('resize', () => {
            this.baseMaxSize = this.calculateBaseMaxSize();
        });
    }

    getBackgroundConfig() {
        return this.backgroundConfig;
    }

    calculateBaseMaxSize() {
        // Use viewport width to calculate base size
        // This ensures objects scale with the viewport
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return Math.min(vw, vh) * 0.1; // 10% of the smaller viewport dimension
    }

    async loadConfiguration() {
        try {
            const response = await fetch('static.json');
            const data = await response.json();
            this.config = data.staticObjects;
            
            // Load background config if available
            if (data.config?.background) {
                this.backgroundConfig = data.config.background;
            }
            
            // Preload SVG files
            await this.preloadSVGs();
            
            return true;
        } catch (error) {
            console.error('Error loading static objects configuration:', error);
            return false;
        }
    }

    async preloadSVGs() {
        const svgPromises = [];
        
        Object.values(this.config.templates).forEach(template => {
            if (template.image && !this.imageCache.has(template.image)) {
                console.log('Attempting to load SVG:', template.image);
                const promise = fetch(`images/${template.image}`)
                    .then(response => response.text())
                    .then(svgContent => {
                        console.log('Successfully loaded SVG:', template.image);
                        this.imageCache.set(template.image, svgContent);
                    })
                    .catch(error => {
                        console.error('Failed to load SVG:', template.image, error);
                    });
                svgPromises.push(promise);
            }
        });

        await Promise.all(svgPromises);
    }

    renderChipsWithPerspective(svg, lines, calculateProgress, worldCurveAt, applyPerspective) {
        // Find the center line (line 0)
        const centerLine = lines.find(line => line.number === 0);
        if (!centerLine) return;

        const chipTemplate = this.config.templates['chip'];
        if (!chipTemplate || !chipTemplate.image) return;

        const svgContent = this.imageCache.get(chipTemplate.image);
        if (!svgContent) return;

        // Calculate chip spacing in world units
        const CHIP_SPACING = 50 * this.OVERLAP_SCALE; // Adjust this value to control density
        const NUM_CHIPS = 20; // Number of chips to render

        // Create a group for all chips
        const chipsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        chipsGroup.setAttribute('class', 'dissolving-object');

        // Generate chips along the path
        for (let i = 0; i < NUM_CHIPS; i++) {
            const progress = i / NUM_CHIPS;
            const t = calculateProgress({ startProgress: progress });
            
            // Skip if outside visible range
            if (t < 0 || t > 1) continue;

            // Calculate world position
            const worldPos = worldCurveAt(t);
            const perspectivePos = applyPerspective(worldPos.x, worldPos.y, 1 - t);

            // Calculate size with perspective
            const baseSize = this.baseMaxSize * 0.5;
            const perspectiveScale = 1 - (t * 0.8); // Smaller scale in distance
            const finalSize = baseSize * perspectiveScale * this.CHIP_SCALE;

            // Create chip SVG
            const chipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            chipGroup.setAttribute('transform', `translate(${perspectivePos.x - finalSize/2},${perspectivePos.y - finalSize/2})`);

            // Parse the SVG content
            const parser = new DOMParser();
            const chipDoc = parser.parseFromString(svgContent, 'image/svg+xml');
            const chipSvg = chipDoc.documentElement;

            // Set size
            chipSvg.setAttribute('width', finalSize);
            chipSvg.setAttribute('height', finalSize);

            // Add to group
            chipGroup.appendChild(chipSvg);
            chipsGroup.appendChild(chipGroup);
        }

        svg.appendChild(chipsGroup);
    }

    renderObjects(svg, lines, calculateProgress, worldCurveAt, applyPerspective) {
        if (!this.config) return;

        // Render chips with perspective
        this.renderChipsWithPerspective(svg, lines, calculateProgress, worldCurveAt, applyPerspective);

        // Render other objects (trees, hills, etc.)
        const objectsToRender = [];
        this.config.placements.forEach(placement => {
            const template = this.config.templates[placement.template];
            if (!template || template.render === 'chips') {
                return;
            }

            placement.positions.forEach(pos => {
                // Find the corresponding line for this object
                const objectLine = lines.find(line => line.number === pos.line);
                if (!objectLine || !objectLine.pathEl) return;

                // Calculate progress differently for straight vs curved lines
                let t;
                if (objectLine.isStraight) {
                    // For straight lines, set speed to 0 for debugging
                    t = pos.progress; // Static position, no movement
                } else {
                    // Normal progress calculation for curved lines
                    t = calculateProgress({ startProgress: pos.progress });
                }

                if (t < 0 || t > 1) return;

                // Get the total length of the path and point
                const totalLength = objectLine.pathEl.getTotalLength();
                const point = objectLine.pathEl.getPointAtLength(totalLength * t);

                // Calculate size and opacity
                const baseScaleFactor = placement.scale || template.scale || 1;
                const positionScale = pos.scale || 1;
                const finalScale = baseScaleFactor * positionScale;
                
                const MIN_SIZE = this.baseMaxSize * 0.02;
                const maxSize = this.baseMaxSize * finalScale;
                const sizeMultiplier = {
                    'small': 0.7,
                    'medium': 1.0,
                    'large': 1.4
                }[placement.size || 'medium'] || 1.0;

                const growthProgress = Math.min(t / 0.8, 1);
                const currentSize = MIN_SIZE + (maxSize - MIN_SIZE) * growthProgress * sizeMultiplier;

                let opacity = 1;
                if (t > 0.8) {
                    opacity = 1 - ((t - 0.8) / 0.2);
                }

                objectsToRender.push({
                    t,
                    point,
                    template,
                    placement,
                    currentSize,
                    opacity
                });
            });
        });

        // Sort and render objects
        objectsToRender.sort((a, b) => a.t - b.t);
        objectsToRender.forEach(obj => {
            if (obj.template.type === 'svg') {
                if (obj.template.render === 'tree') {
                    this.renderTree(svg, obj.point, obj.template, obj.placement, obj.currentSize, obj.opacity);
                } else if (obj.template.render === 'hill') {
                    this.renderHill(svg, obj.point, obj.template, obj.placement, obj.currentSize, obj.opacity);
                }
            }
        });
    }

    renderTree(svg, pos, template, placement, size, opacity) {
        // Create tree group with exact position
        const treeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        treeGroup.setAttribute('transform', `translate(${pos.x - size/2},${pos.y - size})`);
        treeGroup.setAttribute('class', 'dissolving-object');
        treeGroup.style.opacity = opacity;

        // Render based on variant
        switch (template.variant) {
            case 'pine':
                this.renderPineTree(treeGroup, size, template.baseColor);
                break;
            case 'round':
                this.renderRoundTree(treeGroup, size, template.baseColor);
                break;
            case 'slim':
                this.renderSlimTree(treeGroup, size, template.baseColor);
                break;
        }

        svg.appendChild(treeGroup);
    }

    renderPineTree(group, size, color) {
        const tree = document.createElementNS("http://www.w3.org/2000/svg", "path");
        tree.setAttribute('d', `M0,${size} L${size/2},0 L${size},${size} Z`);
        tree.setAttribute('fill', color);
        group.appendChild(tree);
    }

    renderRoundTree(group, size, color) {
        const trunk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        trunk.setAttribute('x', size * 0.4);
        trunk.setAttribute('y', size * 0.7);
        trunk.setAttribute('width', size * 0.2);
        trunk.setAttribute('height', size * 0.3);
        trunk.setAttribute('fill', color);

        const crown = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        crown.setAttribute('cx', size * 0.5);
        crown.setAttribute('cy', size * 0.4);
        crown.setAttribute('r', size * 0.4);
        crown.setAttribute('fill', color);

        group.appendChild(trunk);
        group.appendChild(crown);
    }

    renderSlimTree(group, size, color) {
        const trunk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        trunk.setAttribute('x', size * 0.45);
        trunk.setAttribute('y', size * 0.5);
        trunk.setAttribute('width', size * 0.1);
        trunk.setAttribute('height', size * 0.5);
        trunk.setAttribute('fill', color);

        const crown = document.createElementNS("http://www.w3.org/2000/svg", "path");
        crown.setAttribute('d', `M${size*0.5},0 L${size*0.8},${size*0.6} L${size*0.2},${size*0.6} Z`);
        crown.setAttribute('fill', color);

        group.appendChild(trunk);
        group.appendChild(crown);
    }

    renderChips(svg, pos, template, placement, size, opacity) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('transform', `translate(${pos.x - size/2},${pos.y - size/2})`);
        group.setAttribute('class', 'dissolving-object');
        group.style.opacity = opacity;

        // Get cached SVG content
        const svgContent = this.imageCache.get(template.image);
        if (svgContent) {
            console.log('Found cached SVG content for:', template.image);
            // Create a temporary div to parse SVG content
            const div = document.createElement('div');
            div.innerHTML = svgContent;
            const svgElement = div.querySelector('svg');
            
            if (svgElement) {
                console.log('Successfully parsed SVG element');
                // Extract the contents of the SVG
                const contents = svgElement.innerHTML;
                
                // Create a new SVG element with proper sizing
                const chipsSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                chipsSvg.setAttribute('width', size);
                chipsSvg.setAttribute('height', size);
                chipsSvg.setAttribute('viewBox', svgElement.getAttribute('viewBox') || '0 0 100 100');
                chipsSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                chipsSvg.innerHTML = contents;
                
                group.appendChild(chipsSvg);
            } else {
                console.error('Failed to parse SVG element from content');
            }
        } else {
            console.error('No cached SVG content found for:', template.image);
        }

        svg.appendChild(group);
    }

    renderHill(svg, pos, template, placement, size, opacity) {
        // Create hill group with exact position
        const hillGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        hillGroup.setAttribute('transform', `translate(${pos.x - size},${pos.y - size/2})`);
        hillGroup.setAttribute('class', 'dissolving-object');
        hillGroup.style.opacity = opacity;

        // Create the hill path
        const hill = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // Generate a gentle hill curve
        const width = size * 2;  // Make hill wider than it is tall
        const height = size * 0.6;  // Control hill height
        let d = `M 0,${size/2}`;  // Start at base
        
        // Add curve points
        for (let x = 0; x <= width; x += width/20) {
            const progress = x / width;
            const y = size/2 - height * Math.sin(progress * Math.PI);
            d += ` L ${x},${y}`;
        }
        
        // Close the path
        d += ` L ${width},${size/2} Z`;
        
        hill.setAttribute('d', d);
        hill.setAttribute('fill', template.baseColor);
        
        hillGroup.appendChild(hill);
        svg.appendChild(hillGroup);
    }
} 