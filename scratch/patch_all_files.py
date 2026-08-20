import re
import os

def patch_ueber_uns():
    path = 'public/ueber-uns/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Timeline section
    html = re.sub(
        r'<div class="section-label justify-center"><span class="line"></span><span[^>]*data-de="Unsere Geschichte"[^>]*>Unsere Geschichte</span><span class="line"></span></div>',
        r'<div class="section-label justify-center"><span class="line"></span><span class="i18n" data-cms="about.timeline_label" data-de="Unsere Geschichte" data-en="Our story" data-fr="Notre parcours" data-cs="Náš příběh">Unsere Geschichte</span><span class="line"></span></div>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl font-800"[^>]*data-de="Von der Leidenschaft zur Expertise"[^>]*>Von der Leidenschaft zur Expertise</h2>',
        r'<h2 class="text-4xl font-800 i18n" data-cms="about.timeline_title" data-de="Von der Leidenschaft zur Expertise" data-en="From passion to expertise" data-fr="De la passion à l\'expertise" data-cs="Od vášně k profesionalitě">Von der Leidenschaft zur Expertise</h2>',
        html
    )
    
    # Milestones
    html = re.sub(
        r'<div class="text-gold-400 font-700 text-sm mb-1">1990–1995</div>\s*<h4 class="font-700 mb-2"[^>]*data-de="Die Anfänge am Set"[^>]*>Die Anfänge am Set</h4>\s*<p class="text-gray-400 text-sm leading-relaxed"[^>]*data-de="Einstieg in die Filmbranche[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<div class="text-gold-400 font-700 text-sm mb-1" data-cms-text="about.milestone1_year">1990–1995</div>\n            <h4 class="font-700 mb-2 i18n" data-cms="about.milestone1_title" data-de="Die Anfänge am Set" data-en="The Beginnings" data-fr="Les débuts sur le plateau" data-cs="Začátky na place">Die Anfänge am Set</h4>\n            <p class="text-gray-400 text-sm leading-relaxed i18n" data-cms="about.milestone1_desc" data-de="Einstieg in die Filmbranche als Boom Operator, Requisiteur, Garderoben- und Produktionsfahrer. Fundamentale Erfahrungen am Set." data-en="Entry into the film industry as a boom operator, prop master, wardrobe, and production driver. Acquiring fundamental on-set experience." data-fr="Débuts dans l\'industrie cinématographique comme perchman, accessoiriste, chauffeur de production. Acquisition d\'une solide expérience de terrain." data-cs="Vstup do filmového průmyslu jako zvukař s mikrofonem, rekvizitář, kostymérský a produkční řidič. Získání základních zkušeností na place.">Einstieg in die Filmbranche als Boom Operator, Requisiteur, Garderoben- und Produktionsfahrer. Fundamentale Erfahrungen am Set.</p>',
        html
    )

    html = re.sub(
        r'<div class="text-gold-400 font-700 text-sm mb-1">1995–2015</div>\s*<h4 class="font-700 mb-2"[^>]*data-de="Spezialisierung & Remote Heads"[^>]*>Spezialisierung &amp; Remote Heads</h4>\s*<p class="text-gray-400 text-sm leading-relaxed"[^>]*data-de="Entwicklung zum Key Grip[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<div class="text-gold-400 font-700 text-sm mb-1" data-cms-text="about.milestone2_year">1995–2015</div>\n            <h4 class="font-700 mb-2 i18n" data-cms="about.milestone2_title" data-de="Spezialisierung & Remote Heads" data-en="Specialization & Remote Heads" data-fr="Spécialisation & Têtes télécommandées" data-cs="Specializace a dálkově ovládané hlavy">Spezialisierung &amp; Remote Heads</h4>\n            <p class="text-gray-400 text-sm leading-relaxed i18n" data-cms="about.milestone2_desc" data-de="Entwicklung zum Key Grip, Dolly Grip und Operator für Motion Control sowie stabilisierte Remote Heads. Erste Einsätze an High-End-Systemen." data-en="Transitioning into Key Grip, Dolly Grip, and operator for motion control and stabilized remote heads. First deployments on high-end systems." data-fr="Évolution vers les postes de chef machiniste (Key Grip), machiniste travelling (Dolly Grip) et opérateur motion control & têtes gyrostabilisées." data-cs="Vývoj na pozice Key Grip, Dolly Grip a operátora pro motion control i stabilizované hlavy. První nasazení na špičkových systémech.", "textarea">Entwicklung zum Key Grip, Dolly Grip und Operator für Motion Control sowie stabilisierte Remote Heads. Erste Einsätze an High-End-Systemen.</p>',
        html
    )

    html = re.sub(
        r'<div class="text-gold-400 font-700 text-sm mb-1">2015</div>\s*<h4 class="font-700 mb-2"[^>]*data-de="Upgrade & Blockbuster"[^>]*>Upgrade &amp; Blockbuster</h4>\s*<p class="text-gray-400 text-sm leading-relaxed"[^>]*data-de="Upgrade auf den Supertechno 50\+[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<div class="text-gold-400 font-700 text-sm mb-1" data-cms-text="about.milestone3_year">2015</div>\n            <h4 class="font-700 mb-2 i18n" data-cms="about.milestone3_title" data-de="Upgrade & Blockbuster" data-en="Upgrade & Blockbusters" data-fr="Montée en puissance & Blockbusters" data-cs="Upgrade a filmové hity">Upgrade &amp; Blockbuster</h4>\n            <p class="text-gray-400 text-sm leading-relaxed i18n" data-cms="about.milestone3_desc" data-de="Upgrade auf den Supertechno 50+ mit S-Head. Mitwirkung an internationalen Großproduktionen wie Mission: Impossible (Austrian Key Grip), Agent 47, Woman in Gold und 300." data-en="Upgraded to Supertechno 50+ with S-Head. Collaborating on major international productions like Mission: Impossible (Austrian Key Grip), Agent 47, Woman in Gold, and 300." data-fr="Acquisition du Supertechno 50+ avec tête S-Head. Collaboration à des blockbusters internationaux tels que Mission: Impossible (Key Grip Autriche), Agent 47, La Femme au tableau et 300." data-cs="Upgrade na Supertechno 50+ s hlavou S-Head. Účast na velkých mezinárodních produkcích jako Mission: Impossible (rakouský Key Grip), Agent 47, Dáma ve zlatém nebo 300.">Upgrade auf den Supertechno 50+ mit S-Head. Mitwirkung an internationalen Großproduktionen wie Mission: Impossible (Austrian Key Grip), Agent 47, Woman in Gold und 300.</p>',
        html
    )

    html = re.sub(
        r'<div class="text-gold-400 font-700 text-sm mb-1">Heute</div>\s*<h4 class="font-700 mb-2"[^>]*data-de="U-Crane, Marvel & Globale Projekte"[^>]*>U-Crane, Marvel &amp; Globale Projekte</h4>\s*<p class="text-gray-400 text-sm leading-relaxed"[^>]*data-de="Weltweite U-Crane[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<div class="text-gold-400 font-700 text-sm mb-1 i18n" data-cms="about.milestone4_year" data-de="Heute" data-en="Today" data-fr="Aujourd\'hui" data-cs="Dnes">Heute</div>\n            <h4 class="font-700 mb-2 i18n" data-cms="about.milestone4_title" data-de="U-Crane, Marvel & Globale Projekte" data-en="U-Crane, Marvel & Global Projects" data-fr="U-Crane, Marvel & Projets mondiaux" data-cs="U-Crane, Marvel a globální projekty">U-Crane, Marvel &amp; Globale Projekte</h4>\n            <p class="text-gray-400 text-sm leading-relaxed i18n" data-cms="about.milestone4_desc" data-de="Weltweite U-Crane (MotoCrane) & Scorpio Einsätze für Produktionen wie Marvel, Jack Ryan und Luc Bessons \'Projet D\'. Über 30 Jahre Expertise an vorderster Front." data-en="Worldwide U-Crane (MotoCrane) & Scorpio operations for productions like Marvel, Jack Ryan, and Luc Besson\'s \'Projet D\'. Over 30 years of front-line expertise." data-fr="Missions internationales en U-Crane (Russian Arm) & Scorpio pour des productions comme Marvel, Jack Ryan et \'Projet D\' de Luc Besson. Plus de 30 ans d\'expertise au plus haut niveau." data-cs="Celosvětové nasazení U-Crane (MotoCrane) a Scorpio pro projekty jako Marvel, Jack Ryan a \'Projet D\' Luca Bessona. Více než 30 let zkušeností v první linii.">Weltweite U-Crane (MotoCrane) & Scorpio Einsätze für Produktionen wie Marvel, Jack Ryan und Luc Bessons "Projet D". Über 30 Jahre Expertise an vorderster Front.</p>',
        html
    )

    # Evolution section
    html = re.sub(
        r'<div class="section-label justify-center"><span class="line"></span><span[^>]*data-de="Die Evolution"[^>]*>Die Evolution</span><span class="line"></span></div>',
        r'<div class="section-label justify-center"><span class="line"></span><span class="i18n" data-cms="about.evolution_label" data-de="Die Evolution" data-en="The Evolution" data-fr="L\'Évolution" data-cs="Evoluce">Die Evolution</span><span class="line"></span></div>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl font-800 text-gold-gradient mb-4"[^>]*data-de="Die Evolution zum Kranoperator"[^>]*>Die Evolution zum Kranoperator</h2>',
        r'<h2 class="text-4xl font-800 text-gold-gradient mb-4 i18n" data-cms="about.evolution_title" data-de="Die Evolution zum Kranoperator" data-en="The Evolution to the Crane Operator" data-fr="L\'Évolution vers l\'opérateur de grue" data-cs="Evoluce v operátora jeřábu">Die Evolution zum Kranoperator</h2>',
        html
    )
    html = re.sub(
        r'<p class="text-gray-400 max-w-2xl mx-auto"[^>]*data-de="Vom ersten aufrechten Gang[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<p class="text-gray-400 max-w-2xl mx-auto i18n" data-cms="about.evolution_desc" data-de="Vom ersten aufrechten Gang bis zur perfekten Kamerabewegung. Unsere Arbeit erfordert höchste Präzision, Koordination und das richtige Fingerspitzengefühl am Steuer." data-en="From the first upright steps to the perfect camera movement. Our work requires ultimate precision, coordination, and the right touch at the controls." data-fr="Des premiers pas de l\'humanité au mouvement de caméra parfait. Notre métier exige rigueur absolue, coordination sans faille et doigté millimétré aux commandes." data-cs="Od prvních vzpřímených kroků až po dokonalý pohyb kamery. Naše práce vyžaduje maximální preciznost, koordinaci a citlivé vedení u řízení.">Vom ersten aufrechten Gang bis zur perfekten Kamerabewegung. Unsere Arbeit erfordert höchste Präzision, Koordination und das richtige Fingerspitzengefühl am Steuer.</p>',
        html
    )

    # Branchen section
    html = re.sub(
        r'<div class="section-label justify-center"><span class="line"></span><span[^>]*data-de="Einsatzbranchen"[^>]*>Einsatzbranchen</span><span class="line"></span></div>',
        r'<div class="section-label justify-center"><span class="line"></span><span class="i18n" data-cms="about.branch_label" data-de="Einsatzbranchen" data-en="Industries" data-fr="Secteurs d\'activité" data-cs="Odvětví a obory">Einsatzbranchen</span><span class="line"></span></div>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl font-800"[^>]*data-de="Mit wem wir arbeiten"[^>]*>Mit wem wir arbeiten</h2>',
        r'<h2 class="text-4xl font-800 i18n" data-cms="about.branch_title" data-de="Mit wem wir arbeiten" data-en="Who we work with" data-fr="Ils nous font confiance" data-cs="S kým spolupracujeme">Mit wem wir arbeiten</h2>',
        html
    )
    html = re.sub(
        r'<p class="text-gray-500 mt-3"[^>]*data-de="Wir haben für alle gearbeitet[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<p class="text-gray-500 mt-3 i18n" data-cms="about.branch_desc" data-de="Wir haben für alle gearbeitet – vom Indie-Film bis zur internationalen Großproduktion." data-en="We\'ve worked for everyone – from indie film to international blockbuster." data-fr="Nous accompagnons tous les projets – du cinéma indépendant aux grandes productions hollywoodiennes." data-cs="Pracovali jsme pro všechny – od nezávislých filmů až po mezinárodní velkofilmy.">Wir haben für alle gearbeitet – vom Indie-Film bis zur internationalen Großproduktion.</p>',
        html
    )

    # 6 Branchen Kacheln
    branches = [
        ("Film &amp; Kino", "Film & Kino", "about.branch1_title", "Langfilm, Kurzfilm, Dokumentation", "about.branch1_desc"),
        ("TV &amp; Streaming", "TV & Streaming", "about.branch2_title", "Serien, Shows, Live-Events", "about.branch2_desc"),
        ("Musik &amp; Konzerte", "Musik & Konzerte", "about.branch3_title", "Musikvideos, Konzertaufnahmen", "about.branch3_desc"),
        ("Werbung &amp; Corporate", "Werbung & Corporate", "about.branch4_title", "TV-Spots, Imagefilme, Pitches", "about.branch4_desc"),
        ("Sport &amp; Events", "Sport & Events", "about.branch5_title", "Galas, Sportevents, Messen", "about.branch5_desc"),
        ("Spezialaufnahmen", "Spezialaufnahmen", "about.branch6_title", "Industrie, Architektur, Kunst", "about.branch6_desc"),
    ]
    for b_de_amp, b_de, key_title, desc_de, key_desc in branches:
        pattern = rf'<div class="font-700 mb-1"[^>]*data-de="{re.escape(b_de)}"[^>]*>{re.escape(b_de_amp)}</div>\s*<div class="text-gray-500 text-sm"[^>]*data-de="{re.escape(desc_de)}"[^>]*>[^<]+</div>'
        replacement = f'<div class="font-700 mb-1 i18n" data-cms="{key_title}" data-de="{b_de}">{b_de_amp}</div>\n          <div class="text-gray-500 text-sm i18n" data-cms="{key_desc}" data-de="{desc_de}">{desc_de}</div>'
        html = re.sub(pattern, replacement, html)

    # CTA section
    html = re.sub(
        r'<h2 class="text-3xl font-800 mb-4"[^>]*data-de="Bereit, zusammenzuarbeiten\?"[^>]*>Bereit, zusammenzuarbeiten\?</h2>',
        r'<h2 class="text-3xl font-800 mb-4 i18n" data-cms="about.cta_title" data-de="Bereit, zusammenzuarbeiten?" data-en="Ready to work together?" data-fr="Prêt à collaborer ?" data-cs="Jste připraveni ke spolupráci?">Bereit, zusammenzuarbeiten?</h2>',
        html
    )
    html = re.sub(
        r'<p class="text-gray-400 mb-8"[^>]*data-de="Erzählen Sie uns von Ihrem Projekt[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<p class="text-gray-400 mb-8 i18n" data-cms="about.cta_desc" data-de="Erzählen Sie uns von Ihrem Projekt. Wir sind für Sie da – persönlich, erfahren und zuverlässig." data-en="Tell us about your project. We\'re here for you – personal, experienced and reliable." data-fr="Parlez-nous de votre projet. Nous sommes à vos côtés – disponibilité, savoir-faire et fiabilité." data-cs="Řekněte nám o svém projektu. Jsme tu pro vás – osobně, zkušeně a spolehlivě.">Erzählen Sie uns von Ihrem Projekt. Wir sind für Sie da – persönlich, erfahren und zuverlässig.</p>',
        html
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Patched public/ueber-uns/index.html")


def patch_leistungen():
    path = 'public/leistungen/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Buttons in Hero
    html = re.sub(
        r'<a href="/kontakt"[^>]*>\s*<svg[^>]*>[\s\S]*?</svg>\s*<span[^>]*data-de="Angebot anfragen"[^>]*>Angebot anfragen</span>\s*</a>',
        r'<a href="/kontakt" class="btn-gold px-8 py-4 rounded-xl text-base font-700 gap-2 animate-pulse-gold"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg><span class="i18n" data-cms="services.hero_cta_quote" data-de="Angebot anfragen" data-en="Request Quote" data-fr="Demander un devis" data-cs="Požádat o nabídku">Angebot anfragen</span></a>',
        html
    )
    html = re.sub(
        r'<a href="/supertechno-50"[^>]*>\s*<svg[^>]*>[\s\S]*?</svg>\s*<span[^>]*data-de="Produkt ansehen"[^>]*>Produkt ansehen</span>\s*</a>',
        r'<a href="/supertechno-50" class="btn-outline px-8 py-4 rounded-xl text-base font-600 gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg><span class="i18n" data-cms="services.hero_cta_product" data-de="Produkt ansehen" data-en="View Product" data-fr="Découvrir le produit" data-cs="Prohlédnout produkt">Produkt ansehen</span></a>',
        html
    )

    # Sektion Label
    html = re.sub(
        r'<div class="section-label justify-center"><span class="line"></span><span[^>]*data-de="Unsere drei Säulen"[^>]*>Unsere drei Säulen</span><span class="line"></span></div>',
        r'<div class="section-label justify-center"><span class="line"></span><span class="i18n" data-cms="services.section_label" data-de="Unsere drei Säulen" data-en="Our three pillars" data-fr="Nos trois piliers" data-cs="Naše tři pilíře">Unsere drei Säulen</span><span class="line"></span></div>',
        html
    )

    # Bullet points Service 1
    bullets_s1 = [
        ("Supertechno 50+ mit 15,11m Reichweite", "services.s1_item1"),
        ("Techno S-Head Remote Control", "services.s1_item2"),
        ("Indoor & Outdoor einsetzbar", "services.s1_item3"),
        ("Transport & Lieferung nach Wien & AT", "services.s1_item4"),
        ("Tages- und Wochenmiete", "services.s1_item5")
    ]
    for de_txt, key in bullets_s1:
        pattern = rf'<span[^>]*data-de="{re.escape(de_txt)}"[^>]*>[^<]+</span>'
        replacement = f'<span class="i18n" data-cms="{key}" data-de="{de_txt}">{de_txt}</span>'
        html = re.sub(pattern, replacement, html)

    # Bullet points Service 2
    bullets_s2 = [
        ("Zertifizierter, erfahrener Operator", "services.s2_item1"),
        ("Briefing & Shot-Planung vorab", "services.s2_item2"),
        ("Kommunikation mit DoP & Regie", "services.s2_item3"),
        ("Wiederholbare, präzise Movements", "services.s2_item4"),
        ("Flexibel auf Set & reaktionsschnell", "services.s2_item5")
    ]
    for de_txt, key in bullets_s2:
        pattern = rf'<span[^>]*data-de="{re.escape(de_txt)}"[^>]*>[^<]+</span>'
        replacement = f'<span class="i18n" data-cms="{key}" data-de="{de_txt}">{de_txt}</span>'
        html = re.sub(pattern, replacement, html)

    # Bullet points Service 3
    bullets_s3 = [
        ("Technische Betreuung inklusive", "services.s3_item1"),
        ("Kompatibel mit allen Kamerasystemen", "services.s3_item2"),
        ("Techno S-Head, Preston FI+Z", "services.s3_item3"),
        ("Location Scouting auf Anfrage", "services.s3_item4"),
        ("Technische Beratung vorab (kostenlos)", "services.s3_item5")
    ]
    for de_txt, key in bullets_s3:
        pattern = rf'<span[^>]*data-de="{re.escape(de_txt)}"[^>]*>[^<]+</span>'
        replacement = f'<span class="i18n" data-cms="{key}" data-de="{de_txt}">{de_txt}</span>'
        html = re.sub(pattern, replacement, html)

    # Prozess section
    html = re.sub(
        r'<div class="section-label justify-center"><span class="line"></span><span[^>]*data-de="So läuft es ab"[^>]*>So läuft es ab</span><span class="line"></span></div>',
        r'<div class="section-label justify-center"><span class="line"></span><span class="i18n" data-cms="services.process_label" data-de="So läuft es ab" data-en="How it works" data-fr="Comment ça se passe" data-cs="Jak to probíhá">So läuft es ab</span><span class="line"></span></div>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl font-800"[^>]*data-de="Von der Anfrage zum Shot"[^>]*>Von der Anfrage zum Shot</h2>',
        r'<h2 class="text-4xl font-800 i18n" data-cms="services.process_title" data-de="Von der Anfrage zum Shot" data-en="From inquiry to the shot" data-fr="De la demande au tournage" data-cs="Od poptávky k záběru">Von der Anfrage zum Shot</h2>',
        html
    )

    steps = [
        ("Anfrage", "services.step1_title", "Kurzes Formular oder Anruf – wir melden uns in 24h.", "services.step1_desc"),
        ("Briefing", "services.step2_title", "Shotliste, Location und Kameraausstattung besprechen.", "services.step2_desc"),
        ("Bereitstellung", "services.step3_title", "Anlieferung & Einrichtung – in kürzester Zeit einsatzbereit.", "services.step3_desc"),
        ("Shot!", "services.step4_title", "Operator am Steuer – präzise, wiederholbar, sicher.", "services.step4_desc"),
    ]
    for title_de, key_t, desc_de, key_d in steps:
        pattern = rf'<h4 class="font-700 mb-2"[^>]*data-de="{re.escape(title_de)}"[^>]*>{re.escape(title_de)}</h4>\s*<p class="text-gray-500 text-sm"[^>]*data-de="{re.escape(desc_de)}"[^>]*>[^<]+</p>'
        replacement = f'<h4 class="font-700 mb-2 i18n" data-cms="{key_t}" data-de="{title_de}">{title_de}</h4>\n          <p class="text-gray-500 text-sm i18n" data-cms="{key_d}" data-de="{desc_de}">{desc_de}</p>'
        html = re.sub(pattern, replacement, html)

    # Preise section
    html = re.sub(
        r'<div class="section-label justify-center mb-8"><span class="line"></span><span[^>]*data-de="Konditionen"[^>]*>Konditionen</span><span class="line"></span></div>',
        r'<div class="section-label justify-center mb-8"><span class="line"></span><span class="i18n" data-cms="services.pricing_label" data-de="Konditionen" data-en="Pricing" data-fr="Tarification" data-cs="Ceník">Konditionen</span><span class="line"></span></div>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl font-800 mb-6"[^>]*data-de="Transparente Preisgestaltung"[^>]*>Transparente Preisgestaltung</h2>',
        r'<h2 class="text-4xl font-800 mb-6 i18n" data-cms="services.pricing_title" data-de="Transparente Preisgestaltung" data-en="Transparent pricing" data-fr="Tarifs clairs et transparents" data-cs="Transparentní tvorba cen">Transparente Preisgestaltung</h2>',
        html
    )

    prices = [
        ("Angebot auf Anfrage", "services.price1_title", "Jede Produktion ist anders – wir kalkulieren individuell nach Aufwand, Dauer und Leistungsumfang.", "services.price1_desc"),
        ("Tages- &amp; Wochensätze", "Tages- & Wochensätze", "services.price2_title", "Flexible Buchung: Halbtag, ganzer Tag oder Mehrtagesprojekte – mit Mengenrabatt.", "services.price2_desc"),
        ("Alle Kosten inklusive", "services.price3_title", "Transport, Operator, Techno S-Head und Betreuung – keine versteckten Kosten.", "services.price3_desc"),
        ("Kostenlose Erstberatung", "services.price4_title", "Wir besprechen Ihr Projekt vorab und prüfen Machbarkeit – unverbindlich und kostenlos.", "services.price4_desc"),
    ]
    for p_item in prices:
        if len(p_item) == 4:
            t_de, k_t, d_de, k_d = p_item
            t_amp = t_de
        else:
            t_amp, t_de, k_t, d_de, k_d = p_item
        pattern = rf'<h4 class="font-700 mb-1"[^>]*data-de="{re.escape(t_de)}"[^>]*>{re.escape(t_amp)}</h4>\s*<p class="text-gray-500 text-sm"[^>]*data-de="{re.escape(d_de)}"[^>]*>[^<]+</p>'
        replacement = f'<h4 class="font-700 mb-1 i18n" data-cms="{k_t}" data-de="{t_de}">{t_amp}</h4>\n            <p class="text-gray-500 text-sm i18n" data-cms="{k_d}" data-de="{d_de}">{d_de}</p>'
        html = re.sub(pattern, replacement, html)

    html = re.sub(
        r'<span[^>]*data-de="Jetzt kostenloses Angebot anfragen"[^>]*>Jetzt kostenloses Angebot anfragen</span>',
        r'<span class="i18n" data-cms="services.pricing_cta_btn" data-de="Jetzt kostenloses Angebot anfragen" data-en="Request free quote now" data-fr="Demander un devis gratuit dès maintenant" data-cs="Požádat o bezplatnou nabídku">Jetzt kostenloses Angebot anfragen</span>',
        html
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Patched public/leistungen/index.html")


def patch_supertechno():
    path = 'public/supertechno-50/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # USP Badges
    html = re.sub(
        r'<span class="glass text-xs px-3 py-1.5 rounded-full text-gold-400 font-600">🌍 Bewährt weltweit</span>',
        r'<span class="glass text-xs px-3 py-1.5 rounded-full text-gold-400 font-600 i18n" data-cms="product.usp_badge1" data-de="🌍 Bewährt weltweit" data-en="🌍 Proven worldwide" data-fr="🌍 Éprouvé dans le monde entier" data-cs="🌍 Prověřeno po celém světě">🌍 Bewährt weltweit</span>',
        html
    )
    html = re.sub(
        r'<span class="glass text-xs px-3 py-1.5 rounded-full text-gold-400 font-600">🎯 Präziser S-Head</span>',
        r'<span class="glass text-xs px-3 py-1.5 rounded-full text-gold-400 font-600 i18n" data-cms="product.usp_badge2" data-de="🎯 Präziser S-Head" data-en="🎯 Precise S-Head" data-fr="🎯 Tête S-Head ultra-précise" data-cs="🎯 Precizní hlava S-Head">🎯 Präziser S-Head</span>',
        html
    )
    html = re.sub(
        r'<span class="glass text-xs px-3 py-1.5 rounded-full text-gold-400 font-600">✅ Operator inklusive</span>',
        r'<span class="glass text-xs px-3 py-1.5 rounded-full text-gold-400 font-600 i18n" data-cms="product.usp_badge3" data-de="✅ Operator inklusive" data-en="✅ Operator included" data-fr="✅ Opérateur inclus" data-cs="✅ Operátor v ceně">✅ Operator inklusive</span>',
        html
    )

    # Diagrams
    html = re.sub(
        r'<div class="section-label mb-8"><span class="line"></span><span[^>]*data-de="Technisches Diagramm"[^>]*>Technisches Diagramm</span></div>',
        r'<div class="section-label mb-8"><span class="line"></span><span class="i18n" data-cms="product.diagram_label" data-de="Technisches Diagramm" data-en="Technical Diagram" data-fr="Schéma technique" data-cs="Technické schéma">Technisches Diagramm</span></div>',
        html
    )
    html = re.sub(
        r'<p class="text-xs text-gray-600 text-center"[^>]*data-de="Draufsicht – Schwenkbereich und Reichweite"[^>]*>Draufsicht – Schwenkbereich und Reichweite</p>',
        r'<p class="text-xs text-gray-600 text-center i18n" data-cms="product.diagram_top_desc" data-de="Draufsicht – Schwenkbereich und Reichweite" data-en="Top view – pan range and reach" data-fr="Vue de dessus – amplitude de rotation et portée" data-cs="Pohled shora – rozsah otáčení a dosah">Draufsicht – Schwenkbereich und Reichweite</p>',
        html
    )
    html = re.sub(
        r'<p class="text-xs text-gray-600 text-center mt-1"[^>]*data-de="Seitenansicht – Kranarm-Positionen"[^>]*>Seitenansicht – Kranarm-Positionen</p>',
        r'<p class="text-xs text-gray-600 text-center mt-1 i18n" data-cms="product.diagram_side_desc" data-de="Seitenansicht – Kranarm-Positionen" data-en="Side view – crane arm positions" data-fr="Vue latérale – positions du bras de grue" data-cs="Boční pohled – polohy ramene jeřábu">Seitenansicht – Kranarm-Positionen</p>',
        html
    )

    # Use Cases
    html = re.sub(
        r'<div class="section-label justify-center"><span class="line"></span><span[^>]*data-de="Einsatzbereiche"[^>]*>Einsatzbereiche</span></div>',
        r'<div class="section-label justify-center"><span class="line"></span><span class="i18n" data-cms="product.usecases_label" data-de="Einsatzbereiche" data-en="Use Cases" data-fr="Domaines d\'intervention" data-cs="Oblasti použití">Einsatzbereiche</span></div>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl font-800"[^>]*data-de="Vielseitig auf jedem Set"[^>]*>Vielseitig auf jedem Set</h2>',
        r'<h2 class="text-4xl font-800 i18n" data-cms="product.usecases_title" data-de="Vielseitig auf jedem Set" data-en="Versatile on every set" data-fr="Une polyvalence totale sur plateau" data-cs="Všestrannost na každém place">Vielseitig auf jedem Set</h2>',
        html
    )

    uses = [
        ("Film &amp; Kino", "Film & Kino", "product.use1_title", "Bewährt in nationalen und internationalen Kinoproduktionen. Ideale Reichweite für Establishing Shots und Crane-Moves.", "product.use1_desc"),
        ("TV &amp; Werbung", "TV & Werbung", "product.use2_title", "Ideal für zeitkritische TV-Produktionen und Werbeaufnahmen. Schneller Auf- und Abbau auf Set.", "product.use2_desc"),
        ("Events &amp; Konzerte", "Events & Konzerte", "product.use3_title", "Spektakuläre Shots bei Konzerten, Sportevents und Messen. Maximale Flexibilität dank Outdoor-Eignung.", "product.use3_desc"),
        ("Sport", "Sport", "product.use4_title", "Live-Übertragungen von Sport-Events, Motorsport und Action-Aufnahmen. Dynamische Fahrten und präzise Verfolgung in Höchstgeschwindigkeit.", "product.use4_desc"),
    ]
    for u_amp, u_de, k_t, d_de, k_d in uses:
        pattern = rf'<h3 class="text-xl font-700 mb-2"[^>]*data-de="{re.escape(u_de)}"[^>]*>{re.escape(u_amp)}</h3>\s*<p class="text-gray-400 text-sm leading-relaxed"[^>]*data-de="{re.escape(d_de)}"[^>]*>[^<]+</p>'
        replacement = f'<h3 class="text-xl font-700 mb-2 i18n" data-cms="{k_t}" data-de="{u_de}">{u_amp}</h3>\n          <p class="text-gray-400 text-sm leading-relaxed i18n" data-cms="{k_d}" data-de="{d_de}">{d_de}</p>'
        html = re.sub(pattern, replacement, html)

    # Download section
    html = re.sub(
        r'<h2 class="text-3xl font-800 mb-4"[^>]*data-de="Möchten Sie alle technischen Details\?"[^>]*>Möchten Sie alle technischen Details\?</h2>',
        r'<h2 class="text-3xl font-800 mb-4 i18n" data-cms="product.download_title" data-de="Möchten Sie alle technischen Details?" data-en="Want all technical details?" data-fr="Vous souhaitez consulter la fiche technique complète ?" data-cs="Chcete vědět všechny technické detaily?">Möchten Sie alle technischen Details?</h2>',
        html
    )
    html = re.sub(
        r'<p class="text-gray-400 mb-8 max-w-xl mx-auto"[^>]*data-de="Laden Sie das offizielle Datenblatt[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<p class="text-gray-400 mb-8 max-w-xl mx-auto i18n" data-cms="product.download_desc" data-de="Laden Sie das offizielle Datenblatt des Supertechno 50+ herunter – inklusive Maßskizzen und Traglasttabellen." data-en="Download the official Supertechno 50+ spec sheet – including dimensional drawings and load charts." data-fr="Téléchargez la documentation officielle de la Supertechno 50+ – avec schémas cotés et abaques de charge." data-cs="Stáhněte si oficiální technický list Supertechno 50+ – včetně výkresů a zátěžových tabulek.">Laden Sie das offizielle Datenblatt des Supertechno 50+ herunter – inklusive Maßskizzen und Traglasttabellen.</p>',
        html
    )
    html = re.sub(
        r'<span[^>]*data-de="Datenblatt herunterladen \(PDF\)"[^>]*>Datenblatt herunterladen \(PDF\)</span>',
        r'<span class="i18n" data-cms="product.download_btn" data-de="Datenblatt herunterladen (PDF)" data-en="Download Spec Sheet (PDF)" data-fr="Télécharger la fiche technique (PDF)" data-cs="Stáhnout technický list (PDF)">Datenblatt herunterladen (PDF)</span>',
        html
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Patched public/supertechno-50/index.html")


def patch_kontakt():
    path = 'public/kontakt/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Hero button
    html = re.sub(
        r'<a href="#formulare"[^>]*>\s*<svg[^>]*>[\s\S]*?</svg>\s*<span[^>]*data-de="Zum Kontaktformular"[^>]*>Zum Kontaktformular</span>\s*</a>',
        r'<a href="#formulare" class="btn-gold px-8 py-4 rounded-xl text-base font-700 gap-2 animate-pulse-gold"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg><span class="i18n" data-cms="contact.cta_scroll_form" data-de="Zum Kontaktformular" data-en="To the contact form" data-fr="Vers le formulaire de contact" data-cs="Přejít na formulář">Zum Kontaktformular</span></a>',
        html
    )

    # Form labels & headers
    html = re.sub(
        r'<span[^>]*data-de="Allgemeine Anfrage"[^>]*>Allgemeine Anfrage</span>',
        r'<span class="i18n" data-cms="contact.tab_contact" data-de="Allgemeine Anfrage" data-en="General Inquiry" data-fr="Demande générale" data-cs="Obecný dotaz">Allgemeine Anfrage</span>',
        html
    )
    html = re.sub(
        r'<span[^>]*data-de="Produktanfrage"[^>]*>Produktanfrage</span>',
        r'<span class="i18n" data-cms="contact.tab_product" data-de="Produktanfrage" data-en="Product Inquiry" data-fr="Demande de matériel" data-cs="Poptávka techniky">Produktanfrage</span>',
        html
    )
    html = re.sub(
        r'<span[^>]*data-de="Beratungstermin"[^>]*>Beratungstermin</span>',
        r'<span class="i18n" data-cms="contact.tab_booking" data-de="Beratungstermin" data-en="Consultation" data-fr="Rendez-vous conseil" data-cs="Konzultace">Beratungstermin</span>',
        html
    )

    # Form 1 buttons & labels
    html = re.sub(
        r'<span[^>]*data-de="Nachricht senden"[^>]*>Nachricht senden</span>',
        r'<span class="i18n" data-cms="contact.form_submit_general" data-de="Nachricht senden" data-en="Send Message" data-fr="Envoyer le message" data-cs="Odeslat zprávu">Nachricht senden</span>',
        html
    )
    html = re.sub(
        r'<span[^>]*data-de="Angebot anfragen"[^>]*>Angebot anfragen</span>',
        r'<span class="i18n" data-cms="contact.form_submit_quote" data-de="Angebot anfragen" data-en="Request Quote" data-fr="Demander un devis" data-cs="Požádat o nabídku">Angebot anfragen</span>',
        html
    )
    html = re.sub(
        r'<span[^>]*data-de="Termin bestätigen"[^>]*>Termin bestätigen</span>',
        r'<span class="i18n" data-cms="contact.form_submit_booking" data-de="Termin bestätigen" data-en="Confirm booking" data-fr="Confirmer le rendez-vous" data-cs="Potvrdit termín">Termin bestätigen</span>',
        html
    )
    html = re.sub(
        r'<div class="text-xs text-gray-500 mt-1"[^>]*data-de="Genaue Adresse auf Anfrage"[^>]*>Genaue Adresse auf Anfrage</div>',
        r'<div class="text-xs text-gray-500 mt-1 i18n" data-cms="contact.map_address_note" data-de="Genaue Adresse auf Anfrage" data-en="Exact address on request" data-fr="Adresse exacte sur demande" data-cs="Přesná adresa na vyžádání">Genaue Adresse auf Anfrage</div>',
        html
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Patched public/kontakt/index.html")


if __name__ == '__main__':
    patch_ueber_uns()
    patch_leistungen()
    patch_supertechno()
    patch_kontakt()
