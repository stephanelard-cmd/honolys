/* HONOLYS — illustration du circuit cible. Aucune donnée ni connexion externe. */
(() => {
  'use strict';
  const root = document.getElementById('securite');
  if (!root) return;
  const find = (selector) => root.querySelector(selector);
  const diagram = find('#hl-diagram');
  const network = find('#hl-network');
  const links = find('#hl-links');
  const particles = find('#hl-particles');
  const toggle = find('#hl-facility-switch');
  const pause = find('#hl-pause');
  const facility = find('#hl-facility-node');
  const detail = find('#hl-facility-detail');
  const status = find('#hl-state');
  if (![diagram, network, links, particles, toggle, pause, facility, detail, status].every(Boolean)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ns = 'http://www.w3.org/2000/svg';
  let playing = !motion.matches;
  let visible = false;
  let elapsed = 0;
  let previous = null;
  let animation = null;
  let routes = [];

  function element(tag, attributes) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }
  function placeParticles() {
    routes.forEach((route) => route.dots.forEach((item, index) => {
      let progress = (elapsed / (3900 + route.index * 350) + item.phase) % 1;
      if (index % 2) progress = 1 - progress;
      const point = route.path.getPointAtLength(progress * route.length);
      [item.glow, item.dot].forEach((dot) => {
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
      });
    }));
  }
  function draw() {
    // Coordinates follow the luminous paths in the original 1536 × 1024 artwork.
    const curves = [
      'M 909 440 C 951 426 994 444 1004 472 L 1017 498',
      'M 1133 441 C 1098 432 1050 445 1037 467 L 1022 498',
      'M 944 742 C 898 743 850 700 850 657 C 850 628 886 609 934 611',
      'M 1090 746 C 1137 740 1171 680 1149 638 C 1137 625 1125 620 1103 619',
      'M 835 530 C 819 562 831 607 867 613 C 894 617 918 621 934 618',
      'M 1197 529 C 1220 565 1213 599 1178 617 C 1155 628 1127 627 1103 622',
    ];
    if (toggle.checked) curves.push('M 1160 674 C 1146 650 1118 642 1097 628');
    links.replaceChildren();
    particles.replaceChildren();
    routes = [];
    curves.forEach((curve, index) => {
      const optional = index === 6;
      const path = element('path', { d: curve, fill: 'none', stroke: '#5ef5ee', 'stroke-width': optional ? 2 : 1.2, 'stroke-opacity': optional ? .75 : .15 });
      links.appendChild(path);
      const dots = [];
      for (let i = 0; i < 3; i += 1) {
        const glow = element('circle', { r: 9, fill: '#54ffe9', opacity: .13 });
        const dot = element('circle', { r: 3.2, fill: '#d9fff9' });
        particles.append(glow, dot);
        dots.push({ glow, dot, phase: i / 3 + index * .13 });
      }
      routes.push({ path, length: path.getTotalLength(), dots, index });
    });
    placeParticles();
  }
  const canAnimate = () => playing && visible && !document.hidden;
  function frame(now) {
    animation = null;
    if (!canAnimate()) { previous = null; return; }
    if (previous !== null) elapsed += Math.min(now - previous, 100);
    previous = now;
    placeParticles();
    animation = window.requestAnimationFrame(frame);
  }
  function syncAnimation() {
    if (canAnimate()) {
      if (animation === null) animation = window.requestAnimationFrame(frame);
    } else {
      if (animation !== null) window.cancelAnimationFrame(animation);
      animation = null;
      previous = null;
    }
  }
  function updatePlayback() {
    pause.textContent = playing ? 'Mettre les flux en pause' : 'Animer les flux';
    pause.setAttribute('aria-pressed', String(!playing));
    syncAnimation();
  }

  toggle.addEventListener('change', () => {
    facility.hidden = !toggle.checked;
    detail.hidden = !toggle.checked;
    status.textContent = toggle.checked
      ? 'Le module établissement est inclus dans cette illustration.'
      : 'Illustration des trois espaces : praticien, secrétariat et patient.';
    diagram.setAttribute('aria-label', toggle.checked
      ? 'Bouclier HONOLYS : quatre espaces reliés au serveur HDS, dont le module établissement de soins optionnel.'
      : 'Bouclier HONOLYS : praticien, secrétariat et patient reliés au serveur HDS.');
    draw();
  });
  pause.addEventListener('click', () => { playing = !playing; updatePlayback(); });
  const onMotionChange = () => {
    if (motion.matches) { playing = false; updatePlayback(); }
  };
  if (motion.addEventListener) motion.addEventListener('change', onMotionChange);
  else if (motion.addListener) motion.addListener(onMotionChange);
  document.addEventListener('visibilitychange', syncAnimation);
  window.addEventListener('pagehide', () => { visible = false; syncAnimation(); });
  const updateVisibility = () => {
    const rect = diagram.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < window.innerHeight;
    syncAnimation();
  };
  window.addEventListener('pageshow', updateVisibility);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncAnimation(); });
    observer.observe(diagram);
  } else {
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility, { passive: true });
  }
  draw();
  toggle.disabled = false;
  pause.hidden = false;
  updateVisibility();
  updatePlayback();
})();
