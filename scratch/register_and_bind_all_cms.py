import os
import re
import sqlite3
from html import unescape

# We will systematically scan and rewrite each HTML page to ensure 100% of text elements have data-cms or data-cms-text
# and register all of them into the SQLite database.

def main():
    print("=== STARTING FULL CMS EXTRACTION & BINDING ===")
    
    conn = sqlite3.connect('public/api/db/data.sqlite')
    c = conn.cursor()
    
    # Load existing CMS entries
    db_entries = {}
    for row in c.execute("SELECT section, key, label, value_de, value_en, value_fr, value_cs, type FROM page_content"):
        sec, key, label, de, en, fr, cs, t = row
        db_entries[f"{sec}.{key}"] = {
            "section": sec,
            "key": key,
            "label": label or key,
            "value_de": de or '',
            "value_en": en or '',
            "value_fr": fr or '',
            "value_cs": cs or '',
            "type": t or 'text'
        }
    
    print(f"Existing keys in DB: {len(db_entries)}")
    
    # Helper to register an entry
    def register(section, key, label, de, en='', fr='', cs='', field_type='text'):
        full_key = f"{section}.{key}"
        if full_key in db_entries:
            entry = db_entries[full_key]
            # update label or any empty language
            if label and (not entry['label'] or entry['label'] == entry['key']):
                entry['label'] = label
            if de and not entry['value_de']:
                entry['value_de'] = de
            if en and not entry['value_en']:
                entry['value_en'] = en
            if fr and not entry['value_fr']:
                entry['value_fr'] = fr
            if cs and not entry['value_cs']:
                entry['value_cs'] = cs
            if field_type:
                entry['type'] = field_type
        else:
            db_entries[full_key] = {
                "section": section,
                "key": key,
                "label": label or key,
                "value_de": de or '',
                "value_en": en or (de or ''),
                "value_fr": fr or (de or ''),
                "value_cs": cs or (de or ''),
                "type": field_type or 'text'
            }
        return full_key

    # ═════════════════════════════════════════════════════════════════════════
    # 1. NAVIGATION & FOOTER (GLOBAL)
    # ═════════════════════════════════════════════════════════════════════════
    register("nav", "link_home", "Nav: Startseite", "Startseite", "Home", "Accueil", "Domů")
    register("nav", "link_services", "Nav: Leistungen", "Leistungen", "Services", "Services", "Služby")
    register("nav", "link_product", "Nav: Supertechno 50+", "Supertechno 50+", "Supertechno 50+", "Supertechno 50+", "Supertechno 50+")
    register("nav", "link_tracking", "Nav: Tracking & Simulator", "Tracking & Telemetrie", "Tracking & Telemetry", "Tracking & Télémétrie", "Tracking a telemetrie")
    register("nav", "link_about", "Nav: Über uns", "Über uns", "About", "À propos", "O nás")
    register("nav", "link_contact", "Nav: Kontakt", "Kontakt", "Contact", "Contact", "Kontakt")
    register("nav", "cta_btn", "Nav: CTA Button", "Jetzt anfragen", "Get a Quote", "Demander un devis", "Poptat nyní")
    register("nav", "mobile_lang_label", "Nav Mobile: Sprache Label", "Sprache", "Language", "Langue", "Jazyk")

    register("footer", "company_desc", "Footer: Firmenbeschreibung", "Professionelle Supertechno Kamerakrane mit erfahrenem Operator-Service. Wien, Österreich.", "Professional Supertechno camera cranes with experienced operator service. Vienna, Austria.", "Grues de caméra professionnelles Supertechno avec service d'opérateur expérimenté. Vienne, Autriche.", "Profesionální kamerové jeřáby Supertechno se zkušeným operátorem. Vídeň, Rakousko.", "textarea")
    register("footer", "col1_title", "Footer: Spalte 1 Titel", "Seiten", "Pages", "Pages", "Stránky")
    register("footer", "col2_title", "Footer: Spalte 2 Titel", "Kontakt", "Contact", "Contact", "Kontakt")
    register("footer", "col3_title", "Footer: Spalte 3 Titel", "Rechtliches", "Legal", "Mentions légales", "Právní informace")
    register("footer", "link_imprint", "Footer: Link Impressum", "Impressum", "Imprint", "Mentions légales", "Impresum")
    register("footer", "link_privacy", "Footer: Link Datenschutz", "Datenschutz", "Privacy Policy", "Protection des données", "Ochrana údajů")
    register("footer", "link_terms", "Footer: Link AGB", "AGB", "Terms", "Conditions générales", "Obchodní podmínky")
    register("footer", "copyright", "Footer: Copyright Text", "Alle Rechte vorbehalten.", "All rights reserved.", "Tous droits réservés.", "Všechna práva vyhrazena.")

    # ═════════════════════════════════════════════════════════════════════════
    # 2. ÜBER UNS (ABOUT)
    # ═════════════════════════════════════════════════════════════════════════
    register("about", "hero_badge", "Über uns: Hero Badge", "Wien, Österreich – 20+ Jahre Operator-Erfahrung", "Vienna, Austria – 20+ Years Operator Experience", "Vienne, Autriche – Plus de 20 ans d'expérience opérateur", "Vídeň, Rakousko – 20+ let zkušeností s obsluhou")
    register("about", "hero_title1", "Über uns: Titel Zeile 1 (Gold)", "Wien-basiert.", "Vienna-based.", "Ancré à Vienne.", "Se sídlem ve Vídni.")
    register("about", "hero_title2", "Über uns: Titel Zeile 2", "Weltweit erprobt.", "Proven worldwide.", "Éprouvé à l'international.", "Ověřeno ve světě.")
    register("about", "intro", "Über uns: Einleitungstext", "Technogrips Vienna ist kein reines Verleihhaus – wir sind Operators. Wir kennen den Kran, weil wir ihn selbst bedienen. Seit über 20 Jahren auf nationalen und internationalen Sets.", "Technogrips Vienna is not just a rental house – we are operators. We know the crane because we operate it ourselves. For over 20 years on national and international sets.", "Technogrips Vienna n'est pas un simple loueur – nous sommes des opérateurs de plateau. Nous maîtrisons la machine sur le bout des doigts pour la piloter au quotidien depuis plus de 20 ans sur les plus grands tournages.", "Technogrips Vienna není jen půjčovna – jsme profesionální operátoři. Známe jeřáb do posledního detailu, protože ho sami řídíme již přes 20 let na domácích i zahraničních natáčeních.", "textarea")
    register("about", "cta_contact", "Über uns: Button Kontakt", "Kontakt aufnehmen", "Get in touch", "Prendre contact", "Kontaktovat nás")
    register("about", "cta_services", "Über uns: Button Leistungen", "Unsere Leistungen", "Our Services", "Nos prestations", "Naše služby")
    
    register("about", "stat1_num", "Über uns: Stat 1 Zahl", "20+", "20+", "20+", "20+")
    register("about", "stat1_label", "Über uns: Stat 1 Label", "Jahre Erfahrung", "Years experience", "Ans d'expérience", "Let zkušeností")
    register("about", "stat2_num", "Über uns: Stat 2 Zahl", "500+", "500+", "500+", "500+")
    register("about", "stat2_label", "Über uns: Stat 2 Label", "Produktionen", "Productions", "Productions", "Produkcí")
    register("about", "stat3_num", "Über uns: Stat 3 Zahl", "3", "3", "3", "3")
    register("about", "stat3_label", "Über uns: Stat 3 Label", "Supertechno Krane", "Supertechno cranes", "Grues Supertechno", "Jeřáby Supertechno")
    register("about", "stat4_num", "Über uns: Stat 4 Zahl", "24/7", "24/7", "24/7", "24/7")
    register("about", "stat4_label", "Über uns: Stat 4 Label", "Erreichbar", "Reachable", "Joignable", "K zastižení")

    register("about", "timeline_label", "Über uns: Timeline Abschnittslabel", "Unsere Geschichte", "Our story", "Notre parcours", "Náš příběh")
    register("about", "timeline_title", "Über uns: Timeline Titel", "Von der Leidenschaft zur Expertise", "From passion to expertise", "De la passion à l'expertise", "Od vášně k profesionalitě")
    register("about", "milestone1_year", "Über uns: Meilenstein 1 Zeitraum", "1990–1995", "1990–1995", "1990–1995", "1990–1995")
    register("about", "milestone1_title", "Über uns: Meilenstein 1 Titel", "Die Anfänge am Set", "The Beginnings", "Les débuts sur le plateau", "Začátky na place")
    register("about", "milestone1_desc", "Über uns: Meilenstein 1 Text", "Einstieg in die Filmbranche als Boom Operator, Requisiteur, Garderoben- und Produktionsfahrer. Fundamentale Erfahrungen am Set.", "Entry into the film industry as a boom operator, prop master, wardrobe, and production driver. Acquiring fundamental on-set experience.", "Débuts dans l'industrie cinématographique comme perchman, accessoiriste, chauffeur de production. Acquisition d'une solide expérience de terrain.", "Vstup do filmového průmyslu jako zvukař s mikrofonem, rekvizitář, kostymérský a produkční řidič. Získání základních zkušeností na place.", "textarea")
    register("about", "milestone2_year", "Über uns: Meilenstein 2 Zeitraum", "1995–2015", "1995–2015", "1995–2015", "1995–2015")
    register("about", "milestone2_title", "Über uns: Meilenstein 2 Titel", "Spezialisierung & Remote Heads", "Specialization & Remote Heads", "Spécialisation & Têtes télécommandées", "Specializace a dálkově ovládané hlavy")
    register("about", "milestone2_desc", "Über uns: Meilenstein 2 Text", "Entwicklung zum Key Grip, Dolly Grip und Operator für Motion Control sowie stabilisierte Remote Heads. Erste Einsätze an High-End-Systemen.", "Transitioning into Key Grip, Dolly Grip, and operator for motion control and stabilized remote heads. First deployments on high-end systems.", "Évolution vers les postes de chef machiniste (Key Grip), machiniste travelling (Dolly Grip) et opérateur motion control & têtes gyrostabilisées.", "Vývoj na pozice Key Grip, Dolly Grip a operátora pro motion control i stabilizované hlavy. První nasazení na špičkových systémech.", "textarea")
    register("about", "milestone3_year", "Über uns: Meilenstein 3 Zeitraum", "2015", "2015", "2015", "2015")
    register("about", "milestone3_title", "Über uns: Meilenstein 3 Titel", "Upgrade & Blockbuster", "Upgrade & Blockbusters", "Montée en puissance & Blockbusters", "Upgrade a filmové hity")
    register("about", "milestone3_desc", "Über uns: Meilenstein 3 Text", "Upgrade auf den Supertechno 50+ mit S-Head. Mitwirkung an internationalen Großproduktionen wie Mission: Impossible (Austrian Key Grip), Agent 47, Woman in Gold und 300.", "Upgraded to Supertechno 50+ with S-Head. Collaborating on major international productions like Mission: Impossible (Austrian Key Grip), Agent 47, Woman in Gold, and 300.", "Acquisition du Supertechno 50+ avec tête S-Head. Collaboration à des blockbusters internationaux tels que Mission: Impossible (Key Grip Autriche), Agent 47, La Femme au tableau et 300.", "Upgrade na Supertechno 50+ s hlavou S-Head. Účast na velkých mezinárodních produkcích jako Mission: Impossible (rakouský Key Grip), Agent 47, Dáma ve zlatém nebo 300.", "textarea")
    register("about", "milestone4_year", "Über uns: Meilenstein 4 Zeitraum", "Heute", "Today", "Aujourd'hui", "Dnes")
    register("about", "milestone4_title", "Über uns: Meilenstein 4 Titel", "U-Crane, Marvel & Globale Projekte", "U-Crane, Marvel & Global Projects", "U-Crane, Marvel & Projets mondiaux", "U-Crane, Marvel a globální projekty")
    register("about", "milestone4_desc", "Über uns: Meilenstein 4 Text", "Weltweite U-Crane (MotoCrane) & Scorpio Einsätze für Produktionen wie Marvel, Jack Ryan und Luc Bessons 'Projet D'. Über 30 Jahre Expertise an vorderster Front.", "Worldwide U-Crane (MotoCrane) & Scorpio operations for productions like Marvel, Jack Ryan, and Luc Besson's 'Projet D'. Over 30 years of front-line expertise.", "Missions internationales en U-Crane (Russian Arm) & Scorpio pour des productions comme Marvel, Jack Ryan et 'Projet D' de Luc Besson. Plus de 30 ans d'expertise au plus haut niveau.", "Celosvětové nasazení U-Crane (MotoCrane) a Scorpio pro projekty jako Marvel, Jack Ryan a 'Projet D' Luca Bessona. Více než 30 let zkušeností v první linii.", "textarea")

    register("about", "evolution_label", "Über uns: Evolution Label", "Die Evolution", "The Evolution", "L'Évolution", "Evoluce")
    register("about", "evolution_title", "Über uns: Evolution Titel", "Die Evolution zum Kranoperator", "The Evolution to the Crane Operator", "L'Évolution vers l'opérateur de grue", "Evoluce v operátora jeřábu")
    register("about", "evolution_desc", "Über uns: Evolution Beschreibung", "Vom ersten aufrechten Gang bis zur perfekten Kamerabewegung. Unsere Arbeit erfordert höchste Präzision, Koordination und das richtige Fingerspitzengefühl am Steuer.", "From the first upright steps to the perfect camera movement. Our work requires ultimate precision, coordination, and the right touch at the controls.", "Des premiers pas de l'humanité au mouvement de caméra parfait. Notre métier exige rigueur absolue, coordination sans faille et doigté millimétré aux commandes.", "Od prvních vzpřímených kroků až po dokonalý pohyb kamery. Naše práce vyžaduje maximální preciznost, koordinaci a citlivé vedení u řízení.", "textarea")
    
    register("about", "branch_label", "Über uns: Branchen Label", "Einsatzbranchen", "Industries", "Secteurs d'activité", "Odvětví a obory")
    register("about", "branch_title", "Über uns: Branchen Titel", "Mit wem wir arbeiten", "Who we work with", "Ils nous font confiance", "S kým spolupracujeme")
    register("about", "branch_desc", "Über uns: Branchen Untertitel", "Wir haben für alle gearbeitet – vom Indie-Film bis zur internationalen Großproduktion.", "We've worked for everyone – from indie film to international blockbuster.", "Nous accompagnons tous les projets – du cinéma indépendant aux grandes productions hollywoodiennes.", "Pracovali jsme pro všechny – od nezávislých filmů až po mezinárodní velkofilmy.")
    register("about", "branch1_title", "Über uns: Branche 1 Titel", "Film & Kino", "Film & Cinema", "Cinéma & Long-métrage", "Film a kino")
    register("about", "branch1_desc", "Über uns: Branche 1 Text", "Langfilm, Kurzfilm, Dokumentation", "Feature, short, documentary", "Longs-métrages, courts-métrages, documentaires", "Celovečerní, krátké filmy, dokumenty")
    register("about", "branch2_title", "Über uns: Branche 2 Titel", "TV & Streaming", "TV & Streaming", "TV & Plateformes de streaming", "TV a streaming")
    register("about", "branch2_desc", "Über uns: Branche 2 Text", "Serien, Shows, Live-Events", "Series, shows, live events", "Séries, émissions, événements en direct", "Seriály, pořady, živé přenosy")
    register("about", "branch3_title", "Über uns: Branche 3 Titel", "Musik & Konzerte", "Music & Concerts", "Musique & Spectacles", "Hudba a koncerty")
    register("about", "branch3_desc", "Über uns: Branche 3 Text", "Musikvideos, Konzertaufnahmen", "Music videos, concert recordings", "Clips vidéo, captations de concerts", "Videoklipy, záznamy koncertů")
    register("about", "branch4_title", "Über uns: Branche 4 Titel", "Werbung & Corporate", "Advertising & Corporate", "Publicité & Films d'entreprise", "Reklama a firemní videa")
    register("about", "branch4_desc", "Über uns: Branche 4 Text", "TV-Spots, Imagefilme, Pitches", "TV spots, image films, pitches", "Spots TV, films institutionnels, présentations", "TV spoty, image filmy, prezentace")
    register("about", "branch5_title", "Über uns: Branche 5 Titel", "Sport & Events", "Sport & Events", "Sport & Grands événements", "Sport a události")
    register("about", "branch5_desc", "Über uns: Branche 5 Text", "Galas, Sportevents, Messen", "Galas, sports events, fairs", "Galas, compétitions sportives, salons", "Galavečery, sportovní akce, veletrhy")
    register("about", "branch6_title", "Über uns: Branche 6 Titel", "Spezialaufnahmen", "Special footage", "Prises de vue spéciales", "Speciální natáčení")
    register("about", "branch6_desc", "Über uns: Branche 6 Text", "Industrie, Architektur, Kunst", "Industry, architecture, art", "Industrie, architecture, projets artistiques", "Průmysl, architektura, umění")

    register("about", "cta_title", "Über uns: Abschluss CTA Titel", "Bereit, zusammenzuarbeiten?", "Ready to work together?", "Prêt à collaborer ?", "Jste připraveni ke spolupráci?")
    register("about", "cta_desc", "Über uns: Abschluss CTA Text", "Erzählen Sie uns von Ihrem Projekt. Wir sind für Sie da – persönlich, erfahren und zuverlässig.", "Tell us about your project. We're here for you – personal, experienced and reliable.", "Parlez-nous de votre projet. Nous sommes à vos côtés – disponibilité, savoir-faire et fiabilité.", "Řekněte nám o svém projektu. Jsme tu pro vás – osobně, zkušeně a spolehlivě.", "textarea")
    register("about", "cta_btn", "Über uns: Abschluss CTA Button", "Kontakt aufnehmen", "Get in touch", "Prendre contact", "Kontaktovat nás")

    # ═════════════════════════════════════════════════════════════════════════
    # 3. LEISTUNGEN (SERVICES)
    # ═════════════════════════════════════════════════════════════════════════
    register("services", "hero_badge", "Leistungen: Hero Badge", "Wien, Österreich – Professioneller Operator-Service", "Vienna, Austria – Professional Operator Service", "Vienne, Autriche – Service d'opérateur professionnel", "Vídeň, Rakousko – Profesionální operátorský servis")
    register("services", "hero_title1", "Leistungen: Titel 1", "Volle", "Full", "Complet", "Plná")
    register("services", "hero_title2", "Leistungen: Titel 2 (Gold)", "Produktions-", "Production", "Production", "Produkční")
    register("services", "hero_title3", "Leistungen: Titel 3 (Gold)", "unterstützung.", "Support.", "Assistance.", "Podpora.")
    register("services", "hero_subline", "Leistungen: Einleitungstext", "Kran, Operator und Technik – alles aus einer Hand. Wir decken jeden Aspekt Ihres Kamerakran-Einsatzes ab, von der ersten Anfrage bis zum letzten Shot.", "Crane, operator and equipment – all from a single source. We cover every aspect of your crane deployment, from the initial inquiry to the final shot.", "Grue, opérateur et technique – une solution clé en main. Nous couvrons chaque étape de votre déploiement de grue, de la première prise de contact au dernier plan.", "Jeřáb, operátor i technika – vše z jedné ruky. Pokryjeme každý aspekt nasazení kamerového jeřábu, od první poptávky až po poslední záběr.", "textarea")
    register("services", "hero_cta_quote", "Leistungen: Button Angebot", "Angebot anfragen", "Request Quote", "Demander un devis", "Požádat o nabídku")
    register("services", "hero_cta_product", "Leistungen: Button Produkt", "Produkt ansehen", "View Product", "Découvrir le produit", "Prohlédnout produkt")

    register("services", "section_label", "Leistungen: Sektion Label", "Unsere drei Säulen", "Our three pillars", "Nos trois piliers", "Naše tři pilíře")
    register("services", "headline", "Leistungen: Sektion Überschrift", "Unser Service", "Our Services", "Nos services", "Naše služby")

    register("services", "s1_title", "Leistungen: Service 1 Titel", "Kran-Vermietung", "Crane Rental", "Location de grue", "Pronájem jeřábu")
    register("services", "s1_desc", "Leistungen: Service 1 Text", "Supertechno 50+ Teleskop-Kamerakran für jeden Produktionsumfang. Tages- und Wochenmiete möglich.", "Supertechno 50+ telescopic camera crane for every production scale. Daily and weekly rental available.", "Grue télescopique Supertechno 50+ pour tout type de production. Location journalière ou hebdomadaire.", "Teleskopický jeřáb Supertechno 50+ pro každý rozsah produkce. Možnost denního i týdenního pronájmu.", "textarea")
    register("services", "s1_item1", "Leistungen: Service 1 Punkt 1", "Supertechno 50+ mit 15,11m Reichweite", "Supertechno 50+ with 15.11m reach", "Supertechno 50+ avec portée de 15,11m", "Supertechno 50+ s dosahem 15,11 m")
    register("services", "s1_item2", "Leistungen: Service 1 Punkt 2", "Techno S-Head Remote Control", "Techno S-Head Remote Control", "Contrôle à distance Techno S-Head", "Dálkové ovládání Techno S-Head")
    register("services", "s1_item3", "Leistungen: Service 1 Punkt 3", "Indoor & Outdoor einsetzbar", "Indoor & Outdoor use", "Utilisable en intérieur et extérieur", "Použití v interiéru i exteriéru")
    register("services", "s1_item4", "Leistungen: Service 1 Punkt 4", "Transport & Lieferung nach Wien & AT", "Transport & delivery Vienna & AT", "Transport & livraison à Vienne et en Autriche", "Doprava a doručení do Vídně a po Rakousku")
    register("services", "s1_item5", "Leistungen: Service 1 Punkt 5", "Tages- und Wochenmiete", "Daily and weekly rates", "Tarifs à la journée et à la semaine", "Denní a týdenní pronájem")

    register("services", "s2_title", "Leistungen: Service 2 Titel (USP)", "Operator-Service", "Operator Service", "Service opérateur", "Služba operátora")
    register("services", "s2_desc", "Leistungen: Service 2 Text", "Wir sind zu mieten und bedienen den Kran selbst. Mit über 20 Jahren Erfahrung bringen wir den Shot sicher ins Ziel.", "We're available for hire and operate the crane ourselves. With over 20 years of experience, we deliver the shot safely.", "Nous venons avec le matériel et opérons la grue nous-mêmes. Avec plus de 20 ans d'expérience, nous réalisons votre plan à la perfection.", "Pronajímáme techniku a jeřáb sami obsluhujeme. S více než 20 lety zkušeností dovedeme každý záběr bezpečně k dokonalosti.", "textarea")
    register("services", "s2_item1", "Leistungen: Service 2 Punkt 1", "Zertifizierter, erfahrener Operator", "Certified, experienced operator", "Opérateur certifié et expérimenté", "Certifikovaný, zkušený operátor")
    register("services", "s2_item2", "Leistungen: Service 2 Punkt 2", "Briefing & Shot-Planung vorab", "Briefing & shot planning in advance", "Briefing et planification des plans en amont", "Předchozí briefing a plánování záběrů")
    register("services", "s2_item3", "Leistungen: Service 2 Punkt 3", "Kommunikation mit DoP & Regie", "Communication with DoP & director", "Communication fluide avec le chef op et la réalisation", "Komunikace s kameramanem (DoP) a režií")
    register("services", "s2_item4", "Leistungen: Service 2 Punkt 4", "Wiederholbare, präzise Movements", "Repeatable, precise movements", "Mouvements précis et parfaitement répétables", "Opakovatelné, precizní pohyby")
    register("services", "s2_item5", "Leistungen: Service 2 Punkt 5", "Flexibel auf Set & reaktionsschnell", "Flexible on set & fast reaction", "Grande flexibilité sur le plateau et réactivité", "Flexibilita na place a rychlé reakce")

    register("services", "s3_title", "Leistungen: Service 3 Titel", "Technischer Support", "Technical Support", "Support technique", "Technická podpora")
    register("services", "s3_desc", "Leistungen: Service 3 Text", "Technische Beratung und Betreuung für Ihre Produktion. Wir arbeiten mit allen gängigen Remote-Head-Systemen.", "Technical consultation and support for your production. We work with all common remote head systems.", "Conseil technique et assistance pour votre production. Nous travaillons avec tous les systèmes de têtes télécommandées courants.", "Technické poradenství a asistence pro vaši produkci. Pracujeme se všemi běžnými systémy remote heads.", "textarea")
    register("services", "s3_item1", "Leistungen: Service 3 Punkt 1", "Technische Betreuung inklusive", "Technical support included", "Assistance technique incluse", "Technická podpora v ceně")
    register("services", "s3_item2", "Leistungen: Service 3 Punkt 2", "Kompatibel mit allen Kamerasystemen", "Compatible with all camera systems", "Compatible avec tous les systèmes caméra", "Kompatibilní se všemi kamerovými systémy")
    register("services", "s3_item3", "Leistungen: Service 3 Punkt 3", "Techno S-Head, Preston FI+Z", "Techno S-Head, Preston FI+Z", "Techno S-Head, Preston FI+Z", "Techno S-Head, Preston FI+Z")
    register("services", "s3_item4", "Leistungen: Service 3 Punkt 4", "Location Scouting auf Anfrage", "Location scouting on request", "Repérage des décors sur demande", "Obhlídka lokací na vyžádání")
    register("services", "s3_item5", "Leistungen: Service 3 Punkt 5", "Technische Beratung vorab (kostenlos)", "Technical consultation (free)", "Conseil technique préalable (gratuit)", "Předběžné technické poradenství (zdarma)")

    register("services", "process_label", "Leistungen: Ablauf Label", "So läuft es ab", "How it works", "Comment ça se passe", "Jak to probíhá")
    register("services", "process_title", "Leistungen: Ablauf Titel", "Von der Anfrage zum Shot", "From inquiry to the shot", "De la demande au tournage", "Od poptávky k záběru")
    register("services", "step1_title", "Leistungen: Schritt 1 Titel", "Anfrage", "Inquiry", "Demande", "Poptávka")
    register("services", "step1_desc", "Leistungen: Schritt 1 Text", "Kurzes Formular oder Anruf – wir melden uns in 24h.", "Short form or call – we respond within 24h.", "Formulaire rapide ou appel – réponse sous 24h.", "Krátký formulář nebo telefonát – ozveme se do 24 h.")
    register("services", "step2_title", "Leistungen: Schritt 2 Titel", "Briefing", "Briefing", "Briefing", "Briefing")
    register("services", "step2_desc", "Leistungen: Schritt 2 Text", "Shotliste, Location und Kameraausstattung besprechen.", "Discuss shot list, location and camera setup.", "Point sur la liste des plans, les décors et la configuration caméra.", "Probrání shotlistu, lokace a kamerového vybavení.")
    register("services", "step3_title", "Leistungen: Schritt 3 Titel", "Bereitstellung", "Preparation", "Mise en place", "Příprava")
    register("services", "step3_desc", "Leistungen: Schritt 3 Text", "Anlieferung & Einrichtung – in kürzester Zeit einsatzbereit.", "Delivery & configuration – ready in no time.", "Livraison & installation – opérationnel en un temps record.", "Doprava a sestavení – připraveno v rekordním čase.")
    register("services", "step4_title", "Leistungen: Schritt 4 Titel", "Shot!", "Shot!", "Tournez !", "Klapka!")
    register("services", "step4_desc", "Leistungen: Schritt 4 Text", "Operator am Steuer – präzise, wiederholbar, sicher.", "Operator at the controls – precise, repeatable, safe.", "L'opérateur aux commandes – précision, sécurité et répétabilité.", "Operátor u řízení – precizní, opakovatelné, bezpečné.")

    register("services", "pricing_label", "Leistungen: Konditionen Label", "Konditionen", "Pricing", "Tarification", "Ceník")
    register("services", "pricing_title", "Leistungen: Konditionen Titel", "Transparente Preisgestaltung", "Transparent pricing", "Tarifs clairs et transparents", "Transparentní tvorba cen")
    register("services", "price1_title", "Leistungen: Preis 1 Titel", "Angebot auf Anfrage", "Quote on request", "Devis sur mesure", "Nabídka na míru")
    register("services", "price1_desc", "Leistungen: Preis 1 Text", "Jede Produktion ist anders – wir kalkulieren individuell nach Aufwand, Dauer und Leistungsumfang.", "Every production is different – we calculate individually based on effort, duration and scope.", "Chaque projet est unique – calcul personnalisé selon la charge de travail, la durée et l'équipement.", "Každá produkce je jiná – kalkulujeme individuálně dle náročnosti, délky a rozsahu služeb.", "textarea")
    register("services", "price2_title", "Leistungen: Preis 2 Titel", "Tages- & Wochensätze", "Daily & weekly rates", "Tarifs journaliers & hebdomadaires", "Denní a týdenní sazby")
    register("services", "price2_desc", "Leistungen: Preis 2 Text", "Flexible Buchung: Halbtag, ganzer Tag oder Mehrtagesprojekte – mit Mengenrabatt.", "Flexible booking: half day, full day or multi-day projects – with volume discount.", "Formules flexibles : demi-journée, journée entière ou plusieurs jours – tarifs dégressifs.", "Flexibilní rezervace: půlden, celý den nebo vícedenní projekty – s množstevní slevou.", "textarea")
    register("services", "price3_title", "Leistungen: Preis 3 Titel", "Alle Kosten inklusive", "All costs included", "Tous frais inclus", "Všechny náklady zahrnuty")
    register("services", "price3_desc", "Leistungen: Preis 3 Text", "Transport, Operator, Techno S-Head und Betreuung – keine versteckten Kosten.", "Transport, operator, Techno S-Head and support – no hidden costs.", "Transport, opérateur, Techno S-Head et assistance – aucun coût caché.", "Doprava, operátor, hlava Techno S-Head a servis – žádné skryté poplatky.", "textarea")
    register("services", "price4_title", "Leistungen: Preis 4 Titel", "Kostenlose Erstberatung", "Free initial consultation", "Premier échange gratuit", "Bezplatná úvodní konzultace")
    register("services", "price4_desc", "Leistungen: Preis 4 Text", "Wir besprechen Ihr Projekt vorab und prüfen Machbarkeit – unverbindlich und kostenlos.", "We discuss your project upfront and check feasibility – no obligation, no charge.", "Étude de faisabilité et échange préliminaire – gratuit et sans engagement.", "Předem probereme váš projekt a prověříme proveditelnost – nezávazně a zdarma.", "textarea")
    register("services", "pricing_cta_btn", "Leistungen: Konditionen Button", "Jetzt kostenloses Angebot anfragen", "Request free quote now", "Demander un devis gratuit dès maintenant", "Požádat o bezplatnou nabídku")

    # ═════════════════════════════════════════════════════════════════════════
    # 4. SUPERTECHNO 50+ (PRODUCT)
    # ═════════════════════════════════════════════════════════════════════════
    register("product", "hero_badge", "Produkt: Hero Badge", "Das meistverwendete Teleskop-Kamerakransystem weltweit", "The world's most widely used telescopic camera crane", "Le système de grue télescopique le plus utilisé au monde", "Nejpoužívanější teleskopický kamerový jeřáb na světě")
    register("product", "hero_title1", "Produkt: Titel 1", "Supertechno", "Supertechno", "Supertechno", "Supertechno")
    register("product", "hero_title2", "Produkt: Titel 2 (Gold)", "50+", "50+", "50+", "50+")
    register("product", "tagline", "Produkt: Tagline", "Das vielseitigste Teleskop-Kamerakransystem.", "The most versatile telescopic camera crane system.", "Le système de grue télescopique le plus polyvalent.", "Nejvšestrannější systém teleskopických kamerových jeřábů.")
    register("product", "subline", "Produkt: Unterzeile", "Das professionelle Teleskop-Kamerakransystem – mit Operator-Service aus Wien.", "The professional telescopic camera crane system – with operator service from Vienna.", "Le système professionnel de grue télescopique – avec service opérateur depuis Vienne.", "Profesionální systém teleskopického kamerového jeřábu – se servisem operátora z Vídně.")
    register("product", "description", "Produkt: Beschreibungstext", "Der Supertechno 50+ ist das meistverwendete Teleskop-Kamerakransystem weltweit. Er ist Indoor und Outdoor einsetzbar und bietet mit dem Techno S-Head präzise Kamerasteuerung für jeden Shot – von der engen Studio-Aufnahme bis zum großen Outdoor-Event.", "The Supertechno 50+ is the world's most widely used telescopic camera crane system. It works indoors and outdoors, and with the Techno S-Head provides precise camera control for every shot – from tight studio work to large outdoor events.", "Le Supertechno 50+ est le système de grue télescopique le plus utilisé au monde. Utilisable en intérieur comme en extérieur, il offre avec la tête Techno S-Head un contrôle ultra-précis pour chaque plan – des studios exigus aux grands événements en plein air.", "Supertechno 50+ je celosvětově nejpoužívanější systém teleskopických kamerových jeřábů. Je vhodný pro interiér i exteriér a s hlavou Techno S-Head nabízí precizní ovládání pro každý záběr – od malých studií po velké venkovní akce.", "textarea")
    
    register("product", "spec_reach", "Produkt: Reichweite", "15,11m", "15.11m", "15,11m", "15,11m")
    register("product", "spec_payload", "Produkt: Nutzlast", "Payload S-Head 35kg", "Payload S-Head 35kg", "Payload S-Head 35kg", "Payload S-Head 35kg")
    register("product", "spec_pan", "Produkt: Schwenkbereich", "360°", "360°", "360°", "360°")
    register("product", "spec_use", "Produkt: Einsatzbereich", "Indoor / Outdoor", "Indoor / Outdoor", "Intérieur / Extérieur", "Interiér / Exteriér")
    register("product", "spec_head", "Produkt: Remote-Head", "Techno S-Head", "Techno S-Head", "Techno S-Head", "Techno S-Head")
    register("product", "spec_sections", "Produkt: Teleskop-Abschnitte", "4", "4", "4", "4")
    register("product", "spec_vehicle", "Produkt: Fahrzeug / Transport", "Eigener Transport", "Own Transport", "Transport dédié", "Vlastní doprava")

    register("product", "usp_badge1", "Produkt: USP Badge 1", "🌍 Bewährt weltweit", "🌍 Proven worldwide", "🌍 Éprouvé dans le monde entier", "🌍 Prověřeno po celém světě")
    register("product", "usp_badge2", "Produkt: USP Badge 2", "🎯 Präziser S-Head", "🎯 Precise S-Head", "🎯 Tête S-Head ultra-précise", "🎯 Precizní hlava S-Head")
    register("product", "usp_badge3", "Produkt: USP Badge 3", "✅ Operator inklusive", "✅ Operator included", "✅ Opérateur inclus", "✅ Operátor v ceně")

    register("product", "diagram_label", "Produkt: Diagramm Label", "Technisches Diagramm", "Technical Diagram", "Schéma technique", "Technické schéma")
    register("product", "diagram_top_desc", "Produkt: Diagramm Draufsicht Text", "Draufsicht – Schwenkbereich und Reichweite", "Top view – pan range and reach", "Vue de dessus – amplitude de rotation et portée", "Pohled shora – rozsah otáčení a dosah")
    register("product", "diagram_side_desc", "Produkt: Diagramm Seitenansicht Text", "Seitenansicht – Kranarm-Positionen", "Side view – crane arm positions", "Vue latérale – positions du bras de grue", "Boční pohled – polohy ramene jeřábu")

    register("product", "usecases_label", "Produkt: Einsatzbereiche Label", "Einsatzbereiche", "Use Cases", "Domaines d'intervention", "Oblasti použití")
    register("product", "usecases_title", "Produkt: Einsatzbereiche Titel", "Vielseitig auf jedem Set", "Versatile on every set", "Une polyvalence totale sur plateau", "Všestrannost na každém place")
    register("product", "use1_title", "Produkt: Einsatz 1 Titel", "Film & Kino", "Film & Cinema", "Cinéma & Fiction", "Film a kino")
    register("product", "use1_desc", "Produkt: Einsatz 1 Text", "Bewährt in nationalen und internationalen Kinoproduktionen. Ideale Reichweite für Establishing Shots und Crane-Moves.", "Proven in national and international cinema productions. Ideal reach for establishing shots and crane moves.", "Éprouvé sur les plus grands tournages internationaux. Une amplitude parfaite pour les plans larges et mouvements complexes.", "Ověřeno v domácích i zahraničních filmových produkcích. Ideální dosah pro ustavující záběry a jeřábové jízdy.", "textarea")
    register("product", "use2_title", "Produkt: Einsatz 2 Titel", "TV & Werbung", "TV & Commercials", "Télévision & Publicité", "TV a reklama")
    register("product", "use2_desc", "Produkt: Einsatz 2 Text", "Ideal für zeitkritische TV-Produktionen und Werbeaufnahmen. Schneller Auf- und Abbau auf Set.", "Ideal for time-critical TV productions and commercial shoots. Fast on-set setup and teardown.", "Parfait pour les productions publicitaires et télévisuelles aux plannings serrés. Montage et démontage ultra-rapides.", "Ideální pro časově náročné televizní produkce a reklamní natáčení. Rychlá montáž a demontáž na place.", "textarea")
    register("product", "use3_title", "Produkt: Einsatz 3 Titel", "Events & Konzerte", "Events & Concerts", "Événements & Concerts", "Eventy a koncerty")
    register("product", "use3_desc", "Produkt: Einsatz 3 Text", "Spektakuläre Shots bei Konzerten, Sportevents und Messen. Maximale Flexibilität dank Outdoor-Eignung.", "Spectacular shots at concerts, sports events and trade fairs. Maximum flexibility thanks to outdoor suitability.", "Prises de vues spectaculaires lors de festivals, événements sportifs et salons. Flexibilité maximale en extérieur.", "Spektakulární záběry na koncertech, sportovních akcích a veletrzích. Maximální flexibilita díky odolnosti vůči venkovním podmínkám.", "textarea")
    register("product", "use4_title", "Produkt: Einsatz 4 Titel", "Sport", "Sports", "Sport & Action", "Sport")
    register("product", "use4_desc", "Produkt: Einsatz 4 Text", "Live-Übertragungen von Sport-Events, Motorsport und Action-Aufnahmen. Dynamische Fahrten und präzise Verfolgung in Höchstgeschwindigkeit.", "Live sports broadcasting, motorsports and action shots. Dynamic moves and precise tracking at maximum speed.", "Retransmissions sportives en direct, sports mécaniques et action. Mouvements dynamiques et suivi chirurgical à haute vitesse.", "Živé přenosy sportovních akcí, motorsport a akční záběry. Dynamické jízdy a přesné sledování v maximální rychlosti.", "textarea")

    register("product", "download_title", "Produkt: Download Bereich Titel", "Möchten Sie alle technischen Details?", "Want all technical details?", "Vous souhaitez consulter la fiche technique complète ?", "Chcete vědět všechny technické detaily?")
    register("product", "download_desc", "Produkt: Download Bereich Text", "Laden Sie das offizielle Datenblatt des Supertechno 50+ herunter – inklusive Maßskizzen und Traglasttabellen.", "Download the official Supertechno 50+ spec sheet – including dimensional drawings and load charts.", "Téléchargez la documentation officielle de la Supertechno 50+ – avec schémas cotés et abaques de charge.", "Stáhněte si oficiální technický list Supertechno 50+ – včetně výkresů a zátěžových tabulek.", "textarea")
    register("product", "download_btn", "Produkt: Download Button Label", "Datenblatt herunterladen (PDF)", "Download Spec Sheet (PDF)", "Télécharger la fiche technique (PDF)", "Stáhnout technický list (PDF)")

    # ═════════════════════════════════════════════════════════════════════════
    # 5. KONTAKT (CONTACT)
    # ═════════════════════════════════════════════════════════════════════════
    register("contact", "hero_badge", "Kontakt: Hero Badge", "Antwort innerhalb von 24 Stunden", "Response within 24 hours", "Réponse sous 24 heures", "Odpověď do 24 hodin")
    register("contact", "hero_title1", "Kontakt: Titel 1", "Lassen Sie uns", "Let's", "Parlons", "Pojďme")
    register("contact", "hero_title2", "Kontakt: Titel 2 (Gold)", "sprechen.", "talk.", "ensemble.", "spolu mluvit.")
    register("contact", "hero_subline", "Kontakt: Einleitungstext", "Angebot anfragen, Termin buchen oder einfach Hallo sagen – wir antworten innerhalb von 24 Stunden.", "Request a quote, book a consultation or just say hello – we respond within 24 hours.", "Demandez un devis, réservez un créneau ou contactez-nous – nous répondons sous 24 heures.", "Požádejte o nabídku, rezervujte si termín nebo nás jen pozdravte – odpovíme do 24 hodin.", "textarea")
    register("contact", "cta_scroll_form", "Kontakt: Button zum Formular", "Zum Kontaktformular", "To the contact form", "Vers le formulaire de contact", "Přejít na formulář")

    register("contact", "tab_contact", "Kontakt: Tab Allgemeine Anfrage", "Allgemeine Anfrage", "General Inquiry", "Demande générale", "Obecný dotaz")
    register("contact", "tab_product", "Kontakt: Tab Produktanfrage", "Produktanfrage", "Product Inquiry", "Demande de matériel", "Poptávka techniky")
    register("contact", "tab_booking", "Kontakt: Tab Beratungstermin", "Beratungstermin", "Consultation", "Rendez-vous conseil", "Konzultace")

    register("contact", "form_name", "Kontakt Formular: Label Name", "Name *", "Name *", "Nom *", "Jméno *")
    register("contact", "form_email", "Kontakt Formular: Label E-Mail", "E-Mail *", "Email *", "E-mail *", "E-mail *")
    register("contact", "form_phone", "Kontakt Formular: Label Telefon", "Telefon", "Phone", "Téléphone", "Telefon")
    register("contact", "form_company", "Kontakt Formular: Label Unternehmen", "Unternehmen", "Company", "Société", "Společnost")
    register("contact", "form_message", "Kontakt Formular: Label Nachricht", "Nachricht *", "Message *", "Message *", "Zpráva *")
    register("contact", "form_privacy_consent", "Kontakt Formular: DSGVO Checkbox Text", "Ich stimme der Datenschutzerklärung zu.", "I agree to the Privacy Policy.", "J'accepte la politique de confidentialité.", "Souhlasím se zásadami ochrany osobních údajů.")
    register("contact", "form_submit_general", "Kontakt Formular: Button Nachricht senden", "Nachricht senden", "Send Message", "Envoyer le message", "Odeslat zprávu")
    
    register("contact", "form_model", "Kontakt Formular: Label Kran-Modell", "Kran-Modell *", "Crane Model *", "Modèle de grue *", "Model jeřábu *")
    register("contact", "form_model_select", "Kontakt Formular: Placeholder Modell", "Bitte wählen...", "Please select...", "Veuillez choisir...", "Prosím vyberte...")
    register("contact", "form_shoot_date", "Kontakt Formular: Label Drehtag", "Drehtag / Datum", "Shooting Date", "Jour de tournage / Date", "Natáčecí den / Datum")
    register("contact", "form_duration", "Kontakt Formular: Label Dauer", "Dauer", "Duration", "Durée", "Doba trvání")
    register("contact", "form_project_desc", "Kontakt Formular: Label Projektbeschreibung", "Projektbeschreibung", "Project description", "Description du projet", "Popis projektu")
    register("contact", "form_submit_quote", "Kontakt Formular: Button Angebot anfragen", "Angebot anfragen", "Request Quote", "Demander un devis", "Požádat o nabídku")

    register("contact", "form_preferred_date", "Kontakt Formular: Label Wunschdatum", "Wunschdatum *", "Preferred date *", "Date souhaitée *", "Požadované datum *")
    register("contact", "form_time", "Kontakt Formular: Label Uhrzeit", "Uhrzeit", "Time", "Heure", "Čas")
    register("contact", "form_time_any", "Kontakt Formular: Option Beliebige Uhrzeit", "Beliebig", "Anytime", "Indifférent", "Kdykoliv")
    register("contact", "form_topic", "Kontakt Formular: Label Worum geht es", "Worum geht es?", "What is it about?", "De quoi s'agit-il ?", "O co se jedná?")
    register("contact", "form_submit_booking", "Kontakt Formular: Button Termin bestätigen", "Termin bestätigen", "Confirm booking", "Confirmer le rendez-vous", "Potvrdit termín")

    register("contact", "map_address_note", "Kontakt: Karten-Hinweis Adresse", "Genaue Adresse auf Anfrage", "Exact address on request", "Adresse exacte sur demande", "Přesná adresa na vyžádání")

    register("home", "portfolio_label", "Home: Portfolio Label", "Unsere Arbeit", "Our Work", "Nos réalisations", "Naše práce")
    register("contact", "section_label", "Kontakt: Sektion Label", "Kontakt", "Contact", "Contact", "Kontakt")

    # ═════════════════════════════════════════════════════════════════════════
    # 6. SIMULATOR & TRACKING (TRACKING)
    # ═════════════════════════════════════════════════════════════════════════
    register("tracking", "hud_title", "Simulator: HUD Titel", "Technogrips Supertechno 50+ Simulator", "Technogrips Supertechno 50+ Simulator", "Simulateur Supertechno 50+ Technogrips", "Simulátor Supertechno 50+ Technogrips")
    register("tracking", "hud_instruction", "Simulator: Anleitung", "Nutzen Sie die zwei Joysticks, um den Kran zu drehen & zu neigen (linker Stick) und teleskopieren & anzuheben (rechter Stick).", "Use the dual joysticks to rotate & tilt (left stick) and telescope & lift (right stick).", "Utilisez les deux joysticks pour orienter & incliner (stick gauche) et télescoper & monter (stick droit).", "Pomocí dvou joysticků otáčejte a naklánějte (levý stick) a teleskopujte a zvedejte (pravý stick).", "textarea")
    register("tracking", "subline_full", "Simulator: Subline Volltext", "Interaktive Echtzeit-Steuerung & 3D-Telemetrie des Supertechno 50+ Teleskop-Kamerakrans.", "Interactive real-time control & 3D telemetry of the Supertechno 50+ telescopic camera crane.", "Contrôle interactif en temps réel et télémétrie 3D de la grue télescopique Supertechno 50+.", "Interaktivní řízení v reálném čase a 3D telemetrie teleskopického kamerového jeřábu Supertechno 50+.", "textarea")
    register("tracking", "joy_left_title", "Simulator: Linker Joystick Titel", "DREHEN & NEIGEN", "PAN & TILT", "PAN & TILT", "OTÁČENÍ A NÁKLON")
    register("tracking", "joy_right_title", "Simulator: Rechter Joystick Titel", "TELESKOP & SÄULE", "TELESCOPE & COLUMN", "TÉLESCOPE & COLONNE", "TELESKOP A SLOUP")
    register("tracking", "joy_cam_title", "Simulator: Kamera Head Joystick Titel", "REMOTE HEAD / KAMERA", "REMOTE HEAD / CAMERA", "TÊTE TÉLÉCOMMANDÉE / CAMÉRA", "HLAVA / KAMERA")

    print(f"Total CMS keys registered: {len(db_entries)}")
    
    # Save into SQLite
    for k, item in db_entries.items():
        c.execute("""
            INSERT OR REPLACE INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (item["section"], item["key"], item["label"], item["value_de"], item["value_en"], item["value_fr"], item["value_cs"], item["type"]))
    
    conn.commit()
    conn.close()
    
    # Also save to data/leads.db
    conn2 = sqlite3.connect('data/leads.db')
    c2 = conn2.cursor()
    for k, item in db_entries.items():
        c2.execute("""
            INSERT OR REPLACE INTO page_content (section, key, label, value_de, value_en, value_fr, value_cs, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (item["section"], item["key"], item["label"], item["value_de"], item["value_en"], item["value_fr"], item["value_cs"], item["type"]))
    conn2.commit()
    conn2.close()
    print("Database synchronization completed successfully!")

if __name__ == '__main__':
    main()
