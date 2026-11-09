#!/usr/bin/env python3
"""
Build the plvch personal-site / blog hub as static HTML in EN / RU / DE.

Output is written next to this file, so this folder *is* the site root and
maps 1:1 onto the future `plvch.github.io` repository:

    /                -> index.html              (EN home / blog index)
    /ru/  /de/       -> ru|de/index.html
    /practice/ ...   -> practice/index.html (+ ru|de)
    /legal/ ...      -> legal/index.html (+ ru|de)

The three essays live in their own repos and nest under the same domain
(/open-indexing/, /indexes_cost/, /small-business-concentration/), so the
links here are root-relative and work on plvch.github.io now and on the
custom domain later.

    python3 build.py
"""

import os
import shutil
from html import escape as e

HERE = os.path.dirname(os.path.abspath(__file__))

# ====================================================================
# CONFIG  —  to move onto the custom domain, change DOMAIN to "plvch.com"
# (GitHub: Settings -> Pages -> custom domain writes the CNAME for you),
# then re-run this script. That single line is the whole switch.
# ====================================================================
DOMAIN       = "plvch.com"                # <- one-line switch to "plvch.com"
BASE_URL     = "https://" + DOMAIN
EMAIL        = "m@plvch.com"
DEFAULT_LANG = "en"
LANGS        = ["en", "ru", "de"]
LANG_LABEL   = {"en": "EN", "ru": "RU", "de": "DE"}
HTML_LANG    = {"en": "en", "ru": "ru", "de": "de"}

PAGES = ["home", "practice", "legal"]
SEG   = {"home": "", "practice": "practice", "legal": "legal"}
ACTIVE_NAV = {"home": "writing", "practice": "practice", "legal": None}


def url_for(page, lang):
    """Root-relative URL for a page in a language."""
    prefix = "" if lang == DEFAULT_LANG else "/" + lang
    seg = SEG[page]
    if seg:
        return prefix + "/" + seg + "/"
    return (prefix + "/") if prefix else "/"


def asset_url(rel):
    """Root-relative asset URL with an mtime cache-buster (?v=…) so browsers
    re-fetch whenever the file changes — handy behind a no-cache dev server."""
    path = os.path.join(HERE, rel.lstrip("/"))
    try:
        v = int(os.path.getmtime(path))
        return "/" + rel.lstrip("/") + "?v=" + str(v)
    except OSError:
        return "/" + rel.lstrip("/")


def out_path(page, lang):
    parts = [HERE]
    if lang != DEFAULT_LANG:
        parts.append(lang)
    if SEG[page]:
        parts.append(SEG[page])
    return os.path.join(*parts, "index.html")


