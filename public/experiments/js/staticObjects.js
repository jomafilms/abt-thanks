export default class StaticObjectManager {
    constructor() {
        this.config = null;
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

                // Get scale factor from placement or template (default to 1)
                const scaleFactor = placement.scale || template.scale || 1;
                
                // Base size calculation (similar to markers)
                const MIN_SIZE = 2;  // Match marker min size
                const BASE_MAX_SIZE = 100; // Base max size for scale factor 1
                const maxSize = BASE_MAX_SIZE * scaleFactor;

                // Adjust growth curve to reach full size around 20% from bottom
                // t = 0 is horizon, t = 1 is bottom
                // We want full size at t = 0.8
                const growthT = Math.min(t / 0.8, 1); // Reach full size at 80% of the path
                const currentSize = MIN_SIZE + (maxSize - MIN_SIZE) * growthT;

                // Create and render the object based on its type
                if (template.type === 'svg' && template.render === 'tree') {
                    this.renderTree(svg, point, template, placement, currentSize);
                }
            });
        });
    }

    renderTree(svg, pos, template, placement, size) {
        // Create tree group with exact position
        const treeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        treeGroup.setAttribute('transform', `translate(${pos.x - size/2},${pos.y - size})`);

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