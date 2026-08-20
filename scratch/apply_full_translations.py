import os
import re
import json

# Comprehensive Translation Dictionary: DE -> (EN, FR, CS)
DICT = {
  "Startseite": ("Home", "Accueil", "Domů"),
  "Leistungen": ("Services", "Services", "Služby"),
  "Supertechno 50+": ("Supertechno 50+", "Supertechno 50+", "Supertechno 50+"),
  "Tracking & Telemetrie": ("Tracking & Telemetry", "Tracking & Télémétrie", "Tracking a telemetrie"),
  "Über uns": ("About", "À propos", "O nás"),
  "Kontakt": ("Contact", "Contact", "Kontakt"),
  "Jetzt anfragen": ("Get a Quote", "Demander un devis", "Poptat nyní"),
  "Sprache": ("Language", "Langue", "Jazyk"),
  "Wien, Österreich – Professioneller Operator-Service": ("Vienna, Austria – Professional Operator Service", "Vienne, Autriche – Service d'opérateur professionnel", "Vídeň, Rakousko – Profesionální operátorský servis"),
  "Der Kran.": ("The Crane.", "La Grue.", "Jeřáb."),
  "Der Operator.": ("The Operator.", "L'Opérateur.", "Operátor."),
  "Ihr Shot.": ("Your Shot.", "Votre Prise de vue.", "Váš záběr."),
  "Wir stellen professionelle Supertechno Teleskop-Kamerakrane mit erfahrenen Operators zur Verfügung – für Film-, TV- und Eventproduktionen in Wien und ganz Österreich.": (
    "We provide professional Supertechno telescopic camera cranes with experienced operators – for film, TV and event productions in Vienna and all of Austria.",
    "Nous fournissons des grues télescopiques professionnelles Supertechno avec opérateurs expérimentés – pour les productions de films, TV et événements à Vienne et dans toute l'Autriche.",
    "Poskytujeme profesionální teleskopické kamerové jeřáby Supertechno se zkušenými operátory – pro filmovou, televizní a eventovou produkci ve Vídni a celém Rakousku."
  ),
  "Kostenlos anfragen": ("Free Quote", "Devis gratuit", "Nezávazná poptávka"),
  "Katalog herunterladen": ("Download Catalog", "Télécharger le catalogue", "Stáhnout katalog"),
  "Jahre Erfahrung": ("Years Experience", "Ans d'expérience", "Let zkušeností"),
  "Produktionen": ("Productions", "Productions", "Produkcí"),
  "Supertechno": ("Supertechno", "Supertechno", "Supertechno"),
  "Verfügbarkeit": ("Availability", "Disponibilité", "Dostupnost"),
  "Was wir bieten": ("What We Offer", "Ce que nous offrons", "Co nabízíme"),
  "Unser Service": ("Our Services", "Nos services", "Naše služby"),
  "Von der Buchung bis zum letzten Shot – wir stellen alles bereit.": (
    "From booking to the last shot – we provide everything.",
    "De la réservation au dernier plan – nous fournissons tout le nécessaire.",
    "Od rezervace až po poslední záběr – zajistíme vše."
  ),
  "Kran-Vermietung": ("Crane Rental", "Location de grue", "Pronájem jeřábu"),
  "Supertechno 30, 50+ und 75+ Teleskop-Kamerakrane für jeden Produktionsumfang. Tages- und Wochenmiete möglich.": (
    "Supertechno 30, 50+ and 75+ telescopic camera cranes for every production scale. Daily and weekly rental available.",
    "Grues télescopiques Supertechno 30, 50+ et 75+ pour toute envergure de production. Location à la journée et à la semaine.",
    "Teleskopické kamerové jeřáby Supertechno 30, 50+ a 75+ pro jakýkoli rozsah produkce. Možnost denního i týdenního pronájmu."
  ),
  "Alle Remote-Heads": ("All Remote Heads", "Toutes têtes télécommandées", "Všechny remote heads"),
  "Vielseitig einsetzbar": ("Versatile Use", "Utilisation polyvalente", "Všestranné využití"),
  "Lieferung nach Wien & AT": ("Delivery to Vienna & AT", "Livraison à Vienne & en Autriche", "Doprava do Vídně a po celém Rakousku"),
  "⭐ Unser USP": ("⭐ Our USP", "⭐ Notre atout majeur", "⭐ Naše hlavní přednost"),
  "Operator-Service": ("Operator Service", "Service opérateur", "Služba operátora"),
  "Wir sind zu mieten und bedienen den Kran selbst. Mit über 20 Jahren Erfahrung bringen wir den Shot sicher ins Ziel.": (
    "We're available for hire and operate the crane ourselves. With over 20 years of experience, we deliver the shot safely.",
    "Nous venons avec le matériel et opérons la grue nous-mêmes. Avec plus de 20 ans d'expérience, nous réalisons votre plan à la perfection.",
    "Pronajímáme techniku a jeřáb sami obsluhujeme. S více než 20 lety zkušeností dovedeme každý záběr bezpečně k dokonalosti."
  ),
  "Zertifizierter Operator": ("Certified Operator", "Opérateur certifié", "Certifikovaný operátor"),
  "Briefing & Planung": ("Briefing & Planning", "Briefing & Planification", "Briefing a plánování"),
  "Vor Ort Support": ("On-site Support", "Support sur le plateau", "Podpora na place"),
  "Technischer Support": ("Technical Support", "Support technique", "Technická podpora"),
  "Technische Beratung und Betreuung für Ihre Produktion. Wir arbeiten mit allen gängigen Remote-Head-Systemen.": (
    "Technical consultation and support for your production. We work with all common remote head systems.",
    "Conseil technique et assistance pour votre production. Nous travaillons avec tous les systèmes de têtes télécommandées courants.",
    "Technické poradenství a asistence pro vaši produkci. Pracujeme se všemi běžnými systémy remote heads."
  ),
  "Techno S-Head": ("Techno S-Head", "Techno S-Head", "Techno S-Head"),
  "Schnelle Reaktionszeit": ("Fast Response Time", "Réactivité rapide", "Rychlá doba odezvy"),
  "Location Scouting": ("Location Scouting", "Repérage des lieux", "Obhlídka lokací"),
  "Das Produkt": ("The Product", "Le Produit", "Produkt"),
  "Das professionelle Teleskop-Kamerakransystem – mit Operator-Service aus Wien.": (
    "The professional telescopic camera crane system – with operator service from Vienna.",
    "Le système professionnel de grue télescopique – avec service d'opérateur depuis Vienne.",
    "Profesionální teleskopický kamerový jeřábový systém – s operátorským servisem z Vídně."
  ),
  "Herstellerseite": ("Manufacturer", "Site du fabricant", "Web výrobce"),
  "Technische Daten": ("Specifications", "Caractéristiques techniques", "Technické specifikace"),
  "Das vielseitigste Teleskop-Kamerakransystem.": ("The most versatile telescopic camera crane system.", "Le système de grue télescopique le plus polyvalent.", "Nejvšestrannější systém teleskopických kamerových jeřábů."),
  "15,11m": ("15.11m", "15,11 m", "15,11 m"),
  "Max. Reichweite": ("Max. Reach", "Portée max.", "Max. dosah"),
  "Max. Nutzlast": ("Max. Payload", "Charge utile max.", "Max. nosnost"),
  "Schwenk (remote)": ("Pan (remote)", "Panoramique (remote)", "Rotace (remote)"),
  "Einsatzbereich": ("Use Case", "Domaine d'application", "Oblast použití"),
  "Remote-Head": ("Remote Head", "Tête télécommandée", "Remote Head"),
  "Der Supertechno 50+ ist das meistverwendete Teleskop-Kamerakransystem weltweit. Er ist Indoor und Outdoor einsetzbar und bietet mit dem Techno S-Head präzise Kamerasteuerung für jeden Shot – von der engen Studio-Aufnahme bis zum großen Outdoor-Event.": (
    "The Supertechno 50+ is the world's most widely used telescopic camera crane system. It works indoors and outdoors, and with the Techno S-Head provides precise camera control for every shot – from tight studio work to large outdoor events.",
    "Le Supertechno 50+ est le système de grue télescopique le plus utilisé au monde. Utilisable en intérieur comme en extérieur, il offre avec la tête Techno S-Head un contrôle ultra-précis pour chaque plan – des studios exigus aux grands événements en plein air.",
    "Supertechno 50+ je celosvětově nejpoužívanější systém teleskopických kamerových jeřábů. Je vhodný pro interiér i exteriér a s hlavou Techno S-Head nabízí precizní ovládání pro každý záběr – od malých studií po velké venkovní akce."
  ),
  "Katalog PDF": ("Catalog PDF", "Catalogue PDF", "Katalog PDF"),
  "Film & Kino": ("Film & Cinema", "Cinéma & Long-métrage", "Film a kino"),
  "Bewährt in nationalen und internationalen Kinoproduktionen. Ideale Reichweite für Establishing Shots und Crane-Moves.": (
    "Proven in national and international cinema productions. Ideal reach for establishing shots and crane moves.",
    "Éprouvé dans les productions cinématographiques nationales et internationales. Portée idéale pour les plans d'ensemble et mouvements de grue.",
    "Osvědčeno v národních i mezinárodních filmových produkcích. Ideální dosah pro ustavující záběry a jeřábové jízdy."
  ),
  "TV & Werbung": ("TV & Commercials", "Télévision & Publicité", "TV a reklama"),
  "Ideal für zeitkritische TV-Produktionen und Werbeaufnahmen. Schneller Auf- und Abbau auf Set.": (
    "Ideal for time-critical TV productions and commercial shoots. Fast on-set setup and teardown.",
    "Idéal pour les productions TV et tournages publicitaires aux délais serrés. Montage et démontage rapides sur le plateau.",
    "Ideální pro časově náročné televizní produkce a reklamní natáčení. Rychlá montáž a demontáž na place."
  ),
  "Events & Konzerte": ("Events & Concerts", "Événements & Concerts", "Akce a koncerty"),
  "Spektakuläre Shots bei Konzerten, Sportevents und Messen. Maximale Flexibilität dank Outdoor-Eignung.": (
    "Spectacular shots at concerts, sports events and trade fairs. Maximum flexibility thanks to outdoor suitability.",
    "Prises de vue spectaculaires lors de concerts, événements sportifs et salons. Flexibilité maximale grâce à l'adaptation extérieure.",
    "Spektakulární záběry na koncertech, sportovních akcích a veletrzích. Maximální flexibilita díky odolnosti v exteriéru."
  ),
  "Warum Technogrips": ("Why Technogrips", "Pourquoi Technogrips", "Proč Technogrips"),
  "Wien-basiert. Weltweit erfahren.": ("Vienna-based. World-class experience.", "Basé à Vienne. Expérience internationale.", "Se sídlem ve Vídni. Světové zkušenosti."),
  "Als Operator-Team mit Sitz in Wien bieten wir nicht nur das Equipment – wir sind das Equipment. Unser Service umfasst die vollständige Betreuung von der Planung bis zum letzten Shot.": (
    "As an operator team based in Vienna, we don't just provide the equipment – we are the equipment. Our service covers complete support from planning to the last shot.",
    "En tant qu'équipe d'opérateurs basée à Vienne, nous ne fournissons pas seulement le matériel – nous faisons corps avec lui. Notre prestation comprend un accompagnement complet, de la préparation au dernier tour de manivelle.",
    "Jako tým operátorů se sídlem ve Vídni nenabízíme pouze techniku – my jsme ta technika. Naše služby zahrnují kompletní servis od plánování až po finální klapku."
  ),
  "Operator inklusive": ("Operator Included", "Opérateur inclus", "Operátor v ceně"),
  "Kein Kran ohne Bedienung. Wir stellen den Operator und bedienen das System professionell.": (
    "No crane without operation. We provide the operator and professionally handle the system.",
    "Pas de grue sans opérateur. Nous assurons nous-mêmes le pilotage professionnel du système.",
    "Žádný jeřáb bez obsluhy. Poskytujeme operátora a systém profesionálně obsluhujeme."
  ),
  "24/7 Verfügbarkeit": ("24/7 Availability", "Disponibilité 24/7", "Dostupnost 24/7"),
  "Filmproduktionen kennen keine Bürozeiten. Wir auch nicht – kurzfristige Buchungen möglich.": (
    "Film productions don't know office hours. Neither do we – short-notice bookings possible.",
    "Les tournages ne connaissent pas d'heures de bureau. Nous non plus – réservations de dernière minute possibles.",
    "Filmová produkce nezná pracovní dobu. My také ne – možnost rezervace na poslední chvíli."
  ),
  "Wien & ganz Österreich": ("Vienna & all of Austria", "Vienne & toute l'Autriche", "Vídeň a celé Rakousko"),
  "Unser Standort ist Wien – wir sind österreichweit und auf Anfrage auch international tätig.": (
    "Based in Vienna – we operate throughout Austria and internationally on request.",
    "Basés à Vienne, nous intervenons dans toute l'Autriche et à l'international sur demande.",
    "Naše sídlo je ve Vídni – působíme po celém Rakousku a na vyžádání i mezinárodně."
  ),
  "Versichert & zertifiziert": ("Insured & Certified", "Assuré & certifié", "Pojištěno a certifikováno"),
  "Vollständige Betriebshaftpflichtversicherung. Alle Sicherheitsstandards werden eingehalten.": (
    "Full liability insurance. All safety standards are maintained.",
    "Assurance responsabilité civile professionnelle complète. Respect strict de toutes les normes de sécurité.",
    "Kompletní pojištění odpovědnosti z provozu. Dodržení veškerých bezpečnostních standardů."
  ),
  "Beratungstermin buchen": ("Book Consultation", "Prendre rendez-vous", "Rezervovat konzultaci"),
  "Unsere Arbeit": ("Our Work", "Nos réalisations", "Naše práce"),
  "Einsatzbereiche": ("Use Cases", "Domaines d'intervention", "Oblasti použití"),
  "Spielfilm": ("Feature Film", "Long-métrage", "Celovečerní film"),
  "Kinoproduktionen": ("Cinema Productions", "Productions cinéma", "Filmové produkce"),
  "TV & Serien": ("TV & Series", "TV & Séries", "TV a seriály"),
  "Werbung": ("Commercials", "Publicité", "Reklama"),
  "Sport": ("Sports", "Sport", "Sport"),
  "Lassen Sie uns sprechen": ("Let's Talk", "Parlons de votre projet", "Pojďme si promluvit"),
  "Schildern Sie Ihr Projekt – wir melden uns innerhalb von 24 Stunden mit einem Angebot.": (
    "Describe your project – we'll get back to you within 24 hours with a quote.",
    "Décrivez-nous votre projet – nous vous répondrons sous 24 heures avec une offre personnalisée.",
    "Popište nám svůj projekt – ozveme se vám do 24 hodin s cenovou nabídkou."
  ),
  "📧 Kontakt": ("📧 Contact", "📧 Contact", "📧 Kontakt"),
  "🎥 Produktanfrage": ("🎥 Product Inquiry", "🎥 Demande de matériel", "🎥 Poptávka techniky"),
  "📅 Beratungstermin": ("📅 Consultation", "📅 Rendez-vous conseil", "📅 Konzultace"),
  "Allgemeine Anfrage": ("General Inquiry", "Demande générale", "Obecný dotaz"),
  "Name *": ("Name *", "Nom *", "Jméno *"),
  "E-Mail *": ("Email *", "E-mail *", "E-mail *"),
  "Telefon": ("Phone", "Téléphone", "Telefon"),
  "Unternehmen": ("Company", "Société", "Společnost"),
  "Nachricht *": ("Message *", "Message *", "Zpráva *"),
  "Ich stimme der": ("I agree to the", "J'accepte la", "Souhlasím se"),
  "Datenschutzerklärung": ("Privacy Policy", "politique de confidentialité", "zásadami ochrany osobních údajů"),
  "zu.": ("zu.", ".", "."),
  "Nachricht senden": ("Send Message", "Envoyer le message", "Odeslat zprávu"),
  "Produktanfrage / Angebot": ("Product Inquiry / Quote", "Demande de matériel / Devis", "Poptávka techniky / Nabídka"),
  "Kran-Modell *": ("Crane Model *", "Modèle de grue *", "Model jeřábu *"),
  "Bitte wählen...": ("Please select...", "Veuillez choisir...", "Prosím vyberte..."),
  "Beratung nötig": ("Need Consultation", "Conseil requis", "Potřebuji poradit"),
  "Drehtag / Startdatum": ("Shooting Date / Start", "Jour de tournage / Date de début", "Natáčecí den / Datum začátku"),
  "Dauer / Zeitraum": ("Duration / Period", "Durée / Période", "Doba trvání / Období"),
  "Projektbeschreibung": ("Project Description", "Description du projet", "Popis projektu"),
  "Ich stimme der Datenschutzerklärung zu.": ("I agree to the Privacy Policy.", "J'accepte la politique de confidentialité.", "Souhlasím se zásadami ochrany osobních údajů."),
  "Angebot anfragen": ("Request Quote", "Demander un devis", "Požádat o nabídku"),
  "Gewünschtes Datum *": ("Preferred Date *", "Date souhaitée *", "Požadované datum *"),
  "Gewünschte Uhrzeit": ("Preferred Time", "Heure souhaitée", "Požadovaný čas"),
  "Worum geht es?": ("What is it about?", "De quoi s'agit-il ?", "O co se jedná?"),
  "Termin buchen": ("Book Appointment", "Réserver un créneau", "Rezervovat termín"),
  "Standort": ("Location", "Emplacement", "Lokalita"),
  "Wien, Österreich": ("Vienna, Austria", "Vienne, Autriche", "Vídeň, Rakousko"),
  "Schnelllinks": ("Quick Links", "Liens rapides", "Rychlé odkazy"),
  "Rechtliches": ("Legal", "Mentions légales", "Právní informace"),
  "Impressum": ("Imprint", "Mentions légales", "Impresum"),
  "Datenschutz": ("Privacy Policy", "Protection des données", "Ochrana údajů"),
  "AGB": ("Terms", "Conditions générales", "Obchodní podmínky"),
  "Alle Rechte vorbehalten.": ("All rights reserved.", "Tous droits réservés.", "Všechna práva vyhrazena."),
  "Powered by": ("Powered by", "Propulsé par", "Běží na"),
  "Anrufen": ("Call", "Appeler", "Zavolat"),
  "E-Mail": ("Email", "E-mail", "E-mail"),
  "Anfragen": ("Inquire", "Demander", "Poptat"),
  "Geben Sie Ihre E-Mail-Adresse ein und erhalten Sie sofortigen Zugang zum vollständigen Produktkatalog.": (
    "Enter your email address and get instant access to the full product catalog.",
    "Entrez votre adresse e-mail pour accéder immédiatement au catalogue produit complet.",
    "Zadejte svůj e-mail a získejte okamžitý přístup ke kompletnímu katalogu produktů."
  ),
  "Jetzt herunterladen": ("Download Now", "Télécharger maintenant", "Stáhnout nyní"),
  "Produktanfrage": ("Product Inquiry", "Demande de matériel", "Poptávka techniky"),
  "Anfrage senden": ("Send Inquiry", "Envoyer la demande", "Odeslat poptávku"),
  "Beratungstermin": ("Book Consultation", "Rendez-vous conseil", "Konzultace"),
  "Wählen Sie einen Wunschtermin für Ihr kostenloses Beratungsgespräch.": (
    "Choose a preferred date for your free consultation call.",
    "Choisissez une date pour votre entretien conseil gratuit.",
    "Vyberte si termín pro vaši bezplatnou konzultaci."
  ),
  "Termin bestätigen": ("Confirm Appointment", "Confirmer le rendez-vous", "Potvrdit termín"),
  "Seiten": ("Pages", "Pages", "Stránky"),
  "Antwort innerhalb von 24 Stunden": ("Response within 24 hours", "Réponse sous 24 heures", "Odpověď do 24 hodin"),
  "Lassen Sie uns": ("Let's", "Parlons", "Pojďme"),
  "sprechen.": ("talk.", "ensemble.", "spolu mluvit."),
  "Angebot anfragen, Termin buchen oder einfach Hallo sagen – wir antworten innerhalb von 24 Stunden.": (
    "Request a quote, book an appointment or just say hello – we reply within 24 hours.",
    "Demandez un devis, réservez un créneau ou contactez-nous – nous répondons sous 24 heures.",
    "Požádejte o nabídku, rezervujte si termín nebo nás jen pozdravte – odpovíme do 24 hodin."
  ),
  "Mobil": ("Mobile", "Mobile", "Mobil"),
  "Office": ("Office", "Bureau", "Kancelář"),
  "Zum Kontaktformular": ("To the contact form", "Vers le formulaire de contact", "Přejít na formulář"),
  "Drehtag / Datum": ("Shooting Date", "Jour de tournage / Date", "Natáčecí den / Datum"),
  "Dauer": ("Duration", "Durée", "Doba trvání"),
  "Wunschdatum *": ("Preferred date *", "Date souhaitée *", "Požadované datum *"),
  "Uhrzeit": ("Time", "Heure", "Čas"),
  "Beliebig": ("Anytime", "Indifférent", "Kdykoliv"),
  "Genaue Adresse auf Anfrage": ("Exact address on request", "Adresse exacte sur demande", "Přesná adresa na vyžádání"),
  "Volle": ("Full", "Complet", "Plná"),
  "Produktions-": ("Production", "Production", "Produkční"),
  "unterstützung.": ("Support.", "Assistance.", "Podpora."),
  "Kran, Operator und Technik – alles aus einer Hand. Wir decken jeden Aspekt Ihres Kamerakran-Einsatzes ab, von der ersten Anfrage bis zum letzten Shot.": (
    "Crane, operator and equipment – all from a single source. We cover every aspect of your camera crane setup, from the first inquiry to the last shot.",
    "Grue, opérateur et technique – une solution clé en main. Nous couvrons chaque étape de votre déploiement de grue, de la première prise de contact au dernier plan.",
    "Jeřáb, operátor i technika – vše z jedné ruky. Pokryjeme každý aspekt nasazení kamerového jeřábu, od první poptávky až po poslední záběr."
  ),
  "Produkt ansehen": ("View Product", "Découvrir le produit", "Prohlédnout produkt"),
  "Unsere drei Säulen": ("Our three pillars", "Nos trois piliers", "Naše tři pilíře"),
  "Supertechno 50+ Teleskop-Kamerakran für jeden Produktionsumfang. Tages- und Wochenmiete möglich.": (
    "Supertechno 50+ telescopic camera crane for every production scale. Daily and weekly rental available.",
    "Grue télescopique Supertechno 50+ pour tout type de production. Location journalière ou hebdomadaire.",
    "Teleskopický jeřáb Supertechno 50+ pro každý rozsah produkce. Možnost denního i týdenního pronájmu."
  ),
  "Supertechno 50+ mit 15,11m Reichweite": ("Supertechno 50+ with 15.11m reach", "Supertechno 50+ avec portée de 15,11m", "Supertechno 50+ s dosahem 15,11 m"),
  "Techno S-Head Remote Control": ("Techno S-Head Remote Control", "Contrôle à distance Techno S-Head", "Dálkové ovládání Techno S-Head"),
  "Indoor & Outdoor einsetzbar": ("Indoor & Outdoor use", "Utilisable en intérieur et extérieur", "Použití v interiéru i exteriéru"),
  "Transport & Lieferung nach Wien & AT": ("Transport & delivery Vienna & AT", "Transport & livraison à Vienne et en Autriche", "Doprava a doručení do Vídně a po Rakousku"),
  "Tages- und Wochenmiete": ("Daily and weekly rates", "Tarifs à la journée et à la semaine", "Denní a týdenní pronájem"),
  "Zertifizierter, erfahrener Operator": ("Certified, experienced operator", "Opérateur certifié et expérimenté", "Certifikovaný, zkušený operátor"),
  "Briefing & Shot-Planung vorab": ("Briefing & shot planning in advance", "Briefing et planification des plans en amont", "Předchozí briefing a plánování záběrů"),
  "Kommunikation mit DoP & Regie": ("Communication with DoP & director", "Communication fluide avec le chef op et la réalisation", "Komunikace s kameramanem (DoP) a režií"),
  "Wiederholbare, präzise Movements": ("Repeatable, precise movements", "Mouvements précis et parfaitement répétables", "Opakovatelné, precizní pohyby"),
  "Flexibel auf Set & reaktionsschnell": ("Flexible on set & fast reaction", "Grande flexibilité sur le plateau et réactivité", "Flexibilita na place a rychlé reakce"),
  "Technische Betreuung inklusive": ("Technical support included", "Assistance technique incluse", "Technická podpora v ceně"),
  "Kompatibel mit allen Kamerasystemen": ("Compatible with all camera systems", "Compatible avec tous les systèmes caméra", "Kompatibilní se všemi kamerovými systémy"),
  "Techno S-Head, Preston FI+Z": ("Techno S-Head, Preston FI+Z", "Techno S-Head, Preston FI+Z", "Techno S-Head, Preston FI+Z"),
  "Location Scouting auf Anfrage": ("Location scouting on request", "Repérage des décors sur demande", "Obhlídka lokací na vyžádání"),
  "Technische Beratung vorab (kostenlos)": ("Technical consultation (free)", "Conseil technique préalable (gratuit)", "Předběžné technické poradenství (zdarma)"),
  "So läuft es ab": ("How it works", "Comment ça se passe", "Jak to probíhá"),
  "Von der Anfrage zum Shot": ("From inquiry to the shot", "De la demande au tournage", "Od poptávky k záběru"),
  "Anfrage": ("Inquiry", "Demande", "Poptávka"),
  "Kurzes Formular oder Anruf – wir melden uns in 24h.": (
    "Short form or call – we respond within 24h.",
    "Formulaire rapide ou appel – réponse sous 24h.",
    "Krátký formulář nebo telefonát – ozveme se do 24 h."
  ),
  "Briefing": ("Briefing", "Briefing", "Briefing"),
  "Shotliste, Location und Kameraausstattung besprechen.": (
    "Discuss shot list, location and camera setup.",
    "Point sur la liste des plans, les décors et la configuration caméra.",
    "Probrání shotlistu, lokace a kamerového vybavení."
  ),
  "Bereitstellung": ("Preparation", "Mise en place", "Příprava"),
  "Anlieferung & Einrichtung – in kürzester Zeit einsatzbereit.": (
    "Delivery & configuration – ready in no time.",
    "Livraison & installation – opérationnel en un temps record.",
    "Doprava a sestavení – připraveno v rekordním čase."
  ),
  "Shot!": ("Shot!", "Tournez !", "Klapka!"),
  "Operator am Steuer – präzise, wiederholbar, sicher.": (
    "Operator at the controls – precise, repeatable, safe.",
    "L'opérateur aux commandes – précision, sécurité et répétabilité.",
    "Operátor u řízení – precizní, opakovatelné, bezpečné."
  ),
  "Konditionen": ("Pricing", "Tarification", "Ceník"),
  "Transparente Preisgestaltung": ("Transparent pricing", "Tarifs clairs et transparents", "Transparentní tvorba cen"),
  "Angebot auf Anfrage": ("Quote on request", "Devis sur mesure", "Nabídka na míru"),
  "Jede Produktion ist anders – wir kalkulieren individuell nach Aufwand, Dauer und Leistungsumfang.": (
    "Every production is different – we calculate individually based on effort, duration and scope.",
    "Chaque projet est unique – calcul personnalisé selon la charge de travail, la durée et l'équipement.",
    "Každá produkce je jiná – kalkulujeme individuálně dle náročnosti, délky a rozsahu služeb."
  ),
  "Tages- & Wochensätze": ("Daily & weekly rates", "Tarifs journaliers & hebdomadaires", "Denní a týdenní sazby"),
  "Flexible Buchung: Halbtag, ganzer Tag oder Mehrtagesprojekte – mit Mengenrabatt.": (
    "Flexible booking: half day, full day or multi-day projects – with volume discount.",
    "Formules flexibles : demi-journée, journée entière ou plusieurs jours – tarifs dégressifs.",
    "Flexibilní rezervace: půlden, celý den nebo vícedenní projekty – s množstevní slevou."
  ),
  "Alle Kosten inklusive": ("All costs included", "Tous frais inclus", "Všechny náklady zahrnuty"),
  "Transport, Operator, Techno S-Head und Betreuung – keine versteckten Kosten.": (
    "Transport, operator, Techno S-Head and support – no hidden costs.",
    "Transport, opérateur, Techno S-Head et assistance – aucun coût caché.",
    "Doprava, operátor, hlava Techno S-Head a servis – žádné skryté poplatky."
  ),
  "Kostenlose Erstberatung": ("Free initial consultation", "Premier échange gratuit", "Bezplatná úvodní konzultace"),
  "Wir besprechen Ihr Projekt vorab und prüfen Machbarkeit – unverbindlich und kostenlos.": (
    "We discuss your project upfront and check feasibility – no obligation, no charge.",
    "Étude de faisabilité et échange préliminaire – gratuit et sans engagement.",
    "Předem probereme váš projekt a prověříme proveditelnost – nezávazně a zdarma."
  ),
  "Jetzt kostenloses Angebot anfragen": ("Request free quote now", "Demander un devis gratuit dès maintenant", "Požádat o bezplatnou nabídku"),
  "Häufige Fragen": ("Frequently Asked Questions", "Foire aux questions", "Často kladené otázky"),
  "Ist ein Operator inklusive oder extra?": ("Is an operator included or extra?", "L'opérateur est-il inclus ou en supplément ?", "Je operátor v ceně nebo za příplatek?"),
  "Unser Operator-Service ist das Herzstück unseres Angebots – wir vermieten den Kran immer mit eigenem Operator. Das garantiert Ihnen professionelle Bedienung, kürzere Rüstzeiten und perfekte Shots.": (
    "Our operator service is the heart of our offering – we always rent the crane with our own operator. This guarantees professional operation, shorter set-up times and perfect shots.",
    "Le service d'opérateur est le cœur de notre offre – la grue est systématiquement louée avec son opérateur dédié. Cela garantit un maniement expert, un gain de temps précieux et des plans impeccables.",
    "Operátorský servis je srdcem naší nabídky – jeřáb pronajímáme vždy s vlastním operátorem. To vám zaručuje profesionální obsluhu, kratší časy přípravy a dokonalé záběry."
  ),
  "Können Sie auch außerhalb von Wien arbeiten?": ("Can you work outside Vienna?", "Intervenez-vous en dehors de Vienne ?", "Pracujete i mimo Vídeň?"),
  "Ja – wir sind österreichweit und auch für internationale Produktionen verfügbar. Anfahrtskosten werden je nach Location individuell kalkuliert. Sprechen Sie uns an.": (
    "Yes – we are available throughout Austria and also for international productions. Travel costs are calculated individually depending on the location. Contact us.",
    "Oui – nous couvrons toute l'Autriche ainsi que les productions internationales. Les frais de déplacement sont ajustés selon le lieu. N'hésitez pas à nous contacter.",
    "Ano – působíme po celém Rakousku i pro mezinárodní produkce. Cestovní náklady se kalkulují individuálně dle lokace. Kontaktujte nás."
  ),
  "Welche Kameras sind kompatibel?": ("Which cameras are compatible?", "Quelles caméras sont compatibles ?", "Jaké kamery jsou kompatibilní?"),
  "Der Supertechno 50+ trägt bis zu 100kg Nutzlast und ist mit allen gängigen Kamerasystemen kompatibel – ARRI, RED, Sony, Canon und mehr. Auch Highspeed-Kameras und Beamsplitter-Rigs sind kein Problem.": (
    "The Supertechno 50+ carries up to 100kg payload and is compatible with all common camera systems – ARRI, RED, Sony, Canon and more. High-speed cameras and beamsplitter rigs are also no problem.",
    "Le Supertechno 50+ supporte jusqu'à 100 kg de charge utile et accueille toutes les caméras professionnelles – ARRI, RED, Sony, Canon, etc. Compatible également avec caméras haute vitesse et rigs 3D/miroir.",
    "Supertechno 50+ unese až 100 kg užitečného zatížení a je kompatibilní se všemi běžnými kamerovými systémy – ARRI, RED, Sony, Canon a dalšími. Žádný problém nejsou ani high-speed kamery a beamsplitter rigy."
  ),
  "Wie früh muss ich buchen?": ("How early do I need to book?", "Quel est le délai de réservation conseillé ?", "Jak dlouho dopředu je nutné rezervovat?"),
  "Wir empfehlen 1–2 Wochen Vorlauf für normale Produktionen. Für kurzfristige Anfragen (24–48h) tun wir unser Bestes – sprechen Sie uns direkt an.": (
    "We recommend 1–2 weeks lead time for standard productions. For short-notice requests (24–48h) we do our best – contact us directly.",
    "Nous conseillons un préavis de 1 à 2 semaines pour les productions standards. Pour les urgences (24-48h), nous faisons notre maximum – appelez-nous directement.",
    "Doporučujeme 1–2 týdny předem pro standardní produkce. U urgentních poptávek (24–48 h) uděláme maximum – ozvěte se nám přímo."
  ),
  "Das meistverwendete Teleskop-Kamerakransystem weltweit": (
    "The world's most widely used telescopic camera crane",
    "Le système de grue télescopique le plus utilisé au monde",
    "Nejpoužívanější teleskopický kamerový jeřábový systém na světě"
  ),
  "50+": ("50+", "50+", "50+"),
  "Der Supertechno 50+ ist das meistverwendete Teleskop-Kamerakransystem weltweit. 15,11m Reichweite, 100kg Nutzlast, Techno S-Head. Indoor und Outdoor einsetzbar.": (
    "The Supertechno 50+ is the world's most widely used telescopic camera crane. 15.11m reach, 100kg payload, Techno S-Head. For indoor and outdoor use.",
    "Le Supertechno 50+ est la grue télescopique la plus plébiscitée au monde. 15,11 m de portée, 100 kg de charge, tête Techno S-Head. Idéal intérieur/extérieur.",
    "Supertechno 50+ je celosvětově nejrozšířenější teleskopický kamerový jeřáb. Dosah 15,11 m, nosnost 100 kg, hlava Techno S-Head. Pro interiér i exteriér."
  ),
  "Reichweite": ("Reach", "Portée", "Dosah"),
  "Nutzlast": ("Payload", "Charge utile", "Nosnost"),
  "Alle Leistungen": ("All Services", "Tous les services", "Všechny služby"),
  "Galerie": ("Gallery", "Galerie", "Galerie"),
  "Der Kran in Aktion": ("The Crane in Action", "La grue en action", "Jeřáb v akci"),
  "Originalfotos vom Supertechno 50+ – weltweit im Einsatz": (
    "Original photos of the Supertechno 50+ – deployed worldwide",
    "Photos authentiques du Supertechno 50+ – en tournage dans le monde entier",
    "Originální fotografie jeřábu Supertechno 50+ – v akci po celém světě"
  ),
  "Remote Head": ("Remote Head", "Tête télécommandée", "Remote Head"),
  "Teleskop-Abschnitte": ("Sections", "Sections télescopiques", "Teleskopické sekce"),
  "Fahrzeug": ("Vehicle", "Véhicule", "Vozidlo"),
  "Eigener Transport": ("Own Transport", "Transport dédié", "Vlastní doprava"),
  "Technisches Diagramm": ("Technical Diagram", "Schéma technique", "Technické schéma"),
  "Draufsicht – Schwenkbereich und Reichweite": ("Top view – pan range and reach", "Vue de dessus – amplitude de rotation et portée", "Pohled shora – rozsah otáčení a dosah"),
  "Seitenansicht – Kranarm-Positionen": ("Side view – crane arm positions", "Vue latérale – positions du bras de grue", "Boční pohled – polohy ramene jeřábu"),
  "Für jede Produktion gemacht": ("Made for every production", "Conçu pour tous vos tournages", "Stvořeno pro jakoukoli produkci"),
  "Live-Übertragungen von Sport-Events, Motorsport und Action-Aufnahmen. Dynamische Fahrten und präzise Verfolgung in Höchstgeschwindigkeit.": (
    "Live sports broadcasting, motorsports and action shots. Dynamic moves and precise tracking at maximum speed.",
    "Retransmissions sportives en direct, sports mécaniques et prises de vue d'action. Mouvements dynamiques et suivi chirurgical à haute vitesse.",
    "Živé přenosy sportovních akcí, motorsport a akční záběry. Dynamické jízdy a precizní sledování v maximální rychlosti."
  ),
  "Supertechno 50+ für Ihre Produktion": ("Supertechno 50+ for your production", "Le Supertechno 50+ pour votre projet", "Supertechno 50+ pro vaši produkci"),
  "Kontaktieren Sie uns für ein unverbindliches Angebot. Wir beraten Sie zu Verfügbarkeit, Preisen und technischen Details – und betreiben den Kran selbst.": (
    "Contact us for a no-obligation quote. We advise you on availability, pricing and technical details – and operate the crane ourselves.",
    "Contactez-nous pour une proposition sans engagement. Nous vous guidons sur les disponibilités, tarifs et aspects techniques – avec notre propre équipe aux commandes.",
    "Kontaktujte nás pro nezávaznou nabídku. Poradíme vám s dostupností, cenami i technickými detaily – a jeřáb sami odřídíme."
  ),
  "Simulator & Lab Mode": ("Simulator & Lab Mode", "Mode Simulateur & Labo", "Režim simulátoru a laboratoře"),
  "Kran-Interaktives Menü": ("Crane Interactive Menu", "Menu interactif de la grue", "Interaktivní menu jeřábu"),
  "Steuern Sie den Supertechno 50+ mit Autopilot oder dem manuellen Steuerpult. Entdecken Sie die physikalischen Bewegungen des Krans in Echtzeit.": (
    "Control the Supertechno 50+ via autopilot or manual console. Discover physical crane movements in real-time.",
    "Pilotez le Supertechno 50+ via le pilote automatique ou la console manuelle. Observez la cinématique réelle de la grue en direct.",
    "Ovládejte Supertechno 50+ pomocí autopilota nebo manuálního pultu. Prozkoumejte fyziku a pohyby jeřábu v reálném čase."
  ),
  "Wien, Österreich – 20+ Jahre Operator-Erfahrung": ("Vienna, Austria – 20+ Years Operator Experience", "Vienne, Autriche – Plus de 20 ans d'expérience opérateur", "Vídeň, Rakousko – 20+ let zkušeností s obsluhou"),
  "Wien-basiert.": ("Vienna-based.", "Ancré à Vienne.", "Se sídlem ve Vídni."),
  "Weltweit erprobt.": ("Proven worldwide.", "Éprouvé à l'international.", "Ověřeno ve světě."),
  "Technogrips Vienna ist kein reines Verleihhaus – wir sind Operators. Wir kennen den Kran, weil wir ihn selbst bedienen. Seit über 20 Jahren auf nationalen und internationalen Sets.": (
    "Technogrips Vienna is not just a rental house – we are operators. We know the crane because we operate it ourselves. For over 20 years on national and international sets.",
    "Technogrips Vienna n'est pas un simple loueur – nous sommes des opérateurs de plateau. Nous maîtrisons la machine sur le bout des doigts pour la piloter au quotidien depuis plus de 20 ans sur les plus grands tournages.",
    "Technogrips Vienna není jen půjčovna – jsme profesionální operátoři. Známe jeřáb do posledního detailu, protože ho sami řídíme již přes 20 let na domácích i zahraničních natáčeních."
  ),
  "Kontakt aufnehmen": ("Get in touch", "Prendre contact", "Kontaktovat nás"),
  "Unsere Leistungen": ("Our Services", "Nos prestations", "Naše služby"),
  "Supertechno Krane": ("Supertechno cranes", "Grues Supertechno", "Jeřáby Supertechno"),
  "Erreichbar": ("Reachable", "Joignable", "K zastižení"),
  "Unsere Geschichte": ("Our story", "Notre parcours", "Náš příběh"),
  "Von der Leidenschaft zur Expertise": ("From passion to expertise", "De la passion à l'expertise", "Od vášně k profesionalitě"),
  "Die Anfänge am Set": ("The Beginnings", "Les débuts sur le plateau", "Začátky na place"),
  "Einstieg in die Filmbranche als Boom Operator, Requisiteur, Garderoben- und Produktionsfahrer. Fundamentale Erfahrungen am Set.": (
    "Entry into the film industry as a boom operator, prop master, wardrobe, and production driver. Acquiring fundamental on-set experience.",
    "Débuts dans l'industrie cinématographique comme perchman, accessoiriste, chauffeur de production. Acquisition d'une solide expérience de terrain.",
    "Vstup do filmového průmyslu jako zvukař s mikrofonem, rekvizitář, kostymérský a produkční řidič. Získání základních zkušeností na place."
  ),
  "Spezialisierung & Remote Heads": ("Specialization & Remote Heads", "Spécialisation & Têtes télécommandées", "Specializace a dálkově ovládané hlavy"),
  "Entwicklung zum Key Grip, Dolly Grip und Operator für Motion Control sowie stabilisierte Remote Heads. Erste Einsätze an High-End-Systemen.": (
    "Transitioning into Key Grip, Dolly Grip, and operator for motion control and stabilized remote heads. First deployments on high-end systems.",
    "Évolution vers les postes de chef machiniste (Key Grip), machiniste travelling (Dolly Grip) et opérateur motion control & têtes gyrostabilisées.",
    "Vývoj na pozice Key Grip, Dolly Grip a operátora pro motion control i stabilizované hlavy. První nasazení na špičkových systémech."
  ),
  "Upgrade & Blockbuster": ("Upgrade & Blockbusters", "Montée en puissance & Blockbusters", "Upgrade a filmové hity"),
  "Upgrade auf den Supertechno 50+ mit S-Head. Mitwirkung an internationalen Großproduktionen wie Mission: Impossible (Austrian Key Grip), Agent 47, Woman in Gold und 300.": (
    "Upgraded to Supertechno 50+ with S-Head. Collaborating on major international productions like Mission: Impossible (Austrian Key Grip), Agent 47, Woman in Gold, and 300.",
    "Acquisition du Supertechno 50+ avec tête S-Head. Collaboration à des blockbusters internationaux tels que Mission: Impossible (Key Grip Autriche), Agent 47, La Femme au tableau et 300.",
    "Upgrade na Supertechno 50+ s hlavou S-Head. Účast na velkých mezinárodních produkcích jako Mission: Impossible (rakouský Key Grip), Agent 47, Dáma ve zlatém nebo 300."
  ),
  "U-Crane, Marvel & Globale Projekte": ("U-Crane, Marvel & Global Projects", "U-Crane, Marvel & Projets mondiaux", "U-Crane, Marvel a globální projekty"),
  "Weltweite U-Crane (MotoCrane) & Scorpio Einsätze für Produktionen wie Marvel, Jack Ryan und Luc Bessons 'Projet D'. Über 30 Jahre Expertise an vorderster Front.": (
    "Worldwide U-Crane (MotoCrane) & Scorpio operations for productions like Marvel, Jack Ryan, and Luc Besson's 'Projet D'. Over 30 years of front-line expertise.",
    "Missions internationales en U-Crane (Russian Arm) & Scorpio pour des productions comme Marvel, Jack Ryan et 'Projet D' de Luc Besson. Plus de 30 ans d'expertise au plus haut niveau.",
    "Celosvětové nasazení U-Crane (MotoCrane) a Scorpio pro projekty jako Marvel, Jack Ryan a 'Projet D' Luca Bessona. Více než 30 let zkušeností v první linii."
  ),
  "Die Evolution": ("The Evolution", "L'Évolution", "Evoluce"),
  "Die Evolution zum Kranoperator": ("The Evolution to the Crane Operator", "L'Évolution vers l'opérateur de grue", "Evoluce v operátora jeřábu"),
  "Vom ersten aufrechten Gang bis zur perfekten Kamerabewegung. Unsere Arbeit erfordert höchste Präzision, Koordination und das richtige Fingerspitzengefühl am Steuer.": (
    "From the first upright steps to the perfect camera movement. Our work requires ultimate precision, coordination, and the right touch at the controls.",
    "Des premiers pas de l'humanité au mouvement de caméra parfait. Notre métier exige rigueur absolue, coordination sans faille et doigté millimétré aux commandes.",
    "Od prvních vzpřímených kroků až po dokonalý pohyb kamery. Naše práce vyžaduje maximální preciznost, koordinaci a citlivé vedení u řízení."
  ),
  "Urzeit": ("Prehistory", "Préhistoire", "Pravěk"),
  "Aufrecht": ("Upright Walking", "Marche debout", "Vzpřímení"),
  "Entwicklung": ("Development", "Évolution", "Vývoj"),
  "Werkzeug": ("Tool", "Outils", "Nástroj"),
  "Moderne": ("Modernity", "Ère moderne", "Současnost"),
  "Kranoperator": ("Crane Operator", "Opérateur de grue", "Operátor jeřábu"),
  "Einsatzbranchen": ("Industries", "Secteurs d'activité", "Odvětví a obory"),
  "Mit wem wir arbeiten": ("Who we work with", "Ils nous font confiance", "S kým spolupracujeme"),
  "Wir haben für alle gearbeitet – vom Indie-Film bis zur internationalen Großproduktion.": (
    "We've worked for everyone – from indie film to international blockbuster.",
    "Nous accompagnons tous les projets – du cinéma indépendant aux grandes productions hollywoodiennes.",
    "Pracovali jsme pro všechny – od nezávislých filmů až po mezinárodní velkofilmy."
  ),
  "Langfilm, Kurzfilm, Dokumentation": ("Feature, short, documentary", "Longs-métrages, courts-métrages, documentaires", "Celovečerní, krátké filmy, dokumenty"),
  "TV & Streaming": ("TV & Streaming", "TV & Plateformes de streaming", "TV a streaming"),
  "Serien, Shows, Live-Events": ("Series, shows, live events", "Séries, émissions, événements en direct", "Seriály, pořady, živé přenosy"),
  "Musik & Konzerte": ("Music & Concerts", "Musique & Spectacles", "Hudba a koncerty"),
  "Musikvideos, Konzertaufnahmen": ("Music videos, concert recordings", "Clips vidéo, captations de concerts", "Videoklipy, záznamy koncertů"),
  "Werbung & Corporate": ("Advertising & Corporate", "Publicité & Films d'entreprise", "Reklama a firemní videa"),
  "TV-Spots, Imagefilme, Pitches": ("TV spots, image films, pitches", "Spots TV, films institutionnels, présentations", "TV spoty, image filmy, prezentace"),
  "Sport & Events": ("Sport & Events", "Sport & Grands événements", "Sport a události"),
  "Galas, Sportevents, Messen": ("Galas, sports events, fairs", "Galas, compétitions sportives, salons", "Galavečery, sportovní akce, veletrhy"),
  "Spezialaufnahmen": ("Special footage", "Prises de vue spéciales", "Speciální natáčení"),
  "Industrie, Architektur, Kunst": ("Industry, architecture, art", "Industrie, architecture, projets artistiques", "Průmysl, architektura, umění"),
  "Bereit, zusammenzuarbeiten?": ("Ready to work together?", "Prêt à collaborer ?", "Jste připraveni ke spolupráci?"),
  "Erzählen Sie uns von Ihrem Projekt. Wir sind für Sie da – persönlich, erfahren und zuverlässig.": (
    "Tell us about your project. We're here for you – personal, experienced and reliable.",
    "Parlez-nous de votre projet. Nous sommes à vos côtés – disponibilité, savoir-faire et fiabilité.",
    "Řekněte nám o svém projektu. Jsme tu pro vás – osobně, zkušeně a spolehlivě."
  ),
  "Professionelle Supertechno Kamerakrane mit erfahrenem Operator-Service. Wien, Österreich.": (
    "Professional Supertechno camera cranes with experienced operator service. Vienna, Austria.",
    "Grues de caméra professionnelles Supertechno avec service d'opérateur expérimenté. Vienne, Autriche.",
    "Profesionální kamerové jeřáby Supertechno se zkušeným operátorem. Vídeň, Rakousko."
  )
}

