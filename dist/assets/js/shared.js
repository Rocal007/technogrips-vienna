/* ═══════════════════════════════════════════════
   Technogrips Vienna – Shared JavaScript
   CMS Loader · i18n · Nav · Footer · Scroll Anim
   ═══════════════════════════════════════════════ */
(function() {
  'use strict';

  // ── State ─────────────────────────────────────
  window.TG = window.TG || {};
  TG.lang = localStorage.getItem('lang') || 'de';
  TG.cms  = {};

  // ── CMS Loader ────────────────────────────────
  TG.loadCms = async function() {
    try {
      const [r1, r2] = await Promise.all([
        fetch('../../api/content'),
        fetch('../../api/sections')
      ]);
      if (r1.ok) TG.cms = await r1.json();
      if (r2.ok) TG.sections = await r2.json();
      TG.applyCms();
      TG.applySections();
    } catch(e) { /* fallback to HTML defaults */ }
  };

  TG.applyCms = function() {
    // Patch data-de / data-en attributes
    document.querySelectorAll('[data-cms]').forEach(el => {
      const [sec, key] = el.getAttribute('data-cms').split('.');
      const entry = TG.cms[sec]?.[key];
      if (!entry) return;
      if (entry.de) el.setAttribute('data-de', entry.de);
      if (entry.en) el.setAttribute('data-en', entry.en);
    });
    // Plain text (numbers, not translated)
    document.querySelectorAll('[data-cms-text]').forEach(el => {
      const [sec, key] = el.getAttribute('data-cms-text').split('.');
      const v = TG.cms[sec]?.[key]?.de;
      if (v) el.textContent = v;
    });
    // Image sources from CMS
    document.querySelectorAll('[data-cms-img]').forEach(el => {
      const [sec, key] = el.getAttribute('data-cms-img').split('.');
      const v = TG.cms[sec]?.[key]?.de;
      if (v) el.setAttribute('src', v);
    });
    // Contact placeholders
    const phone    = TG.cms.contact?.phone?.de;
    const email    = TG.cms.contact?.email?.de;
    const location = TG.cms.contact?.location?.de;
    if (phone)    document.querySelectorAll('[data-cms-contact="phone"]').forEach(e => e.textContent = phone);
    if (email)    document.querySelectorAll('[data-cms-contact="email"]').forEach(e => e.textContent = email);
    if (location) document.querySelectorAll('[data-cms-contact="location"]').forEach(e => e.textContent = location);
    // Re-apply language
    TG.applyLang(TG.lang);
  };

  // ── Section Visibility ────────────────────────
  TG.applySections = function() {
    if (!TG.sections || !TG.activePage) return;
    let page = TG.activePage;
    if (page === 'produkt') page = 'supertechno-50';
    if (page === 'index') page = 'home';
    const visibility = TG.sections[page];
    if (visibility) {
      Object.keys(visibility).forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = visibility[sec] ? '' : 'none';
      });
    }
  };

  // ── i18n ──────────────────────────────────────
  TG.applyLang = function(lang) {
    TG.lang = lang;
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-de],[data-en]').forEach(el => {
      const txt = el.getAttribute('data-' + lang);
      if (txt && el.tagName !== 'INPUT' && el.tagName !== 'SELECT') el.textContent = txt;
    });
    const langText = document.getElementById('langText');
    const langIcon = document.getElementById('langIcon');
    if (langText) langText.textContent = lang.toUpperCase();
    if (langIcon) langIcon.textContent = lang === 'de' ? '🇩🇪' : '🇬🇧';
    document.documentElement.lang = lang;
    // Update SEO
    const t = TG.cms.seo?.title;
    const d = TG.cms.seo?.description;
    if (t) document.title = lang === 'en' ? (t.en || t.de) : t.de;
    if (d) { const m = document.querySelector('meta[name="description"]'); if(m) m.content = lang === 'en' ? (d.en||d.de) : d.de; }
  };

  // ── Navigation HTML ───────────────────────────
  TG.navHTML = function(activePage) {
    const links = [
      { href: '/leistungen', de: 'Leistungen', en: 'Services', page: 'leistungen' },
      { href: '/supertechno-50', de: 'Supertechno 50+', en: 'Supertechno 50+', page: 'produkt' },
      { href: '/tracking', de: 'Tracking & Telemetrie', en: 'Tracking & Telemetry', page: 'tracking' },
      { href: '/ueber-uns', de: 'Über uns', en: 'About', page: 'ueber-uns' },
      { href: '/kontakt', de: 'Kontakt', en: 'Contact', page: 'kontakt' },
    ];
    const desktopLinks = links.map(l => {
      const active = l.page === activePage ? 'text-gold-400 nav-active' : 'text-gray-400 hover:text-gold-400';
      return `<a href="${l.href}" class="text-sm ${active} transition-colors" data-de="${l.de}" data-en="${l.en}">${l.de}</a>`;
    }).join('');
    const mobileLinks = links.map(l => {
      return `<a href="${l.href}" class="text-gray-300 hover:text-gold-400 py-2 border-b border-white/5" data-de="${l.de}" data-en="${l.en}">${l.de}</a>`;
    }).join('');
    return `
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="../../" class="flex items-center gap-3 no-underline">
      <div class="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center">
        <svg viewBox="0 0 24 24" class="w-6 h-6 text-black fill-current"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      </div>
      <div>
        <div class="text-lg font-800 tracking-tight leading-none text-white">Technogrips</div>
        <div class="text-xs font-600 tracking-[0.2em] uppercase" style="color:#e5c500">Vienna</div>
      </div>
    </a>
    <div class="hidden lg:flex items-center gap-8">${desktopLinks}</div>
    <div class="flex items-center gap-3">
      <button id="langToggle" class="flex items-center gap-1 text-sm glass px-3 py-1.5 rounded-full hover:border-gold-500/40 transition-all cursor-pointer">
        <span id="langIcon">🇩🇪</span>
        <span id="langText" class="font-600" style="color:#e5c500">DE</span>
        <svg class="w-3 h-3 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <a href="../../kontakt/index.html" class="btn-gold px-5 py-2 rounded-xl text-sm font-700 hidden sm:block" data-de="Jetzt anfragen" data-en="Get a Quote">Jetzt anfragen</a>
      <button id="menuBtn" class="lg:hidden p-2 text-gray-400 hover:text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobileMenu" class="hidden lg:hidden glass border-t border-gold-500/10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
      ${mobileLinks}
      <a href="../../kontakt/index.html" class="btn-gold px-5 py-2.5 rounded-xl text-sm font-700 text-center mt-2" data-de="Jetzt anfragen" data-en="Get a Quote">Jetzt anfragen</a>
    </div>
  </div>
</nav>`;
  };

  // ── Footer HTML ───────────────────────────────
  TG.footerHTML = function() {
    return `
<footer style="background:#020817;border-top:1px solid rgba(255,255,255,0.05);padding:3rem 0">
  <div class="max-w-7xl mx-auto px-6">
    <div class="grid md:grid-cols-4 gap-8 mb-10">
      <div class="md:col-span-2">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" class="w-6 h-6 text-black fill-current"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div class="text-lg font-800">Technogrips Vienna</div>
            <div class="text-xs font-600 tracking-widest uppercase" style="color:#e5c500">Kamerakran &amp; Operator</div>
          </div>
        </div>
        <p class="text-sm leading-relaxed max-w-xs" style="color:#6b7280" data-de="Professionelle Supertechno Kamerakrane mit erfahrenem Operator-Service. Wien, Österreich." data-en="Professional Supertechno camera cranes with experienced operator service. Vienna, Austria.">Professionelle Supertechno Kamerakrane mit erfahrenem Operator-Service. Wien, Österreich.</p>
      </div>
      <div>
        <h4 class="font-700 text-sm mb-4" data-de="Seiten" data-en="Pages">Seiten</h4>
        <ul class="space-y-2">
          <li><a href="../../leistungen/index.html" class="text-sm transition-colors" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-de="Leistungen" data-en="Services">Leistungen</a></li>
          <li><a href="../../supertechno-50/index.html" class="text-sm transition-colors" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'">Supertechno 50+</a></li>
          <li><a href="../../tracking" class="text-sm transition-colors" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-de="Tracking & Telemetrie" data-en="Tracking & Telemetry">Tracking & Telemetrie</a></li>
          <li><a href="../../ueber-uns/index.html" class="text-sm transition-colors" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-de="Über uns" data-en="About">Über uns</a></li>
          <li><a href="../../kontakt/index.html" class="text-sm transition-colors" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-de="Kontakt" data-en="Contact">Kontakt</a></li>
          <li><a href="../../admin" class="text-xs transition-colors" style="color:#374151" onmouseover="this.style.color='#6b7280'" onmouseout="this.style.color='#374151'">Admin</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-700 text-sm mb-4" data-de="Rechtliches" data-en="Legal">Rechtliches</h4>
        <ul class="space-y-2">
          <li><a href="#" class="text-sm transition-colors" style="color:#6b7280" data-de="Impressum" data-en="Imprint">Impressum</a></li>
          <li><a href="#" class="text-sm transition-colors" style="color:#6b7280" data-de="Datenschutz" data-en="Privacy Policy">Datenschutz</a></li>
          <li><a href="#" class="text-sm transition-colors" style="color:#6b7280" data-de="AGB" data-en="Terms">AGB</a></li>
        </ul>
      </div>
    </div>
    <div style="padding-top:2rem;border-top:1px solid rgba(255,255,255,0.05)" class="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="text-sm" style="color:#374151">© <span id="currentYear"></span> Technogrips Vienna. <span data-de="Alle Rechte vorbehalten." data-en="All rights reserved.">Alle Rechte vorbehalten.</span></div>
      <div class="flex items-center gap-2">
        <span class="text-xs" style="color:#374151" data-de="Powered by" data-en="Powered by">Powered by</span>
        <a href="https://www.supertechno.com" target="_blank" class="text-xs transition-colors" style="color:#a69000" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#a69000'">Supertechno®</a>
      </div>
    </div>
  </div>
</footer>`;
  };

  // ── Toast ─────────────────────────────────────
  TG.toast = function(type, title, msg) {
    let t = document.getElementById('tg-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tg-toast';
      t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:200;max-width:22rem;display:none';
      t.innerHTML = '<div id="tg-toast-inner" class="rounded-xl px-5 py-4 shadow-2xl flex items-start gap-3"><span id="tg-toast-icon" style="font-size:1.25rem;margin-top:2px"></span><div><div id="tg-toast-title" style="font-weight:700;font-size:0.875rem;margin-bottom:2px"></div><div id="tg-toast-msg" style="font-size:0.75rem;opacity:0.7"></div></div></div>';
      document.body.appendChild(t);
    }
    document.getElementById('tg-toast-inner').className = (type==='success' ? 'success-toast' : 'error-toast') + ' rounded-xl px-5 py-4 shadow-2xl flex items-start gap-3';
    document.getElementById('tg-toast-icon').textContent = type === 'success' ? '✅' : '❌';
    document.getElementById('tg-toast-title').textContent = title;
    document.getElementById('tg-toast-msg').textContent = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 5000);
  };

  // ── API Submit ────────────────────────────────
  TG.submit = async function(endpoint, data) {
    data.language = TG.lang;
    const r = await fetch('../../api/leads/' + endpoint, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data)
    });
    return r.json();
  };

  TG.getFormData = function(form) {
    const d = {};
    new FormData(form).forEach((v, k) => d[k] = v);
    return d;
  };

  // ── Newsletter ────────────────────────────────
  TG.submitNewsletter = async function(e) {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await TG.submit('newsletter', TG.getFormData(form));
      if (res.success) { TG.toast('success', TG.lang==='de'?'Angemeldet!':'Subscribed!', res.message); form.reset(); }
      else TG.toast('error', 'Fehler', res.error);
    } catch(err) { TG.toast('error', 'Fehler', 'Netzwerkfehler.'); }
  };

  // ── Init ──────────────────────────────────────
  TG.init = function(activePage) {
    TG.activePage = activePage || 'home';
    // Inject nav
    const navContainer = document.getElementById('nav-container');
    if (navContainer) navContainer.innerHTML = TG.navHTML(activePage);

    // Inject footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) footerContainer.innerHTML = TG.footerHTML();

    // Year
    const y = document.getElementById('currentYear');
    if (y) y.textContent = new Date().getFullYear();

    // Nav scroll
    const navbar = document.getElementById('navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('glass','shadow-2xl');
        else navbar.classList.remove('glass','shadow-2xl');
      });
    }

    // Mobile menu
    document.addEventListener('click', e => {
      const btn = document.getElementById('menuBtn');
      const menu = document.getElementById('mobileMenu');
      if (btn && btn.contains(e.target)) menu?.classList.toggle('hidden');
      else if (menu && !menu.contains(e.target)) menu?.classList.add('hidden');
    });

    // Lang toggle
    document.addEventListener('click', e => {
      if (e.target.closest('#langToggle')) TG.applyLang(TG.lang === 'de' ? 'en' : 'de');
    });

    // Scroll animations
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.observe,.observe-left,.observe-right').forEach(el => observer.observe(el));

    // Smooth scroll (same-page anchors)
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); }
      });
    });

    // Load CMS then apply language
    TG.loadCms().then(() => TG.applyLang(TG.lang));
  };

  // ── Broken Image Handler ──────────────────────
  window.addEventListener('error', function(e) {
    const target = e.target;
    if (target && target.tagName && target.tagName.toLowerCase() === 'img') {
      if (target.dataset.fallbackApplied) return;
      target.dataset.fallbackApplied = 'true';

      const galleryParent = target.closest('.gallery-item');
      if (galleryParent) {
        galleryParent.style.display = 'none';
        return;
      }
      target.src = '../../assets/images/crane_50.png'; 
    }
  }, true);

})();
