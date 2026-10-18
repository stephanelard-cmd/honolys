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
  const hub = find('#hl-hub');
  const toggle = find('#hl-facility-switch');
  const pause = find('#hl-pause');
  const facility = find('#hl-facility-node');
  const detail = find('#hl-facility-detail');
  const status = find('#hl-state');
  if (![diagram, network, links, particles, hub, toggle, pause, facility, detail, status].every(Boolean)) return;

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
  function centre(node, bounds) {
    const rect = node.getBoundingClientRect();
    return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 };
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
    const bounds = diagram.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;
    if (!width || !height) return;
    network.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const shield = (inset) => {
      const w = width - 2 * inset;
      const h = height - 2 * inset;
      const point = (x, y) => `${inset + w * x} ${inset + h * y}`;
      return `M ${point(.5, .025)} Q ${point(.72, .10)} ${point(.96, .13)} L ${point(.94, .55)} Q ${point(.91, .79)} ${point(.5, .97)} Q ${point(.09, .79)} ${point(.06, .55)} L ${point(.04, .13)} Q ${point(.28, .10)} ${point(.5, .025)} Z`;
    };
    // Nested surfaces give the shield a thick, bevelled glass edge.
    const rim = Math.min(21, width * .035);
    const layers = {
      'hl-rim-path': 5, 'hl-shadow-path': 5, 'hl-depth-path': 5,
      'hl-cast-path': 5, 'hl-bevel-path': 5 + rim * .24,
      'hl-inner-bevel-path': 5 + rim * .77,
      'hl-shield-path': 5 + rim, 'hl-clip-path': 5 + rim,
      'hl-inner-path': 8 + rim,
    };
    Object.entries(layers).forEach(([id, inset]) => find(`#${id}`).setAttribute('d', shield(inset)));
    const depth = Math.min(9, width * .018);
    find('#hl-depth-path').setAttribute('transform', `translate(${depth},${depth * 1.4})`);
    find('#hl-cast-path').setAttribute('transform', `translate(${depth * 2},${depth * 2.7})`);
    const ellipse = (id, attributes) => Object.entries(attributes).forEach(([key, value]) => find(`#${id}`).setAttribute(key, value));
    ellipse('hl-halo', { cx: width / 2, cy: height * .47, rx: width * .6, ry: height * .53 });
    ellipse('hl-floor-light', { cx: width * .5, cy: height * .97, rx: width * .53, ry: height * .075 });
    ellipse('hl-floor-shadow', { cx: width * .54, cy: height * .99, rx: width * .34, ry: height * .033 });
    find('#hl-glass-facet').setAttribute('d', `M 0 0 H ${width} V ${height} H 0 Z`);
    find('#hl-glass-reflection').setAttribute('d', `M 0 0 H ${width} V ${height * .19} Q ${width * .64} ${height * .27} ${width * .45} ${height * .55} Q ${width * .23} ${height * .81} 0 ${height * .78} Z`);
    find('#hl-glass-spine').setAttribute('d', `M ${width / 2} 0 V ${height}`);
    links.replaceChildren();
    particles.replaceChildren();
    routes = [];
    const target = centre(hub, bounds);
    root.querySelectorAll('[data-node]').forEach((node, index) => {
      if (node.hidden) return;
      const source = centre(node, bounds);
      const direction = source.x < target.x ? -1 : 1;
      const curve = `M ${source.x} ${source.y} C ${source.x + direction * width * .06} ${target.y}, ${target.x + direction * width * .12} ${source.y}, ${target.x} ${target.y}`;
      const path = element('path', { d: curve, fill: 'none', stroke: '#5cdddd', 'stroke-width': 1.5, 'stroke-opacity': .52 });
      links.appendChild(path);
      const dots = [];
      for (let i = 0; i < 4; i += 1) {
        const glow = element('circle', { r: 5.5, fill: '#54e5e1', opacity: .16 });
        const dot = element('circle', { r: 2.5, fill: '#bcfff8' });
        particles.append(glow, dot);
        dots.push({ glow, dot, phase: i / 4 + index * .13 });
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
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(diagram);
  else window.addEventListener('resize', draw, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
  toggle.disabled = false;
  pause.hidden = false;
  updateVisibility();
  updatePlayback();
})();
