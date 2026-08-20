import re

def patch_index():
    path = 'public/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Warum Technogrips section
    html = re.sub(
        r'<span class="i18n"[^>]*data-de="Warum Technogrips"[^>]*>Warum Technogrips</span>',
        r'<span class="i18n" data-cms="about.section_label" data-de="Warum Technogrips" data-en="Why Technogrips" data-fr="Pourquoi Technogrips" data-cs="Proč Technogrips">Warum Technogrips</span>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl lg:text-5xl font-800 mb-6 i18n"[^>]*data-de="Wien-basiert. Weltweit erfahren."[^>]*>Wien-basiert. Weltweit erfahren.</h2>',
        r'<h2 class="text-4xl lg:text-5xl font-800 mb-6 i18n" data-cms="about.headline" data-de="Wien-basiert. Weltweit erfahren." data-en="Vienna-based. World-class experience." data-fr="Basé à Vienne. Expérience internationale." data-cs="Se sídlem ve Vídni. Světové zkušenosti.">Wien-basiert. Weltweit erfahren.</h2>',
        html
    )
    html = re.sub(
        r'<p class="text-gray-400 leading-relaxed mb-8 i18n"[^>]*data-de="Als Operator-Team mit Sitz in Wien[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<p class="text-gray-400 leading-relaxed mb-8 i18n" data-cms="about.intro" data-de="Als Operator-Team mit Sitz in Wien bieten wir nicht nur das Equipment – wir sind das Equipment. Unser Service umfasst die vollständige Betreuung von der Planung bis zum letzten Shot." data-en="As an operator team based in Vienna, we don\'t just provide the equipment – we are the equipment. Our service covers complete support from planning to the last shot." data-fr="En tant qu\'équipe d\'opérateurs basée à Vienne, nous ne fournissons pas seulement le matériel – nous faisons corps avec lui. Notre prestation comprend un accompagnement complet, de la préparation au dernier tour de manivelle." data-cs="Jako tým operátorů se sídlem ve Vídni nenabízíme pouze techniku – my jsme ta technika. Naše služby zahrnují kompletní servis od plánování až po finální klapku.">Als Operator-Team mit Sitz in Wien bieten wir nicht nur das Equipment – wir sind das Equipment. Unser Service umfasst die vollständige Betreuung von der Planung bis zum letzten Shot.</p>',
        html
    )

    # 4 USPs on Home
    usps = [
        ("Operator inklusive", "about.usp1_title", "Kein Kran ohne Bedienung. Wir stellen den Operator und bedienen das System professionell.", "about.usp1_desc"),
        ("24/7 Verfügbarkeit", "about.usp2_title", "Filmproduktionen kennen keine Bürozeiten. Wir auch nicht – kurzfristige Buchungen möglich.", "about.usp2_desc"),
        ("Wien & ganz Österreich", "about.usp3_title", "Unser Standort ist Wien – wir sind österreichweit und auf Anfrage auch international tätig.", "about.usp3_desc"),
        ("Versichert & zertifiziert", "about.usp4_title", "Vollständige Betriebshaftpflichtversicherung. Alle Sicherheitsstandards werden eingehalten.", "about.usp4_desc"),
    ]
    for u_title, k_t, u_desc, k_d in usps:
        pattern = rf'<h4 class="font-700 mb-1 i18n"[^>]*data-de="{re.escape(u_title)}"[^>]*>{re.escape(u_title)}</h4>\s*<p class="text-gray-400 text-sm i18n"[^>]*data-de="{re.escape(u_desc)}"[^>]*>[^<]+</p>'
        replacement = f'<h4 class="font-700 mb-1 i18n" data-cms="{k_t}" data-de="{u_title}">{u_title}</h4>\n                <p class="text-gray-400 text-sm i18n" data-cms="{k_d}" data-de="{u_desc}">{u_desc}</p>'
        html = re.sub(pattern, replacement, html)

    # Portfolio section
    html = re.sub(
        r'<span class="i18n"[^>]*data-de="Unsere Arbeit"[^>]*>Unsere Arbeit</span>',
        r'<span class="i18n" data-cms="home.portfolio_label" data-de="Unsere Arbeit" data-en="Our Work" data-fr="Nos réalisations" data-cs="Naše práce">Unsere Arbeit</span>',
        html
    )

    # Contact Section Headers on Home
    html = re.sub(
        r'<span class="i18n"[^>]*data-de="Kontakt"[^>]*>Kontakt</span>',
        r'<span class="i18n" data-cms="contact.section_label" data-de="Kontakt" data-en="Contact" data-fr="Contact" data-cs="Kontakt">Kontakt</span>',
        html
    )
    html = re.sub(
        r'<h2 class="text-4xl lg:text-5xl font-800 mb-4 i18n"[^>]*data-de="Lassen Sie uns sprechen"[^>]*>Lassen Sie uns sprechen</h2>',
        r'<h2 class="text-4xl lg:text-5xl font-800 mb-4 i18n" data-cms="contact.headline" data-de="Lassen Sie uns sprechen" data-en="Let\'s Talk" data-fr="Parlons de votre projet" data-cs="Pojďme si promluvit">Lassen Sie uns sprechen</h2>',
        html
    )
    html = re.sub(
        r'<p class="text-gray-400 max-w-xl mx-auto i18n"[^>]*data-de="Schildern Sie Ihr Projekt[^"]*"[^>]*>([\s\S]*?)</p>',
        r'<p class="text-gray-400 max-w-xl mx-auto i18n" data-cms="contact.subline" data-de="Schildern Sie Ihr Projekt – wir melden uns innerhalb von 24 Stunden mit einem Angebot." data-en="Describe your project – we\'ll get back to you within 24 hours with a quote." data-fr="Décrivez-nous votre projet – nous vous répondrons sous 24 heures avec une offre personnalisée." data-cs="Popište nám svůj projekt – ozveme se vám do 24 hodin s cenovou nabídkou.">Schildern Sie Ihr Projekt – wir melden uns innerhalb von 24 Stunden mit einem Angebot.</p>',
        html
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Patched public/index.html with full CMS bindings!")

if __name__ == '__main__':
    patch_index()
