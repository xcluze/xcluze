// ===== Neon Rush: a small lane racer for the Play section =====
(() => {
    const canvas = document.getElementById('game');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const frame = document.getElementById('gameFrame');
    const overlay = document.getElementById('gameOverlay');
    const hudScore = document.getElementById('hudScore');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudBest = document.getElementById('hudBest');

    const LANES = 3;
    const BASE_SPEED = 420, MAX_SPEED = 1150, ACCEL = 14;   // px/s at a 640px-tall screen
    const TRAFFIC_REL = 0.62;                                // traffic drives forward, so it scrolls slower than the road
    const TRAFFIC = ['#7c6cff', '#3ddc97', '#e8e6e1', '#4cc3ff', '#ff2d7a', '#a1a1aa'];
    const BEST_KEY = 'neonRushBest';

    let W = 0, H = 0, unit = 1, roadL = 0, roadW = 0, laneW = 0, carW = 0, carH = 0;
    let state = 'ready', visible = false, raf = 0, last = 0, clock = 0;
    let player, cars = [], coins = [], parts = [], pops = [], roadDist, objDist, nextRow, speed, bonus, score, shake, best = 0, newBest = false;

    try { best = +localStorage.getItem(BEST_KEY) || 0; } catch { /* storage blocked: best lives for this visit only */ }
    hudBest.textContent = best;

    const laneX = i => roadL + laneW * (i + 0.5);
    const rand = (a, b) => a + Math.random() * (b - a);

    function rr(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
        else ctx.rect(x, y, w, h); // older Safari: square corners
    }

    function resize() {
        const r = frame.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        unit = H / 640;
        roadW = Math.min(W * 0.84, H * 0.62);
        roadL = (W - roadW) / 2;
        laneW = roadW / LANES;
        carW = laneW * 0.52;
        carH = carW * 1.85;
        if (player) { player.x = laneX(player.lane); player.y = H - carH - 46 * unit; }
        if (!raf) draw();
    }

    function reset() {
        player = { lane: 1, x: laneX(1), y: H - carH - 46 * unit, tilt: 0 };
        cars = []; coins = []; parts = []; pops = [];
        roadDist = 0; objDist = 0; nextRow = carH * 2; speed = BASE_SPEED * unit;
        bonus = 0; score = 0; shake = 0; newBest = false;
    }

    // ----- Spawning: one row at a time, always leaving a lane open -----
    function spawnRow() {
        const d = Math.min(1, (speed / unit - BASE_SPEED) / 600);
        const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
        const n = Math.random() < 0.22 + 0.45 * d ? 2 : 1;
        for (let i = 0; i < n; i++) {
            const truck = Math.random() < 0.18;
            cars.push({ lane: lanes[i], y: -carH * (truck ? 1.6 : 1.2), h: carH * (truck ? 1.45 : 1), truck, color: TRAFFIC[(Math.random() * TRAFFIC.length) | 0], passed: false });
        }
        if (Math.random() < 0.6) coins.push({ lane: lanes[n], y: -carH * 0.7 });
        // gap shrinks with difficulty but always leaves room to slip between rows
        nextRow += carH * (4.2 - 1.2 * d) * rand(0.9, 1.15);
    }

    function burst(x, y, color, count, power) {
        for (let i = 0; i < count; i++) {
            const a = rand(0, Math.PI * 2), v = rand(0.3, 1) * power * unit;
            parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, size: rand(2, 5) * unit, color });
        }
    }

    function pop(text, x, y) { pops.push({ text, x, y, life: 1 }); }

    // ----- Update -----
    function update(dt) {
        speed = Math.min(speed + ACCEL * unit * dt, MAX_SPEED * unit);
        roadDist += speed * dt;
        const move = speed * TRAFFIC_REL * dt;
        objDist += move;
        while (objDist >= nextRow) spawnRow();

        const tx = laneX(player.lane);
        player.x += (tx - player.x) * Math.min(1, dt * 14);
        player.tilt = (tx - player.x) / laneW;

        const px = player.x, py = player.y + carH / 2;
        for (const c of cars) {
            c.y += move;
            const cx = laneX(c.lane), cy = c.y + c.h / 2;
            if (Math.abs(cx - px) < carW * 0.84 && Math.abs(cy - py) < (c.h + carH) / 2 * 0.86) return crash();
            if (!c.passed && c.y > player.y + carH) {
                c.passed = true;
                if (Math.abs(cx - px) < laneW * 1.12) {
                    bonus += 25;
                    pop('NEAR MISS +25', px, player.y - 10 * unit);
                }
            }
        }
        for (const k of coins) {
            k.y += move;
            if (!k.got && Math.abs(laneX(k.lane) - px) < laneW * 0.45 && Math.abs(k.y - py) < carH * 0.6) {
                k.got = true;
                bonus += 50;
                pop('+50', laneX(k.lane), k.y);
                burst(laneX(k.lane), k.y, '#ffd23f', 10, 160);
            }
        }
        cars = cars.filter(c => c.y < H + carH * 2);
        coins = coins.filter(k => !k.got && k.y < H + carH);
        score = Math.floor(objDist / (12 * unit)) + bonus;
    }

    function updateFx(dt) {
        for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt * 1.4; }
        parts = parts.filter(p => p.life > 0);
        for (const p of pops) { p.y -= 50 * unit * dt; p.life -= dt * 1.2; }
        pops = pops.filter(p => p.life > 0);
        shake *= Math.pow(0.02, dt);
    }

    function crash() {
        state = 'over';
        shake = 1;
        burst(player.x, player.y + carH / 2, '#ffb020', 26, 340);
        burst(player.x, player.y + carH / 2, '#ff4d6d', 14, 260);
        if (navigator.vibrate) navigator.vibrate(90);
        if (score > best) {
            best = score; newBest = true;
            try { localStorage.setItem(BEST_KEY, best); } catch { /* ignore */ }
        }
        hudBest.textContent = best;
        setTimeout(() => showOverlay('over'), 550);
    }

    // ----- Draw -----
    function drawCar(cx, y, w, h, body, isPlayer, truck) {
        const x = cx - w / 2;
        ctx.fillStyle = 'rgba(0,0,0,.4)';
        rr(x + 3 * unit, y + 6 * unit, w, h, w * 0.22); ctx.fill();
        ctx.fillStyle = body;
        rr(x, y, w, h, w * 0.22); ctx.fill();
        if (truck) {
            ctx.fillStyle = 'rgba(255,255,255,.18)';
            rr(x + w * 0.1, y + h * 0.3, w * 0.8, h * 0.62, 3); ctx.fill();
            ctx.fillStyle = 'rgba(8,12,22,.85)';
            rr(x + w * 0.16, y + h * 0.08, w * 0.68, h * 0.14, 3); ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(8,12,22,.85)';
            rr(x + w * 0.14, y + h * 0.2, w * 0.72, h * 0.2, 4); ctx.fill();   // windshield
            rr(x + w * 0.18, y + h * 0.64, w * 0.64, h * 0.13, 3); ctx.fill(); // rear window
            ctx.fillStyle = 'rgba(255,255,255,.12)';
            rr(x + w * 0.14, y + h * 0.42, w * 0.72, h * 0.2, 3); ctx.fill();  // roof
        }
        if (isPlayer) {
            ctx.fillStyle = 'rgba(20,6,0,.6)';
            ctx.fillRect(cx - w * 0.12, y + h * 0.04, w * 0.07, h * 0.9);
            ctx.fillRect(cx + w * 0.05, y + h * 0.04, w * 0.07, h * 0.9);
        }
        ctx.fillStyle = '#fff6d8';
        ctx.fillRect(x + w * 0.1, y + 2 * unit, w * 0.2, 4 * unit);
        ctx.fillRect(x + w * 0.7, y + 2 * unit, w * 0.2, 4 * unit);
        ctx.fillStyle = '#ff2f55';
        ctx.fillRect(x + w * 0.08, y + h - 5 * unit, w * 0.22, 4 * unit);
        ctx.fillRect(x + w * 0.7, y + h - 5 * unit, w * 0.22, 4 * unit);
    }

    function draw() {
        if (!W) return;
        ctx.save();
        ctx.clearRect(0, 0, W, H);
        if (shake > 0.01) ctx.translate(rand(-1, 1) * shake * 10 * unit, rand(-1, 1) * shake * 10 * unit);

        // ground with a scrolling grid
        ctx.fillStyle = '#0a0a0d';
        ctx.fillRect(-20, -20, W + 40, H + 40);
        const g = 48 * unit, off = (roadDist || 0) % g;
        ctx.strokeStyle = 'rgba(255,91,31,.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = off - g; y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(roadL - 10, y); ctx.moveTo(roadL + roadW + 10, y); ctx.lineTo(W, y); }
        for (let x = roadL - 10 - g; x > 0; x -= g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let x = roadL + roadW + 10 + g; x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        ctx.stroke();

        // road
        const rg = ctx.createLinearGradient(roadL, 0, roadL + roadW, 0);
        rg.addColorStop(0, '#111114'); rg.addColorStop(0.5, '#18181c'); rg.addColorStop(1, '#111114');
        ctx.fillStyle = rg;
        ctx.fillRect(roadL, 0, roadW, H);

        // neon edges: a wide faint stroke under a thin bright one reads as glow without shadowBlur
        for (const ex of [roadL, roadL + roadW]) {
            ctx.fillStyle = 'rgba(255,91,31,.14)'; ctx.fillRect(ex - 5, 0, 10, H);
            ctx.fillStyle = ex === roadL ? '#ff5b1f' : '#ff2d7a'; ctx.fillRect(ex - 1.5, 0, 3, H);
        }
        // roadside posts
        const pg = 110 * unit, poff = (roadDist || 0) % pg;
        ctx.fillStyle = 'rgba(255,176,32,.55)';
        for (let y = poff - pg; y < H; y += pg) { ctx.fillRect(roadL - 16 * unit, y, 4 * unit, 18 * unit); ctx.fillRect(roadL + roadW + 12 * unit, y, 4 * unit, 18 * unit); }

        // lane dashes
        const dash = 34 * unit, period = 70 * unit, doff = (roadDist || 0) % period;
        ctx.fillStyle = 'rgba(245,243,238,.28)';
        for (let i = 1; i < LANES; i++) {
            const x = roadL + laneW * i - 1.5;
            for (let y = doff - period; y < H; y += period) ctx.fillRect(x, y, 3, dash);
        }

        if (player) {
            // coins
            for (const k of coins) {
                const r = laneW * 0.13, sx = Math.max(0.15, Math.abs(Math.cos(clock * 4 + k.y * 0.01)));
                ctx.save();
                ctx.translate(laneX(k.lane), k.y);
                ctx.scale(sx, 1);
                ctx.fillStyle = 'rgba(255,210,63,.18)';
                ctx.beginPath(); ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffd23f';
                ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#c99400';
                ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            for (const c of cars) drawCar(laneX(c.lane), c.y, carW, c.h, c.color, false, c.truck);

            if (state !== 'over') {
                // headlight cone
                const cone = ctx.createLinearGradient(0, player.y, 0, player.y - carH * 1.6);
                cone.addColorStop(0, 'rgba(255,220,170,.22)'); cone.addColorStop(1, 'rgba(255,220,170,0)');
                ctx.fillStyle = cone;
                ctx.beginPath();
                ctx.moveTo(player.x - carW * 0.4, player.y);
                ctx.lineTo(player.x + carW * 0.4, player.y);
                ctx.lineTo(player.x + carW * 0.9, player.y - carH * 1.6);
                ctx.lineTo(player.x - carW * 0.9, player.y - carH * 1.6);
                ctx.fill();

                ctx.save();
                ctx.translate(player.x, player.y + carH / 2);
                ctx.rotate(player.tilt * 0.16);
                const body = ctx.createLinearGradient(-carW / 2, 0, carW / 2, 0);
                body.addColorStop(0, '#ffb020'); body.addColorStop(0.5, '#ff5b1f'); body.addColorStop(1, '#ff2d7a');
                drawCar(0, -carH / 2, carW, carH, body, true, false);
                ctx.restore();
            }
        }

        for (const p of parts) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.font = `800 ${Math.round(14 * unit + 3)}px Anybody, system-ui, sans-serif`;
        for (const p of pops) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.text.startsWith('+') ? '#ffd23f' : '#ff2d7a';
            ctx.fillText(p.text, p.x, p.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    let lastScore = -1, lastKmh = -1;
    function hud() {
        if (score !== lastScore) hudScore.textContent = lastScore = score;
        const kmh = Math.round((speed / unit) * 0.25);
        if (kmh !== lastKmh) hudSpeed.textContent = lastKmh = kmh;
    }

    // ----- Loop: runs only while playing or while crash effects settle -----
    function loop(t) {
        const dt = Math.min((t - last) / 1000, 0.05);
        last = t;
        clock += dt;
        if (state === 'run') update(dt);
        updateFx(dt);
        draw();
        hud();
        raf = (state === 'run' || parts.length || pops.length || shake > 0.01) ? requestAnimationFrame(loop) : 0;
    }
    function kick() {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }

    // ----- States -----
    function showOverlay(kind) {
        const btn = (act, label, cls = 'btn-primary') => `<button class="btn ${cls}" type="button" data-act="${act}">${label}</button>`;
        if (kind === 'ready') {
            overlay.innerHTML = `<p class="go-title">Neon Rush</p><p class="go-sub">Dodge traffic, grab coins, chase the high score.</p><div class="go-actions">${btn('start', 'Start game ▶')}</div><p class="go-hint">Space to start · ← → to steer</p>`;
        } else if (kind === 'paused') {
            overlay.innerHTML = `<p class="go-title">Paused</p><div class="go-actions">${btn('resume', 'Resume ▶')}</div><p class="go-hint">Space to resume</p>`;
        } else {
            overlay.innerHTML = `<p class="go-title">Crashed</p>${newBest ? '<span class="go-new">NEW BEST</span>' : ''}<p class="go-score">${score}</p><p class="go-best">Best <b>${best}</b></p><div class="go-actions">${btn('start', 'Retry ↻')}<a class="btn btn-outline" href="#contact">Hire Saad</a></div><p class="go-hint">Space to retry</p>`;
        }
        overlay.classList.remove('hidden');
    }

    function start() {
        reset();
        state = 'run';
        overlay.classList.add('hidden');
        kick();
    }
    function pause() {
        if (state !== 'run') return;
        state = 'paused';
        showOverlay('paused');
    }
    function resume() {
        if (state !== 'paused') return;
        state = 'run';
        overlay.classList.add('hidden');
        kick();
    }
    const steer = dir => {
        if (state === 'run') player.lane = Math.max(0, Math.min(LANES - 1, player.lane + dir));
    };

    // ----- Input -----
    overlay.addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (!b) return;
        b.dataset.act === 'resume' ? resume() : start();
    });
    canvas.addEventListener('pointerdown', e => {
        if (state !== 'run') return;
        const r = canvas.getBoundingClientRect();
        steer(e.clientX - r.left < r.width / 2 ? -1 : 1);
    });
    document.getElementById('padL').addEventListener('pointerdown', e => { e.preventDefault(); steer(-1); });
    document.getElementById('padR').addEventListener('pointerdown', e => { e.preventDefault(); steer(1); });

    window.addEventListener('keydown', e => {
        if (!visible || e.target.closest?.('input, textarea')) return;
        const k = e.key;
        if (state === 'run') {
            if (k === 'ArrowLeft' || k === 'a' || k === 'A') { steer(-1); e.preventDefault(); }
            else if (k === 'ArrowRight' || k === 'd' || k === 'D') { steer(1); e.preventDefault(); }
            else if (k === 'p' || k === 'P' || k === 'Escape') pause();
            else if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown') e.preventDefault(); // keep the page still mid-race
        } else if (k === ' ' || k === 'Enter') {
            if (e.target.closest?.('button, a')) return; // let focused buttons do their own thing
            e.preventDefault();
            state === 'paused' ? resume() : start();
        }
    });

    // Pause when the game leaves the screen or the tab hides
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => {
            visible = en.intersectionRatio >= 0.5;
            if (!visible) pause();
        }, { threshold: [0, 0.5, 1] }).observe(frame);
    } else visible = true;
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(frame);
    else window.addEventListener('resize', resize);

    resize();
    reset();
    draw();
    showOverlay('ready');
    // redraw once fonts land so pop text uses Anybody
    document.fonts?.ready.then(() => { if (!raf) draw(); });
})();
