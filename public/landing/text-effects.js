/* ============================================================
   MX Performance — Text Effects
   Two canvas-based text animations adapted from 21st.dev refs:
   1) VapourTextCycle  — text vaporizes left-to-right and reforms
   2) ParticleTextSwap — particles converge into shapes of words
   ============================================================ */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------
     1) VAPOUR TEXT CYCLE
     mount(el, { texts, color, fontFamily, fontWeight, fontSize, ... })
  ----------------------------------------------------------- */
  function mountVapour(el, opts = {}) {
    if (reduce) {
      el.textContent = (opts.texts && opts.texts[0]) || '';
      return;
    }

    const texts = opts.texts || ['MX', 'PERFORMANCE'];
    const color = opts.color || 'rgb(31,203,110)';
    const fontFamily = opts.fontFamily || 'Space Grotesk, sans-serif';
    const fontWeight = opts.fontWeight || 700;
    const fontSize = opts.fontSize || 96; // px
    const spread = opts.spread || 4;
    const density = opts.density || 6;
    const align = opts.align || 'center';
    const direction = opts.direction || 'left-to-right';
    const vaporizeDuration = (opts.vaporizeDuration ?? 1.8) * 1000;
    const fadeInDuration = (opts.fadeInDuration ?? 0.9) * 1000;
    const waitDuration = (opts.waitDuration ?? 1.6) * 1000;

    const dpr = Math.min((window.devicePixelRatio || 1) * 1.4, 3);

    el.style.position = el.style.position || 'relative';
    el.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none';
    el.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let particles = [];
    let textBoundaries = { left: 0, right: 0, width: 0 };
    let state = 'static'; // 'vaporizing' | 'fadingIn' | 'waiting' | 'static'
    let progress = 0;
    let fadeOpacity = 0;
    let waitTimer = 0;
    let textIndex = 0;
    let raf = 0;
    let lastT = performance.now();
    let inView = false;

    const transformedDensity = Math.max(0.3, Math.min(1, density / 10 * 0.7 + 0.3));

    function calcSpread(s) {
      if (s <= 20) return 0.2;
      if (s >= 100) return 1.5;
      if (s <= 50) return 0.2 + (s - 20) * (0.5 - 0.2) / (50 - 20);
      return 0.5 + (s - 50) * (1.5 - 0.5) / (100 - 50);
    }
    const VAPORIZE_SPREAD = calcSpread(fontSize) * spread;

    function size() {
      const r = el.getBoundingClientRect();
      const w = Math.max(60, r.width);
      const h = Math.max(40, r.height);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    function buildParticles(text) {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      ctx.font = `${fontWeight} ${fontSize * dpr}px ${fontFamily}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.imageSmoothingQuality = 'high';

      let tx;
      const ty = h / 2;
      if (align === 'center') tx = w / 2;
      else if (align === 'left') tx = 0;
      else tx = w;

      const m = ctx.measureText(text);
      const tw = m.width;
      const tl = align === 'center' ? tx - tw / 2 : (align === 'left' ? tx : tx - tw);
      textBoundaries = { left: tl, right: tl + tw, width: tw };

      ctx.fillText(text, tx, ty);
      const data = ctx.getImageData(0, 0, w, h).data;
      ctx.clearRect(0, 0, w, h);

      const step = Math.max(1, Math.round(dpr / 1.5));
      const out = [];
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4;
          const a = data[i + 3];
          if (a > 0) {
            const oa = (a / 255) * (step / dpr);
            out.push({
              x, y, ox: x, oy: y,
              r: data[i], g: data[i + 1], b: data[i + 2],
              opacity: oa, originalAlpha: oa,
              vx: 0, vy: 0, speed: 0, fadeQuick: false,
            });
          }
        }
      }
      particles = out;
    }

    function update(dt, vaporizeX) {
      let allDone = true;
      const max = VAPORIZE_SPREAD * 2;
      const fadeRate = 0.25 * (2000 / vaporizeDuration);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const should = direction === 'left-to-right' ? p.ox <= vaporizeX : p.ox >= vaporizeX;
        if (should) {
          if (p.speed === 0) {
            const ang = Math.random() * Math.PI * 2;
            p.speed = (Math.random() * 1 + 0.5) * VAPORIZE_SPREAD;
            p.vx = Math.cos(ang) * p.speed;
            p.vy = Math.sin(ang) * p.speed;
            p.fadeQuick = Math.random() > transformedDensity;
          }
          if (p.fadeQuick) {
            p.opacity = Math.max(0, p.opacity - dt);
          } else {
            const dx = p.ox - p.x, dy = p.oy - p.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const damp = Math.max(0.95, 1 - d / (100 * VAPORIZE_SPREAD));
            const rs = VAPORIZE_SPREAD * 3;
            p.vx = (p.vx + (Math.random() - 0.5) * rs + dx * 0.002) * damp;
            p.vy = (p.vy + (Math.random() - 0.5) * rs + dy * 0.002) * damp;
            const cv = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (cv > max) { p.vx *= max / cv; p.vy *= max / cv; }
            p.x += p.vx * dt * 20;
            p.y += p.vy * dt * 10;
            p.opacity = Math.max(0, p.opacity - dt * fadeRate);
          }
          if (p.opacity > 0.01) allDone = false;
        } else {
          allDone = false;
        }
      }
      return allDone;
    }

    function reset() {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = p.ox; p.y = p.oy; p.opacity = p.originalAlpha;
        p.vx = 0; p.vy = 0; p.speed = 0;
      }
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.opacity > 0) {
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.opacity})`;
          ctx.fillRect(p.x / dpr, p.y / dpr, 1, 1);
        }
      }
      ctx.restore();
    }

    function renderFadeIn(op) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const o = Math.min(op, 1) * p.originalAlpha;
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${o})`;
        ctx.fillRect(p.ox / dpr, p.oy / dpr, 1, 1);
      }
      ctx.restore();
    }

    function loop(t) {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      if (!inView) { raf = requestAnimationFrame(loop); return; }

      switch (state) {
        case 'static': render(); break;
        case 'vaporizing': {
          progress += dt * 100 / (vaporizeDuration / 1000);
          const p = Math.min(100, progress);
          const vx = direction === 'left-to-right'
            ? textBoundaries.left + textBoundaries.width * p / 100
            : textBoundaries.right - textBoundaries.width * p / 100;
          const done = update(dt, vx);
          render();
          if (progress >= 100 && done) {
            textIndex = (textIndex + 1) % texts.length;
            buildParticles(texts[textIndex]);
            state = 'fadingIn';
            fadeOpacity = 0;
          }
          break;
        }
        case 'fadingIn': {
          fadeOpacity += dt * 1000 / fadeInDuration;
          renderFadeIn(fadeOpacity);
          if (fadeOpacity >= 1) {
            state = 'waiting';
            waitTimer = 0;
            reset();
          }
          break;
        }
        case 'waiting': {
          render();
          waitTimer += dt * 1000;
          if (waitTimer >= waitDuration) {
            progress = 0;
            state = 'vaporizing';
          }
          break;
        }
      }
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver((es) => {
      es.forEach(e => { inView = e.isIntersecting; });
    }, { threshold: 0.1, rootMargin: '50px' });
    io.observe(el);

    const ro = new ResizeObserver(() => {
      size();
      buildParticles(texts[textIndex]);
    });
    ro.observe(el);

    // wait for fonts
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
      size();
      buildParticles(texts[textIndex]);
      // kick off after a beat
      setTimeout(() => { state = 'vaporizing'; progress = 0; }, 800);
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    });
  }

  /* -----------------------------------------------------------
     2) PARTICLE TEXT SWAP
     mount(el, { words, ... })
     Particles steer to form letters of each word; cycles.
  ----------------------------------------------------------- */
  function mountParticle(el, opts = {}) {
    if (reduce) {
      el.textContent = (opts.words && opts.words[0]) || '';
      return;
    }
    const words = opts.words || ['MX'];
    const fontFamily = opts.fontFamily || 'Space Grotesk, sans-serif';
    const fontWeight = opts.fontWeight || 700;
    const fontSize = opts.fontSize || 120; // px
    const accent = opts.accent || [31, 203, 110];
    const drift = opts.drift || [255, 255, 255];
    const pixelStep = opts.pixelStep || 6;
    const interval = (opts.intervalSec ?? 4) * 1000;

    el.style.position = el.style.position || 'relative';
    el.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    el.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;
    let particles = [];
    let raf = 0;
    let lastSwap = 0;
    let idx = 0;
    let inView = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function size() {
      const r = el.getBoundingClientRect();
      W = Math.max(120, r.width);
      H = Math.max(80, r.height);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
    }

    function randomEdge() {
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const ang = Math.random() * Math.PI * 2;
      const mag = (canvas.width + canvas.height) / 2;
      return { x: cx + Math.cos(ang) * mag, y: cy + Math.sin(ang) * mag };
    }

    function pickColor() {
      // mostly accent, occasional drift
      return Math.random() < 0.85 ? accent : drift;
    }

    function nextWord(word) {
      const off = document.createElement('canvas');
      off.width = canvas.width; off.height = canvas.height;
      const o = off.getContext('2d');
      o.fillStyle = '#fff';
      o.font = `${fontWeight} ${fontSize * dpr}px ${fontFamily}`;
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      o.fillText(word, canvas.width / 2, canvas.height / 2);
      const data = o.getImageData(0, 0, canvas.width, canvas.height).data;

      const coords = [];
      for (let i = 0; i < data.length; i += pixelStep * 4) coords.push(i);
      // shuffle
      for (let i = coords.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [coords[i], coords[j]] = [coords[j], coords[i]];
      }

      let pi = 0;
      for (const c of coords) {
        if (data[c + 3] > 0) {
          const x = (c / 4) % canvas.width;
          const y = ((c / 4) / canvas.width) | 0;
          let p = particles[pi];
          if (!p) {
            const e = randomEdge();
            p = {
              x: e.x, y: e.y, vx: 0, vy: 0, ax: 0, ay: 0,
              tx: 0, ty: 0,
              maxSpeed: Math.random() * 4 + 3,
              maxForce: 0,
              size: Math.random() * 2 + 1.5,
              startC: [0, 0, 0], targetC: [0, 0, 0], cw: 0,
              cwRate: Math.random() * 0.025 + 0.005,
              killed: false,
            };
            p.maxForce = p.maxSpeed * 0.06;
            particles.push(p);
          }
          // blend start color from current
          p.startC = [
            p.startC[0] + (p.targetC[0] - p.startC[0]) * p.cw,
            p.startC[1] + (p.targetC[1] - p.startC[1]) * p.cw,
            p.startC[2] + (p.targetC[2] - p.startC[2]) * p.cw,
          ];
          p.targetC = pickColor();
          p.cw = 0;
          p.tx = x; p.ty = y;
          p.killed = false;
          pi++;
        }
      }
      // kill leftovers
      for (let i = pi; i < particles.length; i++) {
        const p = particles[i];
        if (!p.killed) {
          const e = randomEdge();
          p.tx = e.x; p.ty = e.y;
          p.startC = [
            p.startC[0] + (p.targetC[0] - p.startC[0]) * p.cw,
            p.startC[1] + (p.targetC[1] - p.startC[1]) * p.cw,
            p.startC[2] + (p.targetC[2] - p.startC[2]) * p.cw,
          ];
          p.targetC = [0, 0, 0];
          p.cw = 0;
          p.killed = true;
        }
      }
    }

    function step() {
      // motion blur trail
      ctx.fillStyle = 'rgba(7,10,8,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        // steer toward target
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const close = 100;
        const prox = dist < close ? dist / close : 1;
        let vx = dx, vy = dy;
        const m = Math.sqrt(vx * vx + vy * vy);
        if (m > 0) { vx = vx / m * p.maxSpeed * prox; vy = vy / m * p.maxSpeed * prox; }
        let sx = vx - p.vx, sy = vy - p.vy;
        const sm = Math.sqrt(sx * sx + sy * sy);
        if (sm > 0) { sx = sx / sm * p.maxForce; sy = sy / sm * p.maxForce; }
        p.vx += sx; p.vy += sy;
        p.x += p.vx; p.y += p.vy;

        if (p.cw < 1) p.cw = Math.min(1, p.cw + p.cwRate);
        const r = Math.round(p.startC[0] + (p.targetC[0] - p.startC[0]) * p.cw);
        const g = Math.round(p.startC[1] + (p.targetC[1] - p.startC[1]) * p.cw);
        const b = Math.round(p.startC[2] + (p.targetC[2] - p.startC[2]) * p.cw);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(p.x, p.y, p.size * dpr, p.size * dpr);

        if (p.killed && (p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50)) {
          particles.splice(i, 1);
        }
      }
    }

    function loop(t) {
      if (inView) {
        step();
        if (t - lastSwap > interval) {
          lastSwap = t;
          idx = (idx + 1) % words.length;
          nextWord(words[idx]);
        }
      }
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver((es) => {
      es.forEach(e => { inView = e.isIntersecting; });
    }, { threshold: 0.1 });
    io.observe(el);

    const ro = new ResizeObserver(() => { size(); nextWord(words[idx]); });
    ro.observe(el);

    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
      size();
      nextWord(words[idx]);
      lastSwap = performance.now();
      raf = requestAnimationFrame(loop);
    });
  }

  window.MXTextEffects = { mountVapour, mountParticle };
})();
