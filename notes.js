(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(0.22, 0.9, 0.2, 1)';
  const NS = 'http://www.w3.org/2000/svg';

  const pad = (n) => String(n).padStart(2, '0');
  const hash = (s) => {
    let h = 2166136261;
    for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  };
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const between = (r, a, b) => a + (b - a) * r();
  const shuffled = (list, r) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Cropped diagrams (assets/notes/<set>/snap/NN.jpg, in order) tacked onto the page they came from.
  const SNAPS = {
    'assets/notes/pintos-priority': [
      { page: 2, cap: 'Lock handoff' },
      { page: 3, cap: 'The donation check' },
      { page: 6, cap: 'Donation chains' },
    ],
    'assets/notes/pintos-vm': [
      { page: 2, cap: 'Two-level paging' },
      { page: 2, cap: '4 GB, split' },
      { page: 4, cap: 'Page-fault flow' },
    ],
    'assets/notes/raft-election': [
      { page: 4, cap: 'Threads & RPCs' },
      { page: 5, cap: 'Leader / follower / candidate' },
      { page: 5, cap: 'Five nodes' },
    ],
    'assets/notes/raft-port': [
      { page: 1, cap: 'The port' },
      { page: 1, cap: 'State changes' },
      { page: 1, cap: 'A log write' },
    ],
    'assets/notes/airbus': [
      { page: 1, cap: 'Airbus x Kaggle' },
      { page: 2, cap: 'Tiling idea' },
      { page: 3, cap: 'Classifier, then U-Net' },
    ],
    'assets/notes/seminar-talk': [
      { page: 2, cap: 'A vector per node' },
      { page: 4, cap: 'DeepWalk, step by step' },
    ],
    'assets/notes/pr-whiteboards': [
      { page: 1, cap: 'SGD update' },
      { page: 4, cap: 'A tiny neural net' },
    ],
  };

  const SLOTS = [['46%', '56%'], ['-14%', '60%'], ['52%', '24%'], ['-12%', '26%']];

  // Sets whose pages are white or cream, so their polaroids need a darker frame to stand out.
  const LIGHT_SETS = new Set([
    'assets/notes/raft-election',
    'assets/notes/raft-port',
    'assets/notes/airbus',
    'assets/notes/seminar-talk',
    'assets/notes/pr-whiteboards',
  ]);

  // Transform that makes the `to` box look like the `from` box (FLIP start frame).
  const flipFrom = (from, to) => {
    const s = from.width / to.width;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${s})`;
  };

  const board = (() => {
    const dlg = document.createElement('dialog');
    dlg.className = 'board-dlg';
    dlg.setAttribute('aria-label', 'Notes board');
    dlg.innerHTML =
      '<div class="board">' +
        '<div class="board-surface"><div class="board-scroll">' +
          '<p class="sticky"><span class="sticky-title"></span><span class="sticky-count"></span></p>' +
          '<div class="cards"></div>' +
        '</div></div>' +
        '<button type="button" class="board-close" aria-label="Close board">&times;</button>' +
        '<div class="viewer" hidden>' +
          '<div class="viewer-scrim"></div>' +
          '<div class="viewer-stage"><figure class="viewer-page"><img alt=""><span class="viewer-pin"></span></figure></div>' +
          '<p class="viewer-cap"></p>' +
          '<button type="button" class="lb-btn v-nav v-prev" aria-label="Previous page">&lsaquo;</button>' +
          '<button type="button" class="lb-btn v-nav v-next" aria-label="Next page">&rsaquo;</button>' +
          '<button type="button" class="lb-btn v-close" aria-label="Back to the board">&times;</button>' +
          '<button type="button" class="v-page" hidden>Open the full page</button>' +
        '</div>' +
      '</div>';
    document.body.append(dlg);

    const $ = (s) => dlg.querySelector(s);
    const boardEl = $('.board');
    const scroll = $('.board-scroll');
    const cardsEl = $('.cards');
    const stickyTitle = $('.sticky-title');
    const stickyCount = $('.sticky-count');
    const viewer = $('.viewer');
    const scrim = $('.viewer-scrim');
    const vfig = $('.viewer-page');
    const vimg = vfig.querySelector('img');
    const vcap = $('.viewer-cap');

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'strings');
    svg.setAttribute('aria-hidden', 'true');

    let dir = '';
    let count = 0;
    let title = '';
    let source = null;
    let cards = [];
    let polaroids = [];
    let vIndex = 0;
    let sIndex = 0;
    let mode = 'page';
    let closing = false;
    let timers = [];

    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    const thumb = (i) => `${dir}/t/${pad(i + 1)}.jpg`;
    const full = (i) => `${dir}/${pad(i + 1)}.jpg`;
    const cssNum = (el, name) => parseFloat(el.style.getPropertyValue(name)) || 0;

    const build = () => {
      cardsEl.replaceChildren(svg);
      svg.replaceChildren();
      cards = new Array(count);
      polaroids = [];
      const r = rng(hash(`${dir}/board`));
      // Pages land in a random order so the thread web has no obvious starting point.
      shuffled([...Array(count).keys()], r).forEach((i, slot) => {
        const n = i + 1;
        const card = document.createElement('div');
        card.className = `card${r() < 0.35 ? ' taped' : ''}`;
        card.style.setProperty('--n', slot);
        card.style.setProperty('--r', `${between(r, -5, 5).toFixed(2)}deg`);
        card.style.setProperty('--jx', `${between(r, -10, 10).toFixed(1)}px`);
        card.style.setProperty('--jy', `${between(r, -8, 8).toFixed(1)}px`);
        const img = new Image();
        img.src = thumb(i);
        img.alt = '';
        img.decoding = 'async';
        const num = document.createElement('span');
        num.className = 'card-num';
        num.textContent = n;
        const hit = document.createElement('button');
        hit.type = 'button';
        hit.className = 'card-hit';
        hit.setAttribute('aria-label', `${title}, page ${n} of ${count}`);
        hit.append(img, num);
        hit.addEventListener('click', () => openViewer('page', i));
        card.append(hit);
        cardsEl.append(card);
        cards[i] = card;
      });

      const onPage = {};
      (SNAPS[dir] || []).forEach((snap, k) => {
        const card = cards[snap.page - 1];
        if (!card) return;
        const used = (onPage[snap.page] = (onPage[snap.page] || 0) + 1) - 1;
        const [left, top] = SLOTS[(Math.floor(r() * 4) + used * 2) % 4];
        const tilt = between(r, 4, 10) * (r() < 0.5 ? -1 : 1);
        const idx = polaroids.length;
        const pol = document.createElement('button');
        pol.type = 'button';
        pol.className = LIGHT_SETS.has(dir) ? 'polaroid light' : 'polaroid';
        pol.setAttribute('aria-label', `${snap.cap}, a diagram from page ${snap.page}`);
        pol.addEventListener('click', () => openViewer('snap', idx));
        pol.style.setProperty('--pl', left);
        pol.style.setProperty('--pt', top);
        pol.style.setProperty('--pr', `${tilt.toFixed(1)}deg`);
        const photo = new Image();
        photo.src = `${dir}/snap/${pad(k + 1)}.jpg`;
        photo.alt = '';
        photo.decoding = 'async';
        const cap = document.createElement('span');
        cap.className = 'pol-cap';
        cap.textContent = snap.cap;
        pol.append(photo, cap);
        card.append(pol);
        polaroids.push({ el: pol, card, snap });
      });
    };

    // Each card starts at the middle of the board so it can fly out to its own spot.
    const place = () => {
      const midX = cardsEl.clientWidth / 2;
      const midY = scroll.scrollTop + scroll.clientHeight / 2 - cardsEl.offsetTop;
      cards.forEach((c) => {
        c.style.setProperty('--fx', `${midX - (c.offsetLeft + c.offsetWidth / 2)}px`);
        c.style.setProperty('--fy', `${midY - (c.offsetTop + c.offsetHeight / 2)}px`);
      });
    };

    const circle = (cls, cx, cy, r) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('cx', cx);
      c.setAttribute('cy', cy);
      c.setAttribute('r', r);
      return c;
    };

    const strings = () => {
      svg.setAttribute('viewBox', `0 0 ${cardsEl.clientWidth} ${cardsEl.clientHeight}`);
      svg.replaceChildren();
      const nodes = [
        ...cards.map((c) => ({
          x: c.offsetLeft + c.offsetWidth / 2 + cssNum(c, '--jx'),
          y: c.offsetTop + 9 + cssNum(c, '--jy'),
        })),
        ...polaroids.map(({ el, card }) => ({
          x: card.offsetLeft + el.offsetLeft + el.offsetWidth / 2 + cssNum(card, '--jx'),
          y: card.offsetTop + el.offsetTop + 7 + cssNum(card, '--jy'),
        })),
      ];

      // Random tree (mostly to near neighbours) plus extra cross-links, so the web looks tangled.
      const r = rng(hash(`${dir}/threads`));
      const dist = (a, b) => Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
      const order = shuffled(nodes.map((_, i) => i), r);
      const seen = new Set();
      const edges = [];
      const link = (a, b) => {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (a === b || seen.has(key)) return false;
        seen.add(key);
        edges.push([a, b]);
        return true;
      };
      for (let i = 1; i < order.length; i++) {
        const a = order[i];
        const earlier = order.slice(0, i).sort((p, q) => dist(a, p) - dist(a, q));
        const b = r() < 0.65 ? earlier[Math.floor(r() * Math.min(3, earlier.length))] : earlier[Math.floor(r() * earlier.length)];
        link(a, b);
      }
      const extra = Math.round(nodes.length * 0.4);
      for (let k = 0, tries = 0; k < extra && tries < extra * 12; tries++) {
        const a = Math.floor(r() * nodes.length);
        const b = Math.floor(r() * nodes.length);
        if (dist(a, b) > 90 && link(a, b)) k++;
      }

      edges.forEach(([a, b], i) => {
        const { x: x1, y: y1 } = nodes[a];
        const { x: x2, y: y2 } = nodes[b];
        const sag = 14 + dist(a, b) * between(r, 0.04, 0.1);
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('class', 'thread');
        p.setAttribute('pathLength', '1');
        p.setAttribute('d', `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag} ${x2} ${y2}`);
        p.style.strokeWidth = between(r, 2, 2.8).toFixed(2);
        p.style.setProperty('--n', i);
        svg.append(p);
      });
      nodes.forEach(({ x, y }, i) => {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', `pin c${i % 4}`);
        g.style.setProperty('--n', i);
        g.append(circle('pin-shadow', x + 2, y + 3, 7), circle('pin-head', x, y, 7), circle('pin-hl', x - 2.3, y - 2.4, 2.2));
        svg.append(g);
      });
    };

    const open = async (cluster) => {
      if (closing) return;
      clearTimers();
      source = cluster;
      dir = cluster.dataset.dir;
      count = Number(cluster.dataset.pages);
      title = cluster.dataset.title;
      stickyTitle.textContent = title;
      stickyCount.textContent = `${cluster.querySelector('.cl-tag small').textContent} \u00b7 start anywhere`;
      dlg.classList.remove('live', 'spread', 'pinned', 'strung', 'settled', 'closing');
      dlg.classList.toggle('wide', Number(getComputedStyle(cluster).getPropertyValue('--ar')) > 1);
      viewer.hidden = true;
      viewer.classList.remove('zoomed');
      build();
      boardEl.getAnimations().forEach((a) => a.cancel());
      dlg.showModal();

      const from = cluster.querySelector('.nb-stack').getBoundingClientRect();
      const to = boardEl.getBoundingClientRect();
      cluster.classList.add('lifted');
      if (!reduced) {
        boardEl.animate(
          [
            { transform: flipFrom(from, to), opacity: 0.2, borderRadius: '18px' },
            { transform: 'none', opacity: 1, borderRadius: '8px' },
          ],
          { duration: 720, easing: EASE }
        );
      }

      await Promise.all([...cardsEl.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
      if (closing || !dlg.open) return;
      place();
      strings();
      dlg.classList.add('live');

      const t0 = reduced ? 0 : 420;
      const t1 = t0 + (reduced ? 0 : 500);
      const t2 = t1 + (reduced ? 0 : count * 70 + 200);
      later(() => dlg.classList.add('spread'), t0);
      later(() => dlg.classList.add('pinned'), t1);
      later(() => dlg.classList.add('strung'), t2);
      later(() => dlg.classList.add('settled'), t2 + 1400);
    };

    const closeBoard = async () => {
      if (closing || !dlg.open) return;
      closing = true;
      clearTimers();
      viewer.hidden = true;
      dlg.classList.add('closing');
      if (!reduced) {
        const from = source.querySelector('.nb-stack').getBoundingClientRect();
        const to = boardEl.getBoundingClientRect();
        await boardEl
          .animate(
            [
              { transform: 'none', opacity: 1 },
              { transform: flipFrom(from, to), opacity: 0.2 },
            ],
            { duration: 520, easing: EASE, fill: 'forwards' }
          )
          .finished.catch(() => {});
      }
      dlg.close();
      dlg.classList.remove('live', 'spread', 'pinned', 'strung', 'settled', 'closing');
      boardEl.getAnimations().forEach((a) => a.cancel());
      source.classList.remove('lifted');
      closing = false;
      source.focus({ preventScroll: true });
    };

    const itemEl = () => (mode === 'snap' ? polaroids[sIndex].el : cards[vIndex]);
    const focusItem = (el) => (el.matches('.card') ? el.querySelector('.card-hit') : el).focus({ preventScroll: true });

    // Snap photos are sized in JS so the thumbnail-to-full-size swap never changes the box.
    const fitSnap = () => {
      if (mode !== 'snap' || viewer.classList.contains('zoomed')) {
        vimg.style.width = '';
        return;
      }
      const stage = $('.viewer-stage');
      const ratio = vimg.naturalWidth / vimg.naturalHeight || 1.5;
      const maxW = Math.min(980, stage.clientWidth - 48);
      const maxH = stage.clientHeight - 90;
      vimg.style.width = `${Math.min(maxW, maxH * ratio)}px`;
    };

    const setPage = async (i) => {
      mode = 'page';
      vIndex = i;
      viewer.classList.remove('snap');
      $('.v-page').hidden = true;
      vimg.style.width = '';
      vimg.src = thumb(i);
      vimg.alt = `${title}, page ${i + 1} of ${count}`;
      vcap.textContent = `${title} \u00b7 ${i + 1} / ${count}`;
      await vimg.decode().catch(() => {});
      const big = new Image();
      big.src = full(i);
      big.decode().then(() => { if (mode === 'page' && vIndex === i) vimg.src = big.src; }).catch(() => {});
      [i - 1, i + 1].forEach((p) => { if (p >= 0 && p < count) new Image().src = full(p); });
    };

    const setSnap = async (k) => {
      mode = 'snap';
      sIndex = k;
      const { snap } = polaroids[k];
      viewer.classList.add('snap');
      $('.v-page').hidden = false;
      vimg.src = `${dir}/snap/${pad(k + 1)}.jpg`;
      vimg.alt = `${snap.cap}, a diagram from page ${snap.page} of ${title}`;
      vcap.textContent = `${snap.cap} \u00b7 from page ${snap.page}`;
      await vimg.decode().catch(() => {});
      fitSnap();
      const big = new Image();
      big.src = `${dir}/snap/big/${pad(k + 1)}.jpg`;
      big.decode().then(() => { if (mode === 'snap' && sIndex === k) vimg.src = big.src; }).catch(() => {});
    };

    const openViewer = async (kind, i) => {
      const el = kind === 'snap' ? polaroids[i].el : cards[i];
      const from = el.querySelector('img').getBoundingClientRect();
      viewer.classList.remove('zoomed');
      vfig.style.visibility = 'hidden';
      viewer.hidden = false;
      await (kind === 'snap' ? setSnap(i) : setPage(i));
      el.classList.add('lifted');
      vfig.style.visibility = '';
      if (!reduced) {
        const to = vimg.getBoundingClientRect();
        scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
        vfig.animate([{ transform: flipFrom(from, to) }, { transform: 'none' }], { duration: 560, easing: EASE });
      }
      $('.v-close').focus({ preventScroll: true });
    };

    const closeViewer = async () => {
      if (viewer.hidden) return;
      const el = itemEl();
      viewer.classList.remove('zoomed');
      fitSnap();
      el.scrollIntoView({ block: 'nearest' });
      if (!reduced) {
        const from = el.querySelector('img').getBoundingClientRect();
        const to = vimg.getBoundingClientRect();
        scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
        await vfig
          .animate([{ transform: 'none' }, { transform: flipFrom(from, to) }], { duration: 460, easing: EASE, fill: 'forwards' })
          .finished.catch(() => {});
      }
      viewer.hidden = true;
      vfig.getAnimations().forEach((a) => a.cancel());
      scrim.getAnimations().forEach((a) => a.cancel());
      el.classList.remove('lifted');
      focusItem(el);
    };

    const swapAnimation = (d) => {
      if (reduced) return;
      vfig.animate(
        [
          { opacity: 0, transform: `translateX(${d * 40}px) rotate(${d * 2}deg)` },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 300, easing: EASE }
      );
    };

    const go = async (d) => {
      const snapMode = mode === 'snap';
      const list = snapMode ? polaroids : cards;
      const next = ((snapMode ? sIndex : vIndex) + d + list.length) % list.length;
      itemEl().classList.remove('lifted');
      (snapMode ? polaroids[next].el : cards[next]).classList.add('lifted');
      viewer.classList.remove('zoomed');
      await (snapMode ? setSnap(next) : setPage(next));
      swapAnimation(d);
    };

    const toFullPage = async () => {
      const page = polaroids[sIndex].snap.page - 1;
      itemEl().classList.remove('lifted');
      cards[page].classList.add('lifted');
      viewer.classList.remove('zoomed');
      await setPage(page);
      swapAnimation(1);
    };

    $('.board-close').addEventListener('click', closeBoard);
    $('.v-close').addEventListener('click', closeViewer);
    $('.v-prev').addEventListener('click', () => go(-1));
    $('.v-next').addEventListener('click', () => go(1));
    $('.v-page').addEventListener('click', toFullPage);
    vimg.addEventListener('click', () => {
      viewer.classList.toggle('zoomed');
      fitSnap();
    });
    viewer.addEventListener('click', (e) => {
      if ((e.target === scrim || e.target.classList.contains('viewer-stage')) && !viewer.classList.contains('zoomed')) closeViewer();
    });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) closeBoard(); });
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      if (!viewer.hidden) closeViewer();
      else closeBoard();
    });
    dlg.addEventListener('keydown', (e) => {
      if (viewer.hidden) return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
    addEventListener('resize', () => {
      if (dlg.open && dlg.classList.contains('live')) {
        place();
        strings();
        if (!viewer.hidden) fitSnap();
      }
    });

    return { open };
  })();

  document.querySelectorAll('.flip').forEach((flip) => {
    const clusters = [...flip.querySelectorAll('.cluster')];
    if (!clusters.length) return;

    clusters.forEach((c, i) => {
      const r = rng(hash(c.dataset.dir));
      c.style.setProperty('--dx', `${between(r, -14, 14).toFixed(1)}px`);
      c.style.setProperty('--dy', `${between(r, -12, 12).toFixed(1)}px`);
      c.style.setProperty('--rot', `${between(r, -8, 8).toFixed(1)}deg`);
      c.style.setProperty('--ci', i);

      const stack = c.querySelector('.nb-stack');
      for (let p = Math.min(3, Number(c.dataset.pages)); p >= 1; p--) {
        const page = document.createElement('img');
        page.src = `${c.dataset.dir}/t/${pad(p)}.jpg`;
        page.alt = '';
        page.loading = 'lazy';
        page.decoding = 'async';
        stack.append(page);
      }
      c.addEventListener('click', (e) => {
        e.preventDefault();
        board.open(c);
      });
    });

    // Offsets that pull every cluster to the middle of the pane, so opening the hood spreads them out.
    const scatter = () => {
      clusters.forEach((c) => {
        const wrap = c.offsetParent;
        if (!wrap) return;
        c.style.setProperty('--fx', `${wrap.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2)}px`);
        c.style.setProperty('--fy', `${wrap.clientHeight / 2 - (c.offsetTop + c.offsetHeight / 2)}px`);
      });
    };
    scatter();
    addEventListener('resize', scatter);
    flip.addEventListener('click', scatter, true);

    let timer;
    new MutationObserver(() => {
      clearTimeout(timer);
      if (!flip.classList.contains('flipped')) {
        flip.classList.remove('settled');
      } else if (!flip.classList.contains('settled')) {
        timer = setTimeout(() => flip.classList.add('settled'), 500 + clusters.length * 120 + 1000);
      }
    }).observe(flip, { attributes: true, attributeFilter: ['class'] });
  });
})();
