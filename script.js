// Photos come from photos.json (built by tools/build_images.py, tagged by hand).
// Pages are hash routes so the site stays a plain static folder:
//   #/                      feed of every photo
//   #/archive               years
//   #/archive/2025          places photographed that year
//   #/archive/2025/madrid   photos from that place and year

const IMG_DIR = 'images/web/';
// Browsers without AVIF (Safari before iOS 16 / macOS 13) get the WebP copies.
let EXT = 'avif';
const AVIF_PROBE = 'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANRtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAImlsb2MAAAAAREAAAQABAAAAAAD4AAEAAAAAAAAAEgAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAVGlwcnAAAAA2aXBjbwAAAAxhdjFDgUB8AAAAABRpc3BlAAAAAAAAAAEAAAABAAAADnBpeGkAAAAAAQwAAAAWaXBtYQAAAAAAAAABAAEDgQIDAAAAGm1kYXQSAAoFWAAGOoAyBxgAOOEAAWA=';
const UNDATED = 'Undated';
const UNPLACED = 'Elsewhere';

const view = document.getElementById('view');
let photos = [];

// ---------- helpers ----------

const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const yearOf = p => p.year ? String(p.year) : UNDATED;
const placeOf = p => p.place || UNPLACED;
const isPortrait = p => p.h > p.w;
const url = (p, size) => `${IMG_DIR}${p.file}-${size}.${EXT}`;

function groupBy(list, keyFn) {
    const groups = new Map();
    for (const item of list) {
        const key = keyFn(item);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }
    return groups;
}

function metaLine(p) {
    return [p.place, p.year].filter(Boolean).join(', ');
}

