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

        // Render objects (trees, etc.)
        const objectsToRender = [];
        this.config.placements.forEach(placement => {
            const template = this.config.templates[placement.template];
            if (!template || template.render !== 'tree') {
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
                this.renderTree(svg, obj.point, obj.template, obj.placement, obj.currentSize, obj.opacity);
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
} 