# ====================================================================
# ESSAYS  (titles stay English — they are the essays' own identity;
# the one-line summary is localized as part of the site chrome)
# ====================================================================
POSTS = [
    {
        "slug": "open-indexing",
        "vol":  {"en": "Vol. 01", "ru": "Vol. 01", "de": "Vol. 01"},
        "title": "Open Indexing",
        "date": {"en": "May 2026", "ru": "Май 2026", "de": "Mai 2026"},
        "read": {"en": "14 min",  "ru": "14 мин",   "de": "14 Min"},
        "dek": {
            "en": "A better business model for passive investing: for the saver who drifted into a concentrated bet they never chose, and for the broker whose execution margins went to zero.",
            "ru": "Лучшая бизнес-модель для пассивного инвестирования: и для сберегателя, незаметно оказавшегося в концентрированной ставке, и для брокера, чья маржа на исполнении упала до нуля.",
            "de": "Ein besseres Geschäftsmodell für passives Investieren: für den Sparer, der unbemerkt in eine konzentrierte Wette geraten ist, und für den Broker, dessen Ausführungsmargen auf null gefallen sind.",
        },
        "tags": {
            "en": ["Markets structure", "Retail product"],
            "ru": ["Структура рынка", "Розничный продукт"],
            "de": ["Marktstruktur", "Retail-Produkt"],
        },
    },
    {
        "slug": "indexes-cost",
        "vol":  {"en": "Vol. 02", "ru": "Vol. 02", "de": "Vol. 02"},
        "title": "The ETF Fee Paradox",
        "date": {"en": "June 2026", "ru": "Июнь 2026", "de": "Juni 2026"},
        "read": {"en": "9 min",   "ru": "9 мин",     "de": "9 Min"},
        "dek": {
            "en": "The typical new US ETF keeps getting more expensive, even as the fee on the average invested dollar sits near record lows. Rebuilt from raw SEC filings.",
            "ru": "Типичный новый американский ETF дорожает, хотя комиссия на средний вложенный доллар держится у исторических минимумов. Пересобрано из первичных отчётов SEC.",
            "de": "Der typische neue US-ETF wird immer teurer, während die Gebühr auf den durchschnittlich investierten Dollar nahe Rekordtiefs liegt. Neu aufgebaut aus SEC-Rohdaten.",
        },
        "tags": {
            "en": ["ETFs", "Fees", "Data"],
            "ru": ["ETF", "Комиссии", "Данные"],
            "de": ["ETFs", "Gebühren", "Daten"],
        },
    },
    {
        "slug": "small-business-concentration",
        "vol":  {"en": "Vol. 03", "ru": "Vol. 03", "de": "Vol. 03"},
        "title": "It's rational to ignore small business",
        "date": {"en": "June 2026", "ru": "Июнь 2026", "de": "Juni 2026"},
        "read": {"en": "3 min",   "ru": "3 мин",     "de": "3 Min"},
        "dek": {
            "en": "72% of German firms make 1.2% of the turnover. By the numbers, the fiscal neglect of small business is rational. The question is what could ever change it.",
            "ru": "72% немецких компаний дают 1,2% оборота. По цифрам фискальное безразличие к малому бизнесу рационально. Вопрос лишь в том, что вообще могло бы это изменить.",
            "de": "72% der deutschen Unternehmen erwirtschaften 1,2% des Umsatzes. Nüchtern betrachtet ist die fiskalische Vernachlässigung kleiner Betriebe rational. Die Frage ist, was sie je ändern könnte.",
        },
        "tags": {
            "en": ["Germany", "Policy", "Data"],
            "ru": ["Германия", "Политика", "Данные"],
            "de": ["Deutschland", "Politik", "Daten"],
        },
    },
    {
        "slug": "turnover-vs-gdp",
        "vol":  {"en": "Vol. 04", "ru": "Vol. 04", "de": "Vol. 04"},
        "title": "The curious structure of German exports",
        "date": {"en": "June 2026", "ru": "Июнь 2026", "de": "Juni 2026"},
        "read": {"en": "6 min",   "ru": "6 мин",     "de": "6 Min"},
        "dek": {
            "en": "German firms turn over about €9tn at home, roughly twice GDP. But the export figure everyone watches misses an entire economy they run abroad: €3.4tn, invisible to GDP.",
            "ru": "Немецкие компании дают внутри страны оборот около €9 трлн, примерно вдвое больше ВВП. Но привычная цифра экспорта не замечает целую экономику за рубежом: €3,4 трлн, которых нет в ВВП.",
            "de": "Deutsche Unternehmen setzen im Inland rund 9 Bio. € um, etwa doppelt so viel wie das BIP. Doch die vielzitierte Exportzahl übersieht eine ganze Wirtschaft im Ausland: 3,4 Bio. €, die im BIP nicht auftauchen.",
        },
        "tags": {
            "en": ["Germany", "Trade", "Data"],
            "ru": ["Германия", "Торговля", "Данные"],
            "de": ["Deutschland", "Handel", "Daten"],
        },
    },
    {
        "slug": "updating-my-thoughts-on-writing",
        "vol":  {"en": "Vol. 05", "ru": "Vol. 05", "de": "Vol. 05"},
        "title": "Updating my thoughts on writing",
        "date": {"en": "August 2026", "ru": "Август 2026", "de": "August 2026"},
        "read": {"en": "2 min", "ru": "2 мин", "de": "2 Min"},
        "dek": {
            "en": "AI made my posts clearer, better sourced, and more substantive. It also made them less distinctive. A short note on bringing my own writing back.",
            "ru": "ИИ сделал мои тексты яснее, лучше подкреплёнными источниками и содержательнее — но также менее узнаваемыми. Короткая заметка о возвращении к собственному письму.",
            "de": "KI machte meine Texte klarer, besser belegt und gehaltvoller – aber auch weniger unverwechselbar. Eine kurze Notiz über die Rückkehr zum eigenen Schreiben.",
        },
        "tags": {
            "en": ["Writing", "AI"],
            "ru": ["Тексты", "ИИ"],
            "de": ["Schreiben", "KI"],
        },
    },
]


# English-only personal note. The wording remains the author's; AI editing was
# limited to spelling, punctuation, light grammar, and the small page wrapper.
WRITING_THOUGHTS_BODY = """
<p>One of the least controversial opinions one may hold is that putting thoughts into writing requires discipline and a certain level of clarity. At least, that was the case pre-AI, when creating a paragraph of written language required significant effort.</p>

<p>In the last couple of years, that proof-of-work mechanism has arguably given way to a tsunami of generated work of variable quality. Depending on the platform and the medium, you may notice more or less of it.</p>

<p>During a July discussion around AI in the literary market, I liked a note from Byrne Hobart in <a href="https://www.thediff.co/archive/longreads-open-thread-194/?ref=the-diff-newsletter">The Diff</a> most. It referred back to <a href="https://www.nytimes.com/2026/03/19/books/ai-fiction-shy-girl.html">Hachette's decision to cancel publication of <em>Shy Girl</em></a> over evidence of AI use:</p>

<blockquote>
  <p>“It only gets easier to detect LLM use over time, so we'll all be judged based on the norms and evidence-gathering techniques of the future.”</p>
  <cite>Byrne Hobart, The Diff</cite>
</blockquote>

<p>That sounds very rational and true to me, at least for past and current generations of models.</p>

<p>Looking back at my own posting experience over the last few years, the usefulness of every new model release for a non-native speaker was also clear: first punctuation and structure improved, then clarity and sourcing, and later the analysis itself for essay-style pieces. In sync with the capabilities—writing, coding, and the rest—the posts became more substantive.</p>

<p>But they also became, if not voiceless, certainly less distinctive. At some point, the authorship provenance became clearer, especially with the Claude/Codex family of models.</p>

<p>My takeaway is that it can still be useful to look at less-discussed topics, underexplored data, or similar things, and employ the latest battery of tools to work through them. But the touch of humanness is still a kind of agency that agents will miss, as well as the curiosity, care, and randomness that each of us develops over a lifetime.</p>

<p>And to keep that randomness in place, I want future posts here to contain my writing, and not my models' writing.</p>

<p class="author-note">This note was written by me and lightly edited with AI for spelling, punctuation, and grammar.</p>
"""


