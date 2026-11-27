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
    const endpoint = form.dataset.endpoint;
    // Numéro WhatsApp de HONOLYS (attribut data-whatsapp), chiffres seuls au format international. Vide : bouton masqué.
    const whatsapp = String(form.dataset.whatsapp || '').replace(/\D/g, '').replace(/^0(\d{9})$/, '33$1');
    const sendButton = form.querySelector('[data-send]');
    const whatsappButton = form.querySelector('[data-whatsapp-btn]');
    if (whatsappButton && /^\d{8,15}$/.test(whatsapp)) whatsappButton.hidden = false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let prepared = '';
    const resetStatus = () => { $('#message-result').hidden = true; $('#message-sent').hidden = true; $('#message-error').hidden = true; prepared = ''; };
    form.addEventListener('input', resetStatus);
    form.addEventListener('change', resetStatus);
    const read = () => {
      const data = new FormData(form);
      const value = key => String(data.get(key) || '').trim();
      if (!value('name')) { $('#contact-name').focus(); announce('Indiquez votre nom.'); return null; }
      if (!emailPattern.test(value('email'))) { $('#contact-email').focus(); announce('Indiquez une adresse e-mail valide.'); return null; }
      if (!value('message')) { $('#contact-message').focus(); announce('Écrivez votre message.'); return null; }
      const intention = Object.hasOwn(subjects, value('intent')) ? value('intent') : 'question';
      return {intention, nom:value('name'), email:value('email'), specialite:value('specialty'), lieu:value('place'), telephone:value('phone'), message:value('message'), site:value('site')};
    };
    const compose = d => {
      const lines = ['Bonjour,','',d.message,'','Nom : ' + d.nom,'E-mail : ' + d.email];
      if (d.specialite) lines.push('Spécialité : ' + d.specialite);
      if (d.lieu) lines.push('Ville ou établissement : ' + d.lieu);
      if (d.telephone) lines.push('Téléphone : ' + d.telephone);
      lines.push('','Bien cordialement,',d.nom);
      return lines.join('\n');
    };
    const send = async d => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(endpoint, {method:'POST', mode:'cors', credentials:'omit', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d), signal:controller.signal});
        const body = await response.json().catch(() => ({}));
        return response.ok && body.ok === true ? {ok:true} : {ok:false, statut:response.status, erreur:typeof body.erreur === 'string' ? body.erreur : ''};
      } catch { return {ok:false, statut:0, erreur:''}; }
      finally { clearTimeout(timer); }
    };
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sendButton.disabled) return;
      resetStatus();
      const d = read();
      if (!d) return;
      const label = sendButton.querySelector('span');
      sendButton.disabled = true; sendButton.setAttribute('aria-busy','true'); label.textContent = 'Envoi en cours…';
      const result = await send(d);
      sendButton.disabled = false; sendButton.setAttribute('aria-busy','false'); label.textContent = 'Envoyer mon message →';
      if (result.ok) {
        $('#message-sent [data-sent-email]').textContent = d.email;
        $('#message-sent').hidden = false;
        $('#message-sent').focus();
        $('#contact-message').value = '';
        announce('Votre message est envoyé.');
        return;
      }
      if ((result.statut === 400 || result.statut === 429) && result.erreur) {
        $('#message-error').textContent = result.erreur;
        $('#message-error').hidden = false;
        announce(result.erreur);
        return;
      }
      // Serveur injoignable ou envoi indisponible : message prêt à envoyer depuis la messagerie.
      const subject = subjects[d.intention];
      const body = compose(d);
      prepared = `À : contact@honolys.fr\nObjet : ${subject}\n\n${body}`;
      $('#message-text').textContent = prepared;
      $('#message-mailto').href = `mailto:contact@honolys.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $('#message-copy').textContent = 'Copier le message';
      $('#message-result').hidden = false;
      $('#message-result').focus();
      announce('L’envoi direct n’a pas abouti. Votre message est prêt à envoyer depuis votre messagerie.');
    });
    if (whatsappButton) whatsappButton.addEventListener('click', () => {
      resetStatus();
      const d = read();
      if (!d || !whatsapp) return;
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(subjects[d.intention] + '\n\n' + compose(d))}`, '_blank', 'noopener');
    });
    $('#message-copy').addEventListener('click', event => { if (prepared) copy(prepared, event.currentTarget); });
  }
})();
