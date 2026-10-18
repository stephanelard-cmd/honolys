/* HONOLYS — interactions du site de présentation.
   JavaScript sans dépendance. Toutes les données affichées sont fictives. */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;
  const hasIO = 'IntersectionObserver' in window;
  const NBSP = '\u00a0';
  const globalLive = $('#global-live');

  const onMotionChange = (callback) => {
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', callback);
    else if (motionQuery.addListener) motionQuery.addListener(callback);
  };
  const announce = (region, message) => {
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => { region.textContent = message; }, 60);
  };
  const restart = (element, className) => {
    if (!element || reduced()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  };
  const inViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };
  const pct = (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/\u202f/g, NBSP) + NBSP + '%';
  const plural = (n, word) => `${n}${NBSP}${word}${n > 1 ? 's' : ''}`;
  const eur = (value, digits = 0) => value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/\u202f/g, NBSP) + NBSP + '€';
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const setChip = (element, kind, text, iconName) => {
    if (!element) return;
    element.className = `chip chip-${kind}`;
    element.innerHTML = (iconName ? icon(iconName) : '') + text;
  };
  const scrollToElement = (element, block = 'start') => {
    element.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block });
  };

  /* ---------- En-tête ---------- */
  const header = $('#site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty('--reading-progress', distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const navLinks = $$('.main-nav a[href^="#"]');
  if (hasIO && navLinks.length) {
    const byId = new Map(navLinks.map((link) => [link.getAttribute('href').slice(1), link]));
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((other) => other.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current') === 'true') {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -54% 0px' });
    byId.forEach((_, id) => { const section = document.getElementById(id); if (section) navObserver.observe(section); });
  }

  /* ---------- Séquence d'ouverture ---------- */
  const heroStage = $('#hero-stage');
  const heroReplay = $('#hero-replay');
  if (heroStage && heroReplay) {
    const syncReplay = () => { heroReplay.hidden = reduced(); };
    syncReplay();
    onMotionChange(syncReplay);
    heroReplay.addEventListener('click', () => restart(heroStage, 'is-playing'));
  }

  /* ---------- Constat : les outils se rassemblent sur un même fil ---------- */
  const thread = $('#thread');
  if (thread && hasIO && !reduced() && !inViewport(thread)) {
    thread.classList.add('is-pending');
    const threadObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      thread.classList.remove('is-pending');
      threadObserver.disconnect();
    }, { threshold: 0.4 });
    threadObserver.observe(thread);
  }

  /* ---------- Le film ---------- */
  const video = $('#film-video');
  const player = $('#player');
  const playerStatus = $('#player-status');
  const chapterButtons = $$('.chapter-list [data-seek]');
  const chapterStarts = chapterButtons.map((button) => Number(button.dataset.seek));

  const setPlayerStatus = (html) => { if (playerStatus) playerStatus.innerHTML = html; };
  const markChapter = () => {
    if (!video || !player.classList.contains('is-started')) return;
    let index = 0;
    chapterStarts.forEach((start, i) => { if (video.currentTime >= start - 0.05) index = i; });
    chapterButtons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };
  const startFilm = (at) => {
    if (!video || !player) return;
    setPlayerStatus('');
    player.classList.add('is-started');
    if (typeof at === 'number') {
      if (video.readyState >= 1) video.currentTime = at;
      else video.addEventListener('loadedmetadata', () => { video.currentTime = at; markChapter(); }, { once: true });
    }
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => setPlayerStatus('La lecture n’a pas démarré. Utilisez le bouton de lecture du lecteur.'));
    }
    markChapter();
  };

  if (video && player) {
    $$('[data-play-film]').forEach((button) => button.addEventListener('click', () => {
      const fromCover = button.classList.contains('player-cover');
      startFilm(player.classList.contains('is-started') ? undefined : 0);
      if (!fromCover) scrollToElement(player, 'center');
      try { video.focus({ preventScroll: true }); } catch (error) { video.focus(); }
    }));
    chapterButtons.forEach((button) => button.addEventListener('click', () => {
      const at = Number(button.dataset.seek);
      startFilm(at);
      if (video.readyState >= 1) video.currentTime = at;
      announce(globalLive, `Lecture du film à partir de ${button.querySelector('time').textContent}, ${button.querySelector('span').textContent}.`);
    }));
    video.addEventListener('play', () => player.classList.add('is-started'));
    video.addEventListener('timeupdate', markChapter);
    const reportError = () => {
      const source = $('source', video);
      const href = source ? source.getAttribute('src') : '';
      setPlayerStatus(`La vidéo n’a pas pu être chargée.${href ? ` <a href="${href}">Ouvrir le fichier du film</a>.` : ''}`);
    };
    video.addEventListener('error', reportError);
    const source = $('source', video);
    if (source) source.addEventListener('error', reportError);
  }

  /* ---------- Une journée au cabinet ---------- */
  const steps = $$('.step');
  const clockTime = $('#clock-time');
  const clockLabel = $('#clock-label');
  const clockFill = $('#clock-fill');
  let activeStep = -1;
  const setActiveStep = (index) => {
    if (index === activeStep || !steps[index]) return;
    activeStep = index;
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    if (clockTime) {
      clockTime.textContent = steps[index].dataset.time;
      restart(clockTime, 'is-ticking');
    }
    if (clockLabel) clockLabel.textContent = steps[index].dataset.label;
    if (clockFill) clockFill.style.width = `${((index + 1) / steps.length) * 100}%`;
  };
  if (steps.length && hasIO) {
    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActiveStep(steps.indexOf(entry.target)); });
    }, { rootMargin: '-40% 0px -50% 0px' });
    steps.forEach((step) => stepObserver.observe(step));

    const figures = $$('.step-figure');
    if (!reduced()) {
      figures.forEach((figure) => { if (!inViewport(figure)) figure.classList.add('is-pending'); });
      const figureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || !entry.target.classList.contains('is-pending')) return;
          entry.target.classList.remove('is-pending');
          entry.target.classList.add('is-played');
          figureObserver.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      figures.forEach((figure) => { if (figure.classList.contains('is-pending')) figureObserver.observe(figure); });
    }
  }

  onMotionChange(() => {
    if (!reduced()) return;
    $$('.is-pending').forEach((element) => element.classList.remove('is-pending'));
  });

  /* ---------- Onglets des modules ---------- */
  const tablist = $('#module-tabs');
  const tabs = tablist ? $$('[role="tab"]', tablist) : [];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const indicator = tablist ? $('.tab-indicator', tablist) : null;
  let currentTab = 0;

  const moveIndicator = () => {
    if (!indicator || !tabs[currentTab]) return;
    indicator.style.setProperty('--ix', `${tabs[currentTab].offsetLeft}px`);
    indicator.style.setProperty('--iw', `${tabs[currentTab].offsetWidth}px`);
  };
  const keepTabVisible = (tab) => {
    if (tablist.scrollWidth <= tablist.clientWidth) return;
    const left = tab.offsetLeft - 24;
    const right = tab.offsetLeft + tab.offsetWidth + 24;
    if (left < tablist.scrollLeft) tablist.scrollTo({ left, behavior: reduced() ? 'auto' : 'smooth' });
    else if (right > tablist.scrollLeft + tablist.clientWidth) tablist.scrollTo({ left: right - tablist.clientWidth, behavior: reduced() ? 'auto' : 'smooth' });
  };
  const selectTab = (index, { focus = false, animate = true } = {}) => {
    if (!tabs[index]) return;
    currentTab = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    if (animate) restart(panels[index], 'is-entering');
    if (focus) tabs[index].focus();
    moveIndicator();
    keepTabVisible(tabs[index]);
  };
  if (tabs.length) {
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        selectTab(index);
        try { history.replaceState(null, '', `#${panels[index].id}`); } catch (error) { /* page intégrée */ }
      });
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        selectTab(next, { focus: true });
      });
    });
    const fromHash = panels.findIndex((panel) => panel && `#${panel.id}` === window.location.hash);
    selectTab(fromHash >= 0 ? fromHash : 0, { animate: false });
    if (fromHash >= 0) window.requestAnimationFrame(() => scrollToElement(tablist));
    window.addEventListener('resize', moveIndicator, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

    // Liens « Voir le module … » depuis la journée
    $$('a[href^="#module-"]').forEach((link) => link.addEventListener('click', (event) => {
      const index = panels.findIndex((panel) => panel && `#${panel.id}` === link.getAttribute('href'));
      if (index < 0) return;
      event.preventDefault();
      selectTab(index, { animate: true });
      scrollToElement(tablist);
      try { history.replaceState(null, '', link.getAttribute('href')); } catch (error) { /* page intégrée */ }
      try { panels[index].focus({ preventScroll: true }); } catch (error) { panels[index].focus(); }
    }));
  }


  /* ---------- Démonstration : mutuelle et règlement ---------- */
  const mutuelle = $('[data-demo="mutuelle"]');
  if (mutuelle) {
    const GARANTIE = 100; // prise en charge fictive des dépassements en chirurgie
    const HABITUEL = 150;
    const ECHEANCES = ['12 nov.', '12 déc.', '12 janv.', '12 févr.'];
    const mTabs = $$('[role="tab"]', mutuelle);
    const mPanels = mTabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const chip = $('[data-mut-chip]', mutuelle);
    const range = $('#mut-range');
    const output = $('#mut-output');
    const sentenceEl = $('#mut-sentence');
    const depEl = $('[data-mut-dep]', mutuelle);
    const coverEl = $('[data-mut-cover]', mutuelle);
    const racEl = $('[data-mut-rac]', mutuelle);
    const bar = $('[data-mut-bar]', mutuelle);
    const alertEl = $('[data-mut-alert]', mutuelle);
    const remind = $('[data-mut-remind]', mutuelle);
    const bubble = $('[data-mut-bubble]', mutuelle);
    const messageEl = $('[data-mut-message]', mutuelle);
    const planButtons = $$('[data-plan]', mutuelle);
    const schedule = $('[data-schedule]', mutuelle);
    const live = $('[data-live]', mutuelle);
    let dep = HABITUEL;
    let plan = 3;
    let reminded = false;
    let current = 0;
    let speakTimer = 0;

    const sentence = () => {
      const cover = Math.min(dep, GARANTIE);
      const rac = dep - cover;
      return rac === 0
        ? `Avec ${eur(dep)} de dépassement, la mutuelle prend en charge la totalité (estimation) : aucun reste à charge.`
        : `Avec ${eur(dep)} de dépassement, la mutuelle prend en charge ${eur(cover)} (estimation) et le reste à charge est de ${eur(rac)}.`;
    };
    const chipState = () => [
      ['ok', 'Garanties importées', 'check'],
      dep === HABITUEL ? ['soft', 'Devis du 3 octobre', ''] : ['warn', 'Nouveau devis à accepter', 'alert'],
      reminded ? ['ok', 'Relance envoyée', 'check'] : ['warn', 'Remboursement signalé', 'bell'],
      ['ok', `Échéancier en ${plan}${NBSP}fois`, 'check']
    ][current];
    const render = () => {
      const cover = Math.min(dep, GARANTIE);
      const rac = dep - cover;
      depEl.textContent = eur(dep);
      coverEl.textContent = eur(cover);
      racEl.textContent = eur(rac);
      bar.style.setProperty('--w', `${(cover / dep) * 100}%`);
      output.textContent = eur(dep);
      range.value = String(dep);
      range.setAttribute('aria-valuetext', `${dep} euros de dépassement`);
      range.style.setProperty('--p', `${((dep - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100}%`);
      sentenceEl.textContent = sentence();
      alertEl.textContent = `${eur(cover)} le jeudi 12 novembre. Règlement attendu : ${eur(dep)}.`;
      messageEl.textContent = `Bonjour M.${NBSP}Moreau, votre mutuelle vous a remboursé ${eur(cover)}. Votre règlement de ${eur(dep)} est disponible dans votre espace, en une ou plusieurs fois.`;
      const cents = Math.round(dep * 100);
      const part = Math.floor(cents / plan);
      schedule.innerHTML = Array.from({ length: plan }, (_, k) => {
        const amount = (k === plan - 1 ? cents - part * (plan - 1) : part) / 100;
        const label = plan === 1 ? 'Règlement en une fois' : `${k === 0 ? '1re' : `${k + 1}e`} échéance`;
        return `<li style="--k:${k}"><time>${ECHEANCES[k]}</time><span>${label}</span><b>${eur(amount, 2)}</b></li>`;
      }).join('');
      planButtons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.plan) === plan)));
      const [kind, text, iconName] = chipState();
      setChip(chip, kind, text, iconName);
    };
    const selectStep = (index, focus) => {
      current = index;
      mTabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        mPanels[i].hidden = !on;
      });
      restart(mPanels[index], 'is-entering');
      if (focus) mTabs[index].focus();
      render();
    };
    mTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectStep(index, false));
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = (index + 1) % mTabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + mTabs.length) % mTabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = mTabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        selectStep(next, true);
      });
    });
    range.addEventListener('input', () => {
      dep = Number(range.value);
      render();
      window.clearTimeout(speakTimer);
      speakTimer = window.setTimeout(() => announce(live, sentence()), 450);
    });
    $('[data-mut-fit]', mutuelle).addEventListener('click', () => {
      dep = GARANTIE;
      render();
      announce(live, `Dépassement ajusté au contrat : ${eur(dep)}, aucun reste à charge. Un nouveau devis sera proposé au patient.`);
    });
    $('[data-mut-usual]', mutuelle).addEventListener('click', () => {
      dep = HABITUEL;
      render();
      announce(live, `Retour au dépassement habituel : ${eur(dep)}. ${sentence()}`);
    });
    remind.addEventListener('click', () => {
      if (reminded) return;
      reminded = true;
      remind.setAttribute('aria-disabled', 'true');
      remind.innerHTML = `${icon('check')}Relance envoyée`;
      bubble.hidden = false;
      restart(bubble, 'is-changing');
      render();
      announce(live, 'Relance envoyée à M. Moreau avec son lien de règlement. Simulation.');
    });
    planButtons.forEach((button) => button.addEventListener('click', () => {
      plan = Number(button.dataset.plan);
      render();
      restart(schedule, 'is-entering');
      const first = schedule.querySelector('b').textContent;
      announce(live, plan === 1 ? `Règlement en une fois : ${eur(dep, 2)}.` : `Échéancier en ${plan} fois, première échéance de ${first} le 12 novembre.`);
    }));
    selectStep(0, false);
  }

  /* ---------- Démonstration : honoraires ---------- */
  const fees = $('[data-demo="fees"]');
  if (fees) {
    const states = [
      { status: 'Devis envoyé', kind: 'soft', message: `Bonjour M.${NBSP}Moreau, votre devis est disponible dans votre espace patient.`, live: 'Étape 1 : devis envoyé au patient.' },
      { status: 'Accepté', kind: 'ok', iconName: 'check', message: `Merci, M.${NBSP}Moreau. Votre devis est accepté et votre carte est enregistrée, sans débit.`, live: 'Étape 2 : devis accepté, caution enregistrée sans débit.' },
      { status: 'À régler', kind: 'warn', message: `Bonjour M.${NBSP}Moreau, voici votre lien de règlement : réglez en une ou plusieurs fois, quand votre mutuelle vous a remboursé.`, live: 'Étape 3 : sortie confirmée, lien de règlement envoyé par SMS.' },
      { status: 'Réglé', kind: 'ok', iconName: 'check', message: `Règlement reçu. Merci, M.${NBSP}Moreau.`, live: 'Étape 4 : honoraires réglés par virement, après le remboursement de la mutuelle.' }
    ];
    const buttons = $$('[data-fee-step]', fees);
    const statusChip = $('[data-fee-status]', fees);
    const timeline = $$('.fee-timeline li', fees);
    const message = $('[data-fee-message]', fees);
    const bubble = $('.bubble', fees);
    const live = $('[data-live]', fees);
    const setFee = (index, speak) => {
      const state = states[index];
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      setChip(statusChip, state.kind, state.status, state.iconName);
      timeline.forEach((item) => {
        const at = Number(item.dataset.at);
        item.classList.toggle('is-done', at <= index);
        item.classList.toggle('is-now', at === index);
      });
      message.textContent = state.message;
      restart(bubble, 'is-changing');
      if (speak) announce(live, state.live);
    };
    buttons.forEach((button) => button.addEventListener('click', () => setFee(Number(button.dataset.feeStep), true)));
    setFee(0, false);
  }

  /* ---------- Démonstration : OPTAM ---------- */
  const optam = $('[data-demo="optam"]');
  if (optam) {
    // Exemple fictif : base remboursable, dépassements et part au tarif opposable de l'année.
    const BASE = 96000;
    const DEPASSEMENTS = 55680;
    const OPPOSABLE = 21120;
    const ACTE = 240;
    const PLAFOND_TD = 70;
    const ENGAGEMENT_TO = 25;
    const ECHELLE_TO = 50;
    const range = $('#sim-range');
    const output = $('#sim-output');
    const result = $('#sim-result');
    const tdValue = $('[data-td]', optam);
    const toValue = $('[data-to]', optam);
    const tdFill = $('[data-td-fill]', optam);
    const toFill = $('[data-to-fill]', optam);
    const tdStatus = $('[data-td-status]', optam);
    const toStatus = $('[data-to-status]', optam);
    const live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    optam.appendChild(live);
    let speakTimer = 0;

    const update = (speak) => {
      const n = Number(range.value);
      const base = BASE + ACTE * n;
      const td = (DEPASSEMENTS / base) * 100;
      const to = ((OPPOSABLE + ACTE * n) / base) * 100;
      const reached = to >= ENGAGEMENT_TO - 1e-9;
      tdValue.textContent = pct(td);
      toValue.textContent = pct(to);
      tdFill.style.setProperty('--v', `${td}%`);
      toFill.style.setProperty('--v', `${Math.min(100, (to / ECHELLE_TO) * 100)}%`);
      toFill.classList.toggle('is-warn', !reached);
      if (td <= PLAFOND_TD) setChip(tdStatus, 'ok', 'Dans l’objectif', 'check');
      else setChip(tdStatus, 'warn', 'Au-dessus du plafond', 'alert');
      if (reached) setChip(toStatus, 'ok', 'Engagement atteint', 'check');
      else setChip(toStatus, 'warn', `Sous l’engagement de ${pct(ENGAGEMENT_TO - to).replace(NBSP + '%', '')}${NBSP}point${ENGAGEMENT_TO - to >= 2 ? 's' : ''}`, 'alert');
      output.textContent = `+${plural(n, 'acte')}`;
      range.setAttribute('aria-valuetext', `${plural(n, 'acte')} au tarif opposable`);
      range.style.setProperty('--p', `${(n / Number(range.max)) * 100}%`);
      const sentence = n === 0
        ? `Sans acte supplémentaire, la part projetée reste à ${pct(to)}.`
        : `Avec ${plural(n, 'acte')} de plus, la part projetée atteint ${pct(to)}${reached ? ' : engagement atteint.' : '.'}`;
      result.textContent = sentence;
      if (speak) {
        window.clearTimeout(speakTimer);
        speakTimer = window.setTimeout(() => announce(live, `${sentence} Taux de dépassement projeté : ${pct(td)}.`), 450);
      }
    };
    range.addEventListener('input', () => update(true));
    update(false);

    if (hasIO) {
      const optamObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        optam.classList.add('is-shown');
        optamObserver.disconnect();
      }, { threshold: 0.3 });
      optamObserver.observe(optam);
    } else {
      optam.classList.add('is-shown');
    }
  }

  /* ---------- Démonstration : parcours patient ---------- */
  const parcours = $('[data-demo="parcours"]');
  if (parcours) {
    const screen = $('[data-parcours-screen]', parcours);
    const phone = $('[data-parcours-phone]', parcours);
    const propose = $('[data-parcours-propose]', parcours);
    const sign = $('[data-parcours-sign]', parcours);
    const reset = $('[data-parcours-reset]', parcours);
    const empty = $('[data-phone-empty]', parcours);
    const content = $('[data-phone-content]', parcours);
    const live = $('[data-live]', parcours);
    const piece = (name) => $(`[data-piece-state="${name}"]`, parcours);
    const phoneState = (name) => $(`[data-phone-state="${name}"]`, parcours);
    const phoneTick = (name) => $(`[data-phone-tick="${name}"]`, parcours);
    const flash = (element) => restart(element, 'is-flash');

    const setInitial = () => {
      screen.dataset.state = 'draft';
      phone.dataset.state = 'empty';
      setChip(piece('devis'), 'ok', 'Prêt');
      setChip(piece('consentement'), 'ok', 'Prêt');
      setChip(piece('ordo'), 'line', 'À valider');
      setChip(piece('postop'), 'line', 'À valider');
      propose.removeAttribute('aria-disabled');
      propose.innerHTML = 'Proposer au patient';
      empty.hidden = false;
      content.hidden = true;
      phoneState('devis').textContent = 'À accepter';
      phoneState('consent').textContent = 'À signer';
      phoneTick('devis').classList.remove('is-on');
      phoneTick('consent').classList.remove('is-on');
      sign.removeAttribute('aria-disabled');
      sign.disabled = false;
      sign.innerHTML = 'Accepter et signer <span>(simulation patient)</span>';
    };

    propose.addEventListener('click', () => {
      if (screen.dataset.state !== 'draft') return;
      screen.dataset.state = 'sent';
      setChip(piece('ordo'), 'ok', 'Signées', 'check');
      setChip(piece('postop'), 'soft', 'Programmées');
      flash(piece('ordo'));
      flash(piece('postop'));
      propose.setAttribute('aria-disabled', 'true');
      propose.innerHTML = `${icon('check')}Envoyé à M.${NBSP}Moreau`;
      empty.hidden = true;
      content.hidden = false;
      restart(content, 'is-arriving');
      phone.dataset.state = 'sent';
      announce(live, 'Parcours envoyé à M. Moreau. Les ordonnances préopératoires sont signées par votre clic. Dans l’aperçu du téléphone, le bouton Accepter et signer est disponible.');
    });

    sign.addEventListener('click', () => {
      if (phone.dataset.state !== 'sent') return;
      phone.dataset.state = 'signed';
      phoneState('devis').textContent = 'Accepté';
      phoneState('consent').textContent = 'Signé par code SMS';
      phoneTick('devis').classList.add('is-on');
      phoneTick('consent').classList.add('is-on');
      setChip(piece('devis'), 'ok', 'Accepté', 'check');
      setChip(piece('consentement'), 'ok', 'Signé', 'check');
      flash(piece('devis'));
      flash(piece('consentement'));
      sign.setAttribute('aria-disabled', 'true');
      sign.innerHTML = `Signé par code SMS <span>(simulation)</span>`;
      announce(live, 'M. Moreau a accepté le devis et signé le consentement par code SMS. Simulation.');
    });

    reset.addEventListener('click', () => {
      setInitial();
      announce(live, 'Démonstration réinitialisée.');
    });
    setInitial();
  }

  /* ---------- Démonstration : secrétariat ---------- */
  const secretariat = $('[data-demo="secretariat"]');
  if (secretariat) {
    const filterButtons = $$('[data-filter]', secretariat);
    const rows = $$('[data-dossiers] > li', secretariat);
    const live = $('[data-live]', secretariat);
    filterButtons.forEach((button) => button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      let shown = 0;
      rows.forEach((row) => {
        const visible = filter === 'all' || row.dataset.status === filter;
        row.hidden = !visible;
        if (visible) { shown += 1; restart(row, 'is-entering'); }
      });
      announce(live, `${plural(shown, 'dossier')} affiché${shown > 1 ? 's' : ''}.`);
    }));
    $$('[data-remind]', secretariat).forEach((button) => button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('is-done');
      button.innerHTML = `${icon('check')}Relancé`;
      const next = button.parentElement.querySelector('.row-next');
      if (next) next.textContent = `Relance envoyée par SMS à 12${NBSP}h${NBSP}30`;
      announce(live, `Relance envoyée à ${button.dataset.remind}. Simulation.`);
    }));
  }

  /* ---------- Démonstration : dossier médical ---------- */
  const dossier = $('[data-demo="dossier"]');
  if (dossier) {
    const subtabs = $$('[role="tab"]', dossier);
    const subpanels = subtabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const live = $('[data-live]', dossier);
    const selectSub = (index, focus) => {
      subtabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        subpanels[i].hidden = !on;
      });
      if (focus) subtabs[index].focus();
    };
    subtabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectSub(index, false));
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = (index + 1) % subtabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + subtabs.length) % subtabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = subtabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        selectSub(next, true);
      });
    });
    const inbox = $('[data-inbox]', dossier);
    const validate = $('[data-validate-doc]', dossier);
    const docList = $('[data-doc-list]', dossier);
    validate.addEventListener('click', () => {
      if (inbox.classList.contains('is-done')) { selectSub(1, false); return; }
      inbox.classList.add('is-done');
      $('.inbox-icon', inbox).innerHTML = icon('check');
      $('.inbox-text', inbox).innerHTML = `<b>Bilan biologique validé et classé</b><small>Ajouté aux documents du dossier</small>`;
      validate.textContent = 'Voir les documents';
      const item = document.createElement('li');
      item.className = 'is-new';
      item.innerHTML = `${icon('upload')}<span>Bilan biologique préopératoire<small>Envoyé par le patient, validé par le praticien</small></span><span class="chip chip-ok">Validé</span>`;
      docList.prepend(item);
      selectSub(1, false);
      announce(live, 'Bilan biologique validé et classé dans les documents du dossier. Onglet Documents affiché.');
    });
  }

  /* ---------- Dialogues ---------- */
  const body = document.body;
  const dialogs = $$('dialog');
  const menuDialog = $('#menu-dialog');
  const menuToggle = $('.menu-toggle');
  const contactDialog = $('#contact-dialog');
  const infoDialog = $('#info-dialog');
  let opener = null;
  let pendingTarget = null;

  const anyOpen = () => dialogs.some((dialog) => dialog.open);
  const openDialog = (dialog, from) => {
    if (!dialog || dialog.open) return;
    dialogs.forEach((other) => { if (other.open) other.close(); });
    opener = from || document.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    body.classList.add('is-locked');
    if (dialog === menuDialog && menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    updateMobileCta();
  };
  dialogs.forEach((dialog) => {
    $$('[data-close]', dialog).forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog || dialog === menuDialog) return;
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!anyOpen()) body.classList.remove('is-locked');
      if (dialog === menuDialog && menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
      if (pendingTarget) {
        const target = pendingTarget;
        pendingTarget = null;
        scrollToElement(target);
        const heading = target.querySelector('h2') || target;
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        try { heading.focus({ preventScroll: true }); } catch (error) { heading.focus(); }
      } else if (opener && document.contains(opener) && opener.offsetParent !== null) {
        opener.focus();
      }
      opener = null;
      updateMobileCta();
    });
  });

  if (menuToggle && menuDialog) {
    menuToggle.addEventListener('click', () => openDialog(menuDialog, menuToggle));
    $$('a[href^="#"]', menuDialog).forEach((link) => link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      pendingTarget = target;
      menuDialog.close();
    }));
    window.addEventListener('resize', () => { if (menuDialog.open && window.innerWidth > 1180) menuDialog.close(); }, { passive: true });
  }
  $$('[data-info]').forEach((button) => button.addEventListener('click', () => openDialog(infoDialog, button)));

  /* ---------- Contact (courriel préparé, aucune donnée enregistrée) ---------- */
  const form = $('#contact-form');
  let lastMessage = '';
  if (contactDialog && form) {
    const title = $('#contact-title');
    const messageLabel = $('[data-message-label]', form);
    const message = $('#f-message');
    const name = $('#f-name');
    const sent = $('#contact-sent');
    const setIntent = (intent) => {
      const question = intent === 'question';
      $$('input[name="intent"]', form).forEach((radio) => { radio.checked = radio.value === (question ? 'question' : 'presentation'); });
      title.textContent = question ? 'Poser une question' : 'Demander une présentation';
      messageLabel.innerHTML = question ? 'Votre question' : 'Votre message <span class="opt">(facultatif)</span>';
      message.required = question;
    };
    const showError = (field, errorId, show) => {
      field.setAttribute('aria-invalid', show ? 'true' : 'false');
      $(`#${errorId}`).hidden = !show;
    };
    $$('[data-contact]').forEach((button) => button.addEventListener('click', () => {
      setIntent(button.dataset.contact);
      sent.hidden = true;
      openDialog(contactDialog, button);
      window.setTimeout(() => name.focus(), 30);
    }));
    $$('input[name="intent"]', form).forEach((radio) => radio.addEventListener('change', () => setIntent(radio.value)));
    name.addEventListener('input', () => { if (name.value.trim()) showError(name, 'f-name-error', false); });
    message.addEventListener('input', () => { if (message.value.trim()) showError(message, 'f-message-error', false); });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const intent = String(data.get('intent') || 'presentation');
      const value = (key) => String(data.get(key) || '').trim();
      const nameOk = Boolean(value('name'));
      const messageOk = intent !== 'question' || Boolean(value('message'));
      showError(name, 'f-name-error', !nameOk);
      showError(message, 'f-message-error', !messageOk);
      if (!nameOk) { name.focus(); return; }
      if (!messageOk) { message.focus(); return; }
      const subject = intent === 'question' ? 'Question sur HONOLYS' : 'Demande de présentation HONOLYS';
      const lines = [
        'Bonjour,',
        '',
        intent === 'question' ? 'J’ai une question sur HONOLYS.' : 'Je souhaite une présentation de HONOLYS.',
        '',
        `Nom : ${value('name')}`
      ];
      if (value('specialty')) lines.push(`Spécialité : ${value('specialty')}`);
      if (value('place')) lines.push(`Ville ou établissement : ${value('place')}`);
      if (value('phone')) lines.push(`Téléphone : ${value('phone')}`);
      if (value('message')) lines.push('', value('message'));
      lines.push('', 'Bien cordialement,', value('name'));
      const text = lines.join('\n');
      lastMessage = `Objet : ${subject}\n\n${text}`;
      sent.hidden = false;
      window.location.href = `mailto:contact@honolys.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    });
  }

  /* ---------- Copier ---------- */
  const copyText = async (text, host) => {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (error) { /* repli ci-dessous */ }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      (host || document.body).appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch (error) { return false; }
  };
  $$('[data-copy], [data-copy-message]').forEach((button) => button.addEventListener('click', async () => {
    const text = button.hasAttribute('data-copy-message') ? lastMessage : button.dataset.copy;
    if (!text) return;
    const label = button.querySelector('span');
    const initial = label.textContent;
    const ok = await copyText(text, button.closest('dialog'));
    label.textContent = ok ? 'Copié' : 'Copie impossible : sélectionnez le texte';
    button.classList.toggle('is-done', ok);
    announce(globalLive, ok ? 'Copié dans le presse-papiers.' : 'La copie automatique n’est pas disponible.');
    window.setTimeout(() => { label.textContent = initial; button.classList.remove('is-done'); }, 2600);
  }));

  /* ---------- Barre d'action mobile ---------- */
  const mobileCta = $('#mobile-cta');
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  let heroInView = true;
  let endInView = false;
  let hideTimer = 0;
  function updateMobileCta() {
    if (!mobileCta) return;
    const show = mobileQuery.matches && !heroInView && !endInView && !anyOpen();
    window.clearTimeout(hideTimer);
    if (show) {
      mobileCta.hidden = false;
      mobileCta.inert = false;
      window.requestAnimationFrame(() => mobileCta.classList.remove('is-away'));
    } else if (!mobileCta.hidden) {
      mobileCta.classList.add('is-away');
      mobileCta.inert = true;
      hideTimer = window.setTimeout(() => { mobileCta.hidden = true; }, reduced() ? 0 : 360);
    }
  }
  if (mobileCta && hasIO) {
    mobileCta.classList.add('is-away');
    const heroActions = $('#hero-actions');
    const ends = [$('#contact'), $('.site-footer')].filter(Boolean);
    const endState = new Map();
    if (heroActions) {
      new IntersectionObserver(([entry]) => { heroInView = entry.isIntersecting || entry.boundingClientRect.top > 0; updateMobileCta(); }).observe(heroActions);
    }
    const endObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => endState.set(entry.target, entry.isIntersecting));
      endInView = Array.from(endState.values()).some(Boolean);
      updateMobileCta();
    });
    ends.forEach((element) => endObserver.observe(element));
    const onQuery = () => updateMobileCta();
    if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', onQuery);
    else if (mobileQuery.addListener) mobileQuery.addListener(onQuery);
  }
})();