# ====================================================================
# WHAT I DO  —  the compact "what I work on" column on the home page.
# `page` -> root-relative internal link; `href` -> external (gets a ↗);
# `wip` -> small WIP pill. Otherwise the term is plain text.
# ====================================================================
WHATIDO = [
    {
        "term": {"en": "Data analyst", "ru": "Аналитик данных", "de": "Datenanalyst"},
        "note": {
            "en": "Day job: data & product analytics for internet and tech platforms",
            "ru": "Основная работа: аналитика данных и продукта для интернет- и технологических платформ",
            "de": "Hauptberuf: Daten- und Produktanalytik für Internet- und Tech-Plattformen",
        },
        "href": "https://github.com/plvch", "external": True,
    },
    {
        "term": {"en": "Financial education", "ru": "Финансовое образование", "de": "Finanzbildung"},
        "note": {"en": "geldchen.com", "ru": "geldchen.com", "de": "geldchen.com"},
        "href": "https://geldchen.com", "external": True,
    },
    {
        "term": {
            "en": "Personal financial planning",
            "ru": "Личное финансовое планирование",
            "de": "Persönliche Finanzplanung",
        },
        "note": {
            "en": "Independent, fee-based · plvch",
            "ru": "Независимо, за гонорар · plvch",
            "de": "Unabhängig, honorarbasiert · plvch",
        },
        "page": "practice",
    },
    {
        "term": {"en": "Eardium", "ru": "Eardium", "de": "Eardium"},
        "note": {
            "en": "Audio-visual app for performance enhancement",
            "ru": "Аудиовизуальное приложение для повышения продуктивности",
            "de": "Audiovisuelle App zur Leistungssteigerung",
        },
        "wip": True,
    },
]


# ====================================================================
# UI STRINGS
# ====================================================================
STR = {
    "en": {
        "nav_writing": "Writing", "nav_practice": "Practice",
        "theme_light": "Light", "theme_dark": "Dark", "lang_aria": "Language",
        "foot_nav": "Navigate", "foot_legal": "Legal", "foot_contact": "Contact",
        "rights": "© 2026 plvch", "berlin": "Berlin",
        "impressum": "Impressum", "privacy": "Privacy", "in_english": "In English",
        "home_title": "plvch · essays, notes & financial planning",
        "home_desc": "Essays and notes on markets, policy, and product by Maksim Palevich, plus an independent financial-planning practice. Berlin.",
        "hero_eyebrow": "plvch · Berlin",
        "hero_title": "Maksim Palevich",
        "hero_lede": "Data & product analytics for internet and tech platforms, with writing on markets, policy, and personal finance.",
        "hero_lede2": "AI and agents put to work across all of it.",
        "whatido_head": "What I do",
        "writing_head": "Writing",
        "practice_eyebrow": "Practice", "practice_h1": "Financial planning",
        "practice_desc": "Individual financial planning in Berlin. Planning and analysis, not product sales or investment advice. In preparation; reach out to talk through your situation.",
        "legal_eyebrow": "Legal", "legal_h1": "Legal",
        "legal_desc": "Impressum and privacy notice for plvch.",
        "legal_intro": "The notices below are provided in German, the legally binding language.",
    },
    "ru": {
        "nav_writing": "Тексты", "nav_practice": "Практика",
        "theme_light": "Светлая", "theme_dark": "Тёмная", "lang_aria": "Язык",
        "foot_nav": "Разделы", "foot_legal": "Правовое", "foot_contact": "Контакты",
        "rights": "© 2026 plvch", "berlin": "Берлин",
        "impressum": "Импрессум", "privacy": "Конфиденциальность", "in_english": "На английском",
        "home_title": "plvch · эссе, заметки и финансовое планирование",
        "home_desc": "Эссе и заметки о рынках, политике и продуктах от Максима Полевича, плюс независимая практика финансового планирования. Берлин.",
        "hero_eyebrow": "plvch · Берлин",
        "hero_title": "Максим Полевич",
        "hero_lede": "Аналитика данных и продукта для интернет- и технологических платформ, плюс тексты о рынках, экономической политике и личных финансах.",
        "hero_lede2": "ИИ и агенты в работе во всех проектах.",
        "whatido_head": "Чем занимаюсь",
        "writing_head": "Тексты",
        "practice_eyebrow": "Практика", "practice_h1": "Финансовое планирование",
        "practice_desc": "Индивидуальное финансовое планирование в Берлине. Планирование и анализ, не продажа продуктов и не инвестиционная консультация. В подготовке; напишите, чтобы разобрать вашу ситуацию.",
        "legal_eyebrow": "Правовое", "legal_h1": "Правовая информация",
        "legal_desc": "Импрессум и политика конфиденциальности plvch.",
        "legal_intro": "Тексты ниже приведены на немецком языке, который является юридически обязательным.",
    },
    "de": {
        "nav_writing": "Texte", "nav_practice": "Praxis",
        "theme_light": "Hell", "theme_dark": "Dunkel", "lang_aria": "Sprache",
        "foot_nav": "Navigation", "foot_legal": "Rechtliches", "foot_contact": "Kontakt",
        "rights": "© 2026 plvch", "berlin": "Berlin",
        "impressum": "Impressum", "privacy": "Datenschutz", "in_english": "Auf Englisch",
        "home_title": "plvch · Essays, Notizen & Finanzplanung",
        "home_desc": "Essays und Notizen zu Märkten, Politik und Produkt von Maksim Palevich, plus eine unabhängige Finanzplanungspraxis. Berlin.",
        "hero_eyebrow": "plvch · Berlin",
        "hero_title": "Maksim Palevich",
        "hero_lede": "Daten- und Produktanalytik für Internet- und Tech-Plattformen, dazu Texte zu Märkten, Politik und persönlichen Finanzen.",
        "hero_lede2": "KI und Agenten nutze ich in allen Projekten.",
        "whatido_head": "Was ich mache",
        "writing_head": "Texte",
        "practice_eyebrow": "Praxis", "practice_h1": "Finanzplanung",
        "practice_desc": "Individuelle Finanzplanung in Berlin. Planung und Analyse, kein Produktverkauf und keine Anlageberatung. In Vorbereitung; melden Sie sich, um Ihre Situation zu besprechen.",
        "legal_eyebrow": "Rechtliches", "legal_h1": "Rechtliches",
        "legal_desc": "Impressum und Datenschutzerklärung für plvch.",
        "legal_intro": "Die folgenden Angaben sind auf Deutsch als rechtlich verbindlicher Sprachfassung bereitgestellt.",
    },
}


# ====================================================================
# PAGE BODIES  (Practice is a localized stub; the Legal body is German
# for all locales, with a localized one-line note above it.)
# ====================================================================
PRACTICE_BODY = {
    "en": """
<p>I've been fascinated by finance as an industry for years. Moving to Germany turned that toward the household side: how a family actually plans, saves, and decides.<br>That became <a href="https://geldchen.com">geldchen.com</a>, a separate financial-education project.<br>Now I'm building a practice for individual financial planning.</p>
<p>It's planning, not product-picking. I don't advise on specific instruments.<br>We start from a conversation about your situation and map your savings, investments, and assets against your goals. You get a concrete set of documents: a clear picture of where you stand <em>now</em>, and the calculation toward where you want to be <em>then</em>.</p>
<p><strong>Not open yet.</strong> The practice is still in preparation and isn't taking clients.<br>I'm running case research right now, so if you want to talk through your situation, reach out.</p>
<div class="notice"><strong>Scope.</strong> Information and planning support only. No product sales, and no advice on specific financial instruments, taxes, or legal questions.<br>Every decision stays yours. See the <a href="/legal/#impressum">Impressum</a> and <a href="/legal/#datenschutz">privacy notice</a>.</div>
<a class="btn" href="mailto:{email}">Get in touch</a>
""",
    "ru": """
<p>Финансы как индустрия занимают меня давно. Переезд в Германию развернул интерес к личным финансам: как семья на самом деле планирует, копит и решает.<br>Так появился <a href="https://geldchen.com">geldchen.com</a>, отдельный проект о финансовом просвещении.<br>Сейчас я строю практику индивидуального финансового планирования.</p>
<p>Это планирование, а не подбор продуктов. Конкретные инструменты я не советую.<br>Мы начинаем с разговора о вашей ситуации и сопоставляем сбережения, инвестиции и активы с вашими целями. На выходе вы получаете конкретный набор документов: ясная картина того, где вы <em>сейчас</em>, и расчёт пути к тому, где вы хотите оказаться <em>потом</em>.</p>
<p><strong>Пока не открыто.</strong> Практика готовится и клиентов пока не берёт.<br>Сейчас я веду исследование кейсов: если хотите разобрать свою ситуацию, напишите.</p>
<div class="notice"><strong>Рамки.</strong> Только информация и помощь в планировании. Без продажи продуктов, без советов по конкретным инструментам, налогам и юридическим вопросам.<br>Решение всегда за вами. См. <a href="/ru/legal/#impressum">Impressum</a> и <a href="/ru/legal/#datenschutz">политику конфиденциальности</a>.</div>
<a class="btn" href="mailto:{email}">Связаться</a>
""",
    "de": """
<p>Finanzen als Branche beschäftigen mich seit Langem. In Deutschland kam die persönliche Seite dazu: wie ein Haushalt wirklich plant, spart und entscheidet.<br>Daraus wurde <a href="https://geldchen.com">geldchen.com</a>, ein eigenständiges Projekt zur Finanzbildung.<br>Jetzt baue ich eine Praxis für individuelle Finanzplanung auf.</p>
<p>Es geht um Planung, nicht um Produktauswahl. Zu konkreten Instrumenten berate ich nicht.<br>Wir starten mit einem Gespräch über Ihre Situation und stellen Ersparnisse, Anlagen und Vermögenswerte Ihren Zielen gegenüber. Heraus kommt ein konkreter Satz Dokumente: ein klares Bild davon, wo Sie <em>heute</em> stehen, und die Rechnung dorthin, wo Sie <em>später</em> sein möchten.</p>
<p><strong>Noch nicht geöffnet.</strong> Die Praxis ist in Vorbereitung und nimmt noch keine Aufträge an.<br>Ich mache gerade Fallrecherche: Wenn Sie Ihre Situation besprechen möchten, melden Sie sich.</p>
<div class="notice"><strong>Rahmen.</strong> Nur Information und Planungsunterstützung. Kein Produktverkauf, keine Beratung zu konkreten Finanzinstrumenten, Steuern oder Rechtsfragen.<br>Jede Entscheidung bleibt bei Ihnen. Siehe <a href="/de/legal/#impressum">Impressum</a> und <a href="/de/legal/#datenschutz">Datenschutzerklärung</a>.</div>
<a class="btn" href="mailto:{email}">Kontakt aufnehmen</a>
""",
}

