// Web Audio API Synthesizer for Coca-Cola Sensory Experience
// Zero external sound files needed - procedural generation for instant 0ms playback

class CocaColaAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.fizzNode = null;
    this.fizzGain = null;
    this.fizzFilter = null;
    this.isPlayingFizz = false;
    this.lastTriggeredChapter = -1;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbientFizz();
    } else {
      this.startAmbientFizz();
      this.playIceClink();
    }
    return !this.isMuted;
  }

  // Realistic White/Pink Noise generator for bubbles & fizz
  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  startAmbientFizz() {
    if (this.isMuted || !this.ctx || this.isPlayingFizz) return;
    try {
      const noiseBuffer = this.createNoiseBuffer();
      if (!noiseBuffer) return;

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Bandpass filter for authentic bubbly carbonation tone
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(3200, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(3.5, this.ctx.currentTime);

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(1800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      // Fade in gently
      gain.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 1.2);

      noiseSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(this.ctx.destination);

      noiseSource.start();

      this.fizzNode = noiseSource;
      this.fizzFilter = bandpass;
      this.fizzGain = gain;
      this.isPlayingFizz = true;
    } catch (e) {
      console.warn('Audio not initialized yet:', e);
    }
  }

  // Modulate fizz intensity based on scroll velocity
  updateScrollDynamics(velocity) {
    if (!this.isPlayingFizz || !this.fizzGain || this.isMuted) return;
    const targetGain = Math.min(0.2, 0.04 + Math.abs(velocity) * 0.003);
    const targetFreq = 2800 + Math.min(2500, Math.abs(velocity) * 40);
    const now = this.ctx.currentTime;
    this.fizzGain.gain.setTargetAtTime(targetGain, now, 0.05);
    this.fizzFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
  }

  stopAmbientFizz() {
    if (this.fizzGain && this.ctx) {
      try {
        this.fizzGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
        setTimeout(() => {
          if (this.fizzNode) {
            this.fizzNode.stop();
            this.fizzNode.disconnect();
            this.fizzNode = null;
          }
          this.isPlayingFizz = false;
        }, 350);
      } catch (e) {
        this.isPlayingFizz = false;
      }
    }
  }

  // Satisfying Can Pop & Hisss
  playCanPop() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // 1. Metallic Tab Snap (Square + Sine)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    // 2. High Pressure Gas Release / Hiss
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now + 0.01);
    noise.stop(now + 0.45);
  }

  // Crystal Ice Clink
  playIceClink() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const freqs = [1960, 2640, 3920];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f + (Math.random() * 40 - 20), now);
      
      const startVol = 0.15 / (idx + 1);
      gain.gain.setValueAtTime(startVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5 + idx * 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  // Liquid Splash
  playLiquidSplash() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Low thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // Splash splatter noise
    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.45);
  }

  // Frame threshold triggers for organic audio as user scrolls
  handleFrameTrigger(frameIndex) {
    if (this.isMuted) return;

    if (frameIndex >= 18 && frameIndex <= 26 && this.lastTriggeredChapter !== 1) {
      this.playCanPop();
      this.lastTriggeredChapter = 1;
    } else if (frameIndex >= 180 && frameIndex <= 195 && this.lastTriggeredChapter !== 3) {
      this.playIceClink();
      this.playLiquidSplash();
      this.lastTriggeredChapter = 3;
    } else if (frameIndex < 10) {
      this.lastTriggeredChapter = 0;
    } else if (frameIndex >= 90 && frameIndex <= 110) {
      this.lastTriggeredChapter = 2;
    }
  }
}

window.cocaColaAudio = new CocaColaAudioEngine();
