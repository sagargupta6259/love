// For You, Jaan - 12 November Experience Script

document.addEventListener('DOMContentLoaded', () => {
    initAmbientCanvas();
    initAudioEngine();
    initModals();
});

/* ==========================================================
   1. AMBIENT PARTICLES (Hearts & Soft Glowing Rose Petals)
   ========================================================== */
function initAmbientCanvas() {
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const maxParticles = window.innerWidth < 768 ? 24 : 45;

    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : height + 20;
            this.size = Math.random() * 12 + 8;
            this.speedY = Math.random() * 0.8 + 0.3;
            this.speedX = Math.sin(Math.random() * 6) * 0.5;
            this.opacity = Math.random() * 0.55 + 0.25;
            this.fadeSpeed = Math.random() * 0.003 + 0.001;
            this.angle = Math.random() * Math.PI * 2;
            this.spinSpeed = (Math.random() - 0.5) * 0.02;
            this.type = Math.random() > 0.4 ? 'heart' : 'petal';
        }

        update() {
            this.y -= this.speedY;
            this.x += Math.sin(this.y * 0.01) * 0.6 + this.speedX;
            this.angle += this.spinSpeed;

            if (this.y < -30 || this.x < -30 || this.x > width + 30) {
                this.reset(false);
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.globalAlpha = this.opacity;

            if (this.type === 'heart') {
                ctx.fillStyle = '#ff4d6d';
                ctx.shadowColor = '#ff758f';
                ctx.shadowBlur = 8;
                drawHeart(ctx, 0, 0, this.size);
            } else {
                ctx.fillStyle = '#f4a6b6';
                ctx.shadowColor = '#f0c987';
                ctx.shadowBlur = 6;
                drawPetal(ctx, 0, 0, this.size);
            }
            ctx.restore();
        }
    }

    function drawHeart(c, x, y, size) {
        c.beginPath();
        const topCurveHeight = size * 0.3;
        c.moveTo(x, y + topCurveHeight);
        c.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        c.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 1.4, x, y + size);
        c.bezierCurveTo(x, y + (size + topCurveHeight) / 1.4, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        c.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        c.closePath();
        c.fill();
    }

    function drawPetal(c, x, y, size) {
        c.beginPath();
        c.ellipse(x, y, size * 0.4, size * 0.7, Math.PI / 4, 0, Math.PI * 2);
        c.fill();
    }

    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();

    // Interactive mouse / touch burst
    window.addEventListener('pointerdown', (e) => {
        spawnBurst(e.clientX, e.clientY);
    });

    function spawnBurst(originX, originY) {
        for (let i = 0; i < 6; i++) {
            const p = new Particle();
            p.x = originX;
            p.y = originY;
            p.speedY = (Math.random() - 0.5) * 2;
            p.speedX = (Math.random() - 0.5) * 2;
            p.opacity = 0.8;
            p.size = Math.random() * 10 + 10;
            particles.push(p);
            setTimeout(() => {
                const idx = particles.indexOf(p);
                if (idx > -1) particles.splice(idx, 1);
            }, 3000);
        }
    }
}

/* ==========================================================
   2. ROMANTIC AMBIENT SOUND ENGINE (Web Audio API)
   Plays a soft, emotional acoustic piano & pad score
   ========================================================== */
