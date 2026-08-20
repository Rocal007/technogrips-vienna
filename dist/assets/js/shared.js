/**
 * Technogrips Vienna - Shared Frontend Module
 * Production-ready with 4 Languages (DE, EN, FR, CS)
 */
(function() {
  'use strict';

  window.TG = window.TG || {};

  const LANG_CONFIG = {
    de: { icon: '🇩🇪', label: 'DE', name: 'Deutsch' },
    en: { icon: '🇬🇧', label: 'EN', name: 'English' },
    fr: { icon: '🇫🇷', label: 'FR', name: 'Français' },
    cs: { icon: '🇨🇿', label: 'CS', name: 'Čeština' }
  };

  TG.lang = localStorage.getItem('lang') || 'de';
  TG.cms = {};
  TG.sections = {};

  // ── CMS Loader ─────────────────────────────────
  TG.loadCms = async function() {
    try {
      let res = await fetch('/api/content');
      if (!res.ok) res = await fetch('/api/content.php');
      if (!res.ok) throw new Error('CMS fetch failed');
      TG.cms = await res.json();
      TG.applyCms();
    } catch (e) {
      // Fallback: use inline data attributes
    }
  };

  // ── Apply CMS to DOM ───────────────────────────
  TG.applyCms = function() {
    // 1. Rich / Multilingual text elements (data-cms="section.key")
    document.querySelectorAll('[data-cms]').forEach(el => {
      const [sec, key] = el.getAttribute('data-cms').split('.');
      const entry = TG.cms[sec]?.[key];
      if (!entry) return;
      if (entry.de !== undefined) el.setAttribute('data-de', entry.de);
      if (entry.en !== undefined) el.setAttribute('data-en', entry.en);
      if (entry.fr !== undefined) el.setAttribute('data-fr', entry.fr);
      if (entry.cs !== undefined) el.setAttribute('data-cs', entry.cs);
    });

    // 2. Plain text / specs / counters (data-cms-text="section.key")
    document.querySelectorAll('[data-cms-text]').forEach(el => {
      const [sec, key] = el.getAttribute('data-cms-text').split('.');
      let entry = TG.cms[sec]?.[key];
      if (!entry && sec === 'about' && TG.cms.hero?.[key]) {
        entry = TG.cms.hero[key];
      }
      if (!entry) return;
      const val = (typeof entry === 'object') ? (entry[TG.lang] || entry.de || entry.en || entry.fr || entry.cs || '') : entry;
      if (val !== undefined && val !== '') {
        el.textContent = val;
      }
    });

    // 3. Images (data-cms-img="section.key")
    document.querySelectorAll('[data-cms-img]').forEach(el => {
      const [sec, key] = el.getAttribute('data-cms-img').split('.');
      const val = (typeof TG.cms[sec]?.[key] === 'object') ? (TG.cms[sec]?.[key]?.de || TG.cms[sec]?.[key]?.en) : TG.cms[sec]?.[key];
      if (val) el.src = val;
    });

    const phoneMobile = TG.cms.contact?.phone_mobile?.de;
    const phoneOffice = TG.cms.contact?.phone_office?.de;
    const phone = TG.cms.contact?.phone?.de;
    const email = TG.cms.contact?.email?.de;
    const location = TG.cms.contact?.location?.de;
    const activePhone = phoneMobile || phone || phoneOffice;

    // Apply text content
    if (phoneMobile) document.querySelectorAll('[data-cms-contact="phone_mobile"]').forEach(el => el.textContent = phoneMobile);
    if (phoneOffice) document.querySelectorAll('[data-cms-contact="phone_office"]').forEach(el => el.textContent = phoneOffice);
    if (phone) document.querySelectorAll('[data-cms-contact="phone"]').forEach(el => el.textContent = phone);
    else if (activePhone) document.querySelectorAll('[data-cms-contact="phone"]').forEach(el => el.textContent = activePhone);
    if (email) document.querySelectorAll('[data-cms-contact="email"]').forEach(el => el.textContent = email);
    if (location) document.querySelectorAll('[data-cms-contact="location"]').forEach(el => el.textContent = location);

    // Apply href links
    if (activePhone) {
      document.querySelectorAll('[data-cms-contact-href="phone"]').forEach(el => el.href = 'tel:' + activePhone.replace(/\s+/g, ''));
      document.querySelectorAll('a[data-cms-contact="phone"]').forEach(el => el.href = 'tel:' + activePhone.replace(/\s+/g, ''));
    }
    if (phoneMobile) {
      document.querySelectorAll('[data-cms-contact-href="phone_mobile"]').forEach(el => el.href = 'tel:' + phoneMobile.replace(/\s+/g, ''));
      document.querySelectorAll('a[data-cms-contact="phone_mobile"]').forEach(el => el.href = 'tel:' + phoneMobile.replace(/\s+/g, ''));
    }
    if (phoneOffice) {
      document.querySelectorAll('[data-cms-contact-href="phone_office"]').forEach(el => el.href = 'tel:' + phoneOffice.replace(/\s+/g, ''));
      document.querySelectorAll('a[data-cms-contact="phone_office"]').forEach(el => el.href = 'tel:' + phoneOffice.replace(/\s+/g, ''));
    }
    if (email) {
      document.querySelectorAll('[data-cms-contact-href="email"]').forEach(el => el.href = 'mailto:' + email.trim());
      document.querySelectorAll('a[data-cms-contact="email"]').forEach(el => el.href = 'mailto:' + email.trim());
    }

    TG.applySections();
    TG.applyLang(TG.lang);
  };

  // ── Apply Section Visibility ───────────────────
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
    if (!LANG_CONFIG[lang]) lang = 'de';
    TG.lang = lang;
    localStorage.setItem('lang', lang);

    document.querySelectorAll('[data-de],[data-en],[data-fr],[data-cs],.i18n').forEach(el => {
      const txt = el.getAttribute('data-' + lang) || el.getAttribute('data-en') || el.getAttribute('data-de');
      if (txt && el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA') {
        el.textContent = txt;
      }
    });

    // Update plain text / specs / counters (data-cms-text="section.key")
    document.querySelectorAll('[data-cms-text]').forEach(el => {
      const [sec, key] = el.getAttribute('data-cms-text').split('.');
      let entry = TG.cms[sec]?.[key];
      if (!entry && sec === 'about' && TG.cms.hero?.[key]) {
        entry = TG.cms.hero[key];
      }
      if (!entry) return;
      const val = (typeof entry === 'object') ? (entry[lang] || entry.de || entry.en || entry.fr || entry.cs || '') : entry;
      if (val !== undefined && val !== '') {
        el.textContent = val;
      }
    });

    // Form inputs and placeholders
    document.querySelectorAll('[data-placeholder-de],[data-placeholder-en],[data-placeholder-fr],[data-placeholder-cs]').forEach(el => {
      const pl = el.getAttribute('data-placeholder-' + lang) || el.getAttribute('data-placeholder-en') || el.getAttribute('data-placeholder-de');
      if (pl) el.setAttribute('placeholder', pl);
    });

    // Update Desktop Header Dropdown current button
    const cfg = LANG_CONFIG[lang] || LANG_CONFIG.de;
    const langIcon = document.getElementById('langIcon');
    const langText = document.getElementById('langText');
    if (langIcon) langIcon.textContent = cfg.icon;
    if (langText) langText.textContent = cfg.label;

    // Update Mobile buttons active state
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang-btn');
      if (btnLang === lang) {
        btn.classList.add('is-active', 'bg-gold-500', 'text-black');
        btn.classList.remove('text-gray-300', 'hover:bg-white/10');
      } else {
        btn.classList.remove('is-active', 'bg-gold-500', 'text-black');
        btn.classList.add('text-gray-300', 'hover:bg-white/10');
      }
    });

    // Update Desktop dropdown active item
    document.querySelectorAll('[data-lang-val]').forEach(item => {
      const itemLang = item.getAttribute('data-lang-val');
      if (itemLang === lang) {
        item.classList.add('text-gold-400', 'bg-gold-500/10');
      } else {
        item.classList.remove('text-gold-400', 'bg-gold-500/10');
      }
    });

    document.documentElement.lang = lang;

    // Update SEO
    const t = TG.cms.seo?.title;
    const d = TG.cms.seo?.description;
    if (t) document.title = t[lang] || t.en || t.de;
    if (d) {
      const m = document.querySelector('meta[name="description"]');
      if (m) m.content = d[lang] || d.en || d.de;
    }
  };

  // ── Navigation HTML ───────────────────────────
  TG.navHTML = function(activePage) {
    const links = [
      { href: '/', de: 'Startseite', en: 'Home', fr: 'Accueil', cs: 'Domů', page: 'home', cms: 'nav.link_home' },
      { href: '/leistungen', de: 'Leistungen', en: 'Services', fr: 'Services', cs: 'Služby', page: 'leistungen', cms: 'nav.link_services' },
      { href: '/supertechno-50', de: 'Supertechno 50+', en: 'Supertechno 50+', fr: 'Supertechno 50+', cs: 'Supertechno 50+', page: 'produkt', cms: 'nav.link_product' },
      { href: '/tracking', de: 'Tracking & Telemetrie', en: 'Tracking & Telemetry', fr: 'Tracking & Télémétrie', cs: 'Tracking a telemetrie', page: 'tracking', cms: 'nav.link_tracking' },
      { href: '/ueber-uns', de: 'Über uns', en: 'About', fr: 'À propos', cs: 'O nás', page: 'ueber-uns', cms: 'nav.link_about' },
      { href: '/kontakt', de: 'Kontakt', en: 'Contact', fr: 'Contact', cs: 'Kontakt', page: 'kontakt', cms: 'nav.link_contact' },
    ];
    const isLinkActive = (l) => l.page === activePage || (l.page === 'produkt' && activePage === 'supertechno-50') || (l.page === 'home' && activePage === 'index');
    const desktopLinks = links.map(l => {
      const active = isLinkActive(l) ? 'text-gold-400 nav-active' : 'text-gray-400 hover:text-gold-400';
      return `<a href="${l.href}" class="text-sm ${active} transition-colors i18n" data-cms="${l.cms}" data-de="${l.de}" data-en="${l.en}" data-fr="${l.fr}" data-cs="${l.cs}">${l.de}</a>`;
    }).join('');
    const mobileLinks = links.map(l => {
      const active = isLinkActive(l) ? 'text-gold-400' : 'text-gray-300 hover:text-gold-400';
      return `<a href="${l.href}" class="${active} py-2 border-b border-white/5 i18n" data-cms="${l.cms}" data-de="${l.de}" data-en="${l.en}" data-fr="${l.fr}" data-cs="${l.cs}">${l.de}</a>`;
    }).join('');
    const curCfg = LANG_CONFIG[TG.lang] || LANG_CONFIG.de;
    return `
<nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-navy-950/80 backdrop-blur-md border-b border-white/5">
  <div class="w-full px-4 sm:px-6 lg:px-10 py-2 sm:py-2.5 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 sm:gap-3 no-underline shrink-0 max-w-[calc(100%-55px)]">
      <img src="/assets/images/logo_transparent.png" alt="Technogrips Logo" class="h-10 sm:h-12 lg:h-[120px] w-auto object-contain shrink-0">
      <div class="min-w-0">
        <div class="text-xl sm:text-2xl lg:text-4xl font-800 tracking-tight leading-none text-white">Technogrips</div>
        <div class="text-[9px] sm:text-[10px] lg:text-xs font-600 tracking-[0.2em] uppercase" style="color:#e5c500">Vienna</div>
      </div>
    </a>

    <!-- Desktop Nav -->
    <div class="desktop-nav hidden lg:flex items-center gap-8">
      ${desktopLinks}
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-3">
      <!-- Language Dropdown (Desktop only) -->
      <div class="relative hidden lg:block" id="langDropdownContainer">
        <button id="langToggle" class="lang-toggle-btn items-center gap-1.5 text-sm glass px-3.5 py-1.5 rounded-full hover:border-gold-500/40 transition-all cursor-pointer inline-flex">
          <span id="langIcon">${curCfg.icon}</span>
          <span id="langText" class="font-600" style="color:#e5c500">${curCfg.label}</span>
          <svg class="w-3 h-3 text-gray-400 ml-0.5 transition-transform duration-200" id="langArrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="langDropdown" class="hidden absolute right-0 mt-2 w-36 rounded-xl shadow-2xl py-1.5 z-50 border border-gold-500/20 backdrop-blur-xl bg-navy-950/95">
          <button type="button" class="lang-option w-full px-3.5 py-2 text-left text-xs font-600 hover:bg-gold-500/15 hover:text-gold-400 flex items-center gap-2 transition-colors cursor-pointer text-gray-300" data-lang-val="de">
            <span>🇩🇪</span> <span>Deutsch</span>
          </button>
          <button type="button" class="lang-option w-full px-3.5 py-2 text-left text-xs font-600 hover:bg-gold-500/15 hover:text-gold-400 flex items-center gap-2 transition-colors cursor-pointer text-gray-300" data-lang-val="en">
            <span>🇬🇧</span> <span>English</span>
          </button>
          <button type="button" class="lang-option w-full px-3.5 py-2 text-left text-xs font-600 hover:bg-gold-500/15 hover:text-gold-400 flex items-center gap-2 transition-colors cursor-pointer text-gray-300" data-lang-val="fr">
            <span>🇫🇷</span> <span>Français</span>
          </button>
          <button type="button" class="lang-option w-full px-3.5 py-2 text-left text-xs font-600 hover:bg-gold-500/15 hover:text-gold-400 flex items-center gap-2 transition-colors cursor-pointer text-gray-300" data-lang-val="cs">
            <span>🇨🇿</span> <span>Čeština</span>
          </button>
        </div>
      </div>

      <!-- CTA Button (Desktop only) -->
      <a id="desktopCtaBtn" href="/kontakt" class="btn-gold desktop-only-btn px-5 py-2 rounded-xl text-sm font-700 hidden lg:inline-flex i18n" data-cms="nav.cta_btn" data-de="Jetzt anfragen" data-en="Get a Quote" data-fr="Demander un devis" data-cs="Poptat nyní">Jetzt anfragen</a>

      <!-- Mobile menu button -->
      <button id="menuBtn" class="lg:hidden p-2 text-gray-400 hover:text-white cursor-pointer" aria-label="Menü öffnen">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>

  <!-- Mobile Menu (Hamburger) -->
  <div id="mobileMenu" class="hidden lg:hidden glass border-t border-gold-500/10">
    <div class="w-full px-6 lg:px-10 py-4 flex flex-col gap-3">
      ${mobileLinks}
      
      <!-- Mobile Language Switcher inside Hamburger (Single-line with national accents) -->
      <div class="pt-3 border-t border-white/10 flex flex-col gap-2 mt-1">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400 font-600 uppercase tracking-wider i18n" data-cms="nav.mobile_lang_label" data-de="Sprache" data-en="Language" data-fr="Langue" data-cs="Jazyk">Sprache</span>
          <span class="text-[10px] text-gray-500 font-mono tracking-wider uppercase">Region</span>
        </div>
        <div class="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-navy-900/90 border border-white/10 shadow-inner">
          <button type="button" class="lang-btn-mobile lang-btn-de py-2 px-1.5 rounded-lg text-xs font-700 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent" data-lang-btn="de">
            <span class="text-sm shrink-0 leading-none">🇩🇪</span>
            <span class="text-[11px] font-700 tracking-wide">DE</span>
          </button>
          <button type="button" class="lang-btn-mobile lang-btn-en py-2 px-1.5 rounded-lg text-xs font-700 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent" data-lang-btn="en">
            <span class="text-sm shrink-0 leading-none">🇬🇧</span>
            <span class="text-[11px] font-700 tracking-wide">EN</span>
          </button>
          <button type="button" class="lang-btn-mobile lang-btn-fr py-2 px-1.5 rounded-lg text-xs font-700 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent" data-lang-btn="fr">
            <span class="text-sm shrink-0 leading-none">🇫🇷</span>
            <span class="text-[11px] font-700 tracking-wide">FR</span>
          </button>
          <button type="button" class="lang-btn-mobile lang-btn-cs py-2 px-1.5 rounded-lg text-xs font-700 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent" data-lang-btn="cs">
            <span class="text-sm shrink-0 leading-none">🇨🇿</span>
            <span class="text-[11px] font-700 tracking-wide">CS</span>
          </button>
        </div>
      </div>

      <!-- Mobile CTA Button inside Hamburger -->
      <a href="/kontakt" class="btn-gold px-5 py-2.5 rounded-xl text-sm font-700 text-center mt-2 i18n" data-cms="nav.cta_btn" data-de="Jetzt anfragen" data-en="Get a Quote" data-fr="Demander un devis" data-cs="Poptat nyní">Jetzt anfragen</a>
    </div>
  </div>
</nav>`;
  };

  // ── Footer HTML ───────────────────────────────
  TG.footerHTML = function() {
    return `
<footer style="background:#020817;border-top:1px solid rgba(255,255,255,0.05);padding:3rem 0">
  <div class="w-full px-6 lg:px-10">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <img src="/assets/images/logo_transparent.png" alt="Technogrips Logo" class="h-12 w-auto object-contain">
          <div>
            <div class="text-lg font-800">Technogrips Vienna</div>
            <div class="text-xs font-600 tracking-widest uppercase" style="color:#e5c500">Kamerakran &amp; Operator</div>
          </div>
        </div>
        <p class="text-sm leading-relaxed max-w-xs i18n" style="color:#6b7280" data-cms="footer.company_desc" data-de="Professionelle Supertechno Kamerakrane mit erfahrenem Operator-Service. Wien, Österreich." data-en="Professional Supertechno camera cranes with experienced operator service. Vienna, Austria." data-fr="Grues de caméra professionnelles Supertechno avec service d'opérateur expérimenté. Vienne, Autriche." data-cs="Profesionální kamerové jeřáby Supertechno se zkušeným operátorem. Vídeň, Rakousko.">Professionelle Supertechno Kamerakrane mit erfahrenem Operator-Service. Wien, Österreich.</p>
      </div>
      <div>
        <h4 class="font-700 text-sm mb-4 i18n" data-cms="footer.col1_title" data-de="Seiten" data-en="Pages" data-fr="Pages" data-cs="Stránky">Seiten</h4>
        <ul class="space-y-2">
          <li><a href="/leistungen" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="nav.link_services" data-de="Leistungen" data-en="Services" data-fr="Services" data-cs="Služby">Leistungen</a></li>
          <li><a href="/supertechno-50" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="nav.link_product">Supertechno 50+</a></li>
          <li><a href="/tracking" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="nav.link_tracking" data-de="Tracking & Telemetrie" data-en="Tracking & Telemetry" data-fr="Tracking & Télémétrie" data-cs="Tracking a telemetrie">Tracking & Telemetrie</a></li>
          <li><a href="/ueber-uns" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="nav.link_about" data-de="Über uns" data-en="About" data-fr="À propos" data-cs="O nás">Über uns</a></li>
          <li><a href="/kontakt" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="nav.link_contact" data-de="Kontakt" data-en="Contact" data-fr="Contact" data-cs="Kontakt">Kontakt</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-700 text-sm mb-4 i18n" data-cms="footer.col2_title" data-de="Kontakt" data-en="Contact" data-fr="Contact" data-cs="Kontakt">Kontakt</h4>
        <ul class="space-y-2.5">
          <li>
            <a href="tel:+436504542261" class="text-sm transition-colors flex items-center gap-2 group" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms-contact-href="phone_mobile">
              <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span data-de="Mobil" data-en="Mobile" data-fr="Mobile" data-cs="Mobil">Mobil</span>
            </a>
          </li>
          <li>
            <a href="tel:+436765919172" class="text-sm transition-colors flex items-center gap-2 group" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms-contact-href="phone_office">
              <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span data-de="Office" data-en="Office" data-fr="Bureau" data-cs="Kancelář">Office</span>
            </a>
          </li>
          <li>
            <a href="mailto:office@technogrips-vienna.at" class="text-sm transition-colors flex items-center gap-2 group" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms-contact-href="email">
              <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <span data-de="E-Mail" data-en="Email" data-fr="E-mail" data-cs="E-mail">E-Mail</span>
            </a>
          </li>
          <li class="text-sm flex items-center gap-2" style="color:#6b7280">
            <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
            <span data-cms-contact="location">Wien, Österreich</span>
          </li>
        </ul>
      </div>
      <div>
        <h4 class="font-700 text-sm mb-4 i18n" data-cms="footer.col3_title" data-de="Rechtliches" data-en="Legal" data-fr="Mentions légales" data-cs="Právní informace">Rechtliches</h4>
        <ul class="space-y-2">
          <li><a href="/impressum" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="footer.link_imprint" data-de="Impressum" data-en="Imprint" data-fr="Mentions légales" data-cs="Impresum">Impressum</a></li>
          <li><a href="/datenschutz" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="footer.link_privacy" data-de="Datenschutz" data-en="Privacy Policy" data-fr="Protection des données" data-cs="Ochrana údajů">Datenschutz</a></li>
          <li><a href="/agb" class="text-sm transition-colors i18n" style="color:#6b7280" onmouseover="this.style.color='#e5c500'" onmouseout="this.style.color='#6b7280'" data-cms="footer.link_terms" data-de="AGB" data-en="Terms" data-fr="Conditions générales" data-cs="Obchodní podmínky">AGB</a></li>
        </ul>
      </div>
    </div>
    <div style="padding-top:2rem;border-top:1px solid rgba(255,255,255,0.05)" class="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="text-sm" style="color:#374151">© <span id="currentYear"></span> Technogrips Vienna. <span class="i18n" data-cms="footer.copyright" data-de="Alle Rechte vorbehalten." data-en="All rights reserved." data-fr="Tous droits réservés." data-cs="Všechna práva vyhrazena.">Alle Rechte vorbehalten.</span></div>
      <div class="flex items-center gap-2">
        <span class="text-xs" style="color:#374151" data-de="Powered by" data-en="Powered by" data-fr="Propulsé par" data-cs="Běží na">Powered by</span>
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
    data.type = data.type || endpoint;
    const r = await fetch('/api/booking', {
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
    const titles = { de: 'Angemeldet!', en: 'Subscribed!', fr: 'Inscrit !', cs: 'Přihlášeno!' };
    const errTitles = { de: 'Fehler', en: 'Error', fr: 'Erreur', cs: 'Chyba' };
    const netErrors = { de: 'Netzwerkfehler.', en: 'Network error.', fr: 'Erreur réseau.', cs: 'Chyba sítě.' };
    try {
      const res = await TG.submit('newsletter', TG.getFormData(form));
      if (res.success) {
        TG.toast('success', titles[TG.lang] || titles.de, res.message);
        form.reset();
      } else {
        TG.toast('error', errTitles[TG.lang] || errTitles.de, res.error);
      }
    } catch(err) {
      TG.toast('error', errTitles[TG.lang] || errTitles.de, netErrors[TG.lang] || netErrors.de);
    }
  };

  // ── Mobile Contact Bar HTML ───────────────────
  TG.mobileContactBarHTML = function() {
    return `
<div id="mobileContactBar" class="mobile-contact-bar md:hidden" aria-label="Mobile Schnellkontakt">
  <div class="flex items-center justify-between gap-2 max-w-lg mx-auto">
    <!-- Call -->
    <a href="tel:+436504542261" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-700 bg-navy-900/90 border border-white/10 text-white hover:border-gold-500/40 active:scale-95 transition-all text-center no-underline shadow-sm" data-cms-contact-href="phone_mobile">
      <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
      <span class="i18n truncate" data-de="Anrufen" data-en="Call" data-fr="Appeler" data-cs="Zavolat">Anrufen</span>
    </a>
    <!-- Email -->
    <a href="mailto:office@technogrips-vienna.at" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-700 bg-navy-900/90 border border-white/10 text-white hover:border-gold-500/40 active:scale-95 transition-all text-center no-underline shadow-sm" data-cms-contact-href="email">
      <svg class="w-4 h-4 text-gold-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      <span class="i18n truncate" data-de="E-Mail" data-en="Email" data-fr="E-mail" data-cs="E-mail">E-Mail</span>
    </a>
    <!-- Anfragen / Kontakt -->
    <a href="/kontakt" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-700 btn-gold text-black active:scale-95 transition-all text-center no-underline shadow-[0_0_12px_rgba(229,197,0,0.35)]">
      <svg class="w-4 h-4 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      <span class="i18n truncate" data-de="Anfragen" data-en="Inquire" data-fr="Demander" data-cs="Poptat">Anfragen</span>
    </a>
  </div>
</div>`;
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

    // Inject mobile contact bar if not already present
    if (!document.getElementById('mobileContactBar')) {
      const barWrapper = document.createElement('div');
      barWrapper.innerHTML = TG.mobileContactBarHTML();
      document.body.appendChild(barWrapper.firstElementChild);
    }

    // Scroll listener for mobile contact bar (visible only after scrolling > 300px)
    const mobileBar = document.getElementById('mobileContactBar');
    if (mobileBar) {
      const updateMobileBarVisibility = () => {
        if (window.scrollY > 300) {
          mobileBar.classList.add('is-visible');
        } else {
          mobileBar.classList.remove('is-visible');
        }
      };
      window.addEventListener('scroll', updateMobileBarVisibility, { passive: true });
      updateMobileBarVisibility();
    }

    // Year
    const y = document.getElementById('currentYear');
    if (y) y.textContent = new Date().getFullYear();

    // Nav scroll & mobile hide on scroll > 300px
    const navbar = document.getElementById('navbar');
    const mobileMenu = document.getElementById('mobileMenu');
    if (navbar) {
      const handleNavbarScroll = () => {
        if (window.scrollY > 50) navbar.classList.add('glass','shadow-2xl');
        else navbar.classList.remove('glass','shadow-2xl');

        // Mobile hide after 300px scroll
        const isMobile = window.innerWidth < 1024;
        const menuOpen = mobileMenu && !mobileMenu.classList.contains('hidden');
        if (isMobile && window.scrollY > 300 && !menuOpen) {
          navbar.classList.add('nav-hidden');
        } else {
          navbar.classList.remove('nav-hidden');
        }
      };
      window.addEventListener('scroll', handleNavbarScroll, { passive: true });
      window.addEventListener('resize', handleNavbarScroll, { passive: true });
      handleNavbarScroll();
    }

    // Mobile menu toggle
    document.addEventListener('click', e => {
      const btn = document.getElementById('menuBtn');
      const menu = document.getElementById('mobileMenu');
      if (btn && btn.contains(e.target)) {
        menu?.classList.toggle('hidden');
        if (navbar && !menu?.classList.contains('hidden')) {
          navbar.classList.remove('nav-hidden');
        }
      } else if (menu && !menu.contains(e.target) && !e.target.closest('#menuBtn')) {
        menu?.classList.add('hidden');
      }
    });

    // Language Dropdown and Button Click Handlers
    document.addEventListener('click', e => {
      const toggle = e.target.closest('#langToggle');
      const dropdown = document.getElementById('langDropdown');
      const arrow = document.getElementById('langArrow');
      const opt = e.target.closest('[data-lang-val]');
      const mobileBtn = e.target.closest('[data-lang-btn]');

      if (toggle) {
        e.stopPropagation();
        if (dropdown) {
          dropdown.classList.toggle('hidden');
          if (arrow) arrow.classList.toggle('rotate-180');
        }
      } else if (opt) {
        const l = opt.getAttribute('data-lang-val');
        TG.applyLang(l);
        if (dropdown) dropdown.classList.add('hidden');
        if (arrow) arrow.classList.remove('rotate-180');
      } else if (mobileBtn) {
        const l = mobileBtn.getAttribute('data-lang-btn');
        TG.applyLang(l);
      } else {
        if (dropdown && !dropdown.contains(e.target)) {
          dropdown.classList.add('hidden');
          if (arrow) arrow.classList.remove('rotate-180');
        }
      }
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
      target.src = '/assets/images/crane_50.png'; 
    }
  }, true);

})();