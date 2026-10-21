// Pinned Full-Screen Scroll Animation Engine
// Locks the canvas on screen until all 300 frames play completely

(function() {
  'use strict';

  const TOTAL_FRAMES = 300;
  const frameImages = new Array(TOTAL_FRAMES);

  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawnIndex = -1;

  const scrollTrack = document.getElementById('scroll-track');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d');

  const frameCounter = document.getElementById('frame-counter');
  const hintFill = document.getElementById('hint-fill');
  const scrollHint = document.getElementById('scroll-hint');

  function getFramePath(index) {
    const frameNum = String(index + 1).padStart(3, '0');
    return `frames/ezgif-frame-${frameNum}.jpg`;
  }

  // Preload all 300 images
  function preloadImages() {
    // 1. Immediately paint frame 0 so screen is ready instantly
    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    firstImg.onload = () => {
      frameImages[0] = firstImg;
      drawFrame(0);
    };

    // 2. Concurrently load remaining 299 frames
    const concurrency = 20;
    let nextIndex = 1;

    const loadNext = () => {
      if (nextIndex >= TOTAL_FRAMES) return;
      const idx = nextIndex++;
      const img = new Image();
      img.src = getFramePath(idx);

      img.onload = () => {
        frameImages[idx] = img;
        loadNext();
      };

      img.onerror = () => {
        loadNext();
      };
    };

    for (let i = 0; i < concurrency; i++) {
      loadNext();
    }
  }

  // Handle window resize and high-DPI
  function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    if (lastDrawnIndex >= 0) {
      drawFrame(lastDrawnIndex);
    }
    updatePinAndScroll();
  }

  // Fit on screen with cropping (Cover mode): fills 100% of viewport edge-to-edge
  function drawFrame(index) {
    const img = frameImages[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;
    const imgW = img.naturalWidth || 1920;
    const imgH = img.naturalHeight || 1080;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Fullscreen cover: fills 100% of screen edge-to-edge with centered cropping
    const scale = Math.max(canvasW / imgW, canvasH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (canvasW - drawW) / 2;
    const drawY = (canvasH - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // Update active state of the floating liquid glass navigation
  const navItems = document.querySelectorAll('.nav-link');
  const sections = [
    { id: 'reel', el: scrollTrack },
    { id: 'story', el: document.getElementById('brand-story') },
    { id: 'experience', el: document.getElementById('the-experience') },
    { id: 'products', el: document.getElementById('product-highlights') },
    { id: 'campaign', el: document.getElementById('campaign-lifestyle') }
  ];

  function updateActiveNav(scrollY) {
    let currentSection = 'reel';
    const viewMid = scrollY + window.innerHeight * 0.35;

    for (let i = sections.length - 1; i >= 0; i--) {
      const sec = sections[i];
      if (sec.el && sec.el.offsetTop <= viewMid) {
        currentSection = sec.id;
        break;
      }
    }

    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.nav === currentSection);
    });
  }

  // Pinning logic: Canvas remains 100% pinned to viewport while frames advance
  function updatePinAndScroll() {
    const trackHeight = scrollTrack.offsetHeight;
    const viewportH = window.innerHeight;
    const maxAnimScroll = trackHeight - viewportH;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    updateActiveNav(scrollY);

    if (scrollY >= maxAnimScroll) {
      // Animation is 100% finished!
      // Pin to the bottom of the track so user can now scroll forward into subsequent content
      canvasWrapper.style.position = 'absolute';
      canvasWrapper.style.top = maxAnimScroll + 'px';
      if (scrollHint) scrollHint.style.opacity = '0';
      targetFrame = TOTAL_FRAMES - 1;
    } else {
      // User is scrolling through the animation: LOCK CANVAS FIXED TO SCREEN
      canvasWrapper.style.position = 'fixed';
      canvasWrapper.style.top = '0px';
      if (scrollHint) scrollHint.style.opacity = '1';

      const progress = Math.max(0, scrollY / maxAnimScroll);
      targetFrame = progress * (TOTAL_FRAMES - 1);
    }
  }

  // Smooth lerp rendering loop with realistic fluid easing
  function renderLoop() {
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) < 0.008) {
      currentFrame = targetFrame;
    } else {
      currentFrame += diff * 0.055; // Ultra-smooth fluid pour inertia
    }

    const displayIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrame)));

    if (displayIndex !== lastDrawnIndex) {
      drawFrame(displayIndex);
      lastDrawnIndex = displayIndex;

      // Update progress indicator
      if (frameCounter) {
        frameCounter.textContent = `FRAME ${String(displayIndex + 1).padStart(3, '0')} / ${TOTAL_FRAMES}`;
      }
      if (hintFill) {
        hintFill.style.width = `${Math.round((displayIndex / (TOTAL_FRAMES - 1)) * 100)}%`;
      }
    }

    requestAnimationFrame(renderLoop);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', updatePinAndScroll, { passive: true });

  resizeCanvas();
  preloadImages();
  renderLoop();

})();