def escape_attr(val):
  return val.replace('"', '&quot;')

def patch_html_content(content):
  # Replace data-de="..." data-en="..." by adding data-fr="..." data-cs="..."
  def repl(m):
    full = m.group(0)
    de = m.group(1)
    en = m.group(2) if m.group(2) else ""
    
    # Check if already has data-fr
    if 'data-fr=' in full:
      return full
      
    if de in DICT:
      _, fr, cs = DICT[de]
      return f'data-de="{de}" data-en="{en}" data-fr="{escape_attr(fr)}" data-cs="{escape_attr(cs)}"'
    else:
      # Fallback to en or de if not in dictionary
      fallback = en if en else de
      return f'data-de="{de}" data-en="{en}" data-fr="{escape_attr(fallback)}" data-cs="{escape_attr(fallback)}"'

  p = re.compile(r'data-de="([^"]*)"(?:\s+data-en="([^"]*)")?')
  return p.sub(repl, content)

targets = [
  'dist/index.html',
  'public/index.html',
  'dist/kontakt/index.html',
  'public/kontakt/index.html',
  'dist/leistungen/index.html',
  'public/leistungen/index.html',
  'dist/supertechno-50/index.html',
  'public/supertechno-50/index.html',
  'dist/tracking/index.html',
  'public/tracking/index.html',
  'dist/ueber-uns/index.html',
  'public/ueber-uns/index.html',
  'dist/kran-test/index.html',
  'public/kran-test/index.html'
]

for t in targets:
  if os.path.exists(t):
    with open(t, 'r', encoding='utf-8') as f:
      c = f.read()
    patched = patch_html_content(c)
    with open(t, 'w', encoding='utf-8') as f:
      f.write(patched)
    print(f'Successfully patched {t}')

print('All HTML files patched with FR and CS attributes!')
