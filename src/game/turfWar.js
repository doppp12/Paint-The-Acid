// Paint The Acid — SLIME TURF WAR engine (canvas)

  const COLS = 60, ROWS = 40, CS = 20, W = COLS * CS, H = ROWS * CS, N = COLS * ROWS;
  const COL = { bg: '#0B0A10', empty: '#13111A', me: '#8CFF00', meHi: '#B8FF5C', ai: '#6F24B8', aiHi: '#8E45D6', warn: '#FF3B3B' };
  const ROUNDS = {
    1: { time: 30, down: 1.25, side: 0.35, up: 0.05, eatMe: 0.5, drip: 1.0 },
    2: { time: 15, down: 1.6, side: 0.45, up: 0.08, eatMe: 0.55, drip: 1.4, xRush: 3 },
    3: { time: 15, down: 1.25, side: 0.4, up: 0.06, eatMe: 0.5, drip: 1.0, half: true },
    4: { time: 15, down: 1.15, side: 0.65, up: 0.3, eatMe: 0.5, drip: 1.0, meteors: 5 },
    5: { time: 20, down: 2.1, side: 1.05, up: 0.5, eatMe: 1, drip: 2.5, laser: 1.5, storm: 4 },
  };
  const rnd = Math.random;

  export class TurfWar {
    constructor(canvas, cb) {
      this.cv = canvas; this.ctx = canvas.getContext('2d');
      canvas.width = W; canvas.height = H;
      this.cb = cb || {};
      this.g = new Uint8Array(N); this.b = new Uint8Array(N);
      this.raf = 0; this.paused = false; this.over = true; this.ptr = null; this.down = false; this.last = null;
      this._loop = this._loop.bind(this);
      this._pd = e => { this.down = true; this._setPtr(e); this.last = null; this._sprayTo(); try { canvas.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); };
      this._pm = e => { this._setPtr(e); if (this.down) this._sprayTo(); };
      this._pu = () => { this.down = false; this.last = null; };
      this._pl = () => { if (!this.down) this.ptr = null; };
      canvas.addEventListener('pointerdown', this._pd);
      canvas.addEventListener('pointermove', this._pm);
      canvas.addEventListener('pointerup', this._pu);
      canvas.addEventListener('pointercancel', this._pu);
      canvas.addEventListener('pointerleave', this._pl);
    }
    _setPtr(e) {
      const r = this.cv.getBoundingClientRect();
      this.ptr = { x: (e.clientX - r.left) / r.width * COLS, y: (e.clientY - r.top) / r.height * ROWS };
    }
    _canPaint() { return !this.over && !this.paused && this.phase === 'play'; }
    _sprayTo() {
      if (!this._canPaint() || !this.ptr) return;
      const p = this.ptr, l = this.last || p;
      const d = Math.hypot(p.x - l.x, p.y - l.y), steps = Math.max(1, Math.ceil(d / 0.8));
      for (let s = 1; s <= steps; s++) this._circle(this.g, l.x + (p.x - l.x) * s / steps, l.y + (p.y - l.y) * s / steps, 2.6, 1);
      this.last = { x: p.x, y: p.y };
    }
    _circle(g, cx, cy, r, v) {
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(COLS - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(ROWS - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g[y * COLS + x] = v;
      }
    }
    _plus(g, x, y) {
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) g[ny * COLS + nx] = 2;
      });
    }
    _placeMeteors() {
      const r = Math.sqrt(0.3 * N / 5 / Math.PI);
      for (let attempt = 0; attempt < 400; attempt++) {
        const out = [];
        for (let k = 0; k < 2000 && out.length < 5; k++) {
          const x = r + 1 + rnd() * (COLS - 2 * r - 2), y = r + 3 + rnd() * (ROWS - 2 * r - 4);
          if (out.every(m => Math.hypot(m.x - x, m.y - y) > 2 * r + 0.6)) out.push({ x, y });
        }
        if (out.length === 5) return out.map((m, i) => ({ ...m, r, delay: i * 0.3, landed: false }));
      }
      return [];
    }
    start(n) {
      cancelAnimationFrame(this.raf);
      this.n = n; this.cfg = ROUNDS[n]; this.g.fill(0);
      this.t = 0; this.phase = 'ready'; this.phaseT = 0; this.over = false; this.paused = false;
      this.lastMy = -1; this.lastChange = 0; this.hudKey = '';
      this.meteors = []; this.lasers = []; this.laserT = 0; this.shake = 0;
      const g = this.g;
      if (this.cfg.half) {
        const a = rnd() * 6, b = rnd() * 6;
        for (let x = 0; x < COLS; x++) {
          const h = Math.round(20 + Math.sin(x * 0.35 + a) * 2.2 + Math.sin(x * 0.9 + b) * 1.3 + (rnd() * 1.2 - 0.6));
          for (let y = 0; y < h; y++) g[y * COLS + x] = 2;
        }
      } else if (!this.cfg.xRush) {
        for (let x = 0; x < COLS; x++) g[x] = 2;
      }
      if (this.cfg.meteors) this.meteors = this._placeMeteors();
      this.prev = performance.now();
      this.raf = requestAnimationFrame(this._loop);
      this._hudCounts();
    }
    _hudCounts() {
      let me = 0, ai = 0;
      for (let i = 0; i < N; i++) { const v = this.g[i]; if (v === 1) me++; else if (v === 2) ai++; }
      this._hud(Math.round(me / N * 100), Math.round(ai / N * 100), 0, false);
    }
    pause() { this.paused = true; }
    resume() { if (this.paused) { this.paused = false; this.prev = performance.now(); } }
    destroy() {
      this.over = true; cancelAnimationFrame(this.raf);
      const c = this.cv;
      c.removeEventListener('pointerdown', this._pd); c.removeEventListener('pointermove', this._pm);
      c.removeEventListener('pointerup', this._pu); c.removeEventListener('pointercancel', this._pu);
      c.removeEventListener('pointerleave', this._pl);
    }
    _loop(now) {
      const dt = Math.min(0.05, (now - this.prev) / 1000); this.prev = now;
      if (!this.paused && !this.over) this._update(dt);
      this._draw();
      if (!this.over) this.raf = requestAnimationFrame(this._loop);
    }
    _update(dt) {
      this.phaseT += dt;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
      if (this.phase === 'ready') {
        if (this.phaseT >= 1.4) { this.phase = this.cfg.meteors ? 'meteor' : 'play'; this.phaseT = 0; }
        return;
      }
      if (this.phase === 'meteor') {
        this.meteors.forEach(m => {
          if (!m.landed && this.phaseT >= m.delay + 0.9) { m.landed = true; this._circle(this.g, m.x, m.y, m.r, 2); this.shake = 1; this._hudCounts(); }
        });
        if (this.phaseT >= 0.3 * 4 + 1.3) { this.phase = 'play'; this.phaseT = 0; }
        return;
      }
      this.t += dt;
      const c = this.cfg;
      if (c.xRush && this.t <= c.xRush + dt) {
        const k = Math.min(1, this.t / c.xRush), cx = COLS / 2, cy = ROWS / 2;
        [[0, 0], [COLS, 0], [0, ROWS], [COLS, ROWS]].forEach(([sx, sy]) => {
          for (let s = 0; s <= 6; s++) {
            const kk = Math.max(0, k - s * 0.01);
            this._circle(this.g, sx + (cx - sx) * kk, sy + (cy - sy) * kk, 1.9, 2);
          }
        });
      }
      if (this.down && this.ptr) this._sprayTo();
      this._spread(dt);
      if (c.laser) this._lasers(dt);
      if (c.storm && rnd() < c.storm * dt) {
        this._circle(this.g, rnd() * COLS, rnd() * ROWS, 1.4 + rnd() * 1.2, 2);
      }
      let me = 0, ai = 0;
      for (let i = 0; i < N; i++) { const v = this.g[i]; if (v === 1) me++; else if (v === 2) ai++; }
      const myR = Math.round(me / N * 100), aiR = Math.round(ai / N * 100);
      if (myR !== this.lastMy) { this.lastMy = myR; this.lastChange = this.t; }
      let warn = 0, since = 0;
      if (this.t >= 10 && myR <= 30) {
        since = this.t - Math.max(this.lastChange, 10);
        if (since >= 3) warn = Math.min(1, (since - 3) / 3);
      }
      if (me === N) return this._end(true, false, myR, aiR);
      if (since >= 6) return this._end(false, true, myR, aiR);
      if (this.t >= c.time) return this._end(me > ai, false, myR, aiR);
      this._hud(myR, aiR, warn, since >= 3);
    }
    _spread(dt) {
      const c = this.cfg, g = this.g, b = this.b;
      b.set(g);
      const pd = c.down * dt, ps = c.side * dt, pu = c.up * dt;
      const tryCell = (x, y, p) => {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
        const j = y * COLS + x, v = g[j];
        if (v === 2) return;
        if (rnd() < (v === 1 ? p * c.eatMe : p)) {
          b[j] = 2;
          if (rnd() < 0.08) this._plus(b, x, y);
        }
      };
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (g[y * COLS + x] !== 2) continue;
        tryCell(x, y + 1, pd); tryCell(x - 1, y, ps); tryCell(x + 1, y, ps); tryCell(x, y - 1, pu);
      }
      if (rnd() < c.drip * dt) {
        const x = Math.floor(rnd() * COLS), len = 1 + Math.floor(rnd() * 3);
        for (let y = 0; y < len; y++) b[y * COLS + x] = 2;
      }
      this.g = b; this.b = g;
    }
    _lasers(dt) {
      this.laserT += dt;
      if (this.laserT >= this.cfg.laser) {
        this.laserT = 0;
        const h = rnd() < 0.5;
        this.lasers.push({ h, idx: Math.floor(rnd() * (h ? ROWS : COLS)), t: 0, fired: false });
      }
      this.lasers.forEach(l => {
        l.t += dt;
        if (!l.fired && l.t >= 0.75) {
          l.fired = true;
          if (l.h) for (let x = 0; x < COLS; x++) this.g[l.idx * COLS + x] = 2;
          else for (let y = 0; y < ROWS; y++) this.g[y * COLS + l.idx] = 2;
        }
      });
      this.lasers = this.lasers.filter(l => l.t < 0.95);
    }
    _hud(my, enemy, warnPct, warn) {
      const time = Math.max(0, Math.ceil(this.cfg.time - this.t));
      const warnLeft = Math.max(1, Math.ceil(3 - warnPct * 3));
      const wp = Math.round(warnPct * 50) / 50;
      const key = [time, my, enemy, warn, wp].join('|');
      if (key === this.hudKey) return;
      this.hudKey = key;
      this.cb.onHud && this.cb.onHud({ time, my, enemy, warn, warnLeft, warnPct: wp });
    }
    _end(win, stall, my, enemy) {
      this.over = true;
      this._hud(my, enemy, 0, false);
      this._draw();
      this.cb.onEnd && this.cb.onEnd({ win, stall, my, enemy });
    }
    _draw() {
      const ctx = this.ctx, g = this.g;
      ctx.save();
      if (this.shake > 0) ctx.translate((rnd() - 0.5) * 14 * this.shake, (rnd() - 0.5) * 14 * this.shake);
      ctx.fillStyle = COL.bg; ctx.fillRect(-20, -20, W + 40, H + 40);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const v = g[y * COLS + x];
        ctx.fillStyle = v === 1 ? COL.me : v === 2 ? COL.ai : COL.empty;
        ctx.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2);
        if (v) {
          ctx.fillStyle = v === 1 ? COL.meHi : COL.aiHi;
          ctx.fillRect(x * CS + 3, y * CS + 3, 5, 3);
        }
      }
      this.lasers.forEach(l => {
        if (!l.fired) {
          if (Math.floor(l.t * 12) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,59,59,0.85)';
            if (l.h) ctx.fillRect(0, l.idx * CS + CS / 2 - 2, W, 4); else ctx.fillRect(l.idx * CS + CS / 2 - 2, 0, 4, H);
          }
        } else {
          ctx.fillStyle = 'rgba(200,140,255,' + Math.max(0, 1 - (l.t - 0.75) / 0.2) + ')';
          if (l.h) ctx.fillRect(0, l.idx * CS, W, CS); else ctx.fillRect(l.idx * CS, 0, CS, H);
        }
      });
      if (this.phase === 'meteor') {
        this.meteors.forEach(m => {
          if (m.landed) return;
          const k = (this.phaseT - m.delay) / 0.9;
          if (k < 0) return;
          const ty = m.y * CS, y = -m.r * CS + (ty + m.r * CS) * k * k, x = m.x * CS, rr = m.r * CS * 0.55;
          const grad = ctx.createLinearGradient(x, y - rr * 5, x, y);
          grad.addColorStop(0, 'rgba(111,36,184,0)'); grad.addColorStop(1, 'rgba(142,69,214,0.7)');
          ctx.fillStyle = grad; ctx.fillRect(x - rr * 0.6, y - rr * 5, rr * 1.2, rr * 5);
          ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fillStyle = COL.ai; ctx.fill();
          ctx.beginPath(); ctx.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.3, 0, Math.PI * 2); ctx.fillStyle = COL.aiHi; ctx.fill();
          ctx.beginPath(); ctx.arc(x, ty, m.r * CS * k, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,59,59,0.6)'; ctx.lineWidth = 3; ctx.stroke();
        });
      }
      if (this.ptr && !this.over) {
        ctx.beginPath(); ctx.arc(this.ptr.x * CS, this.ptr.y * CS, 2.6 * CS, 0, Math.PI * 2);
        ctx.strokeStyle = this.down ? 'rgba(140,255,0,0.9)' : 'rgba(245,245,245,0.7)'; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.restore();
      if (this.phase === 'ready' && !this.over) {
        ctx.fillStyle = 'rgba(9,9,13,0.55)'; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#F5F5F5'; ctx.font = '600 34px Poppins, sans-serif';
        ctx.fillText('ROUND ' + this.n, W / 2, H / 2 - 70);
        ctx.fillStyle = '#8CFF00'; ctx.font = 'italic 800 120px Poppins, sans-serif';
        ctx.fillText(this.phaseT < 0.9 ? 'READY' : 'GO!', W / 2, H / 2 + 20);
      }
    }
  }

  export function TurfConfetti(cv) {
    const ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0, raf = 0, prev = performance.now();
    const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const colors = ['#8CFF00', '#B8FF5C', '#F5F5F5', '#6F24B8'];
    const ps = Array.from({ length: 170 }, () => ({
      x: rnd() * w, y: -rnd() * h * 0.8, vx: (rnd() - 0.5) * 80, vy: 120 + rnd() * 220,
      s: 4 + rnd() * 7, a: rnd() * 6, va: (rnd() - 0.5) * 8, c: colors[Math.floor(rnd() * colors.length)], blob: rnd() < 0.4,
    }));
    const loop = now => {
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      if (cv.clientWidth !== w || cv.clientHeight !== h) size();
      ctx.clearRect(0, 0, w, h);
      ps.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
        if (p.y > h + 20) { p.y = -20; p.x = rnd() * w; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
        if (p.blob) { ctx.beginPath(); ctx.arc(0, 0, p.s * 0.6, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }


