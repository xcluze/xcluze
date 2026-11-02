// ===== Config =====
const CONTACT = {
    email: 'xcluze01@gmail.com',
    phone: '+92 331 4558660',
    whatsapp: '923314558660',   // digits only, for wa.me
    linkedin: '',               // full URL, leave '' to hide
    playStore: ''               // developer page URL, leave '' to hide
};

// Hero showcase: landscape screenshots only, they fill the backdrop
const SHOWCASE = [
    'Ragdoll Bike Fall Crash Smash',
    'Real Speed GT Car Rival Race',
    'Wild Horse Family Riding Game',
    'Bus Simulator: Real Bus Games',
    'ASMR Artist!',
    'Downhill Snowboard Racing'
];
const SLIDE_MS = 6500;

const FILTERS = [['all', 'All'], ['racing', 'Racing & Sports'], ['simulation', 'Simulation'], ['puzzle', 'Puzzle & Casual'], ['action', 'Action']];

// [label, title, what it means in practice]
const SKILLS = [
    ['Core', 'Gameplay programming', 'Controls, cameras, game feel and core loops in clean, maintainable C#.'],
    ['Physics', 'Vehicles & ragdolls', 'WheelCollider driving, crash and ragdoll physics that feel right on a phone.'],
    ['Systems', 'Puzzle & level design', 'Sort, jigsaw and match mechanics with data-driven levels and difficulty curves.'],
    ['Revenue', 'Monetization', 'AdMob, AppLovin MAX, Unity Ads and IAP placed without hurting retention.'],
    ['Data', 'Analytics & live ops', 'Firebase and GameAnalytics events, remote config and A/B tests.'],
    ['Perf', 'Optimization', 'Profiling, batching, memory and build size so games run on low-end Android.']
];

const STACK = ['Unity 6', 'C#', 'URP', 'Cinemachine', 'DOTween', 'Addressables', 'Firebase', 'AdMob', 'AppLovin MAX', 'Unity IAP', 'GameAnalytics', 'Android / AAB', 'iOS / Xcode', 'Git'];

const PAGE = 12;

// ===== Helpers =====
const $ = (sel, root = document) => root.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = id => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const installs = dl => {
    const m = /^([\d.]+)([KM])?\+$/.exec(dl || '');
    return m ? parseFloat(m[1]) * (m[2] === 'M' ? 1e6 : m[2] === 'K' ? 1e3 : 1) : 0;
};
const fmt = n => n >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);
const byTitle = t => GAMES.find(g => g.t === t);

function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ===== Hero showcase =====
const slides = SHOWCASE.map(byTitle).filter(Boolean);
const heroBg = $('#heroBg'), rail = $('#rail'), now = $('#now'), hero = $('#top');
let current = -1;

heroBg.innerHTML = slides.map((g, i) => `<img src="${g.shots[0]}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`).join('');
rail.innerHTML = slides.map((g, i) => `
    <button class="rail-item" type="button" role="tab" data-i="${i}" aria-label="${esc(g.t)}">
        <img src="${g.shots[0]}" alt="" loading="lazy" decoding="async">
        <span class="rail-title">${esc(g.t)}</span>
        <span class="rail-bar"><i></i></span>
    </button>`).join('');
const bgImgs = [...heroBg.children], railItems = [...rail.children];

function show(i) {
    if (i === current) return;
    current = (i + slides.length) % slides.length;
    const g = slides[current];
    bgImgs.forEach((img, k) => img.classList.toggle('on', k === current));
    railItems.forEach((b, k) => {
        b.classList.toggle('on', k === current);
        b.setAttribute('aria-selected', k === current);
    });
    now.innerHTML = `
        <p class="now-label">Now showing</p>
        <div class="now-head">
            <img src="${g.icon}" alt="" width="64" height="64">
            <div>
                <p class="now-genre">${esc(g.g)}</p>
                <h2 class="now-title">${esc(g.t)}</h2>
            </div>
        </div>
        <div class="now-meta">
            ${g.dl ? `<span><b>${g.dl}</b> installs</span>` : ''}
            <span><b>${g.ios ? 'Android + iOS' : 'Android'}</b></span>
        </div>
        <div class="now-actions">
            <button class="btn btn-primary btn-sm" type="button" data-t="${esc(g.t)}">View game</button>
            <a class="btn btn-outline btn-sm" href="${g.play}" target="_blank" rel="noopener">${icon('play')} Play Store</a>
        </div>`;
    now.classList.remove('swap');
    void now.offsetWidth; // restart the swap animation
    now.classList.add('swap');
}

