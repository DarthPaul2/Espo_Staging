<style>
.hb-wrap { display: flex; gap: 0; min-height: 80vh; font-family: inherit; }

.hb-sidebar {
    width: 240px;
    min-width: 220px;
    background: #f5f6fa;
    border-right: 1px solid #e0e0e0;
    padding: 16px 0;
    overflow-y: auto;
    flex-shrink: 0;
}

.hb-sidebar h3 {
    font-size: 13px;
    text-transform: uppercase;
    color: #888;
    padding: 0 16px 8px 16px;
    margin: 0 0 4px 0;
    letter-spacing: 0.05em;
}

.hb-nav ul { list-style: none; margin: 0; padding: 0; }
.hb-nav li a {
    display: block;
    padding: 1px 16px;
    font-size: 15px;
    color: #6a7290;
    text-decoration: none;
    border-left: 3px solid transparent;
    line-height: 1.2;
}
.hb-nav li a:hover { background: #eaecf5; color: #3e4d6c; border-left-color: #6c7fb0; }
.hb-nav li a.active { background: #dde3f5; color: #1e3370; border-left-color: #3e5db0; font-weight: 600; }
.hb-nav li.section > a { font-weight: 700; color: #2c3e6a; margin-top: 8px; padding-top: 0; font-size: 17px; text-transform: uppercase; }
.hb-nav-sep { border-top: 1px solid #c8cce0; margin: 10px 14px 6px 14px; }
.hb-nav li.section.muted > a { color: #1d579e; font-size: 15px; }
.hb-nav li.muted > a { color: #1d579e; }
.hb-nav li.section.purple > a { color: #3d2b53; font-size: 17px; font-weight: 700; text-transform: uppercase; }
.hb-nav li.purple > a { color: #3d2b53; }

.hb-main {
    flex: 1;
    padding: 24px 40px 24px 20px;
    min-width: 0;
    overflow-y: auto;
}

.hb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e8eaf2;
}

.hb-header h1 { margin: 0; font-size: 26px; color: #2c3e6a; }

.hb-lang-switcher { display: flex; gap: 4px; }
.hb-lang-btn {
    padding: 5px 14px;
    border: 1px solid #c0c8e0;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: #666;
    transition: all 0.15s;
}
.hb-lang-btn:hover { background: #eaecf5; }
.hb-lang-btn.active { background: #3e5da7; color: #fff; border-color: #3e5da7; }

.hb-main h2 {
    font-size: 22px;
    color: #2c3e6a;
    margin: 32px 0 10px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid #e0e4f0;
}
.hb-main h3 {
    font-size: 18px;
    color: #3a4a7a;
    margin: 22px 0 8px 0;
}
.hb-main h4 { font-size: 16px; color: #555; margin: 16px 0 6px 0; font-weight: 600; }

.hb-main p { margin: 0 0 10px 0; line-height: 1.7; color: #333; font-size: 16px; }
.hb-main ul, .hb-main ol { padding-left: 20px; margin: 0 0 12px 0; }
.hb-main li { line-height: 1.7; font-size: 16px; color: #333; margin-bottom: 6px; }
.hb-main ol li { margin-bottom: 8px; }

.hb-main table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 15px;
}
.hb-main th {
    background: #edf0f8;
    padding: 7px 12px;
    text-align: left;
    font-weight: 600;
    color: #3a4a7a;
    border: 1px solid #d5d9ea;
}
.hb-main td {
    padding: 6px 12px;
    border: 1px solid #e4e7f0;
    color: #333;
    vertical-align: top;
}
.hb-main tr:nth-child(even) td { background: #f9fafd; }

.hb-tip {
    background: #f0f4ff;
    border-left: 4px solid #3e5da7;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
    font-size: 15px;
    color: #333;
}
.hb-warn {
    background: #fff8e8;
    border-left: 4px solid #f0a500;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
    font-size: 15px;
    color: #333;
}

.hb-steps { counter-reset: step; padding-left: 0; list-style: none; }
.hb-steps li {
    counter-increment: step;
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
    align-items: flex-start;
}
.hb-steps li::before {
    content: counter(step);
    background: #3e5da7;
    color: #fff;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    min-width: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    margin-top: 1px;
}

.hb-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    background: #e8eaf5;
    color: #3a4a7a;
    margin: 1px 2px;
}

kbd {
    background: #eee;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 12px;
    font-family: monospace;
}
</style>

<div class="hb-wrap">

    <!-- Боковое меню -->
    <div class="hb-sidebar">
        <div class="hb-nav">
            <div class="hb-content-de" style="display:none">
                <h3>Inhalt</h3>
                <ul>
                    <li class="section"><a href="#de-intro">Einführung</a></li>
                    <li><a href="#de-stammdaten">Stammdaten</a></li>
                    <li><a href="#de-account">→ Kunden</a></li>
                    <li><a href="#de-contact">→ Ansprechpartner</a></li>
                    <li><a href="#de-lieferant">→ Lieferanten</a></li>
                    <li><a href="#de-material">→ Materialien</a></li>
                    <li><a href="#de-objekt">→ Objekte</a></li>
                    <li class="section"><a href="#de-verkauf">Verkaufsprozess</a></li>
                    <li><a href="#de-angebot">→ Angebot</a></li>
                    <li><a href="#de-auftrag">→ Auftrag</a></li>
                    <li><a href="#de-lieferschein">→ Lieferschein</a></li>
                    <li><a href="#de-rechnung">→ Rechnung</a></li>
                    <li class="section"><a href="#de-eingang">Eingangsrechnungen</a></li>
                    <li><a href="#de-eingangsrechnung">→ Eingangsrechnung</a></li>
                    <li><a href="#de-import">→ OCR / AI Import</a></li>
                    <li class="section"><a href="#de-werkzeuge">Werkzeuge</a></li>
                    <li><a href="#de-werkzeug">→ Werkzeug</a></li>
                    <li><a href="#de-ausgabe">→ Werkzeugausgabe</a></li>
                    <li><a href="#de-wartung">→ Wartung</a></li>
                    <li class="hb-nav-sep"></li>
                    <li class="section purple"><a href="#de-mahnwesen">Mahnwesen</a></li>
                    <li class="purple"><a href="#de-mahnung">→ Mahnungen</a></li>
                    <li class="section purple"><a href="#de-arbeitszeit">Arbeitszeit</a></li>
                    <li class="purple"><a href="#de-az">→ Arbeitszeiten</a></li>
                    <li class="purple"><a href="#de-stundenbericht">→ Stundenbericht</a></li>
                    <li class="purple"><a href="#de-abwesenheit">→ Abwesenheit</a></li>
                    <li class="section purple"><a href="#de-berichte">Berichte &amp; Briefe</a></li>
                    <li class="purple"><a href="#de-melder">→ Melder Quartal</a></li>
                    <li class="purple"><a href="#de-briefe">→ Briefe</a></li>
                    <li class="hb-nav-sep"></li>
                    <li class="section muted"><a href="#de-bank">Zahlungen &amp; Bank</a></li>
                    <li class="muted"><a href="#de-bankkonto">→ Bankkonten</a></li>
                    <li class="muted"><a href="#de-zahlung">→ Zahlungen</a></li>
                    <li class="muted"><a href="#de-bankbewegung">→ Bankbewegungen</a></li>
                    <li class="muted"><a href="#de-ausgleich">→ Ausgleiche</a></li>
                    <li class="section muted"><a href="#de-buchhaltung">Buchhaltung</a></li>
                    <li class="muted"><a href="#de-cockpit">→ Finanz-Cockpit (Dashboard)</a></li>
                    <li class="muted"><a href="#de-buchungsjournal">→ Buchungsjournal</a></li>
                    <li class="muted"><a href="#de-auswertung">→ Auswertungen</a></li>
                </ul>
            </div>
            <div class="hb-content-ru" style="display:none">
                <h3>Содержание</h3>
                <ul>
                    <li class="section"><a href="#ru-intro">Введение</a></li>
                    <li><a href="#ru-stammdaten">Справочники</a></li>
                    <li><a href="#ru-account">→ Клиенты</a></li>
                    <li><a href="#ru-contact">→ Контакты</a></li>
                    <li><a href="#ru-lieferant">→ Поставщики</a></li>
                    <li><a href="#ru-material">→ Материалы</a></li>
                    <li><a href="#ru-objekt">→ Объекты</a></li>
                    <li class="section"><a href="#ru-verkauf">Процесс продаж</a></li>
                    <li><a href="#ru-angebot">→ Предложение</a></li>
                    <li><a href="#ru-auftrag">→ Заказ</a></li>
                    <li><a href="#ru-lieferschein">→ Накладная</a></li>
                    <li><a href="#ru-rechnung">→ Счёт-фактура</a></li>
                    <li class="section"><a href="#ru-eingang">Вход. счета</a></li>
                    <li><a href="#ru-eingangsrechnung">→ Eingangsrechnung</a></li>
                    <li><a href="#ru-import">→ OCR / AI Импорт</a></li>
                    <li class="section"><a href="#ru-werkzeuge">Инструменты</a></li>
                    <li><a href="#ru-werkzeug">→ Werkzeug</a></li>
                    <li><a href="#ru-ausgabe">→ Ausgabe</a></li>
                    <li><a href="#ru-wartung">→ Wartung</a></li>
                    <li class="hb-nav-sep"></li>
                    <li class="section purple"><a href="#ru-mahnwesen">Напоминания</a></li>
                    <li class="purple"><a href="#ru-mahnung">→ Mahnungen</a></li>
                    <li class="section purple"><a href="#ru-arbeitszeit">Рабочее время</a></li>
                    <li class="purple"><a href="#ru-az">→ Arbeitszeiten</a></li>
                    <li class="purple"><a href="#ru-stundenbericht">→ Stundenbericht</a></li>
                    <li class="purple"><a href="#ru-abwesenheit">→ Abwesenheit</a></li>
                    <li class="section purple"><a href="#ru-berichte">Отчёты и письма</a></li>
                    <li class="purple"><a href="#ru-melder">→ Melder Quartal</a></li>
                    <li class="purple"><a href="#ru-briefe">→ Briefe</a></li>
                    <li class="hb-nav-sep"></li>
                    <li class="section muted"><a href="#ru-bank">Платежи и банк</a></li>
                    <li class="muted"><a href="#ru-bankkonto">→ Банковские счета</a></li>
                    <li class="muted"><a href="#ru-zahlung">→ Платежи</a></li>
                    <li class="muted"><a href="#ru-bankbewegung">→ Банк. движения</a></li>
                    <li class="muted"><a href="#ru-ausgleich">→ Зачёт</a></li>
                    <li class="section muted"><a href="#ru-buchhaltung">Бухгалтерия</a></li>
                    <li class="muted"><a href="#ru-cockpit">→ Finanz-Cockpit (Dashboard)</a></li>
                    <li class="muted"><a href="#ru-buchungsjournal">→ Журнал проводок</a></li>
                    <li class="muted"><a href="#ru-auswertung">→ Отчёты</a></li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Основной контент -->
    <div class="hb-main">

        <div class="hb-header">
            <h1>
                <span class="hb-content-de" style="display:none">Benutzerhandbuch — Klesec EspoCRM</span>
                <span class="hb-content-ru" style="display:none">Руководство пользователя — Klesec EspoCRM</span>
            </h1>
            <div class="hb-lang-switcher">
                <button class="hb-lang-btn" data-lang="de">DE</button>
                <button class="hb-lang-btn" data-lang="ru">RU</button>
            </div>
        </div>

        <!-- ===================== НЕМЕЦКИЙ КОНТЕНТ ===================== -->
        <div class="hb-content-de" style="display:none">

            <h2 id="de-intro">1. Einführung</h2>
            <p>EspoCRM ist das zentrale Verwaltungssystem von Klesec. Hier wird die gesamte Arbeit abgebildet: von der ersten Anfrage über Angebote, Aufträge und Rechnungen bis hin zu Buchhaltung, Werkzeugverwaltung und Arbeitszeiterfassung.</p>

            <h4>Grundlegende Bedienung</h4>
            <table>
                <tr><th>Aktion</th><th>So geht es</th></tr>
                <tr><td>Datensatz suchen</td><td>Suchfeld oben auf der Seite oder Filter in der Listenansicht</td></tr>
                <tr><td>Datensatz anlegen</td><td>Schaltfläche <kbd>Erstellen</kbd> oben rechts in der Liste</td></tr>
                <tr><td>Datensatz bearbeiten</td><td>Datensatz öffnen → <kbd>Bearbeiten</kbd></td></tr>
                <tr><td>Datensatz löschen</td><td>Datensatz öffnen → Menü <kbd>⋮</kbd> → <kbd>Löschen</kbd></td></tr>
                <tr><td>Verknüpfte Datensätze</td><td>In der Detailansicht unten — Registerkarten mit verknüpften Daten</td></tr>
            </table>
            <div class="hb-tip">Die meisten Nummern (Rechnungen, Aufträge, Angebote) werden <strong>automatisch vergeben</strong> — keine manuelle Eingabe erforderlich.</div>
            <div class="hb-warn">Festgeschriebene Datensätze können <strong>nicht mehr geändert</strong> werden. Dies ist ein buchhalterisches Erfordernis.</div>

            <!-- STAMMDATEN -->
            <!-- STAMMDATEN -->
            <h2 id="de-stammdaten">2. Stammdaten</h2>
            <p>Stammdaten bilden die Grundlage des Systems. Sie werden einmalig angelegt und überall verwendet. Vor dem Erstellen eines Dokuments (Angebot, Rechnung) sicherstellen, dass der betreffende Kunde, Lieferant und die Materialien bereits vorhanden sind.</p>

            <h3 id="de-account">2.1 Kunden (Account)</h3>
            <div class="hb-warn">⚠️ Vor dem Anlegen eines neuen Kunden prüfen, ob er bereits im System vorhanden ist — Suche nach Name oder PLZ.</div>
            <p>Die zentrale Kundenkarte — für Organisationen oder Privatpersonen, mit denen Klesec zusammenarbeitet. Alle Dokumente (Angebote, Aufträge, Rechnungen) werden dem Kunden zugeordnet.</p>
            <p><strong>Menü → Accounts</strong></p>
            <p><strong>Neuen Kunden anlegen:</strong></p>
            <ul class="hb-steps">
                <li>Im Menü <strong>Accounts</strong> öffnen, <kbd>Erstellen</kbd> klicken</li>
                <li>Pflichtfelder ausfüllen: <strong>Name</strong>, <strong>Straße / Hausnummer</strong>, <strong>PLZ</strong>, <strong>Ort</strong>, <strong>Land</strong></li>
                <li>Optional: Telefon, E-Mail hinzufügen</li>
                <li><kbd>Speichern</kbd> — Kundennummer wird automatisch vergeben</li>
            </ul>
            <h4>Verknüpfte Informationen in der Kundenkarte</h4>
            <p>In der Kundenkarte sind unten die zugehörigen Daten in Blöcken sichtbar:</p>
            <table>
                <tr><th>Block / Reiter</th><th>Was ist dort zu sehen</th></tr>
                <tr><td>Objekte</td><td>Standorte / Gebäude des Kunden, an denen Arbeiten durchgeführt werden</td></tr>
                <tr><td colspan="2" style="background:#f0f4ff;font-weight:600">Reiter: Geschäftsdokumente</td></tr>
                <tr><td>Rechnungen</td><td>Alle ausgestellten Rechnungen</td></tr>
                <tr><td>Angebote</td><td>Alle Angebote, die für diesen Kunden erstellt wurden</td></tr>
                <tr><td>Lieferscheine</td><td>Lieferungen und Leistungsnachweise</td></tr>
                <tr><td>Formulare</td><td>Ausgefüllte Formulare aus der mobilen App</td></tr>
                <tr><td colspan="2" style="background:#f0f4ff;font-weight:600">Reiter: Melderprüflisten</td></tr>
                <tr><td>Melder Quartale</td><td>Quartalsberichte der technischen Inspektion</td></tr>
                <tr><td>Melder Gesamt-PDFs</td><td>Jahres-Gesamtberichte der Inspektion</td></tr>
                <tr><td>Contacts</td><td>Ansprechpartner beim Kunden</td></tr>
            </table>

            <h3 id="de-contact">2.2 Ansprechpartner (Contact)</h3>
            <p>Konkrete Person, die einen Kunden vertritt. Ein Kunde kann mehrere Ansprechpartner haben.</p>
            <p><strong>Menü → Contacts</strong></p>
            <ul class="hb-steps">
                <li>In der Kundenkarte: Registerkarte <strong>Contacts</strong> → <kbd>Erstellen</kbd><br>Oder: Menü <strong>Contacts</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder ausfüllen: <strong>Vorname / Nachname</strong>, <strong>Account</strong> (Kundenzuordnung), <strong>Position</strong>, <strong>Telefon</strong>, <strong>E-Mail</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <h3 id="de-lieferant">2.3 Lieferanten</h3>
            <div class="hb-warn">⚠️ Vor dem Anlegen eines neuen Lieferanten prüfen, ob er bereits im System vorhanden ist — Suche nach Name oder Steuernummer.</div>
            <p>Unternehmen oder Personen, von denen Klesec Waren oder Dienstleistungen bezieht. <em>Kunden zahlen an uns — Lieferanten zahlen wir.</em></p>
            <p><strong>Menü → Lieferanten</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Lieferanten</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder ausfüllen: <strong>Name</strong>, Adresse, Kontaktdaten, <strong>USt-IdNr.</strong>, <strong>Steuernummer</strong></li>
                <li>Bankdaten eintragen: <strong>IBAN</strong>, <strong>BIC</strong>, <strong>Bankname</strong></li>
                <li><kbd>Speichern</kbd> — Lieferantennummer wird automatisch vergeben</li>
            </ul>
            <div class="hb-tip">IBAN und BIC direkt beim Anlegen ausfüllen — sie werden für Zahlungen benötigt.</div>
            <h4>Verknüpfte Informationen in der Lieferantenkarte</h4>
            <table>
                <tr><th>Block</th><th>Was ist dort zu sehen</th></tr>
                <tr><td>Eingangsrechnungen</td><td>Alle eingegangenen Rechnungen dieses Lieferanten</td></tr>
            </table>

            <h3 id="de-material">2.4 Materialien</h3>
            <div class="hb-warn">⚠️ Vor dem Anlegen eines neuen Materials zunächst im Katalog suchen — nach Bezeichnung, Artikelnummer oder Kategorie. Doppelte Einträge führen zu unnötigem Aufblähen der Datenbank.</div>
            <p>Katalog aller Materialien, Waren und Dienstleistungen. Bei der Erstellung von Positionen in Angebot oder Rechnung wird das Material aus diesem Katalog ausgewählt — Preis und Beschreibung werden automatisch übernommen.</p>
            <p><strong>Menü → Materialien</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Materialien</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder ausfüllen: <strong>Name</strong>, <strong>Kategorie</strong>, <strong>Einheit</strong>, <strong>Preis</strong>, <strong>EK-Preis</strong>, <strong>MwSt-Satz</strong></li>
                <li>Optional: Lagerort (<strong>Raum / Regal / Segment / Ebene / Platz</strong>)</li>
                <li><kbd>Speichern</kbd> — Barcode wird automatisch generiert</li>
            </ul>

            <h3 id="de-objekt">2.5 Objekte</h3>
            <p>Konkreter Standort (Gebäude, Anlage), an dem Arbeiten für einen Kunden durchgeführt werden. Ein Kunde kann mehrere Objekte haben.</p>
            <p><strong>Menü → Objekte</strong></p>
            <ul class="hb-steps">
                <li>In der Kundenkarte: Registerkarte <strong>Objekte</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Account</strong>, <strong>Straße / Hausnummer</strong>, <strong>PLZ</strong>, <strong>Ort</strong>, <strong>Bezeichnung Zusatz</strong> (z.B. „Lager Nord")</li>
                <li><kbd>Speichern</kbd> — Objektnummer wird automatisch vergeben</li>
            </ul>

            <!-- VERKAUFSPROZESS -->
            <h2 id="de-verkauf">3. Verkaufsprozess</h2>
            <p>Standardkette: <strong>Angebot → Auftrag → Lieferschein → Rechnung</strong>. Jeder folgende Schritt wird auf Basis des vorherigen erstellt — Positionen und Beträge werden automatisch übernommen.</p>

            <h3 id="de-angebot">3.1 Angebot</h3>
            <p>Kaufmännisches Angebot für den Kunden. Nach Bestätigung durch den Kunden wird daraus ein Auftrag erstellt.</p>
            <p><strong>Menü → Angebote</strong></p>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>In Arbeit</td><td>In Bearbeitung, noch nicht versendet</td></tr>
                <tr><td>Abgerechnet</td><td>Rechnung wurde gestellt</td></tr>
                <tr><td>Geschlossen</td><td>Abgelehnt oder nicht mehr aktuell</td></tr>
            </table>
            <p><strong>Angebot erstellen:</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Angebote</strong> → <kbd>Erstellen</kbd></li>
                <li><strong>Account</strong> auswählen — Adressdaten werden automatisch übernommen. Optional: <strong>Kontakt</strong>, <strong>Objekt</strong>, <strong>Gültig bis</strong></li>
                <li>Feld <strong>Einleitung</strong>: eigenen Text eingeben oder den Standardtext unverändert lassen</li>
                <li>Feld <strong>Abschlussbemerkung</strong>: aus der Dropdown-Liste eine passende Vorlage wählen oder eigenen Text eingeben. <em>Nicht vergessen — das Feld muss ausgefüllt sein, bevor das PDF erstellt wird.</em></li>
                <li><kbd>Speichern</kbd> — Angebotsnummer wird automatisch vergeben. Erst danach können Positionen hinzugefügt werden.</li>
                <li>Gesetzliche Optionen prüfen (nur bei Bedarf ankreuzen):
                    <table style="margin-top:8px">
                        <tr><th>Checkbox</th><th>Wann aktivieren</th><th>Auswirkung</th></tr>
                        <tr><td>§ 13b UStG</td><td>Bauleistungen an ein anderes Bauunternehmen</td><td>Steuerschuldnerschaft geht auf den Kunden über — keine MwSt im Angebot, der Kunde erklärt sie selbst</td></tr>
                        <tr><td>§ 12 Abs. 3 UStG</td><td>Angebot für eine Photovoltaikanlage</td><td>MwSt-Satz 0 % für PV-Anlage und zugehörige Komponenten</td></tr>
                    </table>
                    <div class="hb-tip" style="margin-top:8px">Wenn keine Checkbox gesetzt ist, gilt der Standardsatz von 19 % MwSt.</div>
                </li>
                <li>Registerkarte <strong>Positionen</strong> → <kbd>Erstellen</kbd> — es gibt drei Positionstypen:
                    <table style="margin-top:8px">
                        <tr><th>Positionstyp</th><th>Wofür</th></tr>
                        <tr><td>Normale Position</td><td>Reguläre Material- oder Leistungsposition mit Preis</td></tr>
                        <tr><td>Abschnitt</td><td>Überschrift / Gruppenname ohne Preis — strukturiert das Angebot</td></tr>
                        <tr><td>Zwischensumme</td><td>Summiert alle Positionen des zugehörigen Abschnitts</td></tr>
                    </table>
                </li>
                <li>Bei <strong>Normale Position</strong>: <strong>Material</strong> aus dem Katalog wählen — Preis und Einheit werden übernommen. Menge, Rabatt und MwSt prüfen.</li>
                <li><strong>Pos-Nr. korrekt vergeben</strong> — die Nummerierung bestimmt die Darstellung im PDF:
                    <table style="margin-top:8px">
                        <tr><th>Element</th><th>Pos-Nr. Beispiel</th></tr>
                        <tr><td>Abschnitt 1</td><td><strong>1</strong></td></tr>
                        <tr><td>Positionen im Abschnitt 1</td><td><strong>1.1 &nbsp; 1.2 &nbsp; 1.3</strong></td></tr>
                        <tr><td>Zwischensumme für Abschnitt 1</td><td><strong>1Z</strong></td></tr>
                        <tr><td>Abschnitt 2</td><td><strong>2</strong></td></tr>
                        <tr><td>Positionen im Abschnitt 2</td><td><strong>2.1 &nbsp; 2.2</strong></td></tr>
                        <tr><td>Zwischensumme für Abschnitt 2</td><td><strong>2Z</strong></td></tr>
                    </table>
                    <div class="hb-warn" style="margin-top:8px">⚠️ Falsche Nummerierung führt zu falscher Gruppierung im PDF — immer sorgfältig prüfen.</div>
                </li>
                <li>Gesamtbeträge (netto / brutto) prüfen</li>
                <li>PDF ausgeben — drei Schaltflächen in der Angebotskarte:
                    <table style="margin-top:8px">
                        <tr><th>Schaltfläche</th><th>Was wird erzeugt</th><th>Wird gespeichert?</th></tr>
                        <tr><td><kbd>PDF-Vorschau</kbd></td><td>Vorschau im Browser — nur zur Kontrolle, ohne Einzelpreise pro Position</td><td>Nein</td></tr>
                        <tr><td><kbd>PDF erzeugen &amp; speichern</kbd></td><td>PDF <strong>ohne Einzelpreise</strong> — nur Gesamtsumme auf Seite 1, auf den Folgeseiten nur Leistungsbeschreibungen. Geeignet für den Kunden.</td><td>Ja — Link erscheint im Feld <strong>PDF-Datei</strong></td></tr>
                        <tr><td><kbd>PDF erzeugen mit Preis</kbd></td><td>PDF <strong>mit Preis pro Position</strong> — klassisches Format mit Einzel- und Gesamtpreisen. Für interne Zwecke oder auf Kundenwunsch.</td><td>Ja — Link erscheint im Feld <strong>PDF-Datei</strong></td></tr>
                    </table>
                    <div class="hb-tip" style="margin-top:8px">Das gespeicherte PDF kann jederzeit in der Angebotskarte über das Feld <strong>PDF-Datei</strong> geöffnet oder heruntergeladen werden.</div>
                </li>
            </ul>
            <h4>Angebot per E-Mail versenden</h4>
            <p>In der Angebotskarte auf <kbd>Angebot senden</kbd> klicken — es öffnet sich das Standard-E-Mail-Fenster von EspoCRM mit vorausgefüllten Feldern:</p>
            <table>
                <tr><th>Feld</th><th>Vorausgefüllt mit</th><th>Kann geändert werden?</th></tr>
                <tr><td>An (To)</td><td>E-Mail-Adresse des verknüpften Kunden</td><td>Ja — z. B. auf eine andere Adresse ändern</td></tr>
                <tr><td>Betreff</td><td>„Angebot für [Kundenname]"</td><td>Ja</td></tr>
                <tr><td>Nachricht</td><td>Standardtext mit Link zur gespeicherten PDF-Datei</td><td>Ja — Text beliebig anpassen</td></tr>
            </table>
            <div class="hb-warn" style="margin-top:8px">⚠️ Die Schaltfläche <kbd>Angebot senden</kbd> ist nur aktiv, wenn bereits ein PDF gespeichert wurde (Feld <strong>PDF-Datei</strong> ist gefüllt) und beim Kunden eine E-Mail-Adresse hinterlegt ist.</div>
            <div class="hb-tip">Das PDF wird als Link im E-Mail-Text übermittelt — nicht als Anhang. Den Link kann der Empfänger direkt im Browser öffnen.</div>

            <div class="hb-tip">Nach Bestätigung durch den Kunden: in der Angebotskarte auf <kbd>Auftrag erstellen</kbd> klicken.</div>

            <h3 id="de-auftrag">3.2 Auftrag</h3>
            <p>Bestätigter Auftrag — meist aus einem Angebot erstellt. Zeigt an, welcher Betrag bereits abgerechnet wurde und was noch aussteht.</p>
            <p><strong>Menü → Aufträge</strong></p>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>Offen</td><td>Offen, Arbeiten noch nicht begonnen</td></tr>
                <tr><td>In Bearbeitung</td><td>Arbeiten laufen</td></tr>
                <tr><td>Abgeschlossen</td><td>Fertiggestellt</td></tr>
                <tr><td>Storniert</td><td>Storniert</td></tr>
            </table>
            <ul class="hb-steps">
                <li>In der Angebotskarte auf <kbd>Auftrag erstellen</kbd> klicken — Daten werden übernommen</li>
                <li>Felder prüfen: <strong>Leistungsdatum Von / Bis</strong>, Positionen und Beträge</li>
                <li><kbd>Speichern</kbd> — Auftragsnummer wird automatisch vergeben</li>
            </ul>
            <div class="hb-tip">In der Auftragskarte sind <strong>Betrag Netto/Brutto</strong> (Gesamtsumme) und <strong>Verrechnet Netto/Brutto</strong> (bereits abgerechnet) sichtbar. Die Differenz zeigt, was noch aussteht.</div>

            <h3 id="de-lieferschein">3.3 Lieferschein</h3>
            <p>Dokument, das die Lieferung von Materialien oder die Ausführung von Arbeiten bestätigt.</p>
            <p><strong>Menü → Lieferscheine</strong></p>
            <ul class="hb-steps">
                <li>Auftragskarte öffnen → Registerkarte <strong>Lieferscheine</strong> → <kbd>Erstellen</kbd></li>
                <li>Automatisch ausgefüllte Felder prüfen: <strong>Account</strong>, <strong>Lieferadresse</strong>, <strong>Lieferdatum</strong></li>
                <li>Registerkarte <strong>Positionen</strong> → Positionen hinzufügen oder aus Auftrag übernehmen, Mengen prüfen</li>
                <li>Optional: Werkzeuge in Registerkarte <strong>Werkzeuge</strong> verknüpfen</li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd></li>
            </ul>

            <h3 id="de-rechnung">3.4 Rechnung</h3>
            <p>Finanzdokument — Zahlungsaufforderung an den Kunden. Nach der Festschreibung kann die Rechnung <strong>nicht mehr geändert</strong> werden.</p>
            <p><strong>Menü → Rechnungen</strong></p>
            <table>
                <tr><th>Typ</th><th>Bedeutung</th></tr>
                <tr><td>Einzelrechnung</td><td>Normale Einmalrechnung</td></tr>
                <tr><td>Teilrechnung</td><td>Teilbetrag des Auftrags</td></tr>
                <tr><td>Abschlagsrechnung</td><td>Voraus- / Anzahlungsrechnung</td></tr>
                <tr><td>Schlussrechnung</td><td>Abschlussrechnung</td></tr>
                <tr><td>Gutschrift</td><td>Gutschrift / Rückbuchung</td></tr>
            </table>
            <table>
                <tr><th>Zahlungsstatus</th><th>Bedeutung</th></tr>
                <tr><td>Offen</td><td>Nicht bezahlt</td></tr>
                <tr><td>Teilweise bezahlt</td><td>Teilweise bezahlt</td></tr>
                <tr><td>Bezahlt</td><td>Vollständig bezahlt</td></tr>
                <tr><td>Versendet</td><td>An Kunden versendet</td></tr>
                <tr><td>Storniert</td><td>Storniert</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Auftragskarte öffnen → Registerkarte <strong>Rechnungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder prüfen: <strong>Account</strong>, <strong>Auftrag</strong>, <strong>Objekt</strong>, <strong>Rechnungstyp</strong>, <strong>Leistungsdatum Von/Bis</strong>, <strong>Fällig am</strong></li>
                <li>Registerkarte <strong>Positionen</strong> → Positionen prüfen oder manuell ergänzen</li>
                <li>Gesamtbeträge (netto / brutto / MwSt) prüfen</li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd> → Rechnung an Kunden senden</li>
                <li>Nach dem Versand: dem Buchhalter zur Festschreibung übergeben (<kbd>Festschreiben</kbd>)</li>
            </ul>
            <div class="hb-warn">Nach der Festschreibung ist die Rechnung <strong>unveränderlich</strong>. Korrekturen nur über eine neue Rechnung oder Gutschrift.</div>

            <!-- EINGANGSRECHNUNGEN -->
            <h2 id="de-eingang">4. Eingangsbelege &amp; Lieferanten</h2>

            <h3 id="de-eingangsrechnung">4.1 Eingangsbeleg (manuell)</h3>
            <p>Hier werden alle eingehenden Dokumente von Lieferanten erfasst — nicht nur Rechnungen, sondern auch Gutschriften, Korrekturen und weitere Belegtypen.</p>
            <p><strong>Menü → Eingangsbelege</strong></p>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>Entwurf</td><td>In Bearbeitung, noch nicht geprüft</td></tr>
                <tr><td>Freigabe</td><td>Geprüft und zur Festschreibung freigegeben</td></tr>
                <tr><td>Festgeschrieben</td><td>Buchhaltungseinträge wurden erzeugt — Beleg ist gesperrt</td></tr>
            </table>
            <h4>Beleg manuell erstellen</h4>
            <ul class="hb-steps">
                <li>Menü <strong>Eingangsbelege</strong> → <kbd>Erstellen Eingangsbeleg</kbd></li>
                <li>Felder ausfüllen:
                    <table style="margin-top:8px">
                        <tr><th>Feld</th><th>Bedeutung / Hinweis</th></tr>
                        <tr><td><strong>Lieferant</strong></td><td>Pflichtfeld — Lieferant aus der Liste wählen</td></tr>
                        <tr><td><strong>Belegtyp</strong></td><td>Art des Dokuments wählen (siehe unten)</td></tr>
                        <tr><td><strong>Steuer Fall</strong></td><td>19 %, 7 % oder 0 % (steuerfrei)</td></tr>
                        <tr><td><strong>Lief.-Rechnung-Nr.</strong></td><td>Nummer des Dokuments vom Lieferanten</td></tr>
                        <tr><td><strong>Belegdatum</strong></td><td>Datum auf dem Dokument</td></tr>
                        <tr><td><strong>Eingangsdatum</strong></td><td>Datum, wann das Dokument bei uns eingegangen ist</td></tr>
                        <tr><td><strong>Fällig am</strong></td><td>Zahlungsfrist (bei Gutschriften/Stornobelegen nicht erforderlich)</td></tr>
                    </table>
                </li>
                <li><kbd>Speichern</kbd> — interne Eingangsbeleg-Nummer wird automatisch vergeben</li>
                <li>Positionen hinzufügen: Registerkarte <strong>Eingangsrechnungspositionen</strong> → <kbd>Erstellen</kbd></li>
            </ul>
            <h4>Mögliche Belegtypen</h4>
            <table>
                <tr><th>Belegtyp</th><th>Wann verwenden</th></tr>
                <tr><td>Eingangsrechnung</td><td>Standardrechnung eines Lieferanten</td></tr>
                <tr><td>Gutschrift</td><td>Lieferant erstattet uns einen Betrag</td></tr>
                <tr><td>Stornorechnung</td><td>Lieferant storniert eine frühere Rechnung</td></tr>
                <tr><td>Schlussrechnung</td><td>Abschlussrechnung nach Teilzahlungen</td></tr>
                <tr><td>Abschlagsrechnung</td><td>Teilrechnung / Vorauszahlung</td></tr>
                <tr><td>Rechnungskorrektur</td><td>Berichtigung einer bereits gebuchten Rechnung</td></tr>
            </table>
            <h4>Beleg festschreiben</h4>
            <p>Nach Prüfung durchläuft der Beleg zwei Schritte:</p>
            <ul class="hb-steps">
                <li>Schaltfläche <kbd>Freigabe</kbd> klicken — Status wechselt auf <strong>Freigabe</strong></li>
                <li>Schaltfläche <kbd>Festschreiben</kbd> klicken — das System prüft alle Pflichtfelder und Positionen, erstellt automatisch einen <strong>Buchungsjournal-Eintrag</strong> sowie die zugehörigen <strong>Buchungszeilen</strong> (Aufwand, Vorsteuer, Verbindlichkeit)</li>
            </ul>
            <div class="hb-warn">⚠️ Nach der Festschreibung ist der Beleg gesperrt und kann nicht mehr geändert werden. Fehler bitte über einen Korrekturbeleg oder Stornobeleg korrigieren.</div>
            <div class="hb-tip">Vorhandenes PDF des Lieferanten kann direkt an den Beleg angehängt werden — über die Büroklammer-Schaltfläche in der Kartenansicht.</div>
            <p>Wenn ein PDF oder ein Foto des Dokuments vorliegt, kann der Beleg schneller über den <a href="#de-import">OCR / AI Import</a> erfasst werden — das System liest die Daten automatisch aus.</p>

            <h3 id="de-import">4.2 OCR / AI Import</h3>
            <p>Werkzeug zur automatischen Erkennung von Lieferantenrechnungen aus PDF oder JPEG mit KI. Spart manuelle Eingabe.</p>
            <p><strong>Menü → Eingangsrechnung Import</strong></p>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>Neu</td><td>Gerade hochgeladen</td></tr>
                <tr><td>In Verarbeitung</td><td>KI verarbeitet</td></tr>
                <tr><td>Zur Prüfung</td><td>Bereit zur Kontrolle</td></tr>
                <tr><td>Übernommen</td><td>In das System übernommen</td></tr>
                <tr><td>Fehler</td><td>Erkennungsfehler</td></tr>
            </table>
            <ul class="hb-steps">
                <li><kbd>+ Erstellen Import Eingangsbeleg</kbd> klicken</li>
                <li>Feld <strong>Name</strong> ausfüllen — Empfehlung: Lieferantenname + Datum, z.B. <code>Lieferant_GmbH_01_01_25</code></li>
                <li>Schaltfläche <kbd>📎</kbd> klicken → Datei auswählen (PDF oder JPEG). Warten bis <strong>„Bereit"</strong> erscheint</li>
                <li><kbd>Speichern</kbd></li>
                <li>Nach dem Speichern erscheint rechts eine Vorschau des Dokuments. <kbd>Dokument erkennen</kbd> klicken und warten, bis die KI alle Felder befüllt</li>
                <li>Befüllte Felder prüfen: <strong>Lieferant</strong>, Beträge netto/brutto/MwSt, Datum, Fälligkeit, Positionen</li>
                <li>Grüne Schaltfläche klicken — je nach Dokumenttyp:
                    <ul>
                        <li><kbd>Eingangsrechnung erstellen</kbd> — normale Rechnung</li>
                        <li><kbd>Gutschrift erstellen</kbd> — Gutschrift</li>
                        <li><kbd>Korrektur erstellen</kbd> — Korrekturbeleg</li>
                    </ul>
                </li>
                <li>Erstellten Datensatz öffnen und nochmals prüfen</li>
            </ul>
            <div class="hb-tip">Wenn etwas falsch erkannt wurde: Felder vor dem Erstellen manuell korrigieren. Danach in <strong>Eingangsrechnungen</strong> bearbeiten.</div>

            <!-- WERKZEUGE -->
            <h2 id="de-werkzeuge">5. Werkzeuge &amp; Geräte</h2>

            <h3 id="de-werkzeug">5.1 Werkzeuge</h3>
            <p>Verwaltung aller Werkzeuge, Maschinen und Geräte des Unternehmens. Jedes Werkzeug hat eine Inventarnummer, einen Barcode und eine Ausgabehistorie.</p>
            <p><strong>Menü → Werkzeuge</strong></p>
            <table>
                <tr><th>Zustand</th><th>Bedeutung</th></tr>
                <tr><td>Funktionsfähig</td><td>Einsatzbereit</td></tr>
                <tr><td>Defekt</td><td>Defekt</td></tr>
                <tr><td>In Reparatur</td><td>In Reparatur</td></tr>
                <tr><td>Verloren</td><td>Verloren</td></tr>
                <tr><td>Außer Betrieb</td><td>Außer Betrieb genommen</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Menü <strong>Werkzeuge</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Name</strong>, <strong>Kategorie</strong>, <strong>Seriennummer</strong>, <strong>Zustand</strong>, <strong>Letzte Prüfung</strong>, <strong>Nächste Prüfung</strong>, <strong>Standort</strong></li>
                <li>Optional: Dokumente anhängen (<kbd>📎</kbd>)</li>
                <li><kbd>Speichern</kbd> — Inventarnummer und Barcode werden automatisch generiert</li>
            </ul>

            <h3 id="de-ausgabe">5.2 Werkzeugausgabe</h3>
            <p>Ausgabe eines Werkzeugs an einen Mitarbeiter oder auf eine Baustelle.</p>
            <ul class="hb-steps">
                <li>Werkzeugkarte öffnen → Registerkarte <strong>Werkzeugausgaben</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Ausgegeben am</strong>, Status <strong>Ausgegeben</strong></li>
                <li><kbd>Speichern</kbd> — Standort des Werkzeugs wechselt automatisch auf „In Benutzung"</li>
            </ul>
            <p><strong>Rückgabe:</strong> Ausgabedatensatz öffnen → <kbd>Bearbeiten</kbd> → <strong>Zurückgegeben am</strong> eintragen → Status auf <strong>Zurückgegeben</strong> → <kbd>Speichern</kbd></p>

            <h3 id="de-wartung">5.3 Wartung</h3>
            <p>Planung regelmäßiger Wartungen von Anlagen beim Kunden (BMA, EMA, Video, Zutritt). Bei Fälligkeit erstellt das System automatisch eine Aufgabe und benachrichtigt den Verantwortlichen.</p>
            <p><strong>Menü → Wartungen</strong></p>
            <table>
                <tr><th>Fälligkeitsstatus</th><th>Bedeutung</th></tr>
                <tr><td>Fällig</td><td>Wartung ist jetzt fällig</td></tr>
                <tr><td>Bald fällig</td><td>Fälligkeit naht (innerhalb Vorwarnzeit)</td></tr>
                <tr><td>Nicht fällig</td><td>Keine Wartung erforderlich</td></tr>
                <tr><td>Beendet</td><td>Wartung für dieses Objekt beendet</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Menü <strong>Wartungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Account</strong>, <strong>Objekt</strong>, <strong>AnlageTyp</strong>, <strong>Intervall</strong>, <strong>Startdatum</strong>, <strong>Vorwarn-Tage</strong>, <strong>Assigned User</strong> (Techniker)</li>
                <li>Optionen aktivieren: <strong>Auto Aufgabe erstellen</strong>, <strong>Auto Benachrichtigen</strong></li>
                <li><kbd>Speichern</kbd> — nächster Wartungstermin wird automatisch berechnet</li>
            </ul>
            <div class="hb-tip">Filter <strong>Fälligkeitsstatus = Fällig</strong> in der Liste zeigt alle Objekte, die jetzt gewartet werden müssen.</div>

            <!-- MAHNWESEN -->
            <h2 id="de-mahnwesen">6. Mahnwesen</h2>

            <h3 id="de-mahnung">6.1 Mahnungen</h3>
            <p>Das System erstellt Mahnungen für überfällige Rechnungen automatisch. Der Buchhalter prüft und versendet sie.</p>
            <p><strong>Menü → Mahnungen</strong></p>
            <table>
                <tr><th>Stufe</th><th>Bedeutung</th></tr>
                <tr><td>Zahlungserinnerung</td><td>Erste freundliche Erinnerung</td></tr>
                <tr><td>Mahnung 1</td><td>Erste offizielle Mahnung</td></tr>
                <tr><td>Mahnung 2</td><td>Zweite Mahnung</td></tr>
                <tr><td>Mahnung 3</td><td>Letzte Warnung</td></tr>
                <tr><td>Inkasso</td><td>Übergabe an Inkassobüro</td></tr>
            </table>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>Zu prüfen</td><td>Vom System erstellt — Buchhalter muss prüfen</td></tr>
                <tr><td>Erstellt</td><td>Geprüft, versandbereit</td></tr>
                <tr><td>Gesendet</td><td>An Kunden versendet</td></tr>
                <tr><td>Storniert</td><td>Storniert</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Menü <strong>Mahnungen</strong> öffnen → Filter <strong>Status = Zu prüfen</strong> setzen</li>
                <li>Jeden Datensatz prüfen: richtiger Kunde, Betrag, Fälligkeitstage, Mahnstufe?</li>
                <li><kbd>Bearbeiten</kbd> → Status auf <strong>Erstellt</strong> setzen → <kbd>Speichern</kbd></li>
                <li><kbd>PDF erstellen</kbd> → an Kunden senden</li>
                <li>Nach dem Versand: Status auf <strong>Gesendet</strong> setzen</li>
            </ul>

            <!-- ARBEITSZEIT -->
            <h2 id="de-arbeitszeit">7. Arbeitszeiterfassung</h2>

            <h3 id="de-az">7.1 Arbeitszeiten</h3>
            <p>Arbeitsstunden der Techniker — Daten kommen automatisch aus der mobilen App. Der Techniker meldet sich in der App an und ab, die Daten werden synchronisiert.</p>
            <p><strong>Menü → Arbeitszeiten</strong></p>
            <p>Anzeige: Datum, Beginn/Ende, Gesamtdauer, Nettozeit (ohne Pausen), Überstunden, GPS-Koordinaten. Monats- und Jahresübersichten in den jeweiligen Registerkarten verfügbar.</p>

            <h3 id="de-stundenbericht">7.2 Stundenbericht</h3>
            <p>Zusammenfassender Bericht über ausgeführte Arbeiten — wird vom Techniker in der App ausgefüllt. Enthält Objekt, verwendete Materialien, Notdienst und Beträge.</p>
            <p><strong>Menü → Stundenberichte</strong></p>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>Entwurf</td><td>Noch nicht abgeschlossen</td></tr>
                <tr><td>PDF erzeugt</td><td>PDF erstellt, wartet auf Prüfung</td></tr>
                <tr><td>Gesendet</td><td>An Kunden versendet</td></tr>
                <tr><td>Archiviert</td><td>Archiviert</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Filter <strong>Status = PDF erzeugt</strong> setzen — Berichte anzeigen, die auf Prüfung warten</li>
                <li>Bericht öffnen: Objekt, Kunde, Materialien und Mengen prüfen</li>
                <li>Bei Versand: <kbd>PDF erstellen</kbd> (falls noch nicht vorhanden) → an Kunden senden → Status auf <strong>Gesendet</strong> setzen</li>
                <li>Abschließend: Status auf <strong>Archiviert</strong> setzen</li>
            </ul>

            <h3 id="de-abwesenheit">7.3 Abwesenheit</h3>
            <p>Erfassung von Abwesenheiten — Urlaub, Krankheit, Freizeitausgleich. Wird im Teamkalender angezeigt.</p>
            <p><strong>Menü → Abwesenheiten</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Abwesenheiten</strong> → <kbd>Erstellen</kbd> (oder im Kalender auf den Tag klicken)</li>
                <li>Felder: <strong>Assigned User</strong>, <strong>Typ</strong> (U=Urlaub, K=Krank, Freizeitausgleich), <strong>Datum Start / Ende</strong>, <strong>Ganztägig</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <!-- BERICHTE & BRIEFE -->
            <h2 id="de-berichte">8. Technische Berichte &amp; Briefe</h2>

            <h3 id="de-melder">8.1 Melder Quartal</h3>
            <p>Quartalsberichte der technischen Inspektion von Brand- und Einbruchmeldeanlagen. Werden vom Techniker in der App ausgefüllt und automatisch im System gespeichert.</p>
            <p><strong>Menü → Melder Quartale</strong></p>
            <p>In der Objekt- oder Kundenkarte ist unter <strong>Melder Gesamt PDFs</strong> der jährliche Gesamtbericht aller Quartale verfügbar.</p>

            <h3 id="de-briefe">8.2 Briefe</h3>
            <p>Ausgehende Korrespondenz — verknüpft mit Kunden, Aufträgen oder Rechnungen.</p>
            <p><strong>Menü → Briefe</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Briefe</strong> → <kbd>Erstellen</kbd> (oder aus Kunden-/Auftragskarte)</li>
                <li>Felder: <strong>Betreff</strong>, <strong>Datum</strong>, <strong>Account</strong>, <strong>Kontakt</strong>, optionale Verknüpfungen zu Angebot/Auftrag/Rechnung, <strong>Body</strong> (Text)</li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd> → versenden → Status auf <strong>Final</strong> setzen</li>
            </ul>

            <!-- ZAHLUNGEN & BANK -->
            <h2 id="de-bank">9. Zahlungen &amp; Bank</h2>
            <h3 id="de-bankkonto">9.1 Bankkonten</h3>
            <p>Bankkonten der Firma Klesec, über die Ein- und Auszahlungen laufen. Wird einmalig vom Buchhalter eingerichtet.</p>
            <p><strong>Menü → Bankkonten</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Bankkonten</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Name</strong> (z.B. „Hauptkonto Sparkasse"), <strong>IBAN</strong>, <strong>BIC</strong>, <strong>Bankname</strong>, <strong>Startsaldo</strong>, <strong>Startsaldo Datum</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <h3 id="de-zahlung">9.2 Zahlungen</h3>
            <p>Aufzeichnung einer Zahlung — eingehend (Kunde zahlt uns) oder ausgehend (wir zahlen Lieferant). Die Verknüpfung mit der Rechnung erfolgt über den Ausgleich — danach wird der Zahlungsstatus automatisch aktualisiert.</p>
            <p><strong>Menü → Zahlungen</strong></p>
            <table>
                <tr><th>Richtung</th><th>Bedeutung</th></tr>
                <tr><td>Eingang</td><td>Eingang — Kunde hat uns bezahlt</td></tr>
                <tr><td>Ausgang</td><td>Ausgang — wir haben Lieferant bezahlt</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Menü <strong>Zahlungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Zahlungsrichtung</strong>, <strong>Zahlungsdatum</strong>, <strong>Betrag</strong>, <strong>Zahlungsart</strong> (Bank / Bar / Sonstige), <strong>Account</strong> oder <strong>Lieferant</strong></li>
                <li><kbd>Speichern</kbd> — Zahlungsnummer wird automatisch vergeben</li>
                <li>Zahlung mit Rechnung verknüpfen: Registerkarte <strong>Ausgleiche</strong> → <kbd>Erstellen</kbd> → Rechnung und Betrag auswählen</li>
            </ul>

            <h3 id="de-bankbewegung">9.3 Bankbewegungen</h3>
            <p>Eine Bankbewegung entspricht genau einer Zeile im Kontoauszug — einer realen Transaktion auf dem Firmenkonto. Bankbewegungen werden aus der Bank importiert und dienen als Grundlage, um Zahlungseingänge und -ausgänge mit Rechnungen, Lieferanten und Kunden abzugleichen.</p>

            <h4 style="margin-top:18px;color:#2c3e6a;">Wie kommen Bankbewegungen ins System?</h4>
            <p>Es gibt vier Quellen:</p>
            <ul>
                <li><strong>CSV-Import</strong> — Kontoauszug als CSV-Datei aus dem Online-Banking herunterladen und unter <strong>Bankbewegungen → Importieren</strong> hochladen. Bankkonto auswählen, Import starten.</li>
                <li><strong>CAMT-Import</strong> — strukturiertes Bankformat (ISO 20022), ebenfalls per Dateiimport.</li>
                <li><strong>API</strong> — automatischer Abruf direkt vom Banksystem (wenn eingerichtet).</li>
                <li><strong>Manuell</strong> — einzelne Bewegung von Hand erfassen (z.B. für Barkasse oder Korrekturen).</li>
            </ul>
            <div class="hb-tip">Das System erkennt Duplikate automatisch über einen Import-Hash — dieselbe Transaktion kann nicht zweimal importiert werden.</div>

            <h4 style="margin-top:18px;color:#2c3e6a;">Was passiert beim Import automatisch?</h4>
            <p>Das System normalisiert jede importierte Bewegung sofort:</p>
            <ul>
                <li><strong>Richtung</strong> (Eingang / Ausgang) wird aus dem Vorzeichen des Betrags ermittelt — negative Beträge werden als Ausgang gespeichert, der Betrag selbst bleibt positiv.</li>
                <li><strong>Name</strong> wird automatisch gebildet: Datum · Richtung · Betrag · Gegenpartei (z.B. „2025-03-15 · Eingang · 1.250,00 EUR · Müller GmbH").</li>
                <li><strong>Importiert am</strong> wird auf den aktuellen Zeitstempel gesetzt.</li>
                <li>Wenn eine Rechnung, Eingangsrechnung, Zahlung, Kunde oder Lieferant verknüpft wird, springt der Status automatisch auf <strong>Manuell zugeordnet</strong>.</li>
            </ul>

            <h4 style="margin-top:18px;color:#2c3e6a;">Die zwei Status-Felder verstehen</h4>
            <p>Jede Bankbewegung hat zwei parallele Status:</p>
            <table class="hb-table">
                <thead><tr><th>Status</th><th>Bedeutung</th></tr></thead>
                <tbody>
                    <tr><td><strong>Importiert</strong></td><td>Frisch importiert, noch keine Bearbeitung</td></tr>
                    <tr><td><strong>Automatisch erkannt</strong></td><td>System hat einen möglichen Treffer gefunden (Belegnummer im Verwendungszweck erkannt)</td></tr>
                    <tr><td><strong>Manuell zugeordnet</strong></td><td>Buchhaltung hat Rechnung, Eingangsrechnung oder Zahlung manuell verknüpft</td></tr>
                    <tr><td><strong>Unklar</strong></td><td>Transaktion ist unbekannt — muss manuell geprüft werden</td></tr>
                    <tr><td><strong>Ignoriert</strong></td><td>Keine Aktion erforderlich (z.B. interne Umbuchung, Gebühr)</td></tr>
                </tbody>
            </table>
            <table class="hb-table" style="margin-top:10px;">
                <thead><tr><th>Abstimmungsstatus</th><th>Bedeutung</th></tr></thead>
                <tbody>
                    <tr><td><strong>Offen</strong></td><td>Noch nicht abgestimmt</td></tr>
                    <tr><td><strong>Vorschlag vorhanden</strong></td><td>System hat einen Zuordnungsvorschlag — noch nicht bestätigt</td></tr>
                    <tr><td><strong>Zugeordnet</strong></td><td>Vollständig einem Beleg oder Zahlung zugeordnet</td></tr>
                    <tr><td><strong>Teilweise zugeordnet</strong></td><td>Teilbetrag wurde zugeordnet, Rest offen</td></tr>
                    <tr><td><strong>Gebucht</strong></td><td>Vollständig verarbeitet und im Buchungsjournal erfasst</td></tr>
                    <tr><td><strong>Nicht relevant</strong></td><td>Bewegung wird für die Buchhaltung nicht berücksichtigt</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Typischer Arbeitsablauf</h4>
            <ol>
                <li>Kontoauszug importieren: <strong>Bankbewegungen → Importieren</strong> → Datei (CSV oder CAMT) hochladen → Bankkonto auswählen → Import starten.</li>
                <li>Liste der Bankbewegungen öffnen. Bewegungen mit Abstimmungsstatus <strong>Vorschlag vorhanden</strong> als erstes prüfen — System hat bereits eine passende Rechnung oder Zahlung erkannt.</li>
                <li>Bewegung öffnen → Vorschlag prüfen (erkannte Belegnummer, Gegenpartei, Zuordnungshinweis lesen) → bei Übereinstimmung bestätigen.</li>
                <li>Bewegungen mit Status <strong>Unklar</strong> manuell bearbeiten: Datensatz öffnen → <kbd>Bearbeiten</kbd> → passende Rechnung, Eingangsrechnung, Zahlung, Kunde oder Lieferant verknüpfen → speichern.</li>
                <li>Für Bewegungen ohne passenden Beleg (Kontogebühr, interne Umbuchung usw.) — Status auf <strong>Ignoriert</strong> oder Abstimmungsstatus auf <strong>Nicht relevant</strong> setzen.</li>
                <li>Wenn noch keine Zahlung existiert: Schaltfläche <kbd>Zahlung vorbereiten</kbd> klicken — das System prüft die Bewegung und erstellt automatisch eine neue Zahlung im Entwurf, verknüpft mit dieser Bankbewegung.</li>
            </ol>

            <h4 style="margin-top:18px;color:#2c3e6a;">Wichtige Felder einer Bankbewegung</h4>
            <table class="hb-table">
                <thead><tr><th>Feld</th><th>Herkunft / Bedeutung</th></tr></thead>
                <tbody>
                    <tr><td><strong>Buchungstag</strong></td><td>Datum der Buchung auf dem Konto (aus Kontoauszug)</td></tr>
                    <tr><td><strong>Wertstellungsdatum</strong></td><td>Datum der tatsächlichen Wertstellung (kann abweichen)</td></tr>
                    <tr><td><strong>Betrag / Richtung</strong></td><td>Transaktionsbetrag (immer positiv) + Eingang oder Ausgang</td></tr>
                    <tr><td><strong>Gegenpartei</strong></td><td>Name des Absenders oder Empfängers (aus Kontoauszug)</td></tr>
                    <tr><td><strong>Gegenpartei IBAN</strong></td><td>IBAN der Gegenseite — hilft bei der automatischen Zuordnung zum Lieferanten oder Kunden</td></tr>
                    <tr><td><strong>Verwendungszweck</strong></td><td>Freitext aus dem Überweisungsauftrag — enthält oft die Rechnungsnummer</td></tr>
                    <tr><td><strong>Erkannte Belegnummer</strong></td><td>Vom System automatisch aus dem Verwendungszweck extrahierte Rechnungs- oder Belegnummer</td></tr>
                    <tr><td><strong>Zuordnungshinweis</strong></td><td>Erklärung, warum das System diesen Vorschlag gemacht hat</td></tr>
                    <tr><td><strong>Bankkonto</strong></td><td>Firmenkonto, auf dem diese Bewegung gebucht wurde</td></tr>
                    <tr><td><strong>Zahlung / Rechnung / Eingangsrechnung</strong></td><td>Verknüpfte Belege nach der Zuordnung</td></tr>
                </tbody>
            </table>

            <h3 id="de-ausgleich">9.4 Ausgleiche</h3>
            <p>Der Ausgleich ist das Bindeglied zwischen einer <strong>Zahlung</strong> und einer <strong>Rechnung</strong> (ausgehend) oder <strong>Eingangsrechnung</strong> (eingehend). Er dokumentiert, welcher Betrag einer Zahlung gegen welchen Beleg verrechnet wurde — und aktualisiert dadurch den Zahlungsstatus des Belegs automatisch.</p>

            <h4 style="margin-top:18px;color:#2c3e6a;">Wann wird ein Ausgleich erstellt?</h4>
            <ul>
                <li><strong>Kunde hat unsere Rechnung bezahlt</strong> — Zahlung ist eingegangen, Rechnung soll als bezahlt markiert werden.</li>
                <li><strong>Wir haben eine Lieferantenrechnung bezahlt</strong> — Zahlung ist ausgegangen, Eingangsrechnung soll als bezahlt markiert werden.</li>
                <li><strong>Teilzahlung</strong> — Kunde oder Lieferant zahlt nur einen Teil des Betrags. Der Ausgleich erfasst den Teilbetrag, die Rechnung bleibt mit dem verbleibenden Restbetrag offen.</li>
                <li><strong>Eine Zahlung deckt mehrere Rechnungen</strong> — für jede Rechnung wird ein eigener Ausgleich mit dem jeweiligen Betrag erstellt.</li>
                <li><strong>Mehrere Zahlungen für eine Rechnung</strong> — jede Zahlung bekommt einen eigenen Ausgleich; der Restbetrag der Rechnung sinkt nach jedem Ausgleich.</li>
            </ul>

            <h4 style="margin-top:18px;color:#2c3e6a;">Wie wird ein Ausgleich erstellt?</h4>
            <ol>
                <li>Zahlung öffnen (<strong>Zahlungen &amp; Bank → Zahlungen</strong>) und die gewünschte Zahlung aufrufen.</li>
                <li>Registerkarte <strong>Ausgleiche</strong> → Schaltfläche <kbd>Erstellen</kbd> klicken.</li>
                <li>Im Formular die zu verrechnende <strong>Rechnung</strong> (Ausgangsbeleg) oder <strong>Eingangsrechnung</strong> (Eingangsbeleg) auswählen.</li>
                <li>Das System füllt <strong>automatisch</strong> aus:
                    <ul>
                        <li><em>Datum</em> — vom Zahlungsdatum übernommen</li>
                        <li><em>Betrag</em> — Minimum aus Zahlungsbetrag und offenem Restbetrag der Rechnung</li>
                        <li><em>Ausgleich-Typ</em> — <strong>Vollausgleich</strong>, wenn der Betrag den Restbetrag vollständig deckt; sonst <strong>Teilausgleich</strong></li>
                        <li><em>Richtung</em> — bei Ausgangsrechnung automatisch „Forderungsausgleich"; bei Eingangsrechnung „Verbindlichkeitsausgleich"</li>
                        <li><em>Restbetrag nach Ausgleich</em> — verbleibender offener Betrag auf der Rechnung</li>
                    </ul>
                </li>
                <li>Betrag bei Bedarf manuell anpassen (z.B. bei vereinbarter Teilzahlung).</li>
                <li>Speichern — der Zahlungsstatus der Rechnung wird sofort aktualisiert.</li>
            </ol>

            <h4 style="margin-top:18px;color:#2c3e6a;">Felder im Überblick</h4>
            <table class="hb-table">
                <thead><tr><th>Feld</th><th>Bedeutung</th></tr></thead>
                <tbody>
                    <tr><td><strong>Ausgleich-Nr.</strong></td><td>Automatisch vergebene Nummer (Autonummer)</td></tr>
                    <tr><td><strong>Ausgl.-Datum</strong></td><td>Datum der Verrechnung — normalerweise = Zahlungsdatum</td></tr>
                    <tr><td><strong>Ausgl.-Betrag</strong></td><td>Betrag, der mit dieser Zahlung gegen den Beleg verrechnet wird</td></tr>
                    <tr><td><strong>Ausgleich-Typ</strong></td><td><em>Vollausgleich</em> — Beleg vollständig ausgeglichen; <em>Teilausgleich</em> — Restbetrag bleibt offen</td></tr>
                    <tr><td><strong>Ausgl.-Richtung</strong></td><td><em>Forderungsausgleich</em> — Kundenrechnung; <em>Verbindlichkeitsausgleich</em> — Lieferantenrechnung</td></tr>
                    <tr><td><strong>Restbetrag nach Ausgleich</strong></td><td>Verbleibender offener Betrag auf der Rechnung nach diesem Ausgleich</td></tr>
                    <tr><td><strong>Zahlung</strong></td><td>Verknüpfte Zahlung</td></tr>
                    <tr><td><strong>Rechnung</strong></td><td>Verknüpfte Ausgangsrechnung (Kundenbeleg)</td></tr>
                    <tr><td><strong>Eingangsrechnung</strong></td><td>Verknüpfte Eingangsrechnung (Lieferantenbeleg)</td></tr>
                    <tr><td><strong>Status</strong></td><td><em>Aktiv</em> — gültig; <em>Storniert</em> — wurde storniert</td></tr>
                    <tr><td><strong>Bemerkung</strong></td><td>Freitextfeld für interne Notizen</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Ausgleich stornieren</h4>
            <p>Wenn ein Ausgleich falsch erstellt wurde (z.B. falsche Rechnung verknüpft), kann er storniert werden — sofern die zugehörige Zahlung <strong>noch nicht festgeschrieben</strong> ist. Nach der Festschreibung der Zahlung ist weder Bearbeitung noch Stornierung möglich. In diesem Fall muss zunächst die Zahlung storniert werden.</p>
            <div class="hb-tip"><strong>Wichtig:</strong> Ein stornierter Ausgleich erhält den Status „Storniert" und wird bei der Berechnung des Zahlungsstatus der Rechnung nicht mehr berücksichtigt.</div>

            <!-- BUCHHALTUNG -->
            <h2 id="de-buchhaltung">10. Buchhaltung</h2>

            <h3 id="de-cockpit">10.0 Finanz-Cockpit</h3>
            <p>Zentrale Übersichtstafel mit allen wichtigen Kennzahlen, Grafiken und Prüfindikatoren — für Geschäftsführung und Buchhaltung auf einen Blick.</p>
            <p><strong>Startseite (Dashboard) → Dashlet „Buchhaltung Cockpit"</strong></p>
            <div class="hb-tip">Das Cockpit liest ausschließlich Buchungsdaten — es verändert nichts im System.</div>

            <h4 style="margin-top:16px;color:#2c3e6a;">Zeitraumfilter</h4>
            <p>Oben links stehen drei Filteroptionen: <strong>Monat</strong>, <strong>Quartal</strong> oder <strong>Jahr</strong>, kombiniert mit einer Jahresauswahl. Die gesamte Ansicht aktualisiert sich sofort beim Wechsel.</p>

            <h4 style="margin-top:16px;color:#2c3e6a;">Registerkarte: Geschäftsführung</h4>
            <p>Für den täglichen Überblick der Unternehmensleitung.</p>
            <table class="hb-table">
                <thead><tr><th>Block</th><th>Inhalt</th></tr></thead>
                <tbody>
                    <tr><td><strong>KPI-Kacheln (8 Stück)</strong></td><td>Umsatz netto · Aufwand netto · Basis-Ergebnis · Bankbewegung im Zeitraum · Offene Forderungen · Offene Verbindlichkeiten · Steuer-Saldo · Liquiditätsbewegung</td></tr>
                    <tr><td><strong>Liquiditätsbild</strong></td><td>Erwartete Liquidität — Saldo aus Forderungen, Verbindlichkeiten und Bankbewegung</td></tr>
                    <tr><td><strong>Grafik: Wirtschaftliches Ergebnis</strong></td><td>Umsatz vs. Aufwand vs. Ergebnis nach Monat / Quartal / Jahr als Balkendiagramm</td></tr>
                    <tr><td><strong>Grafik: Liquiditätsbewegung</strong></td><td>Netto-Geldfluss nach Periode als Liniendiagramm</td></tr>
                    <tr><td><strong>Offene Posten</strong></td><td>Offene Forderungen, zu zahlende Verbindlichkeiten, erwartete Liquidität in einer Tabelle</td></tr>
                    <tr><td><strong>Steuer-Saldo</strong></td><td>Umsatzsteuer minus Vorsteuer — zeigt ob eine Zahllast oder ein Erstattungsanspruch besteht</td></tr>
                    <tr><td><strong>Vorschau nächste Wochen</strong></td><td>Fällige Rechnungen und Zahlungen der kommenden Wochen — Liquiditätsplanung</td></tr>
                    <tr><td><strong>Kritische Forderungen</strong></td><td>Top-Offene-Posten nach Betrag — wer schuldet am meisten</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Registerkarte: Buchhaltung</h4>
            <p>Für die Buchhalterin — Prüfindikatoren und Abstimmungsstatus.</p>
            <table class="hb-table">
                <thead><tr><th>Block</th><th>Inhalt</th></tr></thead>
                <tbody>
                    <tr><td><strong>Prüfsaldo Soll/Haben</strong></td><td>Differenz zwischen Soll- und Habenseite aller Buchungen — muss 0,00 € sein</td></tr>
                    <tr><td><strong>OP-Abstimmung Forderungen</strong></td><td>Vergleich Journalsaldo (Kto. 1200) mit operativen Restbeträgen in CRechnung</td></tr>
                    <tr><td><strong>OP-Abstimmung Verbindlichkeiten</strong></td><td>Vergleich Journalsaldo (Kto. 3300) mit operativen Restbeträgen in CEingangsrechnung</td></tr>
                    <tr><td><strong>Anzahl Buchungen</strong></td><td>Gesamtzahl der Buchungszeilen im gewählten Zeitraum</td></tr>
                    <tr><td><strong>Steuerprüfung kompakt</strong></td><td>USt und VSt je Steuersatz — schnelle Kontrolle vor der Voranmeldung</td></tr>
                    <tr><td><strong>Offene-Posten-Abstimmung kompakt</strong></td><td>Kurzübersicht der Abstimmungsdifferenzen zwischen Journal und operativen Daten</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Arbeitsliste (Auffälligkeiten)</h4>
            <p>Unter beiden Registerkarten erscheint automatisch eine farblich hervorgehobene <strong>Arbeitsliste</strong>: Sie zeigt alle offenen Punkte, die Aufmerksamkeit erfordern — z. B. unklare Bankbewegungen, unausgeglichene Belege, OP-Differenzen oder kritische Forderungen. Jeder Eintrag enthält einen direkten Link zur betreffenden Auswertung.</p>

            <h3 id="de-buchungsjournal">10.1 Buchungsjournal</h3>
            <p><strong>Menü → Buchungsjournale</strong></p>
            <div class="hb-tip">Buchungsjournale werden vollautomatisch erstellt — normale Mitarbeiter müssen hier nichts tun. Dieser Bereich ist für die Buchhaltung zur Kontrolle und Prüfung.</div>

            <h4 style="margin-top:16px;color:#2c3e6a;">Was ist ein Buchungsjournal?</h4>
            <p>Ein Buchungsjournal ist der buchhaltungstechnische Nachweis einer Geschäftstransaktion. Jedes Journal enthält eine oder mehrere <strong>Buchungszeilen (CBuchung)</strong> — die konkreten Soll/Haben-Einträge auf Konten.</p>
            <p>Das System erstellt automatisch ein neues Buchungsjournal, sobald ein Beleg <strong>festgeschrieben</strong> wird. Festschreiben ist der Moment, in dem ein Dokument buchhalterisch wirksam wird und nicht mehr geändert werden kann.</p>

            <h4 style="margin-top:16px;color:#2c3e6a;">Wann wird ein Journal erstellt?</h4>
            <table class="hb-table">
                <thead><tr><th>Auslöser</th><th>Journal-Nummer (Prefix)</th><th>Was passiert</th></tr></thead>
                <tbody>
                    <tr><td><strong>Rechnung festschreiben</strong></td><td><code>JRN-JJJJMMTT-…</code></td><td>3 Buchungszeilen: Forderung (Soll), Erlös (Haben), Umsatzsteuer (Haben)</td></tr>
                    <tr><td><strong>Eingangsbeleg festschreiben</strong></td><td><code>EJR-JJJJMMTT-…</code></td><td>3 Buchungszeilen: Aufwand (Soll), Vorsteuer (Soll), Verbindlichkeit (Haben)</td></tr>
                    <tr><td><strong>Eingangsbeleg als Gegenbuchung</strong></td><td><code>EGS-JJJJMMTT-…</code></td><td>Gegenbuchung mit umgekehrter Buchungswirkung</td></tr>
                    <tr><td><strong>Zahlung festschreiben</strong></td><td><code>ZLG-JRN-JJJJMMTT-…</code></td><td>Buchungszeilen für Zahlungsein- oder -ausgang</td></tr>
                    <tr><td><strong>Rechnung stornieren</strong></td><td><code>STR-JRN-JJJJMMTT-…</code></td><td>Spiegelverkehrte Buchungen zur Originalrechnung</td></tr>
                    <tr><td><strong>Eingangsbeleg stornieren</strong></td><td><code>ESTR-JRN-JJJJMMTT-…</code></td><td>Spiegelverkehrte Buchungen zum Originalbeleg</td></tr>
                    <tr><td><strong>Zahlung stornieren</strong></td><td><code>STZLG-JRN-JJJJMMTT-…</code></td><td>Spiegelverkehrte Buchungen zur Originalzahlung</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Buchungszeilen je Belegart</h4>
            <table class="hb-table">
                <thead><tr><th>Belegart</th><th>Buchungszeile</th><th>Soll / Haben</th><th>Betrag</th></tr></thead>
                <tbody>
                    <tr><td rowspan="3"><strong>Ausgangsrechnung</strong></td><td>Forderung aus Rechnung</td><td>Soll</td><td>Brutto</td></tr>
                    <tr><td>Erlös aus Rechnung</td><td>Haben</td><td>Netto</td></tr>
                    <tr><td>Umsatzsteuer</td><td>Haben</td><td>USt-Betrag</td></tr>
                    <tr><td rowspan="3"><strong>Eingangsrechnung</strong></td><td>Aufwand aus Eingangsrechnung</td><td>Soll</td><td>Netto</td></tr>
                    <tr><td>Vorsteuer</td><td>Soll</td><td>VSt-Betrag</td></tr>
                    <tr><td>Verbindlichkeit</td><td>Haben</td><td>Brutto</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Felder im Buchungsjournal</h4>
            <table class="hb-table">
                <thead><tr><th>Feld</th><th>Bedeutung</th></tr></thead>
                <tbody>
                    <tr><td><strong>Journal Nummer</strong></td><td>Automatisch erzeugte eindeutige Kennung (Prefix + Datum + ID-Suffix)</td></tr>
                    <tr><td><strong>Belegdatum</strong></td><td>Übernommen vom Quellbeleg (Rechnungsdatum, Belegdatum)</td></tr>
                    <tr><td><strong>Buchungstext</strong></td><td>Kurzbeschreibung, z. B. „Festschreibung Eingangsrechnung EJR-20240501…"</td></tr>
                    <tr><td><strong>Quelle Typ</strong></td><td>Woher das Journal stammt: Ausgangsrechnung / Eingangsrechnung / Zahlung</td></tr>
                    <tr><td><strong>Quelle Nummer</strong></td><td>Nummer des Quellbelegs (z. B. Rechnungsnummer)</td></tr>
                    <tr><td><strong>Status</strong></td><td>Immer <em>Festgeschrieben</em> — Journale können nicht bearbeitet werden</td></tr>
                    <tr><td><strong>Ist Storno</strong></td><td>Kennzeichnet Storno-Journale — entstehen bei Stornierung eines Belegs</td></tr>
                    <tr><td><strong>Buchungen</strong></td><td>Registerkarte mit allen zugehörigen Buchungszeilen (Soll/Haben, Konto, Betrag)</td></tr>
                </tbody>
            </table>

            <h3 id="de-auswertung">10.2 Buchhaltung Auswertungen</h3>
            <p><strong>Menü → Buchhaltung Auswertungen</strong></p>
            <p>Vorkonfigurierte Berichte — jeden Bericht öffnen, Zeitraum (Von/Bis) einstellen und <kbd>Aktualisieren</kbd> klicken.</p>

            <h4 style="margin-top:18px;color:#2c3e6a;">Ausgangsrechnungen</h4>
            <table class="hb-table">
                <thead><tr><th>Bericht</th><th>Was zeigt er</th></tr></thead>
                <tbody>
                    <tr><td><strong>Festgeschriebene Rechnungen</strong></td><td>Alle festgeschriebenen Ausgangsrechnungen im Zeitraum — Anzahl, Netto, Steuer, Brutto</td></tr>
                    <tr><td><strong>Umsatzübersicht</strong></td><td>Umsatzentwicklung nach Periode — kompakte Gesamtsicht auf Erlöse</td></tr>
                    <tr><td><strong>Umsatzsteuer-Übersicht</strong></td><td>Umsatzsteuer aus Ausgangsrechnungen — Grundlage für die USt-Voranmeldung</td></tr>
                    <tr><td><strong>Offene Forderungen</strong></td><td>Noch nicht bezahlte Ausgangsrechnungen mit offenem Restbetrag — wer schuldet uns noch Geld</td></tr>
                    <tr><td><strong>Kontenbewegungen</strong></td><td>Alle Buchungssätze aus festgeschriebenen Ausgangsrechnungen (Debitor, Erlös, USt)</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Eingangsrechnungen</h4>
            <table class="hb-table">
                <thead><tr><th>Bericht</th><th>Was zeigt er</th></tr></thead>
                <tbody>
                    <tr><td><strong>Festgeschriebene Eingangsrechnungen</strong></td><td>Alle festgeschriebenen Eingangsbelege — Anzahl, Netto, Steuer, Brutto</td></tr>
                    <tr><td><strong>Verbindlichkeiten</strong></td><td>Noch nicht bezahlte Eingangsrechnungen — was wir Lieferanten noch schulden</td></tr>
                    <tr><td><strong>Aufwand</strong></td><td>Aufwand-Buchungen aus Eingangsrechnungen (Konto 6300) — Gesamtkosten im Zeitraum</td></tr>
                    <tr><td><strong>Vorsteuer</strong></td><td>Vorsteuer-Buchungen aus Eingangsrechnungen — Grundlage für VSt-Abzug</td></tr>
                    <tr><td><strong>Kontenbewegungen Eingang</strong></td><td>Alle Buchungssätze aus festgeschriebenen Eingangsrechnungen</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Zahlungen &amp; Ausgleiche</h4>
            <table class="hb-table">
                <thead><tr><th>Bericht</th><th>Was zeigt er</th></tr></thead>
                <tbody>
                    <tr><td><strong>Festgeschriebene Zahlungen</strong></td><td>Alle gebuchten Zahlungen im Zeitraum</td></tr>
                    <tr><td><strong>Zahlungseingänge</strong></td><td>Nur eingehende Zahlungen (von Kunden)</td></tr>
                    <tr><td><strong>Zahlungsausgänge</strong></td><td>Nur ausgehende Zahlungen (an Lieferanten)</td></tr>
                    <tr><td><strong>Zahlungsübersicht</strong></td><td>Alle Zahlungen gemeinsam — Ein- und Ausgänge im Vergleich</td></tr>
                    <tr><td><strong>Kontenbewegungen Zahlung</strong></td><td>Buchungssätze aus festgeschriebenen Zahlungen</td></tr>
                    <tr><td><strong>Ausgleichsübersicht</strong></td><td>Alle Ausgleiche — Voll- und Teilausgleiche, Gesamtsumme</td></tr>
                    <tr><td><strong>Teilweise ausgeglichene Belege</strong></td><td>Rechnungen und Eingangsbelege, die nur teilweise bezahlt sind</td></tr>
                    <tr><td><strong>Voll ausgeglichene Belege</strong></td><td>Belege mit Restbetrag = 0 — vollständig abgeschlossen</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Bankbewegungen</h4>
            <table class="hb-table">
                <thead><tr><th>Bericht</th><th>Was zeigt er</th></tr></thead>
                <tbody>
                    <tr><td><strong>Bankbewegungen Übersicht</strong></td><td>Alle Kontobewegungen aus dem Kontoauszug — Grundlage für den Bankabgleich</td></tr>
                    <tr><td><strong>Unklare Bankbewegungen</strong></td><td>Bewegungen, die noch nicht zugeordnet sind — Arbeitsliste für die Buchhaltung</td></tr>
                    <tr><td><strong>Bankbewegungen ohne Zahlung</strong></td><td>Bewegungen ohne verknüpfte CZahlung — mögliche fehlende Buchungen</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Storno</h4>
            <table class="hb-table">
                <thead><tr><th>Bericht</th><th>Was zeigt er</th></tr></thead>
                <tbody>
                    <tr><td><strong>Stornierte Rechnungen</strong></td><td>Alle stornierten Ausgangsrechnungen</td></tr>
                    <tr><td><strong>Stornierte Eingangsrechnungen</strong></td><td>Alle stornierten Eingangsbelege</td></tr>
                    <tr><td><strong>Stornierte Zahlungen</strong></td><td>Alle stornierten Zahlungen</td></tr>
                    <tr><td><strong>Stornierte Ausgleiche</strong></td><td>Alle stornierten Ausgleiche</td></tr>
                    <tr><td><strong>Stornierte Kontenbewegungen</strong></td><td>Alle Storno-Buchungssätze im System</td></tr>
                    <tr><td><strong>Stornierte Journale</strong></td><td>Alle stornierten Buchungsjournale</td></tr>
                    <tr><td><strong>Storno-Übersicht</strong></td><td>Zusammenfassung aller Stornierungen über alle Belegarten</td></tr>
                    <tr><td><strong>Stornierte Belege Kontrolle</strong></td><td>Kontrollbericht: zu jedem stornierten Beleg prüfen, ob ein Nachfolgebeleg vorhanden ist</td></tr>
                    <tr><td><strong>Korrekturketten Ausgangsrechnungen</strong></td><td>Verkettung: stornierte Ausgangsrechnung → Korrekturbeleg → Nachfolger</td></tr>
                    <tr><td><strong>Korrekturketten Eingangsrechnungen</strong></td><td>Verkettung: stornierte Eingangsrechnung → Korrekturbeleg → Nachfolger</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Abschluss &amp; Analyse</h4>
            <table class="hb-table">
                <thead><tr><th>Bericht</th><th>Was zeigt er</th></tr></thead>
                <tbody>
                    <tr><td><strong>Summen- und Saldenliste</strong></td><td>Journalbasierte Kontensalden — Soll/Haben-Summen und Endsaldo je Konto (ähnlich SKR)</td></tr>
                    <tr><td><strong>Kontenblatt</strong></td><td>Einzelbuchungen für ein bestimmtes Konto — Detailansicht der Summen- und Saldenliste</td></tr>
                    <tr><td><strong>Steuerübersicht gesamt</strong></td><td>USt und Vorsteuer kombiniert — rechnerische Steuerzahllast oder Erstattungsanspruch</td></tr>
                    <tr><td><strong>Offene-Posten-Abstimmung</strong></td><td>Vergleich: Journalsaldo (Kto. 1200 / 3300) vs. operative Restbeträge in CRechnung / CEingangsrechnung</td></tr>
                    <tr><td><strong>Management-Kennzahlen-Grundlage</strong></td><td>Kompakte Übersicht: Umsatz, Aufwand, Rohertrag — für die Geschäftsführung</td></tr>
                </tbody>
            </table>

        </div><!-- Ende DE -->


        <!-- ===================== РУССКИЙ КОНТЕНТ ===================== -->
        <div class="hb-content-ru" style="display:none">

            <h2 id="ru-intro">1. Введение</h2>
            <p>EspoCRM — центральная система управления Klesec. Здесь ведётся вся работа: от первого запроса до предложений, заказов, счетов, бухгалтерии, учёта инструментов и рабочего времени.</p>

            <h4>Основные действия</h4>
            <table>
                <tr><th>Действие</th><th>Как сделать</th></tr>
                <tr><td>Найти запись</td><td>Строка поиска вверху или фильтры в списке</td></tr>
                <tr><td>Создать запись</td><td><kbd>Erstellen</kbd> в правом верхнем углу списка</td></tr>
                <tr><td>Изменить запись</td><td>Открыть карточку → <kbd>Bearbeiten</kbd></td></tr>
                <tr><td>Удалить запись</td><td>Открыть карточку → меню <kbd>⋮</kbd> → <kbd>Löschen</kbd></td></tr>
                <tr><td>Связанные записи</td><td>Вкладки внизу в карточке записи</td></tr>
            </table>
            <div class="hb-tip">Большинство номеров (счета, заказы, предложения) генерируются <strong>автоматически</strong> — вводить вручную не нужно.</div>
            <div class="hb-warn">Зафиксированные записи (festgeschrieben) <strong>нельзя изменить</strong>. Это бухгалтерское требование.</div>

            <!-- СПРАВОЧНИКИ -->
            <h2 id="ru-stammdaten">2. Основные справочники (Stammdaten)</h2>
            <p>Справочники создаются один раз и используются везде. Перед созданием документа убедитесь, что нужный клиент, поставщик и материалы уже существуют в системе.</p>

            <h3 id="ru-account">2.1 Клиенты (Account)</h3>
            <div class="hb-warn">⚠️ Перед созданием нового клиента проверьте, нет ли его уже в системе — поиск по названию или PLZ.</div>
            <p>Основная карточка клиента. Все документы (предложения, заказы, счета) привязываются к клиенту.</p>
            <p><strong>Меню → Accounts</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Accounts</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Name</strong>, <strong>Straße / Hausnummer</strong>, <strong>PLZ</strong>, <strong>Ort</strong>, <strong>Land</strong></li>
                <li>Опционально: телефон, email</li>
                <li><kbd>Speichern</kbd> — номер клиента присвоится автоматически</li>
            </ul>
            <h4>Связанные данные в карточке клиента</h4>
            <p>В карточке клиента внизу отображаются блоки со связанными данными:</p>
            <table>
                <tr><th>Блок / вкладка</th><th>Что там видно</th></tr>
                <tr><td>Objekte</td><td>Объекты клиента — адреса, где проводятся работы</td></tr>
                <tr><td colspan="2" style="background:#f0f4ff;font-weight:600">Вкладка: Geschäftsdokumente</td></tr>
                <tr><td>Rechnungen</td><td>Все выставленные счета-фактуры</td></tr>
                <tr><td>Angebote</td><td>Все предложения, созданные для этого клиента</td></tr>
                <tr><td>Lieferscheine</td><td>Накладные и акты выполненных работ</td></tr>
                <tr><td>Formulare</td><td>Заполненные формы из мобильного приложения</td></tr>
                <tr><td colspan="2" style="background:#f0f4ff;font-weight:600">Вкладка: Melderprüflisten</td></tr>
                <tr><td>Melder Quartale</td><td>Квартальные отчёты технической инспекции</td></tr>
                <tr><td>Melder Gesamt-PDFs</td><td>Годовые сводные отчёты инспекции</td></tr>
                <tr><td>Contacts</td><td>Контактные лица клиента</td></tr>
            </table>

            <h3 id="ru-contact">2.2 Контактные лица (Contact)</h3>
            <p>Конкретный человек, представляющий клиента. У одного клиента может быть несколько контактов.</p>
            <p><strong>Меню → Contacts</strong></p>
            <ul class="hb-steps">
                <li>В карточке клиента: вкладка <strong>Contacts</strong> → <kbd>Erstellen</kbd><br>Или: Меню <strong>Contacts</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Vorname / Nachname</strong>, <strong>Account</strong>, <strong>Position</strong>, <strong>Telefon</strong>, <strong>E-Mail</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <h3 id="ru-lieferant">2.3 Поставщики (Lieferant)</h3>
            <div class="hb-warn">⚠️ Перед созданием нового поставщика проверьте, нет ли его уже в системе — поиск по названию или номеру налогоплательщика.</div>
            <p>Компании, у которых Klesec покупает товары или услуги. <em>Клиент платит нам — поставщику платим мы.</em></p>
            <p><strong>Меню → Lieferanten</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Lieferanten</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Name</strong>, адрес, контактные данные, <strong>USt-IdNr.</strong>, <strong>Steuernummer</strong></li>
                <li>Банковские реквизиты: <strong>IBAN</strong>, <strong>BIC</strong>, <strong>Bankname</strong></li>
                <li><kbd>Speichern</kbd> — номер поставщика присвоится автоматически</li>
            </ul>
            <div class="hb-tip">IBAN и BIC заполнять сразу при создании — они нужны для проведения платежей.</div>
            <h4>Связанные данные в карточке поставщика</h4>
            <table>
                <tr><th>Блок</th><th>Что там видно</th></tr>
                <tr><td>Eingangsrechnungen</td><td>Все входящие счета от этого поставщика</td></tr>
            </table>

            <h3 id="ru-material">2.4 Материалы (Material)</h3>
            <div class="hb-warn">⚠️ Перед добавлением нового материала обязательно поищите его в каталоге — по названию, артикулу или категории. Дубликаты приводят к излишнему переполнению БД.</div>
            <p>Каталог всех материалов, товаров и услуг. При создании позиций материал выбирается из каталога — цена и описание подтягиваются автоматически.</p>
            <p><strong>Меню → Materialien</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Materialien</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Name</strong>, <strong>Kategorie</strong>, <strong>Einheit</strong>, <strong>Preis</strong>, <strong>EK-Preis</strong>, <strong>MwSt-Satz</strong></li>
                <li>Опционально: данные склада (<strong>Raum / Regal / Segment / Ebene / Platz</strong>)</li>
                <li><kbd>Speichern</kbd> — штрих-код генерируется автоматически</li>
            </ul>

            <h3 id="ru-objekt">2.5 Объекты (Objekt)</h3>
            <p>Конкретный адрес, где проводятся работы. У одного клиента может быть несколько объектов.</p>
            <p><strong>Меню → Objekte</strong></p>
            <ul class="hb-steps">
                <li>В карточке клиента: вкладка <strong>Objekte</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Account</strong>, <strong>Straße / Hausnummer</strong>, <strong>PLZ</strong>, <strong>Ort</strong>, <strong>Bezeichnung Zusatz</strong></li>
                <li><kbd>Speichern</kbd> — номер объекта присвоится автоматически</li>
            </ul>

            <h2 id="ru-verkauf">3. Процесс продаж</h2>
            <p>Стандартная цепочка: <strong>Angebot → Auftrag → Lieferschein → Rechnung</strong>. Данные переносятся автоматически от шага к шагу.</p>

            <h3 id="ru-angebot">3.1 Предложение (Angebot)</h3>
            <p>Коммерческое предложение для клиента. После согласования из него создаётся заказ.</p>
            <p><strong>Меню → Angebote</strong></p>
            <table>
                <tr><th>Статус</th><th>Значение</th></tr>
                <tr><td>In Arbeit</td><td>В работе, не отправлено</td></tr>
                <tr><td>Abgerechnet</td><td>Выставлен счёт</td></tr>
                <tr><td>Geschlossen</td><td>Закрыто</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Меню <strong>Angebote</strong> → <kbd>Erstellen</kbd></li>
                <li>Выбрать <strong>Account</strong> (данные адреса подтянутся). Опционально: <strong>Kontakt</strong>, <strong>Objekt</strong>, <strong>Gültig bis</strong></li>
                <li>Поле <strong>Einleitung</strong>: написать собственный вводный текст или оставить стандартный</li>
                <li>Поле <strong>Abschlussbemerkung</strong>: выбрать подходящий шаблон из выпадающего списка или написать свой текст. <em>Не забудьте — поле должно быть заполнено до создания PDF.</em></li>
                <li><kbd>Speichern</kbd> — номер присвоится автоматически. Только после этого можно добавлять позиции.</li>
                <li>Проверить налоговые опции (отмечать только при необходимости):
                    <table style="margin-top:8px">
                        <tr><th>Галочка</th><th>Когда ставить</th><th>Что меняется</th></tr>
                        <tr><td>§ 13b UStG</td><td>Строительные работы для другой строительной компании</td><td>НДС переходит на покупателя — в предложении НДС не начисляется, клиент сам его декларирует</td></tr>
                        <tr><td>§ 12 Abs. 3 UStG</td><td>Предложение на фотовольтаическую установку</td><td>Ставка НДС 0% на PV-оборудование и сопутствующие компоненты</td></tr>
                    </table>
                    <div class="hb-tip" style="margin-top:8px">Если ни одна галочка не стоит — применяется стандартная ставка НДС 19%.</div>
                </li>
                <li>Вкладка <strong>Positionen</strong> → <kbd>Erstellen</kbd> — доступны три типа позиции:
                    <table style="margin-top:8px">
                        <tr><th>Тип позиции</th><th>Назначение</th></tr>
                        <tr><td>Normale Position</td><td>Обычная позиция с материалом и ценой</td></tr>
                        <tr><td>Abschnitt</td><td>Заголовок раздела без цены — структурирует предложение</td></tr>
                        <tr><td>Zwischensumme</td><td>Итог по позициям соответствующего раздела</td></tr>
                    </table>
                </li>
                <li>Для <strong>Normale Position</strong>: выбрать <strong>Material</strong> из каталога — цена и единица подтянутся. Проверить количество, скидку и НДС.</li>
                <li><strong>Правильно проставлять Pos-Nr.</strong> — нумерация определяет группировку в PDF:
                    <table style="margin-top:8px">
                        <tr><th>Элемент</th><th>Пример Pos-Nr.</th></tr>
                        <tr><td>Раздел 1 (Abschnitt)</td><td><strong>1</strong></td></tr>
                        <tr><td>Позиции раздела 1</td><td><strong>1.1 &nbsp; 1.2 &nbsp; 1.3</strong></td></tr>
                        <tr><td>Промежуточный итог раздела 1</td><td><strong>1Z</strong></td></tr>
                        <tr><td>Раздел 2 (Abschnitt)</td><td><strong>2</strong></td></tr>
                        <tr><td>Позиции раздела 2</td><td><strong>2.1 &nbsp; 2.2</strong></td></tr>
                        <tr><td>Промежуточный итог раздела 2</td><td><strong>2Z</strong></td></tr>
                    </table>
                    <div class="hb-warn" style="margin-top:8px">⚠️ Неправильная нумерация приводит к неверной группировке в PDF — всегда проверяйте перед созданием PDF.</div>
                </li>
                <li>Проверить итоговые суммы (нетто / брутто)</li>
                <li>Вывод PDF — три кнопки в карточке предложения:
                    <table style="margin-top:8px">
                        <tr><th>Кнопка</th><th>Что формируется</th><th>Сохраняется?</th></tr>
                        <tr><td><kbd>PDF-Vorschau</kbd></td><td>Предпросмотр в браузере — только для проверки, без цен по позициям</td><td>Нет</td></tr>
                        <tr><td><kbd>PDF erzeugen &amp; speichern</kbd></td><td>PDF <strong>без цен по позициям</strong> — только итоговая сумма на первой странице, на остальных — описание работ. Для отправки клиенту.</td><td>Да — ссылка появляется в поле <strong>PDF-Datei</strong></td></tr>
                        <tr><td><kbd>PDF erzeugen mit Preis</kbd></td><td>PDF <strong>с ценой по каждой позиции</strong> — классический формат с единичными и итоговыми ценами. Для внутреннего использования или по запросу клиента.</td><td>Да — ссылка появляется в поле <strong>PDF-Datei</strong></td></tr>
                    </table>
                    <div class="hb-tip" style="margin-top:8px">Сохранённый PDF можно в любой момент открыть или скачать из карточки предложения через поле <strong>PDF-Datei</strong>.</div>
                </li>
            </ul>
            <h4>Отправка предложения по электронной почте</h4>
            <p>В карточке предложения нажать <kbd>Angebot senden</kbd> — откроется стандартное почтовое окно EspoCRM с предзаполненными полями:</p>
            <table>
                <tr><th>Поле</th><th>Заполняется автоматически</th><th>Можно изменить?</th></tr>
                <tr><td>Кому (An)</td><td>Email-адрес привязанного клиента</td><td>Да — например, указать другой адрес</td></tr>
                <tr><td>Тема (Betreff)</td><td>«Angebot für [имя клиента]»</td><td>Да</td></tr>
                <tr><td>Сообщение</td><td>Стандартный текст со ссылкой на сохранённый PDF</td><td>Да — текст можно изменить</td></tr>
            </table>
            <div class="hb-warn" style="margin-top:8px">⚠️ Кнопка <kbd>Angebot senden</kbd> работает только если уже сохранён PDF (поле <strong>PDF-Datei</strong> заполнено) и у клиента указан email-адрес.</div>
            <div class="hb-tip">PDF передаётся как ссылка в тексте письма — не как вложение. Получатель открывает его прямо в браузере.</div>

            <div class="hb-tip">После согласования: в карточке предложения нажать <kbd>Auftrag erstellen</kbd>.</div>

            <h3 id="ru-auftrag">3.2 Заказ (Auftrag)</h3>
            <p>Подтверждённый заказ. Показывает общую сумму и уже выставленную сумму — разница = ещё не выставлено.</p>
            <p><strong>Меню → Aufträge</strong></p>
            <table>
                <tr><th>Статус</th><th>Значение</th></tr>
                <tr><td>Offen</td><td>Открыт</td></tr>
                <tr><td>In Bearbeitung</td><td>В работе</td></tr>
                <tr><td>Abgeschlossen</td><td>Завершён</td></tr>
                <tr><td>Storniert</td><td>Отменён</td></tr>
            </table>
            <ul class="hb-steps">
                <li>В карточке предложения нажать <kbd>Auftrag erstellen</kbd> — данные заполнятся</li>
                <li>Проверить: <strong>Leistungsdatum Von / Bis</strong>, позиции и суммы</li>
                <li><kbd>Speichern</kbd> — номер заказа присвоится автоматически</li>
            </ul>

            <h3 id="ru-lieferschein">3.3 Накладная (Lieferschein)</h3>
            <p>Документ, подтверждающий отгрузку материалов или выполнение работ.</p>
            <p><strong>Меню → Lieferscheine</strong></p>
            <ul class="hb-steps">
                <li>Открыть карточку заказа → вкладка <strong>Lieferscheine</strong> → <kbd>Erstellen</kbd></li>
                <li>Проверить: <strong>Account</strong>, <strong>Lieferadresse</strong>, <strong>Lieferdatum</strong></li>
                <li>Вкладка <strong>Positionen</strong> → добавить позиции или перенести из заказа, проверить количество</li>
                <li>Опционально: привязать инструменты во вкладке <strong>Werkzeuge</strong></li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd></li>
            </ul>

            <h3 id="ru-rechnung">3.4 Счёт-фактура (Rechnung)</h3>
            <p>Финансовый документ — требование оплаты. После фиксации изменить <strong>невозможно</strong>.</p>
            <p><strong>Меню → Rechnungen</strong></p>
            <table>
                <tr><th>Тип</th><th>Значение</th></tr>
                <tr><td>Einzelrechnung</td><td>Обычный счёт</td></tr>
                <tr><td>Teilrechnung</td><td>Частичный счёт</td></tr>
                <tr><td>Abschlagsrechnung</td><td>Авансовый счёт</td></tr>
                <tr><td>Schlussrechnung</td><td>Финальный счёт</td></tr>
                <tr><td>Gutschrift</td><td>Кредит-нота</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Открыть карточку заказа → вкладка <strong>Rechnungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Проверить: <strong>Account</strong>, <strong>Auftrag</strong>, <strong>Objekt</strong>, <strong>Rechnungstyp</strong>, <strong>Leistungsdatum Von/Bis</strong>, <strong>Fällig am</strong></li>
                <li>Вкладка <strong>Positionen</strong> → проверить или добавить позиции</li>
                <li>Проверить суммы (нетто / брутто / НДС)</li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd> → отправить клиенту</li>
                <li>После отправки передать бухгалтеру для фиксации (<kbd>Festschreiben</kbd>)</li>
            </ul>
            <div class="hb-warn">После Festschreibung счёт <strong>нельзя изменить</strong>. Исправления — только через новый счёт или Gutschrift.</div>

            <!-- ВХОДЯЩИЕ СЧЕТА -->
            <h2 id="ru-eingang">4. Входящие документы и поставщики</h2>

            <h3 id="ru-eingangsrechnung">4.1 Входящий документ (Eingangsbeleg)</h3>
            <p>Здесь регистрируются все входящие документы от поставщиков — не только счета, но также кредитные ноты, сторно, корректуры и другие типы.</p>
            <p><strong>Меню → Eingangsbelege</strong></p>
            <table>
                <tr><th>Статус</th><th>Значение</th></tr>
                <tr><td>Entwurf</td><td>В работе, ещё не проверен</td></tr>
                <tr><td>Freigabe</td><td>Проверен, готов к проведению</td></tr>
                <tr><td>Festgeschrieben</td><td>Бухгалтерские проводки созданы — документ заблокирован</td></tr>
            </table>
            <h4>Создание документа вручную</h4>
            <ul class="hb-steps">
                <li>Меню <strong>Eingangsbelege</strong> → <kbd>Erstellen Eingangsbeleg</kbd></li>
                <li>Заполнить поля:
                    <table style="margin-top:8px">
                        <tr><th>Поле</th><th>Назначение / Примечание</th></tr>
                        <tr><td><strong>Lieferant</strong></td><td>Обязательно — выбрать поставщика из списка</td></tr>
                        <tr><td><strong>Belegtyp</strong></td><td>Тип документа (см. ниже)</td></tr>
                        <tr><td><strong>Steuer Fall</strong></td><td>19%, 7% или 0% (без НДС)</td></tr>
                        <tr><td><strong>Lief.-Rechnung-Nr.</strong></td><td>Номер документа от поставщика</td></tr>
                        <tr><td><strong>Belegdatum</strong></td><td>Дата на документе поставщика</td></tr>
                        <tr><td><strong>Eingangsdatum</strong></td><td>Дата получения документа нами</td></tr>
                        <tr><td><strong>Fällig am</strong></td><td>Срок оплаты (для кредитных нот и сторно не обязательно)</td></tr>
                    </table>
                </li>
                <li><kbd>Speichern</kbd> — внутренний номер документа присвоится автоматически</li>
                <li>Добавить позиции: вкладка <strong>Eingangsrechnungspositionen</strong> → <kbd>Erstellen</kbd></li>
            </ul>
            <h4>Возможные типы документов</h4>
            <table>
                <tr><th>Тип (Belegtyp)</th><th>Когда использовать</th></tr>
                <tr><td>Eingangsrechnung</td><td>Стандартный счёт от поставщика</td></tr>
                <tr><td>Gutschrift</td><td>Поставщик возвращает нам сумму</td></tr>
                <tr><td>Stornorechnung</td><td>Поставщик сторнирует ранее выставленный счёт</td></tr>
                <tr><td>Schlussrechnung</td><td>Финальный счёт после частичных платежей</td></tr>
                <tr><td>Abschlagsrechnung</td><td>Частичный счёт / авансовый платёж</td></tr>
                <tr><td>Rechnungskorrektur</td><td>Корректировка ранее проведённого счёта</td></tr>
            </table>
            <h4>Проведение документа (Festschreiben)</h4>
            <p>После проверки документ проходит два шага:</p>
            <ul class="hb-steps">
                <li>Нажать <kbd>Freigabe</kbd> — статус изменится на <strong>Freigabe</strong></li>
                <li>Нажать <kbd>Festschreiben</kbd> — система проверит все обязательные поля и позиции, автоматически создаст <strong>запись в журнале проводок</strong> и сами <strong>бухгалтерские проводки</strong> (расходы, входящий НДС, кредиторская задолженность)</li>
            </ul>
            <div class="hb-warn">⚠️ После проведения документ блокируется и не может быть изменён. Ошибки исправляются только через корректурный документ или сторно.</div>
            <div class="hb-tip">PDF или скан оригинала документа можно прикрепить прямо в карточке через кнопку со скрепкой.</div>
            <p>Если на руках есть PDF или фото документа, быстрее всего занести его через <a href="#ru-import">OCR / AI Импорт</a> — система прочитает данные автоматически.</p>

            <h3 id="ru-import">4.2 OCR / AI Импорт</h3>
            <p>Инструмент для автоматического распознавания счетов поставщиков из PDF или JPEG с помощью ИИ.</p>
            <p><strong>Меню → Eingangsrechnung Import</strong></p>
            <table>
                <tr><th>Статус</th><th>Значение</th></tr>
                <tr><td>Neu</td><td>Только загружен</td></tr>
                <tr><td>In Verarbeitung</td><td>ИИ обрабатывает</td></tr>
                <tr><td>Zur Prüfung</td><td>Готов к проверке</td></tr>
                <tr><td>Übernommen</td><td>Перенесён в систему</td></tr>
                <tr><td>Fehler</td><td>Ошибка распознавания</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Нажать <kbd>+ Erstellen Import Eingangsbeleg</kbd></li>
                <li>Поле <strong>Name</strong> — наименование поставщика + дата, например: <code>Lieferant_GmbH_01_01_25</code></li>
                <li>Кнопка <kbd>📎</kbd> → выбрать файл (PDF или JPEG). Дождаться надписи <strong>«Bereit»</strong></li>
                <li><kbd>Speichern</kbd></li>
                <li>Справа появится изображение документа. Нажать <kbd>Dokument erkennen</kbd> — ИИ заполнит поля</li>
                <li>Проверить: <strong>Lieferant</strong>, суммы нетто/брутто/НДС, дату, срок оплаты, позиции</li>
                <li>Нажать зелёную кнопку: <kbd>Eingangsrechnung erstellen</kbd> / <kbd>Gutschrift erstellen</kbd> / <kbd>Korrektur erstellen</kbd></li>
                <li>Открыть созданную запись и проверить ещё раз</li>
            </ul>
            <div class="hb-tip">Если что-то распознано неверно — исправить поля до нажатия кнопки создания.</div>

            <!-- ПЛАТЕЖИ И БАНК -->
            <h2 id="ru-werkzeuge">5. Инструменты и оборудование</h2>

            <h3 id="ru-werkzeug">5.1 Инструменты (Werkzeug)</h3>
            <p>Учёт всех инструментов, машин и оборудования. Каждый инструмент имеет инвентарный номер и историю выдачи.</p>
            <p><strong>Меню → Werkzeuge</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Werkzeuge</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Name</strong>, <strong>Kategorie</strong>, <strong>Seriennummer</strong>, <strong>Zustand</strong>, <strong>Letzte Prüfung</strong>, <strong>Nächste Prüfung</strong>, <strong>Standort</strong></li>
                <li>Опционально: документы (<kbd>📎</kbd>)</li>
                <li><kbd>Speichern</kbd> — инвентарный номер и штрих-код генерируются автоматически</li>
            </ul>

            <h3 id="ru-ausgabe">5.2 Выдача инструментов (Werkzeugausgabe)</h3>
            <ul class="hb-steps">
                <li>Открыть карточку инструмента → вкладка <strong>Werkzeugausgaben</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Ausgegeben am</strong>, статус <strong>Ausgegeben</strong> → <kbd>Speichern</kbd></li>
            </ul>
            <p><strong>Возврат:</strong> Открыть запись о выдаче → <kbd>Bearbeiten</kbd> → заполнить <strong>Zurückgegeben am</strong> → статус <strong>Zurückgegeben</strong> → <kbd>Speichern</kbd></p>

            <h3 id="ru-wartung">5.3 Техническое обслуживание (Wartung)</h3>
            <p>Планирование регулярного обслуживания систем у клиентов (BMA, EMA, Video, Zutritt). При наступлении срока — автоматическое создание задачи и уведомление.</p>
            <p><strong>Меню → Wartungen</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Wartungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Account</strong>, <strong>Objekt</strong>, <strong>AnlageTyp</strong>, <strong>Intervall</strong>, <strong>Startdatum</strong>, <strong>Vorwarn-Tage</strong>, <strong>Assigned User</strong></li>
                <li>Включить: <strong>Auto Aufgabe erstellen</strong>, <strong>Auto Benachrichtigen</strong></li>
                <li><kbd>Speichern</kbd> — следующая дата обслуживания рассчитается автоматически</li>
            </ul>
            <div class="hb-tip">Фильтр <strong>Fälligkeitsstatus = Fällig</strong> в списке покажет все объекты, которые нужно обслужить сейчас.</div>

            <!-- РАБОЧЕЕ ВРЕМЯ -->
            <h2 id="ru-mahnwesen">6. Напоминания об оплате (Mahnwesen)</h2>

            <h3 id="ru-mahnung">6.1 Напоминания (Mahnung)</h3>
            <p>Система автоматически создаёт напоминания для просроченных счетов. Бухгалтер проверяет и отправляет.</p>
            <p><strong>Меню → Mahnungen</strong></p>
            <table>
                <tr><th>Уровень</th><th>Значение</th></tr>
                <tr><td>Zahlungserinnerung</td><td>Первое вежливое напоминание</td></tr>
                <tr><td>Mahnung 1</td><td>Первое официальное</td></tr>
                <tr><td>Mahnung 2</td><td>Второе напоминание</td></tr>
                <tr><td>Mahnung 3</td><td>Последнее предупреждение</td></tr>
                <tr><td>Inkasso</td><td>Передача в коллекторское агентство</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Меню <strong>Mahnungen</strong> → фильтр <strong>Status = Zu prüfen</strong></li>
                <li>Проверить каждое напоминание: клиент, сумма, дни просрочки, уровень</li>
                <li><kbd>Bearbeiten</kbd> → статус <strong>Erstellt</strong> → <kbd>Speichern</kbd></li>
                <li><kbd>PDF erstellen</kbd> → отправить клиенту → статус <strong>Gesendet</strong></li>
            </ul>

            <!-- ИНСТРУМЕНТЫ -->
            <h2 id="ru-arbeitszeit">7. Учёт рабочего времени</h2>

            <h3 id="ru-az">7.1 Рабочее время (Arbeitszeit)</h3>
            <p>Данные приходят автоматически из мобильного приложения. Техник отмечается в приложении — данные синхронизируются с системой.</p>
            <p><strong>Меню → Arbeitszeiten</strong></p>
            <p>Отображается: дата, начало/конец, продолжительность, чистое время, переработки, GPS-координаты. Сводки по месяцам и годам — в соответствующих вкладках.</p>

            <h3 id="ru-stundenbericht">7.2 Отчёты по часам (Stundenbericht)</h3>
            <p>Сводный отчёт о выполненных работах — заполняется техником в приложении. Содержит объект, материалы, Notdienst, суммы.</p>
            <p><strong>Меню → Stundenberichte</strong></p>
            <ul class="hb-steps">
                <li>Фильтр <strong>Status = PDF erzeugt</strong> — отчёты, ожидающие проверки</li>
                <li>Проверить: объект, клиент, материалы и количество</li>
                <li><kbd>PDF erstellen</kbd> → отправить клиенту → статус <strong>Gesendet</strong></li>
                <li>По завершении: статус <strong>Archiviert</strong></li>
            </ul>

            <h3 id="ru-abwesenheit">7.3 Отсутствие (Abwesenheit)</h3>
            <p>Учёт отсутствий — отпуск, больничный, отгул. Отображается в общем календаре.</p>
            <p><strong>Меню → Abwesenheiten</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Abwesenheiten</strong> → <kbd>Erstellen</kbd> (или из Календаря)</li>
                <li>Заполнить: <strong>Assigned User</strong>, <strong>Typ</strong> (U=Urlaub, K=Krank, Freizeitausgleich), <strong>Datum Start / Ende</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <!-- ОТЧЁТЫ И ПИСЬМА -->
            <h2 id="ru-berichte">8. Технические отчёты и переписка</h2>

            <h3 id="ru-melder">8.1 Квартальные проверки (Melder Quartal)</h3>
            <p>Квартальные отчёты технического осмотра систем. Заполняются техником в приложении, автоматически появляются в системе.</p>
            <p><strong>Меню → Melder Quartale</strong></p>
            <p>В карточке объекта или клиента: вкладка <strong>Melder Gesamt PDFs</strong> — сводный PDF за год.</p>

            <h3 id="ru-briefe">8.2 Переписка (Briefe)</h3>
            <p>Исходящие письма, привязанные к клиентам, заказам или счетам.</p>
            <p><strong>Меню → Briefe</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Briefe</strong> → <kbd>Erstellen</kbd> (или из карточки клиента/заказа)</li>
                <li>Заполнить: <strong>Betreff</strong>, <strong>Datum</strong>, <strong>Account</strong>, <strong>Kontakt</strong>, связи с Angebot/Auftrag/Rechnung, текст письма</li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd> → отправить → статус <strong>Final</strong></li>
            </ul>

            <h2 id="ru-bank">9. Платежи и банк</h2>
            <h3 id="ru-bankkonto">9.1 Банковские счета (Bankkonto)</h3>
            <p>Банковские счета компании Klesec. Настраиваются один раз бухгалтером.</p>
            <p><strong>Меню → Bankkonten</strong></p>

            <!-- ПРОЦЕСС ПРОДАЖ -->

            <h3 id="ru-zahlung">9.2 Платежи (Zahlung)</h3>
            <p>Запись о платеже — входящем (клиент заплатил нам) или исходящем (мы заплатили поставщику).</p>
            <p><strong>Меню → Zahlungen</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Zahlungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Zahlungsrichtung</strong> (Eingang/Ausgang), <strong>Zahlungsdatum</strong>, <strong>Betrag</strong>, <strong>Zahlungsart</strong>, <strong>Account</strong> или <strong>Lieferant</strong></li>
                <li><kbd>Speichern</kbd> — номер платежа присвоится автоматически</li>
                <li>Привязать к счёту: вкладка <strong>Ausgleiche</strong> → <kbd>Erstellen</kbd> → выбрать счёт и сумму</li>
            </ul>

            <h3 id="ru-bankbewegung">9.3 Банковские движения (Bankbewegung)</h3>
            <p>Каждое банковское движение — это одна строка банковской выписки, то есть одна реальная транзакция на счёте фирмы. Движения импортируются из банка и служат основой для сопоставления платежей с счетами, поставщиками и клиентами.</p>

            <h4 style="margin-top:18px;color:#2c3e6a;">Как движения попадают в систему?</h4>
            <p>Есть четыре источника:</p>
            <ul>
                <li><strong>CSV-импорт</strong> — выписку скачать из онлайн-банка в формате CSV и загрузить через <strong>Bankbewegungen → Importieren</strong>. Выбрать счёт и запустить импорт.</li>
                <li><strong>CAMT-импорт</strong> — структурированный банковский формат (ISO 20022), также через загрузку файла.</li>
                <li><strong>API</strong> — автоматический запрос из банковской системы (при наличии интеграции).</li>
                <li><strong>Вручную</strong> — ввести отдельное движение вручную (например, кассовая операция или корректировка).</li>
            </ul>
            <div class="hb-tip">Система автоматически определяет дубликаты через Import-Hash — одну и ту же транзакцию нельзя импортировать дважды.</div>

            <h4 style="margin-top:18px;color:#2c3e6a;">Что происходит при импорте автоматически?</h4>
            <ul>
                <li><strong>Направление</strong> (Eingang / Ausgang) определяется по знаку суммы — отрицательная сумма становится Ausgang, сама сумма сохраняется как положительное число.</li>
                <li><strong>Название</strong> формируется автоматически: Дата · Направление · Сумма · Контрагент (например, «2025-03-15 · Eingang · 1.250,00 EUR · Müller GmbH»).</li>
                <li><strong>Importiert am</strong> проставляется текущим временем.</li>
                <li>При добавлении счёта, входящего документа, платежа, клиента или поставщика — статус автоматически меняется на <strong>Manuell zugeordnet</strong>.</li>
            </ul>

            <h4 style="margin-top:18px;color:#2c3e6a;">Два поля статуса — как понимать</h4>
            <p>У каждого движения два параллельных статуса:</p>
            <table class="hb-table">
                <thead><tr><th>Status</th><th>Значение</th></tr></thead>
                <tbody>
                    <tr><td><strong>Importiert</strong></td><td>Только что импортировано, ещё не обработано</td></tr>
                    <tr><td><strong>Automatisch erkannt</strong></td><td>Система нашла возможное совпадение (нашла номер документа в назначении платежа)</td></tr>
                    <tr><td><strong>Manuell zugeordnet</strong></td><td>Бухгалтер вручную привязал счёт, входящий документ или платёж</td></tr>
                    <tr><td><strong>Unklar</strong></td><td>Транзакция неизвестна — требует ручной проверки</td></tr>
                    <tr><td><strong>Ignoriert</strong></td><td>Действий не требуется (например, внутренний перевод, комиссия)</td></tr>
                </tbody>
            </table>
            <table class="hb-table" style="margin-top:10px;">
                <thead><tr><th>Abstimmungsstatus</th><th>Значение</th></tr></thead>
                <tbody>
                    <tr><td><strong>Offen</strong></td><td>Ещё не сопоставлено</td></tr>
                    <tr><td><strong>Vorschlag vorhanden</strong></td><td>Система предложила вариант — ещё не подтверждено</td></tr>
                    <tr><td><strong>Zugeordnet</strong></td><td>Полностью привязано к документу или платежу</td></tr>
                    <tr><td><strong>Teilweise zugeordnet</strong></td><td>Часть суммы сопоставлена, остаток открыт</td></tr>
                    <tr><td><strong>Gebucht</strong></td><td>Полностью обработано и отражено в журнале проводок</td></tr>
                    <tr><td><strong>Nicht relevant</strong></td><td>Движение не учитывается в бухгалтерии</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Типовой рабочий процесс</h4>
            <ol>
                <li>Импортировать выписку: <strong>Bankbewegungen → Importieren</strong> → загрузить файл (CSV или CAMT) → выбрать счёт → запустить импорт.</li>
                <li>Открыть список движений. В первую очередь обработать движения с Abstimmungsstatus <strong>Vorschlag vorhanden</strong> — система уже нашла подходящий счёт или платёж.</li>
                <li>Открыть движение → проверить предложение (читать: erkannte Belegnummer, erkannte Gegenpartei, Zuordnungshinweis) → при совпадении подтвердить.</li>
                <li>Движения со статусом <strong>Unklar</strong> обработать вручную: открыть → <kbd>Bearbeiten</kbd> → привязать нужный счёт, входящий документ, платёж, клиента или поставщика → сохранить.</li>
                <li>Для движений без документа (банковская комиссия, внутренний перевод и т.п.) — установить статус <strong>Ignoriert</strong> или Abstimmungsstatus <strong>Nicht relevant</strong>.</li>
                <li>Если платёж ещё не создан: нажать кнопку <kbd>Zahlung vorbereiten</kbd> — система проверит движение и автоматически создаст новый платёж в статусе Entwurf, привязанный к этому движению.</li>
            </ol>

            <h4 style="margin-top:18px;color:#2c3e6a;">Важные поля банковского движения</h4>
            <table class="hb-table">
                <thead><tr><th>Поле</th><th>Откуда / Значение</th></tr></thead>
                <tbody>
                    <tr><td><strong>Buchungstag</strong></td><td>Дата проводки по счёту (из выписки)</td></tr>
                    <tr><td><strong>Wertstellungsdatum</strong></td><td>Дата фактической валютировки (может отличаться)</td></tr>
                    <tr><td><strong>Betrag / Richtung</strong></td><td>Сумма транзакции (всегда положительная) + Eingang (приход) или Ausgang (расход)</td></tr>
                    <tr><td><strong>Gegenpartei</strong></td><td>Имя отправителя или получателя (из выписки)</td></tr>
                    <tr><td><strong>Gegenpartei IBAN</strong></td><td>IBAN контрагента — помогает автоматически сопоставить с поставщиком или клиентом</td></tr>
                    <tr><td><strong>Verwendungszweck</strong></td><td>Свободный текст из платёжного поручения — часто содержит номер счёта</td></tr>
                    <tr><td><strong>Erkannte Belegnummer</strong></td><td>Номер счёта или документа, автоматически извлечённый системой из назначения платежа</td></tr>
                    <tr><td><strong>Zuordnungshinweis</strong></td><td>Объяснение, почему система предложила именно этот вариант сопоставления</td></tr>
                    <tr><td><strong>Bankkonto</strong></td><td>Счёт фирмы, на котором зафиксировано движение</td></tr>
                    <tr><td><strong>Zahlung / Rechnung / Eingangsrechnung</strong></td><td>Привязанные документы после сопоставления</td></tr>
                </tbody>
            </table>

            <h3 id="ru-ausgleich">9.4 Зачёт требований (Ausgleich)</h3>
            <p>Ausgleich — это связующее звено между <strong>Платежом (Zahlung)</strong> и <strong>Счётом-фактурой (Rechnung)</strong> или <strong>Входящим документом (Eingangsrechnung)</strong>. Он фиксирует, какой суммой платежа и против какого документа был произведён зачёт — и автоматически обновляет статус оплаты документа.</p>

            <h4 style="margin-top:18px;color:#2c3e6a;">Когда создаётся Ausgleich?</h4>
            <ul>
                <li><strong>Клиент оплатил наш счёт</strong> — поступил платёж, счёт нужно закрыть как оплаченный.</li>
                <li><strong>Мы оплатили счёт поставщика</strong> — платёж ушёл, входящий документ нужно закрыть как оплаченный.</li>
                <li><strong>Частичная оплата</strong> — клиент или поставщик оплачивает только часть суммы. Ausgleich фиксирует частичный зачёт, счёт остаётся открытым с остатком.</li>
                <li><strong>Один платёж покрывает несколько счетов</strong> — для каждого счёта создаётся отдельный Ausgleich с соответствующей суммой.</li>
                <li><strong>Несколько платежей по одному счёту</strong> — каждый платёж получает свой Ausgleich; остаток по счёту уменьшается после каждого зачёта.</li>
            </ul>

            <h4 style="margin-top:18px;color:#2c3e6a;">Как создать Ausgleich?</h4>
            <ol>
                <li>Открыть платёж (<strong>Zahlungen &amp; Bank → Zahlungen</strong>) и перейти в нужный платёж.</li>
                <li>Вкладка <strong>Ausgleiche</strong> → кнопка <kbd>Erstellen</kbd>.</li>
                <li>В форме выбрать <strong>Rechnung</strong> (исходящий счёт) или <strong>Eingangsrechnung</strong> (входящий документ).</li>
                <li>Система <strong>автоматически заполнит</strong>:
                    <ul>
                        <li><em>Дата</em> — берётся из даты платежа</li>
                        <li><em>Сумма</em> — минимум из суммы платежа и открытого остатка по документу</li>
                        <li><em>Тип зачёта</em> — <strong>Vollausgleich</strong> (полный зачёт), если сумма покрывает остаток полностью; иначе <strong>Teilausgleich</strong> (частичный)</li>
                        <li><em>Направление</em> — при исходящем счёте автоматически «Forderungsausgleich»; при входящем — «Verbindlichkeitsausgleich»</li>
                        <li><em>Остаток после зачёта</em> — оставшийся открытый долг по документу</li>
                    </ul>
                </li>
                <li>При необходимости скорректировать сумму вручную (например, при договорённости о частичной оплате).</li>
                <li>Сохранить — статус оплаты документа обновится немедленно.</li>
            </ol>

            <h4 style="margin-top:18px;color:#2c3e6a;">Поля Ausgleich</h4>
            <table class="hb-table">
                <thead><tr><th>Поле</th><th>Значение</th></tr></thead>
                <tbody>
                    <tr><td><strong>Ausgleich-Nr.</strong></td><td>Автоматически присваиваемый номер</td></tr>
                    <tr><td><strong>Ausgl.-Datum</strong></td><td>Дата зачёта — обычно совпадает с датой платежа</td></tr>
                    <tr><td><strong>Ausgl.-Betrag</strong></td><td>Сумма, засчитываемая этим платежом против документа</td></tr>
                    <tr><td><strong>Ausgleich-Typ</strong></td><td><em>Vollausgleich</em> — документ полностью закрыт; <em>Teilausgleich</em> — остаток остаётся открытым</td></tr>
                    <tr><td><strong>Ausgl.-Richtung</strong></td><td><em>Forderungsausgleich</em> — счёт клиента; <em>Verbindlichkeitsausgleich</em> — счёт поставщика</td></tr>
                    <tr><td><strong>Restbetrag nach Ausgleich</strong></td><td>Открытый остаток по документу после этого зачёта</td></tr>
                    <tr><td><strong>Zahlung</strong></td><td>Связанный платёж</td></tr>
                    <tr><td><strong>Rechnung</strong></td><td>Связанный исходящий счёт (клиентский документ)</td></tr>
                    <tr><td><strong>Eingangsrechnung</strong></td><td>Связанный входящий документ (счёт поставщика)</td></tr>
                    <tr><td><strong>Status</strong></td><td><em>Aktiv</em> — действует; <em>Storniert</em> — аннулирован</td></tr>
                    <tr><td><strong>Bemerkung</strong></td><td>Свободный текст для внутренних примечаний</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Аннулирование Ausgleich</h4>
            <p>Если зачёт создан ошибочно (например, выбран неверный документ), его можно аннулировать — но только если связанный платёж <strong>ещё не зафиксирован (nicht festgeschrieben)</strong>. После фиксации платежа ни редактирование, ни удаление Ausgleich невозможны. В таком случае сначала нужно сторнировать платёж.</p>
            <div class="hb-tip"><strong>Важно:</strong> Аннулированный Ausgleich получает статус «Storniert» и больше не учитывается при расчёте статуса оплаты документа.</div>

            <!-- БУХГАЛТЕРИЯ -->
            <h2 id="ru-buchhaltung">10. Бухгалтерия</h2>

            <h3 id="ru-cockpit">10.0 Финансовая панель (Finanz-Cockpit)</h3>
            <p>Центральный дашборд со всеми ключевыми показателями, графиками и индикаторами проверки — для руководства и бухгалтерии одним взглядом.</p>
            <p><strong>Главная страница (Dashboard) → Dashlet «Buchhaltung Cockpit»</strong></p>
            <div class="hb-tip">Cockpit только читает данные проводок — ничего в системе не изменяет.</div>

            <h4 style="margin-top:16px;color:#2c3e6a;">Фильтр периода</h4>
            <p>Вверху слева три режима: <strong>Месяц</strong>, <strong>Квартал</strong> или <strong>Год</strong>, с выбором года. Весь дашборд обновляется сразу при переключении.</p>

            <h4 style="margin-top:16px;color:#2c3e6a;">Вкладка: Geschäftsführung (Руководство)</h4>
            <p>Для ежедневного обзора руководителя.</p>
            <table class="hb-table">
                <thead><tr><th>Блок</th><th>Содержание</th></tr></thead>
                <tbody>
                    <tr><td><strong>8 KPI-карточек</strong></td><td>Оборот нетто · Расходы нетто · Базовый результат · Движение по банку · Открытые требования · Открытые обязательства · Налоговое сальдо · Движение ликвидности</td></tr>
                    <tr><td><strong>Ликвидность (картина)</strong></td><td>Ожидаемая ликвидность — сальдо из требований, обязательств и банковских движений</td></tr>
                    <tr><td><strong>График: Экономический результат</strong></td><td>Оборот vs. расходы vs. результат по периодам — столбчатая диаграмма</td></tr>
                    <tr><td><strong>График: Движение ликвидности</strong></td><td>Чистый денежный поток по периодам — линейная диаграмма</td></tr>
                    <tr><td><strong>Открытые позиции</strong></td><td>Дебиторская задолженность, кредиторская задолженность и ожидаемая ликвидность в одной таблице</td></tr>
                    <tr><td><strong>Налоговое сальдо</strong></td><td>НДС начисленный минус входящий НДС — показывает налоговую нагрузку или право на возврат</td></tr>
                    <tr><td><strong>Прогноз на ближайшие недели</strong></td><td>Предстоящие платежи и счета — планирование ликвидности</td></tr>
                    <tr><td><strong>Критические требования</strong></td><td>Топ открытых дебиторов по сумме</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Вкладка: Buchhaltung (Бухгалтерия)</h4>
            <p>Для бухгалтера — индикаторы проверки и статус сверки.</p>
            <table class="hb-table">
                <thead><tr><th>Блок</th><th>Содержание</th></tr></thead>
                <tbody>
                    <tr><td><strong>Контрольное сальдо Дебет/Кредит</strong></td><td>Разница между суммой дебета и кредита всех проводок — должна быть 0,00 €</td></tr>
                    <tr><td><strong>Сверка ОП — требования</strong></td><td>Сравнение сальдо журнала (сч. 1200) с остатками в CRechnung</td></tr>
                    <tr><td><strong>Сверка ОП — обязательства</strong></td><td>Сравнение сальдо журнала (сч. 3300) с остатками в CEingangsrechnung</td></tr>
                    <tr><td><strong>Количество проводок</strong></td><td>Общее число строк проводок за выбранный период</td></tr>
                    <tr><td><strong>Налоговая проверка (компакт)</strong></td><td>НДС и входящий НДС по ставкам — быстрая проверка перед авансовой декларацией</td></tr>
                    <tr><td><strong>Сверка открытых позиций (компакт)</strong></td><td>Краткий обзор расхождений между журналом и оперативными данными</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Список задач (Arbeitsliste)</h4>
            <p>Под обеими вкладками автоматически появляется цветной <strong>список задач</strong>: все открытые пункты, требующие внимания — неразмеченные банковские движения, незакрытые документы, расхождения ОП или критические дебиторы. Каждый пункт содержит прямую ссылку на соответствующий отчёт.</p>

            <h3 id="ru-buchungsjournal">10.1 Журнал проводок (Buchungsjournal)</h3>
            <p><strong>Меню → Buchungsjournale</strong></p>
            <div class="hb-tip">Журналы создаются полностью автоматически — обычным сотрудникам здесь ничего делать не нужно. Раздел предназначен для бухгалтера — контроль и проверка проводок.</div>

            <h4 style="margin-top:16px;color:#2c3e6a;">Что такое журнал проводок?</h4>
            <p>Журнал проводок — это бухгалтерское подтверждение хозяйственной операции. Каждый журнал содержит одну или несколько <strong>строк проводки (CBuchung)</strong> — конкретные записи Дебет/Кредит по счетам.</p>
            <p>Система создаёт новый журнал автоматически при <strong>фиксации (Festschreiben)</strong> документа. Фиксация — это момент, когда документ становится бухгалтерски значимым и больше не может быть изменён.</p>

            <h4 style="margin-top:16px;color:#2c3e6a;">Когда создаётся журнал?</h4>
            <table class="hb-table">
                <thead><tr><th>Событие</th><th>Номер журнала (префикс)</th><th>Что происходит</th></tr></thead>
                <tbody>
                    <tr><td><strong>Фиксация исходящего счёта</strong></td><td><code>JRN-ГГГГММДД-…</code></td><td>3 строки: Требование (Дебет), Выручка (Кредит), НДС (Кредит)</td></tr>
                    <tr><td><strong>Фиксация входящего документа</strong></td><td><code>EJR-ГГГГММДД-…</code></td><td>3 строки: Расходы (Дебет), Входящий НДС (Дебет), Обязательство (Кредит)</td></tr>
                    <tr><td><strong>Входящий документ как Gegenbuchung</strong></td><td><code>EGS-ГГГГММДД-…</code></td><td>Обратная проводка с зеркальным эффектом</td></tr>
                    <tr><td><strong>Фиксация платежа</strong></td><td><code>ZLG-JRN-ГГГГММДД-…</code></td><td>Строки для входящего или исходящего платежа</td></tr>
                    <tr><td><strong>Аннулирование исходящего счёта</strong></td><td><code>STR-JRN-ГГГГММДД-…</code></td><td>Зеркальные проводки к оригинальному счёту</td></tr>
                    <tr><td><strong>Аннулирование входящего документа</strong></td><td><code>ESTR-JRN-ГГГГММДД-…</code></td><td>Зеркальные проводки к оригинальному документу</td></tr>
                    <tr><td><strong>Аннулирование платежа</strong></td><td><code>STZLG-JRN-ГГГГММДД-…</code></td><td>Зеркальные проводки к оригинальному платежу</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Строки проводки по типу документа</h4>
            <table class="hb-table">
                <thead><tr><th>Тип документа</th><th>Строка проводки</th><th>Д / К</th><th>Сумма</th></tr></thead>
                <tbody>
                    <tr><td rowspan="3"><strong>Исходящий счёт</strong></td><td>Требование по счёту</td><td>Дебет</td><td>Брутто</td></tr>
                    <tr><td>Выручка по счёту</td><td>Кредит</td><td>Нетто</td></tr>
                    <tr><td>НДС (Umsatzsteuer)</td><td>Кредит</td><td>Сумма НДС</td></tr>
                    <tr><td rowspan="3"><strong>Входящий счёт</strong></td><td>Расходы (Aufwand)</td><td>Дебет</td><td>Нетто</td></tr>
                    <tr><td>Входящий НДС (Vorsteuer)</td><td>Дебет</td><td>Сумма ВСт</td></tr>
                    <tr><td>Обязательство (Verbindlichkeit)</td><td>Кредит</td><td>Брутто</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:16px;color:#2c3e6a;">Поля журнала</h4>
            <table class="hb-table">
                <thead><tr><th>Поле</th><th>Значение</th></tr></thead>
                <tbody>
                    <tr><td><strong>Journal Nummer</strong></td><td>Автоматически присвоенный уникальный номер (префикс + дата + суффикс ID)</td></tr>
                    <tr><td><strong>Belegdatum</strong></td><td>Дата документа-источника (дата счёта, дата документа)</td></tr>
                    <tr><td><strong>Buchungstext</strong></td><td>Краткое описание, например «Festschreibung Eingangsrechnung EJR-…»</td></tr>
                    <tr><td><strong>Quelle Typ</strong></td><td>Откуда создан журнал: исходящий счёт / входящий счёт / платёж</td></tr>
                    <tr><td><strong>Quelle Nummer</strong></td><td>Номер документа-источника (например, номер счёта)</td></tr>
                    <tr><td><strong>Status</strong></td><td>Всегда <em>Festgeschrieben</em> — журналы редактировать нельзя</td></tr>
                    <tr><td><strong>Ist Storno</strong></td><td>Признак сторно-журнала — создаётся при аннулировании документа</td></tr>
                    <tr><td><strong>Buchungen</strong></td><td>Вкладка со всеми строками проводки (Дебет/Кредит, счёт, сумма)</td></tr>
                </tbody>
            </table>

            <h3 id="ru-auswertung">10.2 Отчёты бухгалтерии (Buchhaltung Auswertung)</h3>
            <p><strong>Меню → Buchhaltung Auswertungen</strong></p>
            <p>Преднастроенные отчёты — открыть нужный, задать период (Von/Bis) и нажать <kbd>Aktualisieren</kbd>.</p>

            <h4 style="margin-top:18px;color:#2c3e6a;">Исходящие счета</h4>
            <table class="hb-table">
                <thead><tr><th>Отчёт</th><th>Что показывает</th></tr></thead>
                <tbody>
                    <tr><td><strong>Festgeschriebene Rechnungen</strong></td><td>Все зафиксированные исходящие счета за период — количество, нетто, налог, брутто</td></tr>
                    <tr><td><strong>Umsatzübersicht</strong></td><td>Динамика оборота по периодам — сводная картина выручки</td></tr>
                    <tr><td><strong>Umsatzsteuer-Übersicht</strong></td><td>НДС с исходящих счетов — основа для предварительной декларации по НДС</td></tr>
                    <tr><td><strong>Offene Forderungen</strong></td><td>Неоплаченные исходящие счета с остатком — кто ещё должен нам деньги</td></tr>
                    <tr><td><strong>Kontenbewegungen</strong></td><td>Все проводки из зафиксированных исходящих счетов (дебитор, выручка, НДС)</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Входящие счета</h4>
            <table class="hb-table">
                <thead><tr><th>Отчёт</th><th>Что показывает</th></tr></thead>
                <tbody>
                    <tr><td><strong>Festgeschriebene Eingangsrechnungen</strong></td><td>Все зафиксированные входящие документы — количество, нетто, налог, брутто</td></tr>
                    <tr><td><strong>Verbindlichkeiten</strong></td><td>Неоплаченные входящие счета — сколько мы ещё должны поставщикам</td></tr>
                    <tr><td><strong>Aufwand</strong></td><td>Проводки расходов из входящих счетов (счёт 6300) — общие затраты за период</td></tr>
                    <tr><td><strong>Vorsteuer</strong></td><td>Входящий НДС из входящих счетов — основа для вычета предварительного налога</td></tr>
                    <tr><td><strong>Kontenbewegungen Eingang</strong></td><td>Все проводки из зафиксированных входящих счетов</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Платежи и зачёты</h4>
            <table class="hb-table">
                <thead><tr><th>Отчёт</th><th>Что показывает</th></tr></thead>
                <tbody>
                    <tr><td><strong>Festgeschriebene Zahlungen</strong></td><td>Все проведённые платежи за период</td></tr>
                    <tr><td><strong>Zahlungseingänge</strong></td><td>Только входящие платежи (от клиентов)</td></tr>
                    <tr><td><strong>Zahlungsausgänge</strong></td><td>Только исходящие платежи (поставщикам)</td></tr>
                    <tr><td><strong>Zahlungsübersicht</strong></td><td>Все платежи вместе — приход и расход в сравнении</td></tr>
                    <tr><td><strong>Kontenbewegungen Zahlung</strong></td><td>Проводки из зафиксированных платежей</td></tr>
                    <tr><td><strong>Ausgleichsübersicht</strong></td><td>Все зачёты — полные и частичные, итоговая сумма</td></tr>
                    <tr><td><strong>Teilweise ausgeglichene Belege</strong></td><td>Счета, оплаченные лишь частично</td></tr>
                    <tr><td><strong>Voll ausgeglichene Belege</strong></td><td>Документы с остатком = 0 — полностью закрытые</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Банковские движения</h4>
            <table class="hb-table">
                <thead><tr><th>Отчёт</th><th>Что показывает</th></tr></thead>
                <tbody>
                    <tr><td><strong>Bankbewegungen Übersicht</strong></td><td>Все движения по счёту из выписки — основа для банковской сверки</td></tr>
                    <tr><td><strong>Unklare Bankbewegungen</strong></td><td>Движения без разметки — рабочий список для бухгалтерии</td></tr>
                    <tr><td><strong>Bankbewegungen ohne Zahlung</strong></td><td>Движения без связанного платежа — возможно пропущены проводки</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Сторно</h4>
            <table class="hb-table">
                <thead><tr><th>Отчёт</th><th>Что показывает</th></tr></thead>
                <tbody>
                    <tr><td><strong>Stornierte Rechnungen</strong></td><td>Все аннулированные исходящие счета</td></tr>
                    <tr><td><strong>Stornierte Eingangsrechnungen</strong></td><td>Все аннулированные входящие документы</td></tr>
                    <tr><td><strong>Stornierte Zahlungen</strong></td><td>Все аннулированные платежи</td></tr>
                    <tr><td><strong>Stornierte Ausgleiche</strong></td><td>Все аннулированные зачёты</td></tr>
                    <tr><td><strong>Stornierte Kontenbewegungen</strong></td><td>Все сторно-проводки в системе</td></tr>
                    <tr><td><strong>Stornierte Journale</strong></td><td>Все аннулированные журналы проводок</td></tr>
                    <tr><td><strong>Storno-Übersicht</strong></td><td>Сводка всех аннулирований по всем типам документов</td></tr>
                    <tr><td><strong>Stornierte Belege Kontrolle</strong></td><td>Контроль: к каждому аннулированному документу должен быть Nachfolgebeleg</td></tr>
                    <tr><td><strong>Korrekturketten Ausgangsrechnungen</strong></td><td>Цепочка: аннулированный исходящий счёт → корректирующий документ → преемник</td></tr>
                    <tr><td><strong>Korrekturketten Eingangsrechnungen</strong></td><td>Цепочка: аннулированный входящий счёт → корректирующий документ → преемник</td></tr>
                </tbody>
            </table>

            <h4 style="margin-top:18px;color:#2c3e6a;">Закрытие и анализ</h4>
            <table class="hb-table">
                <thead><tr><th>Отчёт</th><th>Что показывает</th></tr></thead>
                <tbody>
                    <tr><td><strong>Summen- und Saldenliste</strong></td><td>Сальдо по счетам на основе журнала — дебет/кредит и итоговый остаток (аналог оборотно-сальдовой ведомости)</td></tr>
                    <tr><td><strong>Kontenblatt</strong></td><td>Отдельные проводки по выбранному счёту — детализация Summen- und Saldenliste</td></tr>
                    <tr><td><strong>Steuerübersicht gesamt</strong></td><td>УСт и входящий НДС вместе — расчётная налоговая нагрузка или право на возврат</td></tr>
                    <tr><td><strong>Offene-Posten-Abstimmung</strong></td><td>Сверка: сальдо журнала (сч. 1200 / 3300) vs. остатки в CRechnung / CEingangsrechnung</td></tr>
                    <tr><td><strong>Management-Kennzahlen-Grundlage</strong></td><td>Компактный управленческий отчёт: выручка, расходы, валовая прибыль</td></tr>
                </tbody>
            </table>

            <!-- НАПОМИНАНИЯ -->
        </div><!-- Ende RU -->

    </div><!-- hb-main -->
</div><!-- hb-wrap -->