function imgTag(p, sizes, eager = false) {
    return `<img src="${url(p, 800)}"
        srcset="${url(p, 800)} 800w, ${url(p, 1600)} 1600w"
        sizes="${sizes}" width="${p.w}" height="${p.h}"
        alt="${esc(p.caption || metaLine(p) || 'Photograph')}"
        loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
}

function photoFigure(p, index, { sizes, style = '', cls = '', eager = false, meta = true }) {
    const line = metaLine(p);
    return `<figure class="photo-wrap ${cls}" style="${style}">
        <div class="photo" data-index="${index}">${imgTag(p, sizes, eager)}</div>
        ${meta && line ? `<figcaption class="photo-meta">${esc(line)}</figcaption>` : ''}
    </figure>`;
}

// Fade images in once loaded, including ones already in the cache.
function revealImages(root) {
    root.querySelectorAll('.photo img').forEach(img => {
        if (img.complete && img.naturalWidth) img.classList.add('loaded');
        else img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    });
}

// ---------- feed: editorial placement on a 12-column grid ----------

const SINGLE_LANDSCAPE = ['1 / -1', '3 / span 8', '1 / span 9', '4 / span 9'];
const SINGLE_PORTRAIT = ['4 / span 5', '7 / span 5', '2 / span 5'];
const PAIRS = {
    ll: [['1 / span 6', '8 / span 5'], ['2 / span 5', '7 / span 6']],
    lp: [['1 / span 7', '9 / span 4'], ['2 / span 6', '9 / span 4']],
    pl: [['1 / span 4', '6 / span 7'], ['2 / span 4', '7 / span 6']],
    pp: [['2 / span 4', '8 / span 4'], ['3 / span 4', '7 / span 4']],
};

function feedLayout(list) {
    const placed = [];
    let i = 0, row = 1, turn = 0;
    while (i < list.length) {
        // Alternate single, pair, single, pair... with occasional back-to-back singles.
        const pair = turn % 2 === 1 && i + 1 < list.length;
        if (pair) {
            const [a, b] = [list[i], list[i + 1]];
            const key = (isPortrait(a) ? 'p' : 'l') + (isPortrait(b) ? 'p' : 'l');
            const cols = PAIRS[key][Math.floor(turn / 2) % PAIRS[key].length];
            placed.push({ p: a, col: cols[0], row, align: 'start' });
            placed.push({ p: b, col: cols[1], row, align: turn % 4 === 1 ? 'end' : 'start' });
            i += 2;
        } else {
            const p = list[i];
            const opts = isPortrait(p) ? SINGLE_PORTRAIT : SINGLE_LANDSCAPE;
            placed.push({ p, col: opts[Math.floor(turn / 2) % opts.length], row, align: 'start' });
            i += 1;
        }
        row += 1;
        turn += 1;
    }
    return placed;
}

// ---------- highlights: the star photos, shown full screen on arrival ----------

const featured = () => photos.filter(p => 'featured' in p).sort((a, b) => a.featured - b.featured);

function heroMarkup(list) {
    if (!list.length) return '';
    const total = String(list.length).padStart(2, '0');
    const slides = list.map((p, n) => `
        <figure class="hero-slide${n === 0 ? ' active' : ''}" data-hero="${n}"
            role="group" aria-roledescription="slide" aria-label="${n + 1} of ${list.length}"${n ? ' aria-hidden="true"' : ''}>
            <img src="${url(p, 1600)}" srcset="${url(p, 800)} 800w, ${url(p, 1600)} 1600w"
                sizes="(max-width: 720px) 100vw, 75vw" alt="${esc(p.caption || metaLine(p) || 'Photograph')}"
                width="${p.w}" height="${p.h}" decoding="async" ${n === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
        </figure>`).join('');
    const ticks = list.map((_, n) =>
        `<button class="hero-tick${n === 0 ? ' active' : ''}" data-go="${n}" aria-label="Show photo ${n + 1}"></button>`).join('');
    return `<section class="hero" aria-roledescription="carousel" aria-label="Selected photographs">
        <div class="hero-stage">${slides}</div>
        <div class="hero-bar">
            <span class="hero-left">
                <span class="hero-label">Selected</span>
                <button class="hero-btn hero-toggle" aria-label="Pause slideshow">Pause</button>
            </span>
            <span class="hero-meta" aria-live="off"><span class="hero-num">01</span> / ${total}
                · <span class="hero-place">${esc(metaLine(list[0]))}</span></span>
            <span class="hero-right">
                <button class="hero-btn hero-arrow" data-step="-1" aria-label="Previous photo">←</button>
                <button class="hero-btn hero-arrow" data-step="1" aria-label="Next photo">→</button>
            </span>
            <span class="hero-ticks">${ticks}</span>
        </div>
    </section>`;
}

// Autoplay is driven by the progress bars: when the current bar's CSS fill
// animation (3s, see --hero-delay in style.css) ends, the next photo shows.
// Pausing pauses the animation, so the bar resumes where it stopped.
let heroStep = null;   // moves the highlights from the keyboard while they are on screen
let heroSync = null;   // re-evaluates autoplay, e.g. when the tab is hidden
let heroHeld = false;  // true while the full-screen viewer is open

function startHero(list) {
    heroStep = heroSync = null;
    const hero = view.querySelector('.hero');
    if (!hero) return;
    const slides = hero.querySelectorAll('.hero-slide');
    const ticks = hero.querySelectorAll('.hero-tick');
    const toggle = hero.querySelector('.hero-toggle');
    const meta = hero.querySelector('.hero-meta');
    let at = 0;
    let paused = false;

    const go = n => {
        at = (n + list.length) % list.length;
        slides.forEach((s, i) => {
            s.classList.toggle('active', i === at);
            s.setAttribute('aria-hidden', i === at ? 'false' : 'true');
        });
        ticks.forEach((t, i) => {
            t.classList.remove('active');
            t.classList.toggle('done', i < at);
        });
        void ticks[at].offsetWidth;   // restart the fill even if this bar was already active
        ticks[at].classList.add('active');
        hero.querySelector('.hero-num').textContent = String(at + 1).padStart(2, '0');
        hero.querySelector('.hero-place').textContent = metaLine(list[at]);
        // Load the next one ahead of time so the crossfade never shows a blank.
        slides[(at + 1) % list.length].querySelector('img').loading = 'eager';
    };
    const sync = () => {
        const running = !paused && !heroHeld && !document.hidden;
        hero.classList.toggle('paused', !running);
        toggle.textContent = paused ? 'Play' : 'Pause';
        toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
        // Announce photo changes to screen readers only when the visitor is driving.
        meta.setAttribute('aria-live', paused ? 'polite' : 'off');
    };
    const step = d => go(at + d);
    heroStep = step;

    hero.querySelector('.hero-ticks').addEventListener('animationend', e => {
        if (e.target === ticks[at]) go(at + 1);
    });

    hero.addEventListener('click', e => {
        const tick = e.target.closest('[data-go]');
        const arrow = e.target.closest('[data-step]');
        if (tick) go(Number(tick.dataset.go));
        else if (arrow) step(Number(arrow.dataset.step));
        else if (e.target.closest('.hero-toggle')) { paused = !paused; sync(); }
        else if (e.target.closest('.hero-slide')) openLightbox(list, at);
    });

    let touchX = null;
    const stage = hero.querySelector('.hero-stage');
    stage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 40) {
            e.preventDefault();   // a swipe shouldn't also open the viewer
            step(dx < 0 ? 1 : -1);
        }
    });

    heroSync = sync;
    sync();
}

// Newest year first. Within a year, each place's photos are spread evenly
// through the year's run so one location never arrives as a block.
function feedOrder(list) {
    const ordered = [];
    for (const year of sortYears(groupBy(list, yearOf).keys())) {
        const inYear = list.filter(p => yearOf(p) === year);
        const slots = [];
        for (const [place, group] of groupBy(inYear, placeOf)) {
            group.forEach((p, i) => slots.push({ p, pos: (i + 0.5) / group.length, place }));
        }
        slots.sort((a, b) => a.pos - b.pos || a.place.localeCompare(b.place));
        ordered.push(...slots.map(s => s.p));
    }
    return ordered;
}

function renderFeed() {
    const stars = featured();
    const placed = feedLayout(feedOrder(photos));
    const html = placed.map(({ p, col, row, align }, n) => {
        const portrait = isPortrait(p);
        const span = parseInt(col.split('span ')[1], 10) || 12;
        const sizes = `(max-width: 720px) 100vw, ${Math.round((span / 12) * 100)}vw`;
        return photoFigure(p, n, {
            sizes,
            style: `grid-column:${col};grid-row:${row};align-self:${align}`,
            cls: (portrait ? 'portrait' : '') + (n % 2 ? ' right' : ''),
            eager: !stars.length && n < 2,
        });
    }).join('');

    view.innerHTML = `${heroMarkup(stars)}
        <section class="page">
            <header class="feed-head">
                <span class="eyebrow">All photographs</span>
                <span class="eyebrow">${photos.length}</span>
            </header>
            <div class="feed">${html}</div>
        </section>`;
    startHero(stars);
    return placed.map(x => x.p);
}

// ---------- archive ----------

function indexRow(href, name, countText, cover) {
    return `<li><a href="${href}">
        <span class="index-name">${esc(name)}</span>
        <span class="index-count">${countText}</span>
        <img class="index-cover" src="${url(cover, 800)}" alt="" loading="lazy" decoding="async">
    </a></li>`;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function sortYears(keys) {
    return [...keys].sort((a, b) =>
        a === UNDATED ? 1 : b === UNDATED ? -1 : Number(b) - Number(a));
}

function sortPlaces(groups) {
    // Most-photographed places first, "Elsewhere" last.
    return [...groups.keys()].sort((a, b) =>
        a === UNPLACED ? 1 : b === UNPLACED ? -1 : groups.get(b).length - groups.get(a).length);
}

function renderYears() {
    const years = groupBy(photos, yearOf);
    const rows = sortYears(years.keys()).map(y => {
        const list = years.get(y);
        const places = groupBy(list, placeOf).size;
        return indexRow(`#/archive/${slug(y)}`, y,
            `${plural(list.length, 'photo')} · ${plural(places, 'place')}`, list[0]);
    }).join('');

    view.innerHTML = `<section class="page">
        <header class="page-head">
            <p class="eyebrow">Archive</p>
            <h1 class="page-title">By year</h1>
        </header>
        <ul class="index-list">${rows}</ul>
    </section>`;
    return [];
}

