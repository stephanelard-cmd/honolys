(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))e(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&e(i)}).observe(document,{childList:!0,subtree:!0});function r(t){const n={};return t.integrity&&(n.integrity=t.integrity),t.referrerPolicy&&(n.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?n.credentials="include":t.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function e(t){if(t.ep)return;t.ep=!0;const n=r(t);fetch(t.href,n)}})();const u=`
<a class="skip-link" href="#main">Aller au contenu</a>
<header class="site-header" id="header">
  <div class="container header-inner">
    <a href="./index.html" class="brand">HONO<span class="brand-accent">LYS</span></a>
    <nav class="nav" id="nav" aria-label="Navigation principale">
      <a href="./index.html#parcours" data-anchor="parcours">Parcours</a>
      <a href="./index.html#optam" data-anchor="optam">Veille OPTAM</a>
      <a href="./index.html#offres" data-anchor="offres">Offres</a>
      <a href="./faq.html" data-page="faq.html">Questions</a>
      <a class="btn btn-primary btn-sm" href="mailto:contact@honolys.fr?subject=Demande%20de%20d%C3%A9monstration%20HONOLYS">Demander une démo</a>
    </nav>
    <button class="menu-toggle" id="menuToggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
`,f=`
<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <a href="./index.html" class="brand footer-brand-link">HONOLYS</a>
      <p>Gestion des dépassements d'honoraires, avec un module dossier facultatif pour les chirurgiens libéraux.</p>
      <p><a href="mailto:contact@honolys.fr">contact@honolys.fr</a></p>
    </div>
    <div class="footer-legal">
      <h3>Mentions légales</h3>
      <p>HONOLYS SASU au capital de 1 500 € — 9 rue du Docteur Leray, 95880 Enghien-les-Bains — RCS Pontoise, SIREN 109 914 853</p>
      <p>Président et directeur de la publication : Dr Stéphane Elard</p>
      <p>Hébergeur : GitHub, Inc. — 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis</p>
      <p>Contact : <a href="mailto:contact@honolys.fr">contact@honolys.fr</a> · © <span id="year"></span> HONOLYS. Maquettes et exemples : données fictives, aucune donnée patient réelle.</p>
    </div>
  </div>
</footer>
`;function p(){const o=document.body;o.insertAdjacentHTML("afterbegin",u),o.insertAdjacentHTML("beforeend",f);const s=window.location.pathname.split("/").pop()||"index.html",r=s==="index.html"||s==="";document.querySelectorAll(".nav a:not(.btn)").forEach(e=>{e.dataset.page&&e.dataset.page===s&&e.classList.add("active"),r&&e.dataset.anchor&&e.setAttribute("href","#"+e.dataset.anchor),r&&e.dataset.anchor===s.replace("#","")&&e.classList.add("active")})}function m(){const o=document.getElementById("year");o&&(o.textContent=String(new Date().getFullYear()));const s=document.getElementById("header"),r=()=>s==null?void 0:s.classList.toggle("scrolled",window.scrollY>8);r(),window.addEventListener("scroll",r,{passive:!0});const e=document.getElementById("menuToggle"),t=document.getElementById("nav"),n=()=>{t==null||t.classList.remove("open"),e==null||e.classList.remove("open"),e==null||e.setAttribute("aria-expanded","false")};e==null||e.addEventListener("click",()=>{const a=t==null?void 0:t.classList.toggle("open");e.classList.toggle("open",a),e.setAttribute("aria-expanded",String(a))}),t==null||t.querySelectorAll("a").forEach(a=>a.addEventListener("click",n));const i=document.querySelectorAll(".flow-card, .flow-card-5, .offer-card, .product-card, .benefit, .section-head, .cta-inner, .pricing-card, .mockup, .faq-item, .faq-teaser, .legal-block, .optam-gauge, .demo");if(i.forEach(a=>a.classList.add("reveal")),"IntersectionObserver"in window){const a=new IntersectionObserver(c=>{c.forEach(l=>{l.isIntersecting&&(l.target.classList.add("in"),a.unobserve(l.target))})},{threshold:.12});i.forEach(c=>a.observe(c))}else i.forEach(a=>a.classList.add("in"))}p();m();function h(){const o=document.getElementById("optamSlider");if(!o)return;const s=document.getElementById("optamValue"),r=document.getElementById("optamStatus"),e=document.getElementById("optamFill"),t=document.getElementById("optamMargin"),n=parseInt(o.dataset.threshold||"60",10),i=()=>{const a=parseInt(o.value,10);s&&(s.textContent=a+" %"),e&&(e.style.width=Math.min(a,100)+"%");const c=n-a,l=a>=n-5&&a<n,d=a>=n;e==null||e.classList.toggle("alert",l),e==null||e.classList.toggle("danger",d),s==null||s.classList.toggle("alert",d),r==null||r.classList.toggle("alert",d),r&&(r.textContent=d?"Au-dessus de l'engagement":l?"Proche du seuil":"Dans l'engagement"),t&&(t.textContent=d?"Seuil dépassé de "+(a-n)+" point"+(a-n>1?"s":""):"Marge restante : "+c+" point"+(c>1?"s":"")+" avant l'engagement.",t.classList.toggle("alert",d))};o.addEventListener("input",i),i()}function g(){const o=document.getElementById("copyEmail");o&&o.addEventListener("click",async()=>{try{await navigator.clipboard.writeText("contact@honolys.fr"),o.textContent="Copié",o.classList.add("copied"),setTimeout(()=>{o.textContent="Copier",o.classList.remove("copied")},2e3)}catch{window.location.href="mailto:contact@honolys.fr"}})}h();g();