rail.addEventListener('click', e => {
    const b = e.target.closest('.rail-item');
    if (b) show(+b.dataset.i);
});
// The active tile's progress bar is a CSS animation; when it ends, advance.
rail.addEventListener('animationend', e => {
    if (e.target.parentElement?.parentElement?.classList.contains('on')) show(current + 1);
});
document.documentElement.style.setProperty('--slide', SLIDE_MS + 'ms');
if (reduceMotion) hero.classList.add('paused');
if ('IntersectionObserver' in window && !reduceMotion) {
    new IntersectionObserver(([en]) => hero.classList.toggle('paused', !en.isIntersecting)).observe(hero);
}
show(0);

// ===== Stats (computed from data so they stay true) =====
const total = GAMES.reduce((s, g) => s + installs(g.dl), 0);
$('#stats').innerHTML = [
    [GAMES.length, '', 'Games shipped'],
    [+(total / 1e6).toFixed(1), 'M+', 'Total installs'],
    [GAMES.filter(g => installs(g.dl) >= 1e6).length, '', 'Titles past 1M'],
    [new Date().getFullYear() - 2021, '+', 'Years in games']
].map(([v, suf, k]) => `<div class="stat reveal"><b data-to="${v}" data-suf="${suf}">${v}${suf}</b><span>${k}</span></div>`).join('');

// ===== Skills =====
$('#skillGrid').innerHTML = SKILLS.map(([tag, t, d], i) => `
    <article class="skill reveal" style="--d:${(i % 3) * 70}ms">
        <span class="skill-tag">${tag}</span>
        <h3>${t}</h3>
        <p>${d}</p>
    </article>`).join('');
$('#stack').innerHTML = STACK.map(t => `<span>${t}</span>`).join('');

// ===== Library: filter, search, paging =====
let filter = 'all', query = '', shown = PAGE;
const grid = $('#libGrid'), moreBtn = $('#moreBtn'), empty = $('#libEmpty');
const sorted = [...GAMES].sort((a, b) => installs(b.dl) - installs(a.dl));

$('#filters').innerHTML = FILTERS.map(([k, label]) => {
    const n = k === 'all' ? GAMES.length : GAMES.filter(g => g.c === k).length;
    return `<button type="button" role="tab" data-f="${k}" aria-selected="${k === 'all'}">${label}<small>${n}</small></button>`;
}).join('');

const card = g => `
    <button class="game" type="button" data-t="${esc(g.t)}">
        <span class="game-shot">
            <img src="${g.shots[0]}" alt="" loading="lazy" decoding="async">
            ${g.dl ? `<span class="game-dl">${g.dl}</span>` : '<span class="game-dl new">New</span>'}
        </span>
        <span class="game-info">
            <img class="game-icon" src="${g.icon}" alt="" width="44" height="44" loading="lazy" decoding="async">
            <span class="game-text">
                <span class="game-title">${esc(g.t)}</span>
                <span class="game-meta">${esc(g.g)}${g.ios ? ' · iOS' : ''}</span>
            </span>
        </span>
    </button>`;

function renderLibrary() {
    const q = query.trim().toLowerCase();
    const list = sorted.filter(g => (filter === 'all' || g.c === filter) && (!q || g.t.toLowerCase().includes(q)));
    grid.innerHTML = list.slice(0, shown).map(card).join('');
    empty.hidden = list.length > 0;
    moreBtn.parentElement.hidden = list.length <= shown;
    moreBtn.textContent = `Load more (${list.length - shown})`;
}