# German legal body — shared across locales (the legally binding language).
LEGAL_BODY_DE = """
<h2 id="impressum">Impressum</h2>
<h3>Angaben gemäß § 5 DDG</h3>
<p>Maksim Palevich<br>Prenzlauer Promenade 183<br>13189 Berlin<br>Deutschland</p>
<p>Einzelunternehmen, Geschäftsbezeichnung „plvch“</p>
<h3>Kontakt</h3>
<p>E-Mail: <a href="mailto:{email}">{email}</a><br>Telefon: <a href="tel:+4915678848233">+49 15678 848233</a></p>
<h3>Umsatzsteuer-Identifikationsnummer</h3>
<p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE463487124</p>
<h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
<p>Maksim Palevich<br>Prenzlauer Promenade 183<br>13189 Berlin</p>
<h3>Haftungsausschluss — keine Anlageberatung</h3>
<p>Die Inhalte dieser Website (Essays, Notizen sowie die Darstellung der Finanzplanungsleistung) dienen ausschließlich der allgemeinen Information. Sie stellen <strong>keine Anlage-, Steuer- oder Rechtsberatung</strong> dar und ersetzen keine individuelle Beratung durch eine qualifizierte Fachperson. Es handelt sich nicht um eine Anlageberatung oder Anlagevermittlung im Sinne des KWG/WpIG; es werden keine konkreten Finanzinstrumente empfohlen und keine Finanzprodukte vermittelt oder verkauft. Es werden keine Kundengelder verwahrt, keine Aufträge oder Orders ausgeführt und keine Provisionen, Zuwendungen oder Vermittlungsentgelte von Produktanbietern angenommen. Jede Entscheidung trifft die Nutzerin bzw. der Nutzer eigenverantwortlich.</p>
<h3>Finanzplanung — Verbraucher- und Fernabsatzrecht</h3>
<p>Die individuelle Finanzplanung ist eine kostenpflichtige, planungs- und analysebasierte Leistung (keine Anlageberatung, keine Anlagevermittlung). AGB, Widerrufsbelehrung und vorvertragliche Fernabsatzinformationen sind in Vorbereitung; der Dienst nimmt derzeit noch keine Aufträge an.</p>
<h3>Urheberrecht</h3>
<p>Die auf dieser Website veröffentlichten Inhalte unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung oder Verbreitung außerhalb der Grenzen des Urheberrechts bedürfen der vorherigen schriftlichen Zustimmung des Anbieters.</p>

<h2 id="datenschutz">Datenschutzerklärung</h2>
<h3>1. Verantwortlicher</h3>
<p>Maksim Palevich<br>Prenzlauer Promenade 183<br>13189 Berlin<br>E-Mail: <a href="mailto:{email}">{email}</a></p>
<h3>2. Hosting (GitHub Pages) &amp; Auslieferung</h3>
<p>Diese Website wird als statische Seite über <strong>GitHub Pages</strong> (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA) bereitgestellt und über deren Content-Delivery-Network ausgeliefert.</p>
<p>Beim Aufruf der Website werden technisch bedingt Daten verarbeitet, insbesondere die IP-Adresse, Datum und Uhrzeit des Zugriffs, der angeforderte Inhalt sowie Browser- und Geräteinformationen (User-Agent). Diese Verarbeitung ist für die sichere und stabile Bereitstellung der Website erforderlich.</p>
<p>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer funktionsfähigen und sicheren Website).</p>
<p>Die Bereitstellung dieser Zugriffsdaten ist weder gesetzlich noch vertraglich vorgeschrieben, technisch aber erforderlich, um die Website auszuliefern; ohne sie ist ein Seitenaufruf nicht möglich (Art. 13 Abs. 2 lit. e DSGVO).</p>
<p>Wir selbst speichern keine eigenen Server-Logfiles. Die Speicherdauer der bei GitHub anfallenden Zugriffs- und Sicherheitslogs richtet sich nach den Vorgaben des Anbieters und ist auf das für Betrieb und Sicherheit Erforderliche begrenzt (Art. 13 Abs. 2 lit. a DSGVO).</p>
<p>Da GitHub ein US-Unternehmen ist, kann eine Verarbeitung auch in den USA erfolgen. Den Drittlandtransfer stützt GitHub, Inc. auf seine eigene Zertifizierung unter dem EU-US Data Privacy Framework sowie ergänzend auf Standardvertragsklauseln nach Art. 46 DSGVO. Informationen und eine Kopie der Garantien: <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub (Datenschutz/DPA)</a>.</p>
<h3>3. Cookies &amp; lokale Speicherung</h3>
<p>Diese Website setzt <strong>keine</strong> Analyse-, Tracking- oder Marketing-Cookies und bindet keine Drittanbieter-Analysedienste ein.</p>
<p>Ausschließlich für den von Ihnen gewählten Hell- oder Dunkel-Modus wird der lokale Speicher (localStorage) Ihres Browsers genutzt (Schlüssel <code>oi-theme</code>, gemeinsam für alle Seiten unter plvch.com). Diese Speicherung enthält keine Tracking- oder Wiedererkennungsmerkmale, ist für die gewünschte Darstellung unbedingt erforderlich und daher nicht einwilligungspflichtig (§ 25 Abs. 2 Nr. 2 TDDDG). Die Daten verbleiben im localStorage, bis Sie die Website-Daten in Ihrem Browser löschen.</p>
<h3>4. Kontaktaufnahme (auch zur Finanzplanung)</h3>
<p>Wenn Sie uns per E-Mail kontaktieren — etwa zu einem Beitrag oder zur Finanzplanungsleistung —, verarbeiten wir Ihre Angaben ausschließlich zur Bearbeitung Ihrer Anfrage. Die Angabe ist freiwillig, zur Beantwortung aber erforderlich (Art. 13 Abs. 2 lit. e DSGVO). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (bzw. lit. b, sofern die Anfrage auf einen Vertrag gerichtet ist). Die Daten werden gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
<p>Für den Empfang, Versand und die Speicherung von E-Mails nutzen wir den Dienst <strong>mailbox.org</strong> der Heinlein Hosting GmbH, Schwedter Straße 9a, 10119 Berlin, als Auftragsverarbeiter (Art. 28 DSGVO). Die Verarbeitung findet ausschließlich in der EU bzw. im EWR statt.</p>
<h3>5. Keine weiteren Verarbeitungen</h3>
<p>Über diese Website findet derzeit keine Registrierung, keine Führung von Nutzerkonten, keine Zahlungsabwicklung und kein Newsletter-Versand statt.</p>
<h3>6. Ihre Rechte</h3>
<p>Sie haben jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) sowie Datenübertragbarkeit (Art. 20 DSGVO).</p>
<h3>7. Widerspruchsrecht (Art. 21 DSGVO)</h3>
<p>Soweit wir personenbezogene Daten auf Grundlage berechtigter Interessen (Art. 6 Abs. 1 lit. f DSGVO) verarbeiten, haben Sie das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch gegen diese Verarbeitung einzulegen. Wir verarbeiten Ihre personenbezogenen Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.</p>
<h3>8. Beschwerderecht</h3>
<p>Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Für den Anbieter zuständig ist die Berliner Beauftragte für Datenschutz und Informationsfreiheit (BlnBDI), Alt-Moabit 59-61, 10555 Berlin (Eingang Alt-Moabit 60). Tel.: +49 30 13889-0, Fax: +49 30 2155050, <a href="mailto:mailbox@datenschutz-berlin.de">mailbox@datenschutz-berlin.de</a>, <a href="https://www.datenschutz-berlin.de">datenschutz-berlin.de</a>.</p>
<p class="muted">Stand: November 2026</p>
"""


# ====================================================================
# TEMPLATE PARTS
# ====================================================================
def masthead(lang, active):
    nav_items = [
        ("writing", STR[lang]["nav_writing"], url_for("home", lang)),
        ("practice", STR[lang]["nav_practice"], url_for("practice", lang)),
    ]
    nav = "\n".join(
        '      <a href="{href}"{cur}>{label}</a>'.format(
            href=href,
            label=e(label),
            cur=' aria-current="page"' if key == active else "",
        )
        for key, label, href in nav_items
    )
    langs = "\n".join(
        '      <a href="{href}"{cur} hreflang="{l}">{lab}</a>'.format(
            href=url_for(active_page_for(active), lang2),
            cur=' aria-current="true"' if lang2 == lang else "",
            l=HTML_LANG[lang2], lab=LANG_LABEL[lang2],
        )
        for lang2 in LANGS
    )
    return """<header class="masthead">
  <div class="masthead-inner">
    <a class="wordmark" href="{home}">plvch</a>
    <div class="mh-right">
      <nav class="mh-nav" aria-label="Primary">
{nav}
      </nav>
      <span class="lang" role="group" aria-label="{lang_aria}">
{langs}
      </span>
      <span class="theme-toggle" role="group" aria-label="Theme">
        <button type="button" data-theme-btn="light" class="active" aria-pressed="true">{light}</button>
        <button type="button" data-theme-btn="dark" aria-pressed="false">{dark}</button>
      </span>
    </div>
  </div>
</header>""".format(
        home=url_for("home", lang), nav=nav, langs=langs,
        lang_aria=e(STR[lang]["lang_aria"]),
        light=e(STR[lang]["theme_light"]), dark=e(STR[lang]["theme_dark"]),
    )


