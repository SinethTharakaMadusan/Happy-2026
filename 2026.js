const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');
const intro = document.getElementById('intro');
const celebration = document.getElementById('celebration');
let isCelebrationStarted = false;

// Audio Context
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playExplosionSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Explosion sound synthesis - Lower pitch for bigger boom
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(30 + Math.random() * 80, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

// Canvas & Fireworks
let width, height;
let particles = [];
let fireworks = [];
let trailParticles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Firework {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.distanceToTarget = Math.hypot(targetX - x, targetY - y);
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.coordinateCount = 3;
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        this.angle = Math.atan2(targetY - y, targetX - x);
        this.speed = 2;
        this.acceleration = 1.05;
        this.brightness = Math.random() * 50 + 50;
        this.targetRadius = 1;
    }

    update(index) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        if (this.targetRadius < 8) this.targetRadius += 0.3;
        else this.targetRadius = 1;

        this.speed *= this.acceleration;
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        this.distanceTraveled = Math.hypot(this.startX - this.x - vx, this.startY - this.y - vy);

        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.targetX, this.targetY);
            fireworks.splice(index, 1);
            if (isCelebrationStarted) playExplosionSound();
        } else {
            this.x += vx;
            this.y += vy;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsl(${Math.random() * 360}, 100%, ${this.brightness}%)`;
        ctx.stroke();
    }
}

class Particle {
    constructor(x, y, isTrail = false) {
        this.x = x;
        this.y = y;
        this.coordinates = [];
        this.coordinateCount = isTrail ? 3 : 5;
        this.isTrail = isTrail;
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 15 + 1; // Faster explosion
        if (isTrail) this.speed = Math.random() * 2 + 0.5;

        this.friction = isTrail ? 0.95 : 0.92; // Particles slow down differently
        this.gravity = isTrail ? 0.1 : 0.6; // Reduced gravity for floating effect

        // HSL Color variation
        this.hue = Math.random() * 360;

        this.brightness = Math.random() * 60 + 40;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.005; // Slower fade for longer lasting particles

        // Sparkle properties
        this.flicker = Math.random() < 0.5; // 50% chance to flicker
    }

    update(index, array) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;

        // Flicker effect
        if (this.flicker && !this.isTrail) {
            this.brightness = Math.random() * 80 + 20; // Random brightness for sparkle
        }

        if (this.alpha <= this.decay) {
            array.splice(index, 1);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        ctx.stroke();
    }
}

function createParticles(x, y) {
    // INCREASED PARTICLE COUNT FOR "BLASTER" EFFECT
    let particleCount = 80;
    let baseHue = Math.random() * 360; // Base hue for this explosion

    while (particleCount--) {
        const p = new Particle(x, y);
        // Analogous colors: Variate hue slightly from base
        if (!p.isTrail) {
            p.hue = baseHue + ((Math.random() - 0.5) * 40);
        }
        particles.push(p);
    }
}

document.addEventListener('mousemove', (e) => {
    if (Math.random() < 0.3) {
        trailParticles.push(new Particle(e.clientX, e.clientY, true));
    }
});

function loop() {
    requestAnimationFrame(loop);

    // Smoother trails using less opacity clear
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Slightly longer trails
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    let i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    let j = particles.length;
    while (j--) {
        particles[j].draw();
        particles[j].update(j, particles);
    }

    let k = trailParticles.length;
    while (k--) {
        trailParticles[k].draw();
        trailParticles[k].update(k, trailParticles);
    }

    if (isCelebrationStarted && Math.random() < 0.05) {
        fireworks.push(new Firework(width / 2, height, Math.random() * width, Math.random() * height / 2));
    }
}

// User Interaction to Start Celebration
function startCelebration() {
    if (isCelebrationStarted) return;
    initAudio();
    isCelebrationStarted = true;

    // Transition UI
    intro.classList.add('fade-out');
    setTimeout(() => {
        intro.style.display = 'none';
        celebration.classList.remove('hidden');
        celebration.classList.add('active');

        // Launch initial big fireworks logic
        let count = 0;
        const interval = setInterval(() => {
            fireworks.push(new Firework(width / 2, height, Math.random() * width, Math.random() * height / 2));
            count++;
            if (count > 10) clearInterval(interval);
        }, 300); // Faster initial burst

    }, 1000);
}

document.body.addEventListener('click', (e) => {
    if (!isCelebrationStarted) {
        startCelebration();
    } else {
        fireworks.push(new Firework(width / 2, height, e.clientX, e.clientY));
        // Sparkle on click
        let sparkles = 10;
        while (sparkles--) {
            trailParticles.push(new Particle(e.clientX, e.clientY, true));
        }
        if (audioCtx) initAudio();
    }
});

// Start loop
loop();
