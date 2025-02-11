export default class StaticObjectManager {
    constructor() {
        this.config = null;
        this.baseMaxSize = this.calculateBaseMaxSize();
        this.imageCache = new Map();
        
        // Add resize listener
        window.addEventListener('resize', () => {
            this.baseMaxSize = this.calculateBaseMaxSize();
        });
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

    renderObjects(svg, lines, calculateProgress, worldCurveAt, applyPerspective) {
        if (!this.config) return;

        // Collect all objects with their calculated properties first
        const objectsToRender = [];

        this.config.placements.forEach(placement => {
            const template = this.config.templates[placement.template];
            if (!template) {
                console.log('Template not found:', placement.template);
                return;
            }

            placement.positions.forEach(pos => {
                // Calculate progress exactly like markers do
                const t = calculateProgress({ startProgress: pos.progress });
                if (t < 0 || t > 1) {
                    console.log('Object out of view range:', placement.template, t);
                    return;
                }

                // Find the corresponding line for this object
                const objectLine = lines.find(line => line.number === pos.line);
                if (!objectLine || !objectLine.pathEl) {
                    console.log('Line not found for object:', placement.template, pos.line);
                    return;
                }

                // Get the total length of the path and point
                const totalLength = objectLine.pathEl.getTotalLength();
                const point = objectLine.pathEl.getPointAtLength(totalLength * t);

                // Get base scale factor from placement or template (default to 1)
                const baseScaleFactor = placement.scale || template.scale || 1;
                // Apply position-specific scale multiplier if it exists
                const positionScale = pos.scale || 1;
                const finalScale = baseScaleFactor * positionScale;
                
                // Base size calculation using viewport-relative units
                const MIN_SIZE = this.baseMaxSize * 0.02;  // 2% of base size
                const maxSize = this.baseMaxSize * finalScale;

                // Size multiplier based on template size
                const sizeMultiplier = {
                    'small': 0.7,
                    'medium': 1.0,
                    'large': 1.4
                }[placement.size || 'medium'] || 1.0;

                // Reach full size at t = 0.8 (20% from bottom)
                const growthProgress = Math.min(t / 0.8, 1);
                const currentSize = MIN_SIZE + (maxSize - MIN_SIZE) * growthProgress * sizeMultiplier;

                // Calculate dissolve effect after t = 0.8
                let opacity = 1;
                if (t > 0.8) {
                    opacity = 1 - ((t - 0.8) / 0.2);
                }

                // Store object data for sorting
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

        console.log('Objects to render:', objectsToRender.length);

        // Sort objects by progress (t) - lower t values (further away) first
        objectsToRender.sort((a, b) => a.t - b.t);

        // Render objects in sorted order
        objectsToRender.forEach(obj => {
            if (obj.template.type === 'svg') {
                if (obj.template.render === 'tree') {
                    this.renderTree(svg, obj.point, obj.template, obj.placement, obj.currentSize, obj.opacity);
                } else if (obj.template.render === 'chips' && obj.template.image) {
                    console.log('Rendering chips:', obj.template.image);
                    this.renderChips(svg, obj.point, obj.template, obj.placement, obj.currentSize, obj.opacity);
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
} 