function findYear(yearSlug) {
    return sortYears(groupBy(photos, yearOf).keys()).find(y => slug(y) === yearSlug);
}

function renderPlaces(yearSlug) {
    const year = findYear(yearSlug);
    if (!year) return renderNotFound();
    const places = groupBy(photos.filter(p => yearOf(p) === year), placeOf);
    const rows = sortPlaces(places).map(place =>
        indexRow(`#/archive/${slug(year)}/${slug(place)}`, place,
            plural(places.get(place).length, 'photo'), places.get(place)[0])
    ).join('');

    view.innerHTML = `<section class="page">
        <header class="page-head">
            <p class="eyebrow"><a href="#/archive">Archive</a> / ${esc(year)}</p>
            <h1 class="page-title">${esc(year)}</h1>
        </header>
        <ul class="index-list">${rows}</ul>
    </section>`;
    return [];
}

function renderPlace(yearSlug, placeSlug) {
    const year = findYear(yearSlug);
    const list = photos.filter(p => yearOf(p) === year && slug(placeOf(p)) === placeSlug);
    if (!year || !list.length) return renderNotFound();
    const place = placeOf(list[0]);

    const figures = list.map((p, n) => photoFigure(p, n, {
        sizes: '(max-width: 720px) 100vw, 33vw', eager: n < 3, meta: false,
    })).join('');

    view.innerHTML = `<section class="page">
        <header class="page-head">
            <p class="eyebrow"><a href="#/archive">Archive</a> / <a href="#/archive/${slug(year)}">${esc(year)}</a> / ${esc(place)}</p>
            <h1 class="page-title">${esc(place)} <em>${esc(year)}</em></h1>
        </header>
        <div class="grid">${figures}</div>
    </section>`;
    return list;
}

