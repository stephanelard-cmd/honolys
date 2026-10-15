/* Interactions locales des pages d’information : aucune requête ni stockage. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const all = selector => Array.from(document.querySelectorAll(selector));
  const normal = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
  const announce = text => { const live = $('#support-live'); if (live) live.textContent = text; };
  const copy = async (text, button) => {
    try { await navigator.clipboard.writeText(text); button.textContent = 'Copié'; announce('Copié dans le presse-papiers.'); }
    catch { announce('La copie automatique est indisponible. Sélectionnez le texte pour le copier.'); button.textContent = 'Sélectionnez le texte pour copier'; }
  };
  all('[data-copy-text]').forEach(button => { button.hidden = false; button.addEventListener('click', () => copy(button.dataset.copyText, button)); });

  const search = $('#faq-search');
  if (search) {
    $('[data-faq-tools]').hidden = false;
    const groups = all('.faq-category');
    const entries = groups.flatMap(group => Array.from(group.querySelectorAll('details')).map(detail => ({detail, group, text: normal(detail.textContent)})));
    const toggle = $('#faq-toggle');
    const syncToggle = () => {
      const shown = entries.filter(({detail}) => !detail.hidden);
      toggle.textContent = shown.length && shown.every(({detail}) => detail.open) ? 'Tout replier' : 'Tout déplier';
      toggle.disabled = shown.length === 0;
    };
    const filter = () => {
      const words = normal(search.value).split(' ').filter(Boolean);
      entries.forEach(({detail,text}) => { detail.hidden = !words.every(word => text.includes(word)); });
      groups.forEach(group => { group.hidden = !entries.some(entry => entry.group === group && !entry.detail.hidden); });
      const count = entries.filter(({detail}) => !detail.hidden).length;
      $('#faq-count').textContent = words.length ? `${count} question${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}` : `${entries.length} questions · ${groups.length} thèmes`;
      $('#faq-empty').hidden = count !== 0;
      all('.topic-nav a').forEach(link => { const group = groups.find(g => '#' + g.id === link.getAttribute('href')); link.hidden = !!group?.hidden; });
      syncToggle();
    };
    search.addEventListener('input', filter);
    $('#faq-clear').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
    toggle.addEventListener('click', () => {
      const shown = entries.filter(({detail}) => !detail.hidden);
      const open = !shown.every(({detail}) => detail.open);
      shown.forEach(({detail}) => { detail.open = open; });
      syncToggle();
    });
    entries.forEach(({detail}) => detail.addEventListener('toggle', syncToggle));
    const revealHash = () => {
      let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (target?.tagName === 'DETAILS') {
        if (target.hidden) { search.value = ''; filter(); }
        target.open = true;
        target.scrollIntoView({block:'start'});
      }
    };
    window.addEventListener('hashchange', revealHash);
    revealHash();
  }

  const form = $('#support-contact');
  if (form) {
    form.hidden = false;
    const subjects = {presentation:'Demande de présentation HONOLYS',tarifs:'Tarifs et périmètre HONOLYS',question:'Question sur HONOLYS',retour:'Retour sur le projet HONOLYS',donnees:'Demande relative à mes données',acces:'Problème d’accès à HONOLYS'};
    const intent = new URLSearchParams(location.search).get('objet');
    if (Object.hasOwn(subjects, intent)) $('#contact-intent').value = intent;
    let prepared = '';
    const invalidate = () => { $('#message-result').hidden = true; prepared = ''; };
    form.addEventListener('input', invalidate);
    form.addEventListener('change', invalidate);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const value = key => String(data.get(key) || '').trim();
      if (!value('name')) { $('#contact-name').focus(); announce('Indiquez votre nom.'); return; }
      if (!value('message')) { $('#contact-message').focus(); announce('Écrivez votre message.'); return; }
      const subject = subjects[value('intent')] || subjects.question;
      const lines = ['Bonjour,','',value('message'),'','Nom : ' + value('name')];
      if (value('specialty')) lines.push('Spécialité : ' + value('specialty'));
      if (value('place')) lines.push('Ville ou établissement : ' + value('place'));
      if (value('phone')) lines.push('Téléphone : ' + value('phone'));
      lines.push('','Bien cordialement,',value('name'));
      const body = lines.join('\n');
      prepared = `À : contact@honolys.fr\nObjet : ${subject}\n\n${body}`;
      $('#message-text').textContent = prepared;
      $('#message-mailto').href = `mailto:contact@honolys.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $('#message-copy').textContent = 'Copier le message';
      $('#message-result').hidden = false;
      $('#message-result').focus();
      announce('Message préparé. Aucun courriel n’a été envoyé.');
    });
    $('#message-copy').addEventListener('click', event => { if (prepared) copy(prepared, event.currentTarget); });
  }
})();
