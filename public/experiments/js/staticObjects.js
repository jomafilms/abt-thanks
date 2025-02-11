export default class StaticObjectManager {
    constructor() {
        this.config = null;
        this.baseMaxSize = this.calculateBaseMaxSize();
        
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
            return true;
        } catch (error) {
            console.error('Error loading static objects configuration:', error);
            return false;
        }
    }

    renderObjects(svg, lines, calculateProgress, worldCurveAt, applyPerspective) {
        if (!this.config) return;

        this.config.placements.forEach(placement => {
            const template = this.config.templates[placement.template];
            if (!template) return;

            placement.positions.forEach(pos => {
                // Calculate progress exactly like markers do
                const t = calculateProgress({ startProgress: pos.progress });
                if (t < 0 || t > 1) return;

                // Find the corresponding line for this object
                const objectLine = lines.find(line => line.number === pos.line);
                if (!objectLine || !objectLine.pathEl) return;

                // Get the total length of the path and point, exactly like markers
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
                    // Linear fade out from t=0.8 to t=1
                    opacity = 1 - ((t - 0.8) / 0.2);
                }

                // Create and render the object based on its type
                if (template.type === 'svg' && template.render === 'tree') {
                    this.renderTree(svg, point, template, placement, currentSize, opacity);
                }
            });
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
} 