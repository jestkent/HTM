document.addEventListener('DOMContentLoaded', () => {
    initParallaxSim();
    initSizeSim();
});

// --- Parallax Simulation ---
function initParallaxSim() {
    const canvas = document.getElementById('parallaxCanvas');
    const ctx = canvas.getContext('2d');
    const angleDisplay = document.getElementById('parallax-angle');
    const distDisplay = document.getElementById('est-distance');

    // Set canvas size
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    // State
    let earthAngle = 0; // Radians around sun
    let isDragging = false;

    // Constants
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.8; // Sun position (lower to show depth)
    const orbitRadius = 100;
    const starDist = 300; // Distance to target star (upwards)

    // Mouse interaction
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking near Earth (simplified)
        isDragging = true;
        updateEarthPos(x, y);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        updateEarthPos(x, y);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    function updateEarthPos(mouseX, mouseY) {
        // Calculate angle from sun to mouse
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        earthAngle = Math.atan2(dy, dx);
        draw();
        updateData();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Background Stars (Fixed)
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 50; i++) {
            // Use a pseudo-random based on index to keep them static
            const rx = (Math.sin(i) * 10000) % canvas.width;
            const ry = (Math.cos(i) * 10000) % (canvas.height / 2); // Only in upper sky
            ctx.fillRect(Math.abs(rx), Math.abs(ry), 1, 1);
        }

        // Draw Sun
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFD700';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Orbit Path
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, orbitRadius, orbitRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        // Calculate Earth Position
        // Flatten Y to make it look like a disk
        const ex = centerX + Math.cos(earthAngle) * orbitRadius;
        const ey = centerY + Math.sin(earthAngle) * (orbitRadius * 0.3);

        // Draw Earth
        ctx.beginPath();
        ctx.arc(ex, ey, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#00F3FF';
        ctx.fill();

        // Draw Target Star (Fixed in space relative to sun, but we view it from Earth)
        // In this 2D top-down/perspective hybrid, we visualize the "Shift" 
        // by drawing a line from Earth through the Star to the background.

        const starX = centerX;
        const starY = centerY - 150; // Real position of star

        ctx.beginPath();
        ctx.arc(starX, starY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF4444';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Line of Sight
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(starX, starY);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Projected position on "background"
        // Vector from Earth to Star
        const vecX = starX - ex;
        const vecY = starY - ey;
        // Extend vector
        const scale = 2.5;
        const projX = ex + vecX * scale;
        const projY = ey + vecY * scale;

        // Draw Projected Star on Background
        ctx.beginPath();
        ctx.arc(projX, projY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        // Label
        ctx.fillStyle = '#AAA';
        ctx.font = '10px Arial';
        ctx.fillText("Apparent Position", projX + 10, projY);
    }

    function updateData() {
        // Calculate "Parallax" based on Earth's X offset from center
        // Max offset is orbitRadius.
        const earthX = Math.cos(earthAngle) * orbitRadius;
        // Parallax angle is roughly proportional to baseline / distance
        // We'll fake a realistic looking number
        const maxAngle = 0.76; // arcseconds for Proxima Centauri
        const currentAngle = Math.abs((earthX / orbitRadius) * maxAngle);

        angleDisplay.textContent = currentAngle.toFixed(3) + '"';

        // Distance formula d = 1/p
        // Avoid division by zero
        let dist = 0;
        if (currentAngle > 0.01) {
            dist = 1 / currentAngle;
        } else {
            dist = 100; // Far away
        }

        distDisplay.textContent = dist.toFixed(2) + " pc";
    }

    // Initial draw
    draw();
}

// --- Size Simulation ---
function initSizeSim() {
    const lumSlider = document.getElementById('lum-slider');
    const tempSlider = document.getElementById('temp-slider');
    const starVisual = document.getElementById('star-visual');

    const lumVal = document.getElementById('lum-val');
    const tempVal = document.getElementById('temp-val');
    const radiusVal = document.getElementById('calc-radius');

    function updateStar() {
        const L = parseFloat(lumSlider.value);
        const T = parseFloat(tempSlider.value);

        // Update text
        lumVal.textContent = L + "x Sun";
        tempVal.textContent = T + " K";

        // Physics: L = 4πR²σT⁴
        // R = sqrt(L) / T²  (Proportional relationship)
        // Let's normalize to Sun = 1
        // R_sun = sqrt(1) / 5800^2 ... constant
        // R_rel = sqrt(L_rel) / (T_rel)^2

        const T_sun = 5800;
        const T_rel = T / T_sun;

        const R_rel = Math.sqrt(L) / (T_rel * T_rel);

        radiusVal.textContent = R_rel.toFixed(2) + " x Sun";

        // Visual Update
        // Size
        let pxSize = 100 * R_rel;
        // Clamp size for UI
        if (pxSize < 5) pxSize = 5;
        if (pxSize > 300) pxSize = 300;

        starVisual.style.width = pxSize + 'px';
        starVisual.style.height = pxSize + 'px';

        // Color (Temperature)
        // 3000K = Red, 6000K = White/Yellow, 10000K+ = Blue
        let colorStart = '#fff';
        let colorEnd = '#ccc';
        let glow = '#fff';

        if (T < 4000) {
            colorStart = '#ff8844';
            colorEnd = '#cc2200';
            glow = '#ff2200';
        } else if (T < 6000) {
            colorStart = '#ffdd44';
            colorEnd = '#cc9900';
            glow = '#ffaa00';
        } else if (T < 8000) {
            colorStart = '#ffffff';
            colorEnd = '#cccccc';
            glow = '#ccccff';
        } else {
            colorStart = '#aaddff';
            colorEnd = '#4488ff';
            glow = '#0088ff';
        }

        starVisual.style.background = `radial-gradient(circle at 30% 30%, ${colorStart}, ${colorEnd})`;
        starVisual.style.boxShadow = `0 0 ${pxSize / 2}px ${glow}`;
    }

    lumSlider.addEventListener('input', updateStar);
    tempSlider.addEventListener('input', updateStar);

    updateStar();
}