function initAudioEngine() {
    let audioCtx = null;
    let isPlaying = false;
    let timerId = null;

    const toggleBtn = document.getElementById('toggleAudioBtn');
    const musicIcon = document.getElementById('musicIcon');
    const soundWave = document.getElementById('soundWave');
    const audioLabel = document.getElementById('audioLabel');

    if (!toggleBtn) return;

    // Emotional chord progression: Cmaj9 -> Am9 -> Fmaj7 -> Gsus4
    // Tender, sentimental notes in Hz
    const chords = [
        // Cmaj9 (warm, hopeful)
        [130.81, 196.00, 246.94, 293.66, 329.63, 493.88], // C3, G3, B3, D4, E4, B4
        // Am9 (emotional, vulnerable)
        [110.00, 164.81, 220.00, 261.63, 329.63, 392.00], // A2, E3, A3, C4, E4, G4
        // Fmaj7 (deep love & devotion)
        [87.31, 130.81, 174.61, 220.00, 261.63, 329.63],  // F2, C3, F3, A3, C4, E4
        // Gsus4 / G6 (gentle resolution)
        [98.00, 146.83, 196.00, 246.94, 293.66, 392.00]   // G2, D3, G3, B3, D4, G4
    ];

    let currentChordIndex = 0;
    let noteIndex = 0;

    function createAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }

    function playSoftNote(freq, time, duration = 3.5, volume = 0.12) {
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        // Warm lowpass filter for gentle piano-like timbre
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, time);
        filter.frequency.exponentialRampToValueAtTime(320, time + duration);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        // Envelope: soft gentle attack, long warm decay
        gainNode.gain.setValueAtTime(0.0001, time);
        gainNode.gain.linearRampToValueAtTime(volume, time + 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + duration + 0.1);
    }

    function scheduleNotes() {
        if (!isPlaying || !audioCtx) return;

        const now = audioCtx.currentTime;
        const currentChord = chords[currentChordIndex];

        // Play root bass note warmly
        playSoftNote(currentChord[0], now, 4.2, 0.15);

        // Arpeggiate chord tones
        for (let i = 1; i < currentChord.length; i++) {
            playSoftNote(currentChord[i], now + (i * 0.45), 3.2, 0.08);
        }

        // Advance chord
        currentChordIndex = (currentChordIndex + 1) % chords.length;

        // Schedule next chord in 3.4 seconds
        timerId = setTimeout(scheduleNotes, 3400);
    }

    function startMusic() {
        if (!audioCtx) createAudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isPlaying = true;
        soundWave.classList.add('playing');
        musicIcon.textContent = '⏸️';
        audioLabel.textContent = 'Music Playing ❤️';
        scheduleNotes();
    }

    function stopMusic() {
        isPlaying = false;
        soundWave.classList.remove('playing');
        musicIcon.textContent = '🎵';
        audioLabel.textContent = 'Play Music';
        if (timerId) clearTimeout(timerId);
    }

    toggleBtn.addEventListener('click', () => {
        if (isPlaying) {
            stopMusic();
        } else {
            startMusic();
        }
    });

    // Gentle auto-trigger on first user interaction if allowed
    const autoPlayHandler = () => {
        if (!isPlaying) {
            startMusic();
        }
        window.removeEventListener('click', autoPlayHandler);
    };
    window.addEventListener('click', autoPlayHandler, { once: true });
}

/* ==========================================================
   3. MODAL POPUPS & USER ACTIONS
   ========================================================== */
function initModals() {
    const btnYes = document.getElementById('btnYes');
    const btnNeedTime = document.getElementById('btnNeedTime');
    const modal = document.getElementById('responseModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    const modalActions = document.getElementById('modalActions');

    if (!modal) return;

    function openModal(icon, title, message, actionHtml) {
        modalIcon.textContent = icon;
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        modalActions.innerHTML = actionHtml;
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (btnYes) {
        btnYes.addEventListener('click', () => {
            openModal(
                '❤️🥺',
                'Thank You, Meri Jaan...',
                `Tumhara yeh ek kadam mere liye meri poori duniya hai.<br><br>
                Main promise karta hoon ki main hamesha tumhari respect karunga, tumhari har baat dhyan se sununga aur jo bhi galtiyan hui hain unhe sudharunga.<br><br>
                <strong>Main abhi tumhare call ya message ka intezaar kar raha hoon.</strong>`,
                `<a href="tel:" class="btn btn-primary" style="text-decoration:none;">Call Sagar 📞</a>
                 <button class="btn btn-secondary" onclick="document.getElementById('responseModal').style.display='none'">Dil Se Shukriya ❤️</button>`
            );
        });
    }

    if (btnNeedTime) {
        btnNeedTime.addEventListener('click', () => {
            openModal(
                '🕊️❤️',
                'Main Samajhta Hoon, Jaan',
                `Koi baat nahi, bilkul koi jaldi nahi hai.<br><br>
                Tum jitna chahe utna waqt lo. Tumhara dil shaant hona aur khush rehna sabse zaroori hai.<br><br>
                <strong>Main kahin nahi ja raha, main yahin tumhara intezaar karunga. No pressure, ever.</strong><br>
                I love you always.`,
                `<button class="btn btn-secondary" onclick="document.getElementById('responseModal').style.display='none'">Take Care ❤️</button>`
            );
        });
    }
}

