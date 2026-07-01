// Web Audio API Synthesizer for Interactive Sound Effects
let audioCtx = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playBeep(frequency, type, duration, delay = 0) {
  try {
    initAudioContext();
    if (!audioCtx) return;
    
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }, delay * 1000);
  } catch (e) {
    console.log("Audio play blocked or failed: ", e);
  }
}

function playSuccessChime() {
  playBeep(523.25, 'sine', 0.12, 0);      // C5
  playBeep(659.25, 'sine', 0.12, 0.12);   // E5
  playBeep(783.99, 'sine', 0.12, 0.24);   // G5
  playBeep(1046.50, 'sine', 0.3, 0.36);   // C6
}

function playErrorBuzz() {
  playBeep(180, 'sawtooth', 0.15, 0);
  playBeep(150, 'sawtooth', 0.2, 0.1);
}

function playClickSound() {
  playBeep(680, 'sine', 0.06);
}


// Canvas Particles (Floating Hearts & Confetti) System
const canvas = document.getElementById('global-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let animId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor(x, y, type = 'heart') {
    this.x = x;
    this.y = y;
    this.type = type; // 'heart' or 'confetti'
    this.size = Math.random() * 12 + 6;
    this.color = this.getRandomColor();
    
    // Movement
    if (type === 'heart') {
      this.vx = Math.random() * 1.5 - 0.75;
      this.vy = -(Math.random() * 1.5 + 0.5);
      this.alpha = 1;
      this.decay = Math.random() * 0.005 + 0.003;
    } else { // confetti
      this.vx = Math.random() * 8 - 4;
      this.vy = -(Math.random() * 8 + 4);
      this.gravity = 0.25;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
      this.alpha = 1;
      this.decay = Math.random() * 0.01 + 0.005;
    }
  }

  getRandomColor() {
    const colors = [
      '#ff8b94', '#ffb3ba', '#ffc6ff', '#ffdac1', 
      '#bffcc6', '#c7ceea', '#30e3ca', '#ff6b81'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    if (this.type === 'heart') {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    } else {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      this.alpha -= this.decay;
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    
    if (this.type === 'heart') {
      // Draw Heart Path
      ctx.beginPath();
      const d = this.size;
      const x = this.x;
      const y = this.y;
      ctx.moveTo(x, y + d / 4);
      ctx.quadraticCurveTo(x, y, x + d / 2, y);
      ctx.quadraticCurveTo(x + d, y, x + d, y + d / 3);
      ctx.quadraticCurveTo(x + d, y + d * 2/3, x + d / 2, y + d);
      ctx.quadraticCurveTo(x, y + d * 2/3, x, y + d / 3);
      ctx.quadraticCurveTo(x, y, x, y + d / 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw Confetti rectangle
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
    }
    ctx.restore();
  }
}

// Generate continuous floating hearts from the bottom
function startBackgroundParticles() {
  setInterval(() => {
    // Only generate background hearts if the page is visible and active screen isn't loading
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id !== 'screen-loading') {
      const x = Math.random() * canvas.width;
      particles.push(new Particle(x, canvas.height + 20, 'heart'));
    }
  }, 400);
}

// Burst particles from a source
function triggerBurst(x, y, type = 'confetti', count = 60) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, type));
  }
}

// Animation loop
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach((p, index) => {
    p.update();
    p.draw();
    if (p.alpha <= 0 || p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
      particles.splice(index, 1);
    }
  });

  requestAnimationFrame(animateParticles);
}

// Start rendering
animateParticles();
startBackgroundParticles();


// --- Music Player Controller ---
const bgMusic = document.getElementById('bg-music');
const btnMusic = document.getElementById('btn-music');
let isMusicInitialized = false;

function toggleMusic() {
  initAudioContext();
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      btnMusic.classList.add('playing');
    }).catch(err => {
      console.log("Audio play failed: ", err);
    });
  } else {
    bgMusic.pause();
    btnMusic.classList.remove('playing');
  }
}

btnMusic.addEventListener('click', toggleMusic);

// Automatically attempt to play music on first user click
function tryAutoPlayMusic() {
  if (!isMusicInitialized) {
    initAudioContext();
    bgMusic.play().then(() => {
      btnMusic.classList.add('playing');
      isMusicInitialized = true;
    }).catch(() => {
      // Audio autoplay blocked, wait for manual toggle
    });
    // Remove listeners once we tried once
    document.removeEventListener('click', tryAutoPlayMusic);
  }
}
document.addEventListener('click', tryAutoPlayMusic);


