(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bar = document.querySelector('.progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.querySelectorAll('.flip').forEach((flip) => {
    const front = flip.querySelector('.flip-front');
    const back = flip.querySelector('.flip-back');
    const openBtn = front.querySelector('.more-btn');
    const closeBtn = back.querySelector('.more-btn');

    back.querySelectorAll('.flip-title, li').forEach((el, i) => el.style.setProperty('--i', i));

    const set = (open, moveFocus = true) => {
      flip.classList.toggle('flipped', open);
      front.inert = open;
      back.inert = !open;
      openBtn.setAttribute('aria-expanded', String(open));
      closeBtn.setAttribute('aria-expanded', String(open));
      if (moveFocus) (open ? closeBtn : openBtn).focus({ preventScroll: true });
    };

    openBtn.addEventListener('click', () => set(true));
    closeBtn.addEventListener('click', () => set(false));
    flip.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && flip.classList.contains('flipped')) set(false);
    });
    set(false, false);
  });

  const glowTargets = document.querySelectorAll('.job, .tile');
  glowTargets.forEach((el) => {
    el.classList.add('glow');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  document.querySelectorAll('.embed-dash').forEach((dash) => {
    const slot = dash.querySelector('.embed');
    slot.querySelector('.embed-btn').addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = dash.dataset.src;
      frame.title = 'Interactive Walmart sales dashboard (Power BI)';
      frame.loading = 'lazy';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'no-referrer';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
      slot.replaceChildren(frame);
    });
  });

  document.querySelectorAll('.crowd').forEach((crowd) => {
    for (let n = 0; n < Number(crowd.dataset.dots); n++) {
      const dot = document.createElement('i');
      if (n < Number(crowd.dataset.hits)) dot.className = 'hit';
      crowd.append(dot);
    }
  });

  document.querySelectorAll('.fleet').forEach((fleet) => {
    for (let n = 0; n < Number(fleet.dataset.nodes); n++) {
      const dot = document.createElement('i');
      dot.style.setProperty('--d', `${(Math.random() * 2.4).toFixed(2)}s`);
      fleet.append(dot);
    }
  });

  const tileIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('live');
        tileIo.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );
  document.querySelectorAll('.tile, .timeline').forEach((t) => tileIo.observe(t));

  if (reduced) return;

  const rotator = document.querySelector('.rotator');
  if (rotator) {
    const words = rotator.dataset.words.split('|');
    let i = 0;
    setInterval(() => {
      rotator.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        rotator.textContent = words[i];
        rotator.classList.remove('out');
      }, 350);
    }, 3000);
  }

  const revealTargets = document.querySelectorAll(
    'section > h2, .job, .skills div, .sub, .note'
  );
  revealTargets.forEach((el, n) => {
    el.classList.add('reveal');
    el.style.setProperty('--delay', `${(n % 3) * 80}ms`);
  });

  const countUp = (el) => {
    const end = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = Number(el.dataset.decimals || 0);
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${prefix}${(end * eased).toFixed(decimals)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in');
        el.addEventListener('transitionend', () => el.style.setProperty('--delay', '0ms'), { once: true });
        io.unobserve(el);
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => io.observe(el));

  const statIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      statIo.unobserve(entry.target);
    });
  });
  document.querySelectorAll('[data-count]').forEach((el) => statIo.observe(el));
})();
