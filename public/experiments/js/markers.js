export default class MarkerManager {
    constructor() {
        this.staticConfig = null;
        this.markersWithNames = [];
    }

    async loadConfiguration() {
        try {
            // Load static configuration
            const staticResponse = await fetch('static.json');
            this.staticConfig = await staticResponse.json();

            // Load names
            const namesResponse = await fetch('names.json');
            const namesData = await namesResponse.json();

            // Add our test yellow dot
            this.staticConfig.markers.push({
                id: "test-yellow-dot",
                line: -10,
                startProgress: 0.4, // 40% from horizon
                color: "rgba(255, 255, 0, 0.3)", // Yellow with 30% opacity
                type: "circle",
                description: "Test yellow dot",
                canReceiveName: false
            });

            // Assign names to available markers
            this.markersWithNames = this.staticConfig.markers.map(marker => {
                if (marker.canReceiveName && namesData.names.length > 0) {
                    const nextName = namesData.names.shift();
                    return { ...marker, name: nextName.name };
                }
                return marker;
            });

            return true;
        } catch (error) {
            console.error('Error loading configuration:', error);
            return false;
        }
    }

    renderMarkers(svg, lines, calculateMarkerProgress, worldCurveAt, applyPerspective, hasStarted, scrollProgress) {
        if (!this.staticConfig || !this.markersWithNames) return;

        // Highlight line -10
        const line10 = lines.find(line => line.number === -10);
        if (line10) {
            // Create a copy of line -10's path with a highlight color
            const highlightPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            highlightPath.setAttribute('d', line10.d);
            highlightPath.setAttribute('class', 'path-grid');
            highlightPath.setAttribute('stroke', 'rgba(255, 255, 0, 0.5)');
            highlightPath.setAttribute('stroke-width', '3');
            svg.appendChild(highlightPath);
        }

        this.markersWithNames.forEach(marker => {
            // Find the corresponding line for this marker
            const markerLine = lines.find(line => line.number === marker.line);
            if (!markerLine || !markerLine.pathEl) return;

            // Calculate progress and get position on the path
            const t = calculateMarkerProgress(marker);
            if (t < 0 || t > 1) return;

            // Get the total length of the path
            const totalLength = markerLine.pathEl.getTotalLength();
            // Get the point at the current progress
            const point = markerLine.pathEl.getPointAtLength(totalLength * t);
            const pos = { x: point.x, y: point.y };

            // Calculate size based on position and configuration
            const config = marker.type === 'circle' ? this.staticConfig.config.circles : this.staticConfig.config.rectangles;
            const minSize = config.minSize || 2;
            const maxSize = config.maxSize || 16;
            const baseSize = minSize + (maxSize - minSize) * t;

            // Render the marker
            if (marker.type === 'circle') {
                this.renderCircle(svg, pos, baseSize, marker.color);
            } else if (marker.type === 'rectangle' && marker.name) {
                this.renderRectangle(svg, pos, baseSize, marker, config);
            }
        });
    }

    renderCircle(svg, pos, baseSize, color) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', baseSize);
        circle.setAttribute('fill', color);
        svg.appendChild(circle);
    }

    renderRectangle(svg, pos, baseSize, marker, config) {
        // Create and position the rectangle
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const rectWidth = baseSize * config.defaultWidth;
        const rectHeight = baseSize * config.defaultHeight;
        rect.setAttribute('x', pos.x - rectWidth/2);
        rect.setAttribute('y', pos.y - rectHeight/2);
        rect.setAttribute('width', rectWidth);
        rect.setAttribute('height', rectHeight);
        rect.setAttribute('fill', marker.color);
        rect.setAttribute('rx', rectHeight * config.cornerRadius);
        svg.appendChild(rect);

        // Add name label inside rectangle
        const nameLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameLabel.setAttribute('x', pos.x);
        nameLabel.setAttribute('y', pos.y + baseSize * 0.3);
        nameLabel.setAttribute('fill', '#000');
        nameLabel.setAttribute('font-size', `${baseSize * config.fontScale}px`);
        nameLabel.setAttribute('text-anchor', 'middle');
        nameLabel.setAttribute('dominant-baseline', 'middle');
        nameLabel.textContent = marker.name;
        svg.appendChild(nameLabel);
    }
} 