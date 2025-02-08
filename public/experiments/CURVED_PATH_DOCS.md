# Curved Path Visualization Documentation

## Project Overview
The Curved Path Visualization is a core component of the "Above the Trees" project, creating an immersive path system that guides users through a virtual forest experience. The visualization creates a series of curved lines that converge at a horizon point, creating a sense of depth and perspective.

## Key Features
- Dynamic path width control
- Scrolling-based navigation
- Edge path highlighting with animated dots
- Perspective-based line curvature
- Stable line numbering system for object placement

## Technical Implementation

### Core Concepts

#### 1. Line Generation System
- Uses a fixed-spacing grid system (5% of viewport width)
- Lines are numbered from center outward (-n to +n)
- Path edges are determined by line numbers rather than physical distance
- Ensures stable object placement points regardless of viewport size

#### 2. Perspective and Curvature
```javascript
function adjustPerspective(xOffset) {
    const distanceRatio = Math.abs(xOffset) / (width/2);
    const perspectiveIntensity = 0.3 + (1 - horizonRatio) * 0.3;
    return perspectiveScale * (1 + distanceRatio * perspectiveIntensity);
}
```
- Lines curve more dramatically as they get further from center
- Perspective intensity adjusts based on horizon height
- Creates natural-looking depth without complex 3D math

#### 3. Path Width System
- Path width is percentage-based (default 25% of viewport)
- Edge lines are calculated based on path width divided by line spacing
- Inner/outer path determination uses line numbers for stability

### Mathematical Concepts

#### 1. Quadratic Bezier Curves
Each line is drawn using a quadratic Bezier curve:
```javascript
M ${x} ${height}          // Start at bottom
Q ${controlX} ${controlY}, // Control point
  ${vpX} ${finalY}        // End at horizon
```
- Provides smooth, natural-looking curves
- Single control point makes calculations simpler than cubic curves
- Control point position affected by perspective scaling

#### 2. Viewport Overflow
```javascript
const horizonRatio = vpY / height;
const viewportOverflow = 2 + (1 - horizonRatio) * 2;
```
- Extends drawing area beyond viewport
- More overflow when horizon is higher
- Ensures smooth perspective near horizon

#### 3. Line Spacing
```javascript
const BASE_LINE_SPACING = width * 0.05; // 5% of viewport
const numTotalLines = Math.ceil(totalWidth / BASE_LINE_SPACING);
```
- Fixed spacing relative to viewport
- Provides stable coordinate system for object placement
- Balances visual density with performance

## Edge Cases and Considerations

### 1. Performance
- Lines outside viewport are skipped
- Fixed line spacing prevents excessive line generation
- No unnecessary redraws during scrolling

### 2. Stability
- Line numbers remain consistent during viewport changes
- Edge paths stay on same numbered lines
- Object placement will remain stable when implemented

### 3. Responsiveness
- All measurements are relative to viewport
- Adapts to window resizing
- Maintains visual proportions across screen sizes

## Future Considerations

### 1. Object Placement
- Use line numbers (-n to +n) for horizontal positioning
- Use progress value (0 to 1) for vertical positioning
- Consider perspective scaling for object sizes

### 2. Multiple Paths
- Current system can be duplicated for parallel paths
- Share same line numbering system
- Consider z-index for path overlaps

### 3. Background Elements
- Can use same perspective system
- Parallax effects can be tied to scroll progress
- Consider using different curve intensities for variety

## References
1. Bezier Curves: [https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#bezier_curves](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#bezier_curves)
2. SVG Path Specification: [https://www.w3.org/TR/SVG/paths.html](https://www.w3.org/TR/SVG/paths.html)
3. Perspective Drawing: [https://en.wikipedia.org/wiki/Perspective_(graphical)](https://en.wikipedia.org/wiki/Perspective_(graphical))

## Controls Reference
- Path Width: Controls the width of the main path (10-50% of viewport)
- Curve Intensity: Adjusts the curvature of the lines (0-0.2)
- Edge Dots: Controls number and size of dots on path edges
- Scroll Sensitivity: Adjusts scroll-to-movement ratio

## Code Organization
```
curved-path.html
├── Styles
│   ├── Basic layout
│   ├── Path styles
│   └── Control panel
├── HTML Structure
│   ├── Controls
│   └── SVG container
└── JavaScript
    ├── Core variables
    ├── Event handlers
    ├── createScene()
    └── Helper functions
``` 