// --- SCREEN TRANSITIONS MANAGER ---
function showScreen(screenId) {
  const currentActive = document.querySelector('.screen.active');
  const targetScreen = document.getElementById(screenId);

  if (currentActive) {
    currentActive.classList.remove('active');
  }
  
  setTimeout(() => {
    targetScreen.classList.add('active');
    // Trigger window burst for visual flair
    if (screenId === 'screen-welcome') {
      triggerBurst(canvas.width / 2, canvas.height / 2, 'confetti', 80);
    }
  }, 400);
}


// --- 1. LOADING SCREEN TIMEOUT ---
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    showScreen('screen-password');
  }, 1800);
});


// --- 2. PASSWORD SCREEN LOGIC ---
const correctPasscode = "2026";
let typedPasscode = "";
const indicators = document.querySelectorAll('#indicators-container .indicator');
const keypad = document.getElementById('keypad');

keypad.addEventListener('click', (e) => {
  if (e.target.classList.contains('keypad-btn')) {
    playClickSound();
    const digit = e.target.innerText;
    
    if (typedPasscode.length < 4) {
      typedPasscode += digit;
      updateIndicators();
      
      if (typedPasscode.length === 4) {
        setTimeout(verifyPasscode, 300);
      }
    }
  }
});

function updateIndicators() {
  indicators.forEach((indicator, index) => {
    if (index < typedPasscode.length) {
      indicator.classList.add('filled');
      indicator.innerText = "♥"; // Cute heart placeholder
    } else {
      indicator.classList.remove('filled');
      indicator.classList.remove('error');
      indicator.innerText = "";
    }
  });
}

function verifyPasscode() {
  if (typedPasscode === correctPasscode) {
    // Correct
    playSuccessChime();
    showScreen('screen-welcome');
  } else {
    // Incorrect
    playErrorBuzz();
    
    // Add shake class
    const card = document.querySelector('.password-card');
    card.classList.add('shake');
    
    // Set error class on indicators
    indicators.forEach(ind => ind.classList.add('error'));
    
    setTimeout(() => {
      card.classList.remove('shake');
      typedPasscode = "";
      updateIndicators();
    }, 600);
  }
}


// --- 3. WELCOME SCREEN NEXT BUTTON ---
const btnToWish = document.getElementById('btn-to-wish');
btnToWish.addEventListener('click', () => {
  playClickSound();
  showScreen('screen-wish');
});


// --- 4. MAKE A WISH SCREEN LOGIC ---
const btnBlow = document.getElementById('btn-blow');
const flames = document.querySelectorAll('.flame');
const smokeElements = document.querySelectorAll('.candle-smoke');

btnBlow.addEventListener('click', () => {
  if (btnBlow.classList.contains('blown-state')) return;

  playClickSound();
  btnBlow.innerText = "blowing...";
  btnBlow.classList.add('blown-state');
  
  // Fade out flames and play smoke
  flames.forEach(flame => {
    flame.classList.add('blown');
  });
  
  // Activate smoke animations
  smokeElements.forEach(smoke => {
    smoke.classList.add('active');
  });

  // Play blowing sound/celebration chime after delay
  setTimeout(() => {
    playSuccessChime();
    // Huge explosion of confetti and hearts!
    triggerBurst(canvas.width / 4, canvas.height * 0.7, 'confetti', 50);
    triggerBurst(canvas.width * 3/4, canvas.height * 0.7, 'confetti', 50);
    triggerBurst(canvas.width / 2, canvas.height / 2, 'heart', 40);
  }, 400);

  // Auto transition to Gift screen after 3 seconds
  setTimeout(() => {
    showScreen('screen-gifts');
  }, 3200);
});


// --- 5. GIFT SURPRISE LOGIC ---
const gifts = document.querySelectorAll('.gift-box-wrapper');
const overlays = document.querySelectorAll('.gift-overlay');
const backButtons = document.querySelectorAll('.btn-back');
const sweetEnvelope = document.getElementById('sweet-envelope');

gifts.forEach(gift => {
  gift.addEventListener('click', () => {
    if (gift.classList.contains('opened')) {
      // If already opened once, open the modal instantly
      const targetId = gift.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
      return;
    }

    playClickSound();
    gift.classList.add('opened');
    
    // Sparkle particles on gift location
    const rect = gift.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    triggerBurst(x, y, 'confetti', 30);
    triggerBurst(x, y, 'heart', 15);
    
    // Wait for the lid fly animation, then display overlay card
    setTimeout(() => {
      const targetId = gift.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
      playSuccessChime();
    }, 700);
  });
});

// Close Overlays
backButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    playClickSound();
    const overlay = e.target.closest('.gift-overlay');
    overlay.classList.remove('active');
  });
});

// Click envelope to pop-out letter
sweetEnvelope.addEventListener('click', (e) => {
  e.stopPropagation();
  playClickSound();
  sweetEnvelope.classList.toggle('open-envelope');
});