# the masthead needs the current *page* to build language links; carry it via a global
_CURRENT_PAGE = "home"
def active_page_for(active):
    return _CURRENT_PAGE


def footer(lang):
    s = STR[lang]
    return """<footer class="site"><div class="wrap">
  <div class="foot-grid">
    <div class="col-foot">
      <h4>{foot_nav}</h4>
      <ul>
        <li><a href="{writing}">{nav_writing}</a></li>
        <li><a href="{practice}">{nav_practice}</a></li>
      </ul>
    </div>
    <div class="col-foot">
      <h4>{foot_legal}</h4>
      <ul>
        <li><a href="{legal}#impressum">{impressum}</a></li>
        <li><a href="{legal}#datenschutz">{privacy}</a></li>
      </ul>
    </div>
    <div class="col-foot">
      <h4>{foot_contact}</h4>
      <ul>
        <li><a href="mailto:{email}">{email}</a></li>
        <li>{berlin}</li>
      </ul>
    </div>
  </div>
  <div class="foot-bottom">
    <div>{rights}</div>
    <div>EN · RU · DE</div>
  </div>
</div></footer>""".format(
        foot_nav=e(s["foot_nav"]), foot_legal=e(s["foot_legal"]), foot_contact=e(s["foot_contact"]),
        writing=url_for("home", lang), practice=url_for("practice", lang),
        legal=url_for("legal", lang),
        nav_writing=e(s["nav_writing"]), nav_practice=e(s["nav_practice"]),
        impressum=e(s["impressum"]), privacy=e(s["privacy"]),
        email=EMAIL, berlin=e(s["berlin"]), rights=e(s["rights"]),
    )


def shell(lang, page, title, desc, body, canonical_path=None, localized=True, og_type="website"):
    active = ACTIVE_NAV[page]
    if localized:
        alts = "\n".join(
            '  <link rel="alternate" hreflang="{l}" href="{u}">'.format(l=HTML_LANG[l2], u=BASE_URL + url_for(page, l2))
            for l2 in LANGS
        )
        alts += '\n  <link rel="alternate" hreflang="x-default" href="{u}">'.format(u=BASE_URL + url_for(page, DEFAULT_LANG))
    else:
        article_url = BASE_URL + canonical_path
        alts = '  <link rel="alternate" hreflang="en" href="{u}">\n  <link rel="alternate" hreflang="x-default" href="{u}">'.format(u=article_url)
    canonical = BASE_URL + canonical_path if canonical_path else BASE_URL + url_for(page, lang)
    return """<!DOCTYPE html>
<html lang="{htmllang}" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
{alts}
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta name="theme-color" content="#0b2545">
<link rel="stylesheet" href="{tokens_css}">
<link rel="stylesheet" href="{site_css}">
<script>try{{var t=localStorage.getItem('oi-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
</head>
<body>
{masthead}
<main>
{body}
</main>
{footer}
<script src="{site_js}" defer></script>
</body>
</html>
""".format(
        htmllang=HTML_LANG[lang], title=e(title), desc=e(desc), og_type=e(og_type),
        canonical=canonical, alts=alts,
        tokens_css=asset_url("assets/plvch-tokens.css"),
        site_css=asset_url("assets/site.css"),
        site_js=asset_url("assets/site.js"),
        masthead=masthead(lang, active), body=body, footer=footer(lang),
    )


# ====================================================================
# PAGE BUILDERS
# ====================================================================
def post_card(post, lang):
    tags = post["tags"][lang]
    meta_bits = [e(post["date"][lang]), e(post["read"][lang])] + [e(t) for t in tags]
    meta = "".join('<span class="tag">{}</span>'.format(b) for b in meta_bits)
    en_note = "" if lang == "en" else '<span class="lang-note">{}</span>'.format(e(STR[lang]["in_english"]))
    return """    <a class="post-card" href="/{slug}/" target="_blank" rel="noopener">
      <div class="post-vol">{vol}</div>
      <div class="post-body">
        <h3 class="post-title">{title}</h3>
        <p class="post-dek">{dek}</p>
        <div class="post-meta">{meta}{en_note}</div>
      </div>
    </a>""".format(
        slug=post["slug"], vol=e(post["vol"][lang]), title=e(post["title"]),
        dek=e(post["dek"][lang]), meta=meta, en_note=en_note,
    )


