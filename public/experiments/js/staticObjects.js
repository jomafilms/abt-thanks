export default class StaticObjectManager {
    constructor() {
        this.config = null;
        this.baseMaxSize = this.calculateBaseMaxSize();
        this.imageCache = new Map();
        this.CHIP_SCALE = 2;     // Controls overall chip size
        this.OVERLAP_SCALE = .9; // Controls pattern overlap (0.7 = 30% overlap, 0.8 = 20% overlap, etc)
        
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
                        // Once we have the chips SVG, update the pattern
                        if (template.render === 'chips') {
                            this.updateChipPattern(svgContent);
                        }
                    })
                    .catch(error => {
                        console.error('Failed to load SVG:', template.image, error);
                    });
                svgPromises.push(promise);
            }
        });

        await Promise.all(svgPromises);
    }

    updateChipPattern(svgContent) {
        // Find the main SVG and pattern element
        const mainSvg = document.getElementById('scene');
        if (!mainSvg) {
            console.error('Main SVG element not found');
            return;
        }

        const pattern = mainSvg.querySelector('#chipPattern');
        if (!pattern) {
            console.error('Chip pattern element not found in main SVG');
            return;
        }

        // Clear any existing content
        while (pattern.firstChild) {
            pattern.removeChild(pattern.firstChild);
        }

        // Parse the SVG content
        const div = document.createElement('div');
        div.innerHTML = svgContent;
        const svgElement = div.querySelector('svg');
        
        if (svgElement) {
            // Extract viewBox and content
            const viewBox = svgElement.getAttribute('viewBox');
            console.log('SVG viewBox:', viewBox);
            
            // Parse viewBox values
            const [x, y, width, height] = viewBox.split(' ').map(Number);
            console.log('Original SVG dimensions - width:', width, 'height:', height);
            
            // Calculate aspect ratio
            const aspectRatio = width / height;
            console.log('Aspect ratio:', aspectRatio);
            
            // Calculate sizes with overlap
            const baseChipSize = 50;
            const chipSize = baseChipSize * this.CHIP_SCALE;
            
            // Adjust chip dimensions to maintain aspect ratio
            const chipWidth = chipSize;
            const chipHeight = chipSize / aspectRatio;
            console.log('Adjusted chip dimensions - width:', chipWidth, 'height:', chipHeight);
            
            // Make pattern smaller than chip size to create overlap
            const patternWidth = Math.round(chipWidth * this.OVERLAP_SCALE);
            const patternHeight = Math.round(chipHeight * this.OVERLAP_SCALE);
            
            // Update pattern attributes
            pattern.setAttribute('width', patternWidth.toString());
            pattern.setAttribute('height', patternHeight.toString());
            
            // Background rectangle for path fill
            const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bgRect.setAttribute('width', patternWidth.toString());
            bgRect.setAttribute('height', patternHeight.toString());
            bgRect.setAttribute('fill', '#D4A373');
            bgRect.setAttribute('opacity', '0.2');
            pattern.appendChild(bgRect);

            // Create the chip SVG
            const chipSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            chipSvg.setAttribute('viewBox', viewBox);
            chipSvg.setAttribute('width', chipWidth.toString());
            chipSvg.setAttribute('height', chipHeight.toString());
            
            // Center the chip in the pattern
            chipSvg.setAttribute('x', ((patternWidth - chipWidth) / 2).toString());
            chipSvg.setAttribute('y', ((patternHeight - chipHeight) / 2).toString());
            chipSvg.innerHTML = svgElement.innerHTML;
            
            pattern.appendChild(chipSvg);
        } else {
            console.error('Failed to parse SVG element from content');
        }
    }

    renderObjects(svg, lines, calculateProgress, worldCurveAt, applyPerspective) {
        if (!this.config) return;

        // Ensure we're using the main SVG element
        const mainSvg = svg.closest('svg') || document.getElementById('scene');
        if (!mainSvg) {
            console.error('Main SVG element not found');
            return;
        }

        // Clear existing objects before rendering new ones
        const existingObjects = mainSvg.querySelectorAll('.dissolving-object');
        existingObjects.forEach(obj => obj.remove());

        // Get the viewport dimensions from the SVG
        const width = mainSvg.clientWidth;
        const height = mainSvg.clientHeight;
        const HORIZON_Y = height * 0.4;
        const VANISHING_POINT_X = width * 0.5;

        // First verify the SVG structure
        const defs = mainSvg.querySelector('defs');
        const mask = defs?.querySelector('#pathMask');
        const pathArea = mask?.querySelector('.path-area');
        const staticElements = mainSvg.querySelector('#static-elements');
        const pathFill = staticElements?.querySelector('.path-fill');

        // Log detailed structure information
        console.log('SVG Structure Check:', {
            svgId: mainSvg.id,
            originalElementId: svg.id,
            svgChildCount: mainSvg.children.length,
            defsExists: !!defs,
            defsChildCount: defs?.children.length,
            maskExists: !!mask,
            maskChildCount: mask?.children.length,
            pathAreaExists: !!pathArea,
            staticElementsExists: !!staticElements,
            pathFillExists: !!pathFill,
            pathAreaClass: pathArea?.getAttribute('class'),
            pathFillClass: pathFill?.getAttribute('class')
        });
        
        // Update the path mask with the current path shape
        if (pathArea && pathFill) {
            // Find the edge lines
            const leftEdgeLine = lines.find(line => line.number === -2);  // Explicitly look for line -2
            const rightEdgeLine = lines.find(line => line.number === 2);  // Explicitly look for line 2

            if (leftEdgeLine && rightEdgeLine) {
                // Create a path that encompasses the area between the edge lines
                const pathD = `M ${VANISHING_POINT_X} ${HORIZON_Y} ${leftEdgeLine.d.substring(leftEdgeLine.d.indexOf('L'))} L ${rightEdgeLine.d.split('L').reverse().join(' L ')} Z`;
                
                // Log the path data being set
                console.log('Setting path data:', {
                    pathDLength: pathD.length,
                    pathDStart: pathD.substring(0, 100) + '...',
                    leftEdgeExists: !!leftEdgeLine.d,
                    rightEdgeExists: !!rightEdgeLine.d,
                    pathAreaBefore: pathArea.getAttribute('d'),
                    pathFillBefore: pathFill.getAttribute('d')
                });
                
                // Set the path data
                pathArea.setAttribute('d', pathD);
                pathFill.setAttribute('d', pathD);
                
                console.log('Path data set successfully:', {
                    pathAreaAfter: pathArea.getAttribute('d')?.length,
                    pathFillAfter: pathFill.getAttribute('d')?.length
                });
            } else {
                console.warn('Edge lines not found:', { 
                    leftEdge: leftEdgeLine?.number, 
                    rightEdge: rightEdgeLine?.number,
                    totalLines: lines.length,
                    lineNumbers: lines.map(l => l.number).join(', ')
                });
            }
        } else {
            console.warn('Path elements not found:', { 
                svgId: mainSvg.id,
                originalElementId: svg.id,
                svgChildCount: mainSvg.children.length,
                defsExists: !!defs,
                defsContent: defs?.innerHTML.substring(0, 100) + '...',
                maskExists: !!mask,
                pathArea: !!pathArea,
                pathFill: !!pathFill,
                staticElementsExists: !!staticElements,
                fullSvgHtml: mainSvg.outerHTML.substring(0, 200) + '...'
            });
        }

        // Use mainSvg for rendering trees
        const objectsToRender = [];
        this.config.placements.forEach(placement => {
            const template = this.config.templates[placement.template];
            if (!template || template.render === 'chips') {
                return;
            }

            placement.positions.forEach(pos => {
                // Calculate progress exactly like markers do
                const t = calculateProgress({ startProgress: pos.progress });
                if (t < 0 || t > 1) return;

                // Find the corresponding line for this object
                const objectLine = lines.find(line => line.number === pos.line);
                if (!objectLine || !objectLine.pathEl) return;

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
            if (obj.template.type === 'svg' && obj.template.render === 'tree') {
                this.renderTree(mainSvg, obj.point, obj.template, obj.placement, obj.currentSize, obj.opacity);
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