function renderNotFound() {
    view.innerHTML = `<section class="page">
        <header class="page-head">
            <p class="eyebrow">Not found</p>
            <h1 class="page-title">Nothing here</h1>
        </header>
        <p class="empty"><a href="#/">Back to the feed</a></p>
    </section>`;
    return [];
}

// ---------- router ----------

let current = [];   // photos on the current page, in order, for the lightbox

function route() {
    const hash = location.hash || '#/';
    if (!hash.startsWith('#/')) return;   // in-page anchors like #contact

    const parts = hash.slice(2).split('/').filter(Boolean);
    closeLightbox();
    heroStep = heroSync = null;

    if (parts[0] === 'archive') {
        if (parts.length === 1) current = renderYears();
        else if (parts.length === 2) current = renderPlaces(parts[1]);
        else current = renderPlace(parts[1], parts[2]);
    } else if (parts.length === 0) {
        current = renderFeed();
    } else {
        current = renderNotFound();
    }

    document.querySelectorAll('[data-nav]').forEach(a =>
        a.classList.toggle('active', a.dataset.nav === (parts[0] === 'archive' ? 'archive' : 'feed')));
    revealImages(view);
    window.scrollTo(0, 0);
}

// ---------- lightbox ----------

const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('.lb-img');
const lbCaption = lb.querySelector('.lb-caption');
const lbCount = lb.querySelector('.lb-count');
let lbIndex = 0;
let lbList = [];

function showPhoto(index) {
    lbIndex = (index + lbList.length) % lbList.length;
    const p = lbList[lbIndex];
    lbImg.src = url(p, 1600);
    lbImg.alt = p.caption || metaLine(p) || 'Photograph';
    lbCaption.textContent = [p.caption, metaLine(p)].filter(Boolean).join(' — ');
    lbCount.textContent = `${lbIndex + 1} / ${lbList.length}`;
    // Warm the cache for the neighbours.
    [lbIndex + 1, lbIndex - 1].forEach(i => {
        const n = lbList[(i + lbList.length) % lbList.length];
        new Image().src = url(n, 1600);
    });
}

function openLightbox(list, index) {
    lbList = list;
    heroHeld = true;
    if (heroSync) heroSync();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    showPhoto(index);
}

function closeLightbox() {
    if (lb.hidden) return;
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
    heroHeld = false;
    if (heroSync) heroSync();
}

view.addEventListener('click', e => {
    const photo = e.target.closest('.photo');
    if (photo && current.length) openLightbox(current, Number(photo.dataset.index));
});

lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
lb.querySelector('.lb-prev').addEventListener('click', () => showPhoto(lbIndex - 1));
lb.querySelector('.lb-next').addEventListener('click', () => showPhoto(lbIndex + 1));
lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-figure')) closeLightbox(); });

document.addEventListener('visibilitychange', () => heroSync && heroSync());

document.addEventListener('keydown', e => {
    if (lb.hidden) {
        // Arrow keys move the highlights while they are on screen.
        const hero = view.querySelector('.hero');
        if (heroStep && hero && hero.getBoundingClientRect().bottom > 80 &&
            (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
            heroStep(e.key === 'ArrowRight' ? 1 : -1);
        }
        return;
    }
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showPhoto(lbIndex + 1);
    if (e.key === 'ArrowLeft') showPhoto(lbIndex - 1);
});

let touchX = null;
lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
    else if (e.target === lbImg) closeLightbox();
    touchX = null;
});

// ---------- start ----------

document.getElementById('year').textContent = new Date().getFullYear();

fetch('photos.json')
    .then(r => r.json())
    .then(async data => {
        photos = data.photos;
        // onload/onerror rather than decode(): decode() can stall in background tabs.
        EXT = await new Promise(resolve => {
            const probe = new Image();
            probe.onload = () => resolve(probe.width > 0 ? 'avif' : 'webp');
            probe.onerror = () => resolve('webp');
            setTimeout(() => resolve('avif'), 1000);
            probe.src = AVIF_PROBE;
        });
        const me = photos.find(p => p.portrait);
        if (me) {
            const img = document.getElementById('portrait');
            img.src = url(me, 800);
            img.hidden = false;
        }
        window.addEventListener('hashchange', route);
        route();
    })
    .catch(() => {
        view.innerHTML = '<section class="page"><p class="empty">Photos failed to load. Try refreshing.</p></section>';
    });
