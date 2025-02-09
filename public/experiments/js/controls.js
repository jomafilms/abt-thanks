export class Controls {
    constructor(updateCallback) {
        this.controls = {
            amplitude: document.getElementById('amplitude'),
            frequency: document.getElementById('frequency'),
            lookAhead: document.getElementById('lookAhead'),
            secondary: document.getElementById('secondary'),
            tertiary: document.getElementById('tertiary'),
            sensitivity: document.getElementById('sensitivity'),
            pathWidth: document.getElementById('pathWidth')
        };
        
        this.updateCallback = updateCallback;
        this.setupEventListeners();
        this.setupGearIcon();
        this.setupAutoScroll();
        this.updateControlLimits(); // Initialize limits
    }

    // Calculate safe maximums based on viewport and other controls
    updateControlLimits() {
        const width = window.innerWidth;
        
        // Base maximum amplitude as percentage of viewport width
        const baseMaxAmplitude = Math.min(0.3, width / 2500);  // More conservative base
        
        // Calculate combined effect of all wave controls
        const totalWaveStrength = parseFloat(this.controls.secondary.value) + parseFloat(this.controls.tertiary.value);
        const combinedWaveFactor = 1 / Math.max(1, totalWaveStrength * 2);
        
        // Adjust amplitude max based on all factors
        const freqFactor = 1 / Math.max(1, this.controls.frequency.value * 1.5);
        const lookAheadFactor = 1 / Math.max(1, this.controls.lookAhead.value * 3);
        const safeAmplitude = baseMaxAmplitude * freqFactor * lookAheadFactor * combinedWaveFactor;
        
        // Update amplitude control
        this.controls.amplitude.max = safeAmplitude.toFixed(2);
        if (parseFloat(this.controls.amplitude.value) > safeAmplitude) {
            this.controls.amplitude.value = safeAmplitude;
            this.controls.amplitude.nextElementSibling.textContent = safeAmplitude.toFixed(2);
        }
        
        // Adjust frequency max based on viewport and other factors
        const baseMaxFreq = Math.min(3, width / 600);  // More conservative base
        const amplitudeFactor = 1 / Math.max(1, this.controls.amplitude.value * 4);
        const wavesFactor = 1 / Math.max(1, totalWaveStrength * 1.5);
        const safeFreq = baseMaxFreq * amplitudeFactor * wavesFactor;
        
        // Update frequency control
        this.controls.frequency.max = safeFreq.toFixed(1);
        if (parseFloat(this.controls.frequency.value) > safeFreq) {
            this.controls.frequency.value = safeFreq;
            this.controls.frequency.nextElementSibling.textContent = safeFreq.toFixed(1);
        }
        
        // Adjust look-ahead based on all factors
        const baseMaxLookAhead = Math.min(0.4, width / 2500);  // More conservative base
        const combinedFactor = 1 / Math.max(1, (this.controls.amplitude.value * this.controls.frequency.value * 2) + totalWaveStrength);
        const safeLookAhead = baseMaxLookAhead * combinedFactor;
        
        // Update look-ahead control
        this.controls.lookAhead.max = safeLookAhead.toFixed(2);
        if (parseFloat(this.controls.lookAhead.value) > safeLookAhead) {
            this.controls.lookAhead.value = safeLookAhead;
            this.controls.lookAhead.nextElementSibling.textContent = safeLookAhead.toFixed(2);
        }
        
        // Secondary and tertiary waves scale with all factors
        const baseMaxSecondary = Math.min(0.8, width / 2000);  // More conservative base
        const baseMaxTertiary = Math.min(0.6, width / 2000);   // Even more conservative for detail wave
        
        const mainFactor = 1 / Math.max(1, this.controls.amplitude.value * 3);
        const freqWaveFactor = 1 / Math.max(1, this.controls.frequency.value * 2);
        
        // Calculate safe values considering interdependencies
        const safeSecondary = baseMaxSecondary * mainFactor * freqWaveFactor;
        const safeTertiary = baseMaxTertiary * mainFactor * freqWaveFactor;
        
        // Update secondary and tertiary controls
        this.controls.secondary.max = safeSecondary.toFixed(2);
        this.controls.tertiary.max = safeTertiary.toFixed(2);
        
        if (parseFloat(this.controls.secondary.value) > safeSecondary) {
            this.controls.secondary.value = safeSecondary;
            this.controls.secondary.nextElementSibling.textContent = safeSecondary.toFixed(2);
        }
        if (parseFloat(this.controls.tertiary.value) > safeTertiary) {
            this.controls.tertiary.value = safeTertiary;
            this.controls.tertiary.nextElementSibling.textContent = safeTertiary.toFixed(2);
        }
    }

    setupEventListeners() {
        // Update value displays and limits
        Object.entries(this.controls).forEach(([key, control]) => {
            const display = control.nextElementSibling;
            control.addEventListener('input', () => {
                // Special handling for frequency to show actual number of visual curves
                if (key === 'frequency') {
                    display.textContent = (control.value * 2).toFixed(1);
                } else {
                    display.textContent = control.value;
                }
                this.updateControlLimits(); // Update limits when any control changes
                this.updateCallback();
            });
        });

        // Initial display setup
        Object.entries(this.controls).forEach(([key, control]) => {
            const display = control.nextElementSibling;
            if (key === 'frequency') {
                display.textContent = (control.value * 2).toFixed(1);
            } else {
                display.textContent = control.value;
            }
        });

        // Update limits on window resize
        window.addEventListener('resize', () => {
            this.updateControlLimits();
        });
    }

    setupGearIcon() {
        // Add gear icon click handler
        document.querySelector('.gear-icon').addEventListener('click', () => {
            document.querySelector('.controls').classList.toggle('collapsed');
        });
    }

    setupAutoScroll() {
        this.isAutoScrolling = false;
        this.autoScrollAnimation = null;
        
        // Toggle auto-scroll
        const playButton = document.querySelector('.play-button');
        const playIcon = playButton.querySelector('.play-icon');
        const pauseIcon = playButton.querySelector('.pause-icon');

        playButton.addEventListener('click', () => {
            this.isAutoScrolling = !this.isAutoScrolling;
            playIcon.style.display = this.isAutoScrolling ? 'none' : 'block';
            pauseIcon.style.display = this.isAutoScrolling ? 'block' : 'none';
            if (this.autoScrollCallback) {
                this.updateAutoScroll(this.autoScrollCallback);
            }
        });
    }

    updateAutoScroll(scrollCallback) {
        this.autoScrollCallback = scrollCallback;
        if (this.isAutoScrolling) {
            const scrollStep = () => {
                if (this.isAutoScrolling) {
                    scrollCallback();
                    this.autoScrollAnimation = requestAnimationFrame(scrollStep);
                }
            };
            this.autoScrollAnimation = requestAnimationFrame(scrollStep);
        } else {
            if (this.autoScrollAnimation) {
                cancelAnimationFrame(this.autoScrollAnimation);
                this.autoScrollAnimation = null;
            }
        }
    }

    stopAutoScroll() {
        if (this.isAutoScrolling) {
            this.isAutoScrolling = false;
            const playIcon = document.querySelector('.play-icon');
            const pauseIcon = document.querySelector('.pause-icon');
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            if (this.autoScrollAnimation) {
                cancelAnimationFrame(this.autoScrollAnimation);
                this.autoScrollAnimation = null;
            }
        }
    }

    getValues() {
        return Object.fromEntries(
            Object.entries(this.controls).map(([key, control]) => [key, { value: parseFloat(control.value) }])
        );
    }

    getRawValue(key) {
        return parseFloat(this.controls[key].value);
    }
} 