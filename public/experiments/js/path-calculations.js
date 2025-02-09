// Helper function for linear interpolation
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Helper function to clamp a value between min and max
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Define the curve shape in world coordinates
export function worldCurveAt(t, width, height, HORIZON_Y, controls, scrollProgress, VIEWPORT_MARGIN, VANISHING_POINT_X) {
    // Extend the base Y position to go 20% beyond the bottom of the screen
    const extendedHeight = height * 1.2;
    const baseY = lerp(HORIZON_Y, extendedHeight, t);
    
    const PATH_BASE_AMPLITUDE = width * controls.amplitude.value;
    const LOOK_AHEAD_STRENGTH = controls.lookAhead.value;
    const SECONDARY_STRENGTH = controls.secondary.value;
    const TERTIARY_STRENGTH = controls.tertiary.value;
    
    // Calculate frequencies based on the number of curves control
    const baseFreq = Math.PI * 2 * controls.frequency.value;
    const WAVE_FREQUENCY = baseFreq;
    const SECONDARY_FREQUENCY = baseFreq * 0.5;
    const TERTIARY_FREQUENCY = baseFreq * 2;
    
    // Calculate wave phases based on scroll progress
    const mainPhase = -scrollProgress * WAVE_FREQUENCY;
    const secondaryPhase = -scrollProgress * SECONDARY_FREQUENCY * 0.7;
    const tertiaryPhase = -scrollProgress * TERTIARY_FREQUENCY * 1.3;
    
    const lookAheadPhase = mainPhase + WAVE_FREQUENCY * 0.25;
    const nextDirection = Math.cos(lookAheadPhase);
    
    const mainAmplitude = PATH_BASE_AMPLITUDE * t;
    const secondaryAmplitude = PATH_BASE_AMPLITUDE * SECONDARY_STRENGTH * t;
    const tertiaryAmplitude = PATH_BASE_AMPLITUDE * TERTIARY_STRENGTH * t;
    
    const exitBias = -nextDirection * PATH_BASE_AMPLITUDE * LOOK_AHEAD_STRENGTH * Math.pow(t, 2);
    
    const mainWave = Math.sin(t * WAVE_FREQUENCY + mainPhase) * mainAmplitude;
    const secondaryWave = Math.sin(t * SECONDARY_FREQUENCY + secondaryPhase) * secondaryAmplitude;
    const tertiaryWave = Math.sin(t * TERTIARY_FREQUENCY + tertiaryPhase) * tertiaryAmplitude;
    
    let x = VANISHING_POINT_X + mainWave + secondaryWave + tertiaryWave + exitBias;
    
    const minX = VIEWPORT_MARGIN;
    const maxX = width - VIEWPORT_MARGIN;
    
    const smoothStep = (x) => x * x * (3 - 2 * x);
    const clampStrength = smoothStep(Math.pow(t, 2));
    
    const overMin = Math.max(0, minX - x);
    const overMax = Math.max(0, x - maxX);
    
    if (overMin > 0) {
        const smoothTransition = smoothStep(Math.min(1, overMin / (PATH_BASE_AMPLITUDE * 0.5)));
        x = lerp(x, minX, smoothTransition * clampStrength);
    } else if (overMax > 0) {
        const smoothTransition = smoothStep(Math.min(1, overMax / (PATH_BASE_AMPLITUDE * 0.5)));
        x = lerp(x, maxX, smoothTransition * clampStrength);
    }
    
    return { x, y: baseY };
}

// Apply perspective to a point
export function applyPerspective(x, y, t, VANISHING_POINT_X, HORIZON_Y, bounceOffset, PERSPECTIVE_FACTOR) {
    const scale = 1 / (1 + PERSPECTIVE_FACTOR * t);
    return {
        x: VANISHING_POINT_X + (x - VANISHING_POINT_X) * scale,
        y: (HORIZON_Y + bounceOffset) + (y - (HORIZON_Y + bounceOffset)) * scale
    };
}

// Get screen coordinates for a point on the curve
export function curveAt(t, width, height, HORIZON_Y, controls, scrollProgress, VIEWPORT_MARGIN, VANISHING_POINT_X, bounceOffset, PERSPECTIVE_FACTOR) {
    const worldPos = worldCurveAt(t, width, height, HORIZON_Y, controls, scrollProgress, VIEWPORT_MARGIN, VANISHING_POINT_X);
    const perspectiveT = 1 - t;
    return applyPerspective(worldPos.x, worldPos.y, perspectiveT, VANISHING_POINT_X, HORIZON_Y, bounceOffset, PERSPECTIVE_FACTOR);
}

// Calculate path width and edges
export function getPathWidth(width, pathWidthValue) {
    return width * (parseFloat(pathWidthValue) / 100);
}

export function updatePathEdges(width, BASE_LINE_SPACING, pathWidthValue) {
    const pathHalfWidth = getPathWidth(width, pathWidthValue) / 2;
    const linesInPathHalf = Math.ceil(pathHalfWidth / BASE_LINE_SPACING);
    return {
        left: -linesInPathHalf,
        right: linesInPathHalf
    };
}

// Helper function to add debug text
export function addDebugText(svg, x, y, text) {
    const debugText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    debugText.setAttribute('x', x);
    debugText.setAttribute('y', y);
    debugText.setAttribute('class', 'debug-text');
    debugText.textContent = text;
    svg.appendChild(debugText);
} 