$('#filters').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    filter = b.dataset.f;
    shown = PAGE;
    $('#filters').querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b));
    renderLibrary();
});
$('#search').addEventListener('input', e => { query = e.target.value; shown = PAGE; renderLibrary(); });
moreBtn.addEventListener('click', () => { shown += PAGE; renderLibrary(); });
renderLibrary();

// ===== Game modal =====
const modal = $('#modal');
function openGame(t) {
    const g = byTitle(t);
    if (!g) return;
    $('#mIcon').src = g.icon;
    $('#mTitle').textContent = g.t;
    $('#mGenre').textContent = g.g + (g.dl ? ` · ${g.dl} installs` : '');
    $('#mShots').innerHTML = g.shots.map(s => `<img src="${s}" alt="${esc(g.t)} screenshot" decoding="async">`).join('');
    $('#mActions').innerHTML =
        `<a class="btn btn-primary" href="${g.play}" target="_blank" rel="noopener">${icon('play')} Google Play</a>` +
        (g.ios ? `<a class="btn btn-outline" href="${g.ios}" target="_blank" rel="noopener">${icon('apple')} App Store</a>` : '');
    if (typeof modal.showModal === 'function') modal.showModal();
    else window.open(g.play, '_blank', 'noopener'); // shortcut: very old browsers without <dialog> just open the store page
}
document.addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (b) openGame(b.dataset.t);
});
$('#mClose').addEventListener('click', () => modal.close());
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); }); // backdrop click

// ===== Contact =====
const actions = [];
if (CONTACT.email) actions.push(`<button class="contact-item" id="copyMail" type="button"><span class="ci-icon">${icon('mail')}</span><span><small>Email · tap to copy</small><b>${esc(CONTACT.email)}</b></span>${icon('copy')}</button>`);
if (CONTACT.phone) actions.push(`<a class="contact-item" href="tel:${CONTACT.phone.replace(/\s/g, '')}"><span class="ci-icon">${icon('phone')}</span><span><small>Phone</small><b>${esc(CONTACT.phone)}</b></span>${icon('arrow')}</a>`);
if (CONTACT.whatsapp) actions.push(`<a class="contact-item" href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener"><span class="ci-icon">${icon('wa')}</span><span><small>WhatsApp</small><b>Message me</b></span>${icon('arrow')}</a>`);
if (CONTACT.linkedin) actions.push(`<a class="contact-item" href="${CONTACT.linkedin}" target="_blank" rel="noopener"><span class="ci-icon">in</span><span><small>LinkedIn</small><b>View profile</b></span>${icon('arrow')}</a>`);
if (CONTACT.playStore) actions.push(`<a class="contact-item" href="${CONTACT.playStore}" target="_blank" rel="noopener"><span class="ci-icon">${icon('play')}</span><span><small>Google Play</small><b>Developer page</b></span>${icon('arrow')}</a>`);
$('#contactActions').innerHTML = actions.join('');
$('#copyMail')?.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(CONTACT.email);
        toast('Email copied');
    } catch {
        location.href = 'mailto:' + CONTACT.email;
    }
});
$('#year').textContent = new Date().getFullYear();

// ===== Nav: scrolled state, mobile menu, active link =====
const nav = $('#nav'), menuBtn = $('#menuBtn');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$('#navLinks').addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

const links = [...document.querySelectorAll('.nav-links a:not(.nav-cta)')];
if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['play', 'games', 'skills', 'journey', 'contact'].forEach(id => spy.observe(document.getElementById(id)));
}

// ===== Reveal on scroll + stat count-up =====
function countUp(el) {
    const to = parseFloat(el.dataset.to), suf = el.dataset.suf, dec = to % 1 ? 1 : 0, t0 = performance.now();
    const step = t => {
        const p = Math.min((t - t0) / 1200, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
const reveals = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
} else {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        const b = en.target.querySelector('[data-to]');
        if (b) countUp(b);
        io.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
}

// ===== Hero name: letter spans, decode-in, cursor-driven variable font =====
const heroName = $('#heroName');
const chars = [];
heroName.querySelectorAll('.line').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach(c => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.dataset.c = c;
        s.style.setProperty('--i', chars.length);
        s.setAttribute('aria-hidden', 'true');
        line.appendChild(s);
        chars.push(s);
    });
});
heroName.classList.add('auto'); // idle light sweep + breathing until the cursor takes over

