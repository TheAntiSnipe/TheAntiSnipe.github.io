(() => {
  const host = document.getElementById('skills');
  if (!host) return;

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
  const r = rng(hash('sticker-bomb'));
  const LOGOS = window.SKILL_LOGOS || {};
  const logoSvg = (slug) => (LOGOS[slug] ? `<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><path d="${LOGOS[slug]}"/></svg>` : '');
  const ICONS = window.SKILL_ICONS || {};
  const iconSvg = (name) => {
    const icon = ICONS[name];
    return icon ? `<svg class="icon" viewBox="0 0 ${icon.w} ${icon.h}" aria-hidden="true">${icon.body}</svg>` : '';
  };
  const between = (a, b) => a + (b - a) * r();
  const pick = (list) => list[Math.floor(r() * list.length)];

  const CATS = [
    ['all', 'Everything'],
    ['lang', 'Languages'],
    ['frame', 'Frameworks'],
    ['data', 'Databases'],
    ['aws', 'AWS'],
    ['tools', 'Tools'],
    ['cert', 'Certifications'],
  ];
  const LABEL = {
    lang: 'Language',
    frame: 'Framework / library',
    data: 'Database',
    aws: 'AWS service',
    tools: 'Tool',
    cert: 'Certification',
  };

  const aws = [
    ['Amplify', 'aws-amplify'],
    ['Cognito', 'aws-cognito'],
    ['AppSync', 'aws-appsync'],
    ['CloudWatch', 'aws-cloudwatch'],
    ['S3', 'aws-s3'],
    ['Glue', 'aws-glue'],
    ['IAM', 'aws-iam'],
    ['Athena', 'aws-athena'],
    ['API Gateway', 'aws-api-gateway'],
    ['Lambda', 'aws-lambda'],
    ['SES', 'aws-ses'],
  ].map(([name, icon]) => ({ n: `AWS ${name}`, c: 'aws', icon, hex: 'f4f1e8' }));

  const STICKERS = [
    { n: 'Python', c: 'lang', logo: 'python', hex: '3776AB' },
    { n: 'JavaScript', c: 'lang', logo: 'javascript', hex: 'F7DF1E' },
    { n: 'Dart', c: 'lang', logo: 'dart', hex: '0175C2' },
    { n: 'C', c: 'lang', logo: 'c', hex: 'A8B9CC' },
    { n: 'C++', c: 'lang', logo: 'cplusplus', hex: '00599C' },
    { n: 'C#', c: 'lang', icon: 'c-sharp', hex: 'f4f1e8' },
    { n: 'Go', c: 'lang', logo: 'go', hex: '00ADD8' },
    { n: 'SQL', c: 'lang', text: 'SQL', hex: '334155', ink: '#fbbf24' },
    { n: 'HTML', c: 'lang', logo: 'html5', hex: 'E34F26' },
    { n: 'CSS', c: 'lang', logo: 'css', hex: '663399' },

    { n: 'React', c: 'frame', logo: 'react', hex: '61DAFB' },
    { n: 'Node.js', c: 'frame', logo: 'nodedotjs', hex: '5FA04E' },
    { n: 'Django', c: 'frame', logo: 'django', hex: '092E20' },
    { n: 'Flutter', c: 'frame', logo: 'flutter', hex: '02569B' },
    { n: '.NET', c: 'frame', logo: 'dotnet', hex: '512BD4' },
    { n: 'GraphQL', c: 'frame', logo: 'graphql', hex: 'E10098' },
    { n: 'XGBoost', c: 'frame', text: 'XGBoost', hex: 'EE9B00', ink: '#17140f' },
    { n: 'TensorFlow', c: 'frame', logo: 'tensorflow', hex: 'FF6F00' },
    { n: 'NumPy', c: 'frame', logo: 'numpy', hex: '013243' },
    { n: 'pandas', c: 'frame', logo: 'pandas', hex: '150458' },
    { n: 'Leaflet', c: 'frame', logo: 'leaflet', hex: '199900' },

    { n: 'MySQL', c: 'data', logo: 'mysql', hex: '4479A1' },
    { n: 'PostgreSQL', c: 'data', logo: 'postgresql', hex: '4169E1' },
    { n: 'MongoDB (and Atlas)', c: 'data', logo: 'mongodb', hex: '47A248' },
    { n: 'Redis', c: 'data', logo: 'redis', hex: 'FF4438' },
    { n: 'Amazon DynamoDB', c: 'data', icon: 'aws-dynamodb', hex: 'f4f1e8' },

    ...aws,

    { n: 'Docker', c: 'tools', logo: 'docker', hex: '2496ED' },
    { n: 'Git', c: 'tools', logo: 'git', hex: 'F03C2E' },
    { n: 'GitHub', c: 'tools', logo: 'github', hex: '181717' },
    { n: 'Tableau', c: 'tools', icon: 'tableau-icon', hex: 'f4f1e8' },

    { n: 'Microsoft Azure AZ-900', c: 'cert', pin: ['AZ-900', 'Azure'], icon: 'azure-icon', hex: '0b3d91', ribbon: '#2563eb' },
    { n: 'Qwiklabs: GCP essentials', c: 'cert', pin: ['GCP', 'Essentials'], logo: 'googlecloud', hex: '1a73e8', ribbon: '#ea4335' },
    { n: 'Qwiklabs: GCP baseline ML', c: 'cert', pin: ['GCP', 'Baseline ML'], hex: '188038', ribbon: '#fbbc04' },
    { n: 'Qwiklabs: ML APIs', c: 'cert', pin: ['ML', 'APIs'], hex: '7c3aed', ribbon: '#a78bfa' },
    { n: 'Qwiklabs: AI', c: 'cert', pin: ['AI', 'Qwiklabs'], hex: 'be185d', ribbon: '#f472b6' },
  ];

  const luminance = (hex) => {
    const n = parseInt(hex, 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  };

  const px = (n) => `${n.toFixed(1)}px`;
  const poly = (pts) => `polygon(${pts.map(([x, y]) => `${px(x)} ${px(y)}`).join(', ')})`;

  // The flap is the peeled corner folded back onto the sticker: the corner mirrored across the crease.
  const peelShapes = (corner, a, b, W, H) => {
    const d = 1 / a ** 2 + 1 / b ** 2;
    const fx = (2 / a) / d;
    const fy = (2 / b) / d;
    switch (corner) {
      case 'tl': return { face: [[0, b], [a, 0], [W, 0], [W, H], [0, H]], flap: [[a, 0], [0, b], [fx, fy]] };
      case 'tr': return { face: [[0, 0], [W - a, 0], [W, b], [W, H], [0, H]], flap: [[W - a, 0], [W, b], [W - fx, fy]] };
      case 'br': return { face: [[0, 0], [W, 0], [W, H - b], [W - a, H], [0, H]], flap: [[W - a, H], [W, H - b], [W - fx, H - fy]] };
      default: return { face: [[0, 0], [W, 0], [W, H], [a, H], [0, H - b]], flap: [[a, H], [0, H - b], [fx, H - fy]] };
    }
  };
  const CORNERS = {
    tl: { dir: 'to bottom right', sx: 3, sy: 3 },
    tr: { dir: 'to bottom left', sx: -3, sy: 3 },
    br: { dir: 'to top left', sx: -3, sy: -3 },
    bl: { dir: 'to top right', sx: 3, sy: -3 },
  };

  const SHAPES = [
    { br: '14%', ar: 1 },
    { br: '22%', ar: 1 },
    { br: '10%', ar: 1.3 },
    { br: '12%', ar: 0.82 },
    { br: '50%', ar: 1, still: true },
    { br: '38% 62% 52% 48% / 46% 40% 60% 54%', ar: 1, still: true },
  ];

  const build = (def, i) => {
    const kind = def.pin ? 'pin' : def.icon ? 'icon' : def.text ? 'text' : 'logo';
    let W;
    let H;
    let br = '12%';
    let still = false;
    if (kind === 'logo') {
      const shape = pick(SHAPES);
      H = between(86, 112);
      W = H * shape.ar;
      br = shape.br;
      still = Boolean(shape.still);
    } else if (kind === 'text') {
      W = between(104, 132);
      H = between(64, 84);
    } else if (kind === 'icon') {
      W = H = between(80, 104);
      br = pick(['16%', '22%']);
    } else {
      W = H = between(84, 98);
      br = '50%';
      still = true;
    }

    const lum = luminance(def.hex);
    const inverse = kind === 'logo' && lum < 0.7 && r() < 0.3;
    const bg = inverse ? '#f4f1e8' : `#${def.hex}`;
    const ink = def.ink || (inverse ? `#${def.hex}` : lum > 0.62 ? '#17140f' : '#ffffff');
    const vinyl = inverse ? `#${def.hex}` : '#f4f1e8';
    const bw = kind === 'icon' ? 5 : inverse ? 7 : between(4, 6);

    let face = 'none';
    let faceH = 'none';
    let flap = poly([[0, 0], [0, 0], [0, 0]]);
    let flapH = flap;
    let corner = 'tl';
    if (!still && kind !== 'pin' && r() >= 0.4) {
      corner = pick(Object.keys(CORNERS));
      const big = r() < 0.45;
      let a = big ? between(24, 38) : between(11, 19);
      let b = a * between(0.65, 1.4);
      a = Math.min(a, W * 0.35);
      b = Math.min(b, H * 0.55);
      const grow = Math.min(1.7, (W * 0.6) / a, (H * 0.7) / b);
      const base = peelShapes(corner, a, b, W, H);
      const hov = peelShapes(corner, a * grow, b * grow, W, H);
      face = poly(base.face);
      faceH = poly(hov.face);
      flap = poly(base.flap);
      flapH = poly(hov.flap);
    }

    const len = (def.text || '').length || 1;
    const font = kind === 'text' ? Math.min(H * 0.42, (W - 16) / (len * 0.6)) : H * (def.pin && def.pin[0].length > 4 ? 0.21 : 0.3);
    const worn = r() < 0.28;
    const li = document.createElement('li');
    li.className = `sticker st-${kind}`;
    li.dataset.cat = def.c;
    li.tabIndex = 0;
    li.setAttribute('aria-label', `${def.n}, ${LABEL[def.c]}`);
    const vars = {
      '--w': px(W),
      '--h': px(H),
      '--m': `${px(between(-14, -2))} ${px(between(-12, -2))}`,
      '--rot': `${between(-16, 16).toFixed(1)}deg`,
      '--tx': px(between(-8, 8)),
      '--ty': px(between(-8, 8)),
      '--z': Math.floor(between(1, 40)),
      '--bg': bg,
      '--ink': ink,
      '--vinyl': vinyl,
      '--bw': px(bw),
      '--br': br,
      '--sat': (worn ? between(0.5, 0.7) : between(0.78, 1)).toFixed(2),
      '--bri': (worn ? between(0.78, 0.88) : between(0.88, 1.02)).toFixed(2),
      '--x1': `${between(0, 100).toFixed(0)}%`,
      '--y1': `${between(0, 100).toFixed(0)}%`,
      '--a1': `${between(18, 40).toFixed(0)}%`,
      '--x2': `${between(0, 100).toFixed(0)}%`,
      '--y2': `${between(0, 100).toFixed(0)}%`,
      '--a2': `${between(14, 32).toFixed(0)}%`,
      '--sa': `${between(0, 180).toFixed(0)}deg`,
      '--sb': `${between(0, 360).toFixed(0)}deg`,
      '--scratch': worn ? 0.95 : between(0.3, 0.7).toFixed(2),
      '--face': face,
      '--face-h': faceH,
      '--flap': flap,
      '--flap-h': flapH,
      '--fdir': CORNERS[corner].dir,
      '--fsx': `${CORNERS[corner].sx}px`,
      '--fsy': `${CORNERS[corner].sy}px`,
      '--font': px(font),
    };
    if (def.ribbon) vars['--ribbon'] = def.ribbon;
    Object.entries(vars).forEach(([k, v]) => li.style.setProperty(k, v));

    let inner = '';
    if (kind === 'logo') inner = logoSvg(def.logo) || `<b class="txt">${def.n}</b>`;
    else if (kind === 'icon') inner = iconSvg(def.icon);
    else if (kind === 'text') inner = `<b class="txt">${def.text}</b>`;
    else inner = `${iconSvg(def.icon) || logoSvg(def.logo)}<b class="txt">${def.pin[0]}<small>${def.pin[1]}</small></b>`;

    li.innerHTML =
      `<span class="face" aria-hidden="true">${inner}<i class="scratch"></i></span>` +
      '<span class="flap-wrap" aria-hidden="true"><i class="flap"></i></span>' +
      `<span class="tip" aria-hidden="true">${def.n}<small>${LABEL[def.c]}</small></span>`;

    const wiggle = () => {
      li.classList.remove('wiggle');
      void li.offsetWidth;
      li.classList.add('wiggle');
    };
    li.addEventListener('click', wiggle);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        wiggle();
      }
    });
    li.addEventListener('animationend', () => li.classList.remove('wiggle'));
    return li;
  };

  const shuffled = (() => {
    const a = [...STICKERS];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  })();

  const wrap = document.createElement('div');
  wrap.className = 'lid-wrap';

  const hint = document.createElement('p');
  hint.className = 'lid-hint';
  hint.textContent = 'Everything I work with, sticker-bombed. Hover a sticker to peel it, or pick a drawer.';

  const filters = document.createElement('div');
  filters.className = 'skill-filters';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filter the stickers');

  const lid = document.createElement('div');
  lid.className = 'lid';
  const list = document.createElement('ul');
  list.className = 'lid-list';
  list.setAttribute('aria-label', 'Skills');

  // Pale outlines where stickers used to be.
  for (let g = 0; g < 5; g++) {
    const ghost = document.createElement('i');
    ghost.className = 'ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.cssText = `left:${between(3, 88).toFixed(0)}%;top:${between(3, 86).toFixed(0)}%;width:${between(60, 110).toFixed(0)}px;height:${between(46, 96).toFixed(0)}px;--gr:${between(-20, 20).toFixed(0)}deg`;
    lid.append(ghost);
  }

  const items = shuffled.map(build);
  items.forEach((li) => list.append(li));
  lid.append(list);

  const setFilter = (key) => {
    filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === key)));
    items.forEach((li) => li.classList.toggle('dim', key !== 'all' && li.dataset.cat !== key));
  };
  CATS.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.key = key;
    b.textContent = label;
    b.setAttribute('aria-pressed', String(key === 'all'));
    b.addEventListener('click', () => setFilter(key));
    filters.append(b);
  });

  wrap.append(hint, filters, lid);
  host.querySelector('h2').after(wrap);
})();