def whatido_item(item, lang):
    term = e(item["term"][lang])
    note = e(item["note"][lang])
    wip = ' <span class="wip">WIP</span>' if item.get("wip") else ""
    if item.get("page"):
        arrow = ' <span class="ext" aria-hidden="true">↗</span>'
        term_html = '<a class="do-term" href="{href}" target="_blank" rel="noopener">{term}{arrow}{wip}</a>'.format(
            href=url_for(item["page"], lang), term=term, arrow=arrow, wip=wip)
    elif item.get("href"):
        ext = ' <span class="ext" aria-hidden="true">↗</span>' if item.get("external") else ""
        term_html = '<a class="do-term" href="{href}" target="_blank" rel="noopener">{term}{ext}{wip}</a>'.format(
            href=item["href"], term=term, ext=ext, wip=wip)
    else:
        term_html = '<span class="do-term">{term}{wip}</span>'.format(term=term, wip=wip)
    return """    <li class="do-item">
      {term}
      <span class="do-note">{note}</span>
    </li>""".format(term=term_html, note=note)


def build_home(lang):
    s = STR[lang]
    cards = "\n".join(post_card(p, lang) for p in reversed(POSTS))
    do_items = "\n".join(whatido_item(it, lang) for it in WHATIDO)
    body = """<section class="hero"><div class="wrap"><div class="home-col">
  <h1>{hero_title}</h1>
  <p class="lede">{hero_lede}<br>{hero_lede2}</p>
  <div class="whatido" aria-label="{whatido_head}">
    <div class="do-head">{whatido_head}</div>
    <ul class="do-list">
{do_items}
    </ul>
  </div>
</div></div></section>

<section class="block" id="writing"><div class="wrap"><div class="home-col">
  <div class="section-head"><h2>{writing_head}</h2></div>
  <div class="posts index">
{cards}
  </div>
</div></div></section>""".format(
        hero_eyebrow=e(s["hero_eyebrow"]), hero_title=e(s["hero_title"]), hero_lede=e(s["hero_lede"]),
        hero_lede2=e(s["hero_lede2"]),
        whatido_head=e(s["whatido_head"]), do_items=do_items,
        writing_head=e(s["writing_head"]), cards=cards,
    )
    return shell(lang, "home", s["home_title"], s["home_desc"], body)


def build_doc(lang, page, body_html):
    s = STR[lang]
    body = """<section class="doc"><div class="wrap col">
  <div class="eyebrow">{eyebrow}</div>
  <h1>{h1}</h1>
</div></section>
<section style="padding-bottom:64px"><div class="wrap col"><div class="prose">
{prose}
</div></div></section>""".format(
        eyebrow=e(s[page + "_eyebrow"]), h1=e(s[page + "_h1"]), prose=body_html,
    )
    return shell(lang, page, s[page + "_h1"] + " · plvch", s[page + "_desc"], body)


def build_practice(lang):
    return build_doc(lang, "practice", PRACTICE_BODY[lang].format(email=EMAIL))


def build_legal(lang):
    intro = '<p class="muted">{}</p>'.format(e(STR[lang]["legal_intro"]))
    return build_doc(lang, "legal", intro + LEGAL_BODY_DE.format(email=EMAIL))


def build_writing_thoughts():
    title = "Updating my thoughts on writing"
    desc = "AI made my posts clearer and more substantive, but also less distinctive. A short note on bringing my own writing back."
    body = """<article>
<header class="doc article-head"><div class="wrap col">
  <div class="eyebrow">Personal note · Vol. 05</div>
  <h1>{title}</h1>
  <div class="article-meta"><time datetime="2026-08-09">9 August 2026</time><span>2 min read</span><span>Writing · AI</span></div>
</div></header>
<section class="article-body"><div class="wrap col"><div class="prose article-prose">
{prose}
</div></div></section>
</article>""".format(title=e(title), prose=WRITING_THOUGHTS_BODY)
    return shell(
        "en", "home", title + " · plvch", desc, body,
        canonical_path="/updating-my-thoughts-on-writing/", localized=False, og_type="article",
    )


# ====================================================================
# RENDER
# ====================================================================
def write(path, html):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)


def main():
    global _CURRENT_PAGE
    builders = {"home": build_home, "practice": build_practice, "legal": build_legal}
    count = 0
    for page in PAGES:
        _CURRENT_PAGE = page
        for lang in LANGS:
            write(out_path(page, lang), builders[page](lang))
            count += 1

    _CURRENT_PAGE = "home"
    write(os.path.join(HERE, "updating-my-thoughts-on-writing", "index.html"), build_writing_thoughts())
    count += 1

    # CNAME — only emit when a custom domain is configured.
    cname = os.path.join(HERE, "CNAME")
    if DOMAIN != "plvch.github.io":
        write(cname, DOMAIN + "\n")
    elif os.path.exists(cname):
        os.remove(cname)

    print("Built {} pages for {} ({} locales) -> {}".format(count, BASE_URL, len(LANGS), HERE))


if __name__ == "__main__":
    main()