if (!reduceMotion) {
    const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ#%&@$0123456789';
    chars.forEach((s, i) => {
        let n = 0;
        const end = 8 + i * 3;
        s.classList.add('scr');
        const tick = () => {
            if (++n >= end) { s.textContent = s.dataset.c; s.classList.remove('scr'); return; }
            s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            setTimeout(tick, 45);
        };
        setTimeout(tick, 200);
    });
}

if (finePointer && !reduceMotion) {
    let hraf = 0, hev;
    hero.addEventListener('pointermove', e => {
        hev = e;
        if (hraf) return;
        hraf = requestAnimationFrame(() => {
            hraf = 0;
            heroName.classList.remove('auto');
            const r = heroName.getBoundingClientRect();
            heroName.style.setProperty('--hx', ((hev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
            heroName.style.setProperty('--hy', ((hev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
            const reach = r.height * 0.9;
            for (const s of chars) {
                const b = s.getBoundingClientRect();
                const d = Math.hypot(hev.clientX - (b.left + b.width / 2), hev.clientY - (b.top + b.height / 2));
                const k = Math.max(0, 1 - d / reach); // 1 under the cursor, 0 far away
                s.style.setProperty('--w', Math.round(620 + 280 * k));
                s.style.setProperty('--s', Math.round(80 + 60 * k));
            }
        });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
        chars.forEach(s => { s.style.removeProperty('--w'); s.style.removeProperty('--s'); });
        heroName.style.removeProperty('--hx');
        heroName.style.removeProperty('--hy');
        heroName.classList.add('auto');
    });
}

// ===== Headings: split words for the masked rise =====
document.querySelectorAll('.sec-title, .contact-title').forEach(h => {
    h.innerHTML = h.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--wi:${i}"><span>${esc(w)}</span></span>`).join(' ');
});

// ===== Marquee: pause off screen =====
if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => $('#marquee').classList.toggle('paused', !en.isIntersecting)).observe($('#marquee'));
}

// ===== Cursor ring + magnetic buttons (desktop only) =====
if (finePointer && !reduceMotion) {
    document.body.classList.add('has-cursor');
    const cur = $('#cursor'), label = cur.firstElementChild;
    let x = -100, y = -100, cx = -100, cy = -100, moving = false;
    const follow = () => {
        cx += (x - cx) * 0.22;
        cy += (y - cy) * 0.22;
        cur.style.setProperty('--x', cx.toFixed(1) + 'px');
        cur.style.setProperty('--y', cy.toFixed(1) + 'px');
        moving = Math.abs(x - cx) + Math.abs(y - cy) > 0.3;
        if (moving) requestAnimationFrame(follow);
    };
    document.addEventListener('pointermove', e => {
        x = e.clientX; y = e.clientY;
        if (!moving) { moving = true; requestAnimationFrame(follow); }
        const t = e.target.closest?.('[data-t], canvas, a, button, input, .rail-item');
        const big = t && (t.matches('[data-t].game, canvas') ? (t.tagName === 'CANVAS' ? 'Play' : 'View') : '');
        cur.classList.toggle('big', !!big);
        cur.classList.toggle('hover', !!t && !big);
        if (big) label.textContent = big;
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('hide'));
    document.addEventListener('pointerenter', () => cur.classList.remove('hide'));

    document.querySelectorAll('.btn-primary, .nav-cta').forEach(b => {
        b.addEventListener('pointermove', e => {
            const r = b.getBoundingClientRect();
            b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
        });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
}

// ===== Pointer glow on cards (desktop only; one rAF per move) =====
if (finePointer && !reduceMotion) {
    let raf = 0, last;
    document.addEventListener('pointermove', e => {
        last = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            const el = last.target.closest?.('.game, .skill, .contact-item');
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', last.clientX - r.left + 'px');
            el.style.setProperty('--my', last.clientY - r.top + 'px');
        });
    }, { passive: true });
}
