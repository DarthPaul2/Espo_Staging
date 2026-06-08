<style>
.hb-wrap { display: flex; gap: 0; min-height: 80vh; font-family: inherit; }

.hb-sidebar {
    width: 240px;
    min-width: 200px;
    background: #f5f6fa;
    border-right: 1px solid #e0e0e0;
    padding: 16px 0;
    position: sticky;
    top: 0;
    max-height: 90vh;
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
.hb-nav li.section > a { font-weight: 700; color: #2c3e6a; margin-top: 8px; padding-top: 0; font-size: 17px; text-transform: uppercase; }

.hb-main {
    flex: 1;
    padding: 24px 32px;
    max-width: 860px;
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
                    <li><a href="#de-bankkonto">→ Bankkonten</a></li>
                    <li class="section"><a href="#de-verkauf">Verkaufsprozess</a></li>
                    <li><a href="#de-angebot">→ Angebot</a></li>
                    <li><a href="#de-auftrag">→ Auftrag</a></li>
                    <li><a href="#de-lieferschein">→ Lieferschein</a></li>
                    <li><a href="#de-rechnung">→ Rechnung</a></li>
                    <li class="section"><a href="#de-eingang">Eingangsrechnungen</a></li>
                    <li><a href="#de-eingangsrechnung">→ Eingangsrechnung</a></li>
                    <li><a href="#de-import">→ OCR / AI Import</a></li>
                    <li class="section"><a href="#de-bank">Zahlungen &amp; Bank</a></li>
                    <li><a href="#de-zahlung">→ Zahlungen</a></li>
                    <li><a href="#de-bankbewegung">→ Bankbewegungen</a></li>
                    <li><a href="#de-ausgleich">→ Ausgleiche</a></li>
                    <li class="section"><a href="#de-buchhaltung">Buchhaltung</a></li>
                    <li><a href="#de-buchungsjournal">→ Buchungsjournal</a></li>
                    <li><a href="#de-auswertung">→ Auswertungen</a></li>
                    <li class="section"><a href="#de-mahnwesen">Mahnwesen</a></li>
                    <li><a href="#de-mahnung">→ Mahnungen</a></li>
                    <li class="section"><a href="#de-werkzeuge">Werkzeuge</a></li>
                    <li><a href="#de-werkzeug">→ Werkzeug</a></li>
                    <li><a href="#de-ausgabe">→ Werkzeugausgabe</a></li>
                    <li><a href="#de-wartung">→ Wartung</a></li>
                    <li class="section"><a href="#de-arbeitszeit">Arbeitszeit</a></li>
                    <li><a href="#de-az">→ Arbeitszeiten</a></li>
                    <li><a href="#de-stundenbericht">→ Stundenbericht</a></li>
                    <li><a href="#de-abwesenheit">→ Abwesenheit</a></li>
                    <li class="section"><a href="#de-berichte">Berichte &amp; Briefe</a></li>
                    <li><a href="#de-melder">→ Melder Quartal</a></li>
                    <li><a href="#de-briefe">→ Briefe</a></li>
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
                    <li><a href="#ru-bankkonto">→ Банковские счета</a></li>
                    <li class="section"><a href="#ru-verkauf">Процесс продаж</a></li>
                    <li><a href="#ru-angebot">→ Предложение</a></li>
                    <li><a href="#ru-auftrag">→ Заказ</a></li>
                    <li><a href="#ru-lieferschein">→ Накладная</a></li>
                    <li><a href="#ru-rechnung">→ Счёт-фактура</a></li>
                    <li class="section"><a href="#ru-eingang">Вход. счета</a></li>
                    <li><a href="#ru-eingangsrechnung">→ Eingangsrechnung</a></li>
                    <li><a href="#ru-import">→ OCR / AI Импорт</a></li>
                    <li class="section"><a href="#ru-bank">Платежи и банк</a></li>
                    <li><a href="#ru-zahlung">→ Платежи</a></li>
                    <li><a href="#ru-bankbewegung">→ Банк. движения</a></li>
                    <li><a href="#ru-ausgleich">→ Зачёт</a></li>
                    <li class="section"><a href="#ru-buchhaltung">Бухгалтерия</a></li>
                    <li><a href="#ru-buchungsjournal">→ Журнал проводок</a></li>
                    <li><a href="#ru-auswertung">→ Отчёты</a></li>
                    <li class="section"><a href="#ru-mahnwesen">Напоминания</a></li>
                    <li><a href="#ru-mahnung">→ Mahnungen</a></li>
                    <li class="section"><a href="#ru-werkzeuge">Инструменты</a></li>
                    <li><a href="#ru-werkzeug">→ Werkzeug</a></li>
                    <li><a href="#ru-ausgabe">→ Ausgabe</a></li>
                    <li><a href="#ru-wartung">→ Wartung</a></li>
                    <li class="section"><a href="#ru-arbeitszeit">Рабочее время</a></li>
                    <li><a href="#ru-az">→ Arbeitszeiten</a></li>
                    <li><a href="#ru-stundenbericht">→ Stundenbericht</a></li>
                    <li><a href="#ru-abwesenheit">→ Abwesenheit</a></li>
                    <li class="section"><a href="#ru-berichte">Отчёты и письма</a></li>
                    <li><a href="#ru-melder">→ Melder Quartal</a></li>
                    <li><a href="#ru-briefe">→ Briefe</a></li>
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
            <h2 id="de-stammdaten">2. Stammdaten</h2>
            <p>Stammdaten bilden die Grundlage des Systems. Sie werden einmalig angelegt und überall verwendet. Vor dem Erstellen eines Dokuments (Angebot, Rechnung) sicherstellen, dass der betreffende Kunde, Lieferant und die Materialien bereits vorhanden sind.</p>

            <h3 id="de-account">2.1 Kunden (Account)</h3>
            <p>Die zentrale Kundenkarte — für Organisationen oder Privatpersonen, mit denen Klesec zusammenarbeitet. Alle Dokumente (Angebote, Aufträge, Rechnungen) werden dem Kunden zugeordnet.</p>
            <p><strong>Menü → Accounts</strong></p>
            <p><strong>Neuen Kunden anlegen:</strong></p>
            <ul class="hb-steps">
                <li>Im Menü <strong>Accounts</strong> öffnen, <kbd>Erstellen</kbd> klicken</li>
                <li>Pflichtfelder ausfüllen: <strong>Name</strong>, <strong>Straße / Hausnummer</strong>, <strong>PLZ</strong>, <strong>Ort</strong>, <strong>Land</strong></li>
                <li>Optional: Telefon, E-Mail hinzufügen</li>
                <li><kbd>Speichern</kbd> — Kundennummer wird automatisch vergeben</li>
            </ul>
            <div class="hb-tip">Vor dem Anlegen eines neuen Kunden prüfen, ob er bereits im System vorhanden ist — Suche nach Name oder PLZ.</div>

            <h3 id="de-contact">2.2 Ansprechpartner (Contact)</h3>
            <p>Konkrete Person, die einen Kunden vertritt. Ein Kunde kann mehrere Ansprechpartner haben.</p>
            <p><strong>Menü → Contacts</strong></p>
            <ul class="hb-steps">
                <li>In der Kundenkarte: Registerkarte <strong>Contacts</strong> → <kbd>Erstellen</kbd><br>Oder: Menü <strong>Contacts</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder ausfüllen: <strong>Vorname / Nachname</strong>, <strong>Account</strong> (Kundenzuordnung), <strong>Position</strong>, <strong>Telefon</strong>, <strong>E-Mail</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <h3 id="de-lieferant">2.3 Lieferanten</h3>
            <p>Unternehmen oder Personen, von denen Klesec Waren oder Dienstleistungen bezieht. <em>Kunden zahlen an uns — Lieferanten zahlen wir.</em></p>
            <p><strong>Menü → Lieferanten</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Lieferanten</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder ausfüllen: <strong>Name</strong>, Adresse, Kontaktdaten, <strong>USt-IdNr.</strong>, <strong>Steuernummer</strong></li>
                <li>Bankdaten eintragen: <strong>IBAN</strong>, <strong>BIC</strong>, <strong>Bankname</strong></li>
                <li><kbd>Speichern</kbd> — Lieferantennummer wird automatisch vergeben</li>
            </ul>
            <div class="hb-tip">IBAN und BIC direkt beim Anlegen ausfüllen — sie werden für Zahlungen benötigt.</div>

            <h3 id="de-material">2.4 Materialien</h3>
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

            <h3 id="de-bankkonto">2.6 Bankkonten</h3>
            <p>Bankkonten der Firma Klesec, über die Ein- und Auszahlungen laufen. Wird einmalig vom Buchhalter eingerichtet.</p>
            <p><strong>Menü → Bankkonten</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Bankkonten</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Name</strong> (z.B. „Hauptkonto Sparkasse"), <strong>IBAN</strong>, <strong>BIC</strong>, <strong>Bankname</strong>, <strong>Startsaldo</strong>, <strong>Startsaldo Datum</strong></li>
                <li><kbd>Speichern</kbd></li>
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
                <li><kbd>Speichern</kbd> — Angebotsnummer wird automatisch vergeben</li>
                <li>Registerkarte <strong>Positionen</strong> → <kbd>Erstellen</kbd> → <strong>Material</strong> aus Katalog wählen → Menge, Preis, Rabatt, MwSt prüfen</li>
                <li>Gesamtbeträge (netto / brutto) prüfen</li>
                <li><kbd>PDF erstellen</kbd> → PDF an Kunden senden</li>
            </ul>
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
            <h2 id="de-eingang">4. Eingangsrechnungen &amp; Lieferanten</h2>

            <h3 id="de-eingangsrechnung">4.1 Eingangsrechnung (manuell)</h3>
            <p>Rechnung eines Lieferanten — muss im System erfasst und bezahlt werden. Empfohlen wird der OCR/AI-Import (Abschnitt 4.2).</p>
            <p><strong>Menü → Eingangsrechnungen</strong></p>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>Entwurf</td><td>Entwurf, wird geprüft</td></tr>
                <tr><td>Freigabe</td><td>Zur Zahlung freigegeben</td></tr>
                <tr><td>Festgeschrieben</td><td>In der Buchhaltung festgeschrieben</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Menü <strong>Eingangsrechnungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder ausfüllen: <strong>Lieferant</strong>, <strong>Lieferanten-Rechnungsnummer</strong>, <strong>Belegdatum</strong>, <strong>Fällig am</strong>, <strong>Betrag Brutto</strong>, <strong>Betrag Netto</strong>, <strong>Steuerfall</strong></li>
                <li><kbd>Speichern</kbd> — interne Nummer wird automatisch vergeben</li>
                <li>Optional: Registerkarte <strong>Positionen</strong> ausfüllen, Original-PDF anhängen (<kbd>📎</kbd>)</li>
            </ul>

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

            <!-- ZAHLUNGEN & BANK -->
            <h2 id="de-bank">5. Zahlungen &amp; Bank</h2>

            <h3 id="de-zahlung">5.1 Zahlungen</h3>
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

            <h3 id="de-bankbewegung">5.2 Bankbewegungen</h3>
            <p>Jede Zeile des Kontoauszugs — eine Transaktion auf dem Firmenkonto. Das System versucht, Transaktionen automatisch Zahlungen oder Rechnungen zuzuordnen. Nicht zugeordnete Positionen müssen manuell bearbeitet werden.</p>
            <p><strong>Menü → Bankbewegungen</strong></p>
            <table>
                <tr><th>Status</th><th>Bedeutung</th></tr>
                <tr><td>Importiert</td><td>Gerade importiert, noch nicht bearbeitet</td></tr>
                <tr><td>Automatisch erkannt</td><td>Treffer automatisch gefunden</td></tr>
                <tr><td>Manuell zugeordnet</td><td>Manuell zugeordnet</td></tr>
                <tr><td>Unklar</td><td>Unbekannte Transaktion — manuelle Bearbeitung nötig</td></tr>
                <tr><td>Ignoriert</td><td>Keine Aktion erforderlich</td></tr>
            </table>
            <ul class="hb-steps">
                <li>Kontoauszug importieren: in <strong>Bankbewegungen</strong> → <kbd>Importieren</kbd> → Datei (CSV oder MT940) auswählen → Bankkonto angeben</li>
                <li>Bewegungen mit Status <strong>Vorschlag</strong> prüfen → <kbd>Bestätigen</kbd> oder ablehnen</li>
                <li>Bewegungen mit Status <strong>Unklar</strong> manuell zuordnen: Datensatz öffnen → <kbd>Bearbeiten</kbd> → Rechnung, Eingangsrechnung, Account oder Lieferant auswählen</li>
                <li>Nicht relevante Bewegungen als <strong>Ignoriert</strong> markieren</li>
            </ul>

            <h3 id="de-ausgleich">5.3 Ausgleiche</h3>
            <p>Technischer Datensatz, der eine Zahlung mit einer Rechnung verknüpft. Wird meist automatisch erstellt. Dieser Bereich dient nur zur Kontrolle.</p>

            <!-- BUCHHALTUNG -->
            <h2 id="de-buchhaltung">6. Buchhaltung</h2>

            <h3 id="de-buchungsjournal">6.1 Buchungsjournal</h3>
            <p>Wird automatisch bei der Festschreibung von Rechnungen und Zahlungen erstellt. Der Buchhalter prüft und korrigiert bei Bedarf.</p>
            <p><strong>Menü → Buchungsjournale</strong></p>
            <div class="hb-tip">Buchungsjournale werden automatisch erstellt. Normale Mitarbeiter müssen diesen Bereich nicht bedienen.</div>

            <h3 id="de-auswertung">6.2 Buchhaltung Auswertungen</h3>
            <p>Verschiedene buchhalterische Berichte — Verkaufsjournal, Einkaufsjournal, Zahlungsübersicht, Bankabstimmung, Umsatzsteuerauswertung, Forderungsanalyse u.a.</p>
            <p><strong>Menü → Buchhaltung Auswertungen</strong></p>
            <ul class="hb-steps">
                <li>Gewünschten Bericht in der Liste öffnen</li>
                <li>Zeitraum (<strong>Von / Bis</strong>) einstellen</li>
                <li><kbd>Aktualisieren</kbd> oder <kbd>Anzeigen</kbd> klicken</li>
            </ul>

            <!-- MAHNWESEN -->
            <h2 id="de-mahnwesen">7. Mahnwesen</h2>

            <h3 id="de-mahnung">7.2 Mahnungen</h3>
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

            <!-- WERKZEUGE -->
            <h2 id="de-werkzeuge">8. Werkzeuge &amp; Geräte</h2>

            <h3 id="de-werkzeug">8.1 Werkzeuge</h3>
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

            <h3 id="de-ausgabe">8.2 Werkzeugausgabe</h3>
            <p>Ausgabe eines Werkzeugs an einen Mitarbeiter oder auf eine Baustelle.</p>
            <ul class="hb-steps">
                <li>Werkzeugkarte öffnen → Registerkarte <strong>Werkzeugausgaben</strong> → <kbd>Erstellen</kbd></li>
                <li>Felder: <strong>Ausgegeben am</strong>, Status <strong>Ausgegeben</strong></li>
                <li><kbd>Speichern</kbd> — Standort des Werkzeugs wechselt automatisch auf „In Benutzung"</li>
            </ul>
            <p><strong>Rückgabe:</strong> Ausgabedatensatz öffnen → <kbd>Bearbeiten</kbd> → <strong>Zurückgegeben am</strong> eintragen → Status auf <strong>Zurückgegeben</strong> → <kbd>Speichern</kbd></p>

            <h3 id="de-wartung">8.3 Wartung</h3>
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

            <!-- ARBEITSZEIT -->
            <h2 id="de-arbeitszeit">9. Arbeitszeiterfassung</h2>

            <h3 id="de-az">9.1 Arbeitszeiten</h3>
            <p>Arbeitsstunden der Techniker — Daten kommen automatisch aus der mobilen App. Der Techniker meldet sich in der App an und ab, die Daten werden synchronisiert.</p>
            <p><strong>Menü → Arbeitszeiten</strong></p>
            <p>Anzeige: Datum, Beginn/Ende, Gesamtdauer, Nettozeit (ohne Pausen), Überstunden, GPS-Koordinaten. Monats- und Jahresübersichten in den jeweiligen Registerkarten verfügbar.</p>

            <h3 id="de-stundenbericht">9.2 Stundenbericht</h3>
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

            <h3 id="de-abwesenheit">9.3 Abwesenheit</h3>
            <p>Erfassung von Abwesenheiten — Urlaub, Krankheit, Freizeitausgleich. Wird im Teamkalender angezeigt.</p>
            <p><strong>Menü → Abwesenheiten</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Abwesenheiten</strong> → <kbd>Erstellen</kbd> (oder im Kalender auf den Tag klicken)</li>
                <li>Felder: <strong>Assigned User</strong>, <strong>Typ</strong> (U=Urlaub, K=Krank, Freizeitausgleich), <strong>Datum Start / Ende</strong>, <strong>Ganztägig</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <!-- BERICHTE & BRIEFE -->
            <h2 id="de-berichte">10. Technische Berichte &amp; Briefe</h2>

            <h3 id="de-melder">10.1 Melder Quartal</h3>
            <p>Quartalsberichte der technischen Inspektion von Brand- und Einbruchmeldeanlagen. Werden vom Techniker in der App ausgefüllt und automatisch im System gespeichert.</p>
            <p><strong>Menü → Melder Quartale</strong></p>
            <p>In der Objekt- oder Kundenkarte ist unter <strong>Melder Gesamt PDFs</strong> der jährliche Gesamtbericht aller Quartale verfügbar.</p>

            <h3 id="de-briefe">10.2 Briefe</h3>
            <p>Ausgehende Korrespondenz — verknüpft mit Kunden, Aufträgen oder Rechnungen.</p>
            <p><strong>Menü → Briefe</strong></p>
            <ul class="hb-steps">
                <li>Menü <strong>Briefe</strong> → <kbd>Erstellen</kbd> (oder aus Kunden-/Auftragskarte)</li>
                <li>Felder: <strong>Betreff</strong>, <strong>Datum</strong>, <strong>Account</strong>, <strong>Kontakt</strong>, optionale Verknüpfungen zu Angebot/Auftrag/Rechnung, <strong>Body</strong> (Text)</li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd> → versenden → Status auf <strong>Final</strong> setzen</li>
            </ul>

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
            <p>Основная карточка клиента. Все документы (предложения, заказы, счета) привязываются к клиенту.</p>
            <p><strong>Меню → Accounts</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Accounts</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Name</strong>, <strong>Straße / Hausnummer</strong>, <strong>PLZ</strong>, <strong>Ort</strong>, <strong>Land</strong></li>
                <li>Опционально: телефон, email</li>
                <li><kbd>Speichern</kbd> — номер клиента присвоится автоматически</li>
            </ul>
            <div class="hb-tip">Перед созданием нового клиента проверьте, нет ли его уже в системе — поиск по названию или PLZ.</div>

            <h3 id="ru-contact">2.2 Контактные лица (Contact)</h3>
            <p>Конкретный человек, представляющий клиента. У одного клиента может быть несколько контактов.</p>
            <p><strong>Меню → Contacts</strong></p>
            <ul class="hb-steps">
                <li>В карточке клиента: вкладка <strong>Contacts</strong> → <kbd>Erstellen</kbd><br>Или: Меню <strong>Contacts</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Vorname / Nachname</strong>, <strong>Account</strong>, <strong>Position</strong>, <strong>Telefon</strong>, <strong>E-Mail</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <h3 id="ru-lieferant">2.3 Поставщики (Lieferant)</h3>
            <p>Компании, у которых Klesec покупает товары или услуги. <em>Клиент платит нам — поставщику платим мы.</em></p>
            <p><strong>Меню → Lieferanten</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Lieferanten</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Name</strong>, адрес, контактные данные, <strong>USt-IdNr.</strong>, <strong>Steuernummer</strong></li>
                <li>Банковские реквизиты: <strong>IBAN</strong>, <strong>BIC</strong>, <strong>Bankname</strong></li>
                <li><kbd>Speichern</kbd> — номер поставщика присвоится автоматически</li>
            </ul>

            <h3 id="ru-material">2.4 Материалы (Material)</h3>
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

            <h3 id="ru-bankkonto">2.6 Банковские счета (Bankkonto)</h3>
            <p>Банковские счета компании Klesec. Настраиваются один раз бухгалтером.</p>
            <p><strong>Меню → Bankkonten</strong></p>

            <!-- ПРОЦЕСС ПРОДАЖ -->
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
                <li><kbd>Speichern</kbd> — номер присвоится автоматически</li>
                <li>Вкладка <strong>Positionen</strong> → <kbd>Erstellen</kbd> → выбрать <strong>Material</strong> → проверить количество, цену, скидку, НДС</li>
                <li>Проверить итоговые суммы (нетто / брутто)</li>
                <li><kbd>PDF erstellen</kbd> → отправить клиенту</li>
            </ul>
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
            <h2 id="ru-eingang">4. Входящие счета и поставщики</h2>

            <h3 id="ru-eingangsrechnung">4.1 Входящий счёт (Eingangsrechnung)</h3>
            <p>Счёт от поставщика — нужно занести в систему и оплатить. Рекомендуется использовать OCR/AI импорт (раздел 4.2).</p>
            <p><strong>Меню → Eingangsrechnungen</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Eingangsrechnungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Lieferant</strong>, <strong>Lieferanten-Rechnungsnummer</strong>, <strong>Belegdatum</strong>, <strong>Fällig am</strong>, <strong>Betrag Brutto</strong>, <strong>Betrag Netto</strong>, <strong>Steuerfall</strong></li>
                <li><kbd>Speichern</kbd> — внутренний номер присвоится автоматически</li>
                <li>Опционально: вкладка <strong>Positionen</strong>, прикрепить оригинал PDF (<kbd>📎</kbd>)</li>
            </ul>

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
            <h2 id="ru-bank">5. Платежи и банк</h2>

            <h3 id="ru-zahlung">5.1 Платежи (Zahlung)</h3>
            <p>Запись о платеже — входящем (клиент заплатил нам) или исходящем (мы заплатили поставщику).</p>
            <p><strong>Меню → Zahlungen</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Zahlungen</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Zahlungsrichtung</strong> (Eingang/Ausgang), <strong>Zahlungsdatum</strong>, <strong>Betrag</strong>, <strong>Zahlungsart</strong>, <strong>Account</strong> или <strong>Lieferant</strong></li>
                <li><kbd>Speichern</kbd> — номер платежа присвоится автоматически</li>
                <li>Привязать к счёту: вкладка <strong>Ausgleiche</strong> → <kbd>Erstellen</kbd> → выбрать счёт и сумму</li>
            </ul>

            <h3 id="ru-bankbewegung">5.2 Банковские движения (Bankbewegung)</h3>
            <p>Строки банковской выписки. Система автоматически сопоставляет транзакции со счетами и платежами. Несопоставленные нужно обработать вручную.</p>
            <p><strong>Меню → Bankbewegungen</strong></p>
            <ul class="hb-steps">
                <li>Импортировать выписку: <kbd>Importieren</kbd> → выбрать файл (CSV / MT940) → указать Bankkonto</li>
                <li>Движения со статусом <strong>Vorschlag</strong> — проверить и <kbd>Bestätigen</kbd> или отклонить</li>
                <li>Движения <strong>Unklar</strong> — назначить вручную: открыть → <kbd>Bearbeiten</kbd> → выбрать Rechnung, Eingangsrechnung, Account или Lieferant</li>
                <li>Нерелевантные — отметить как <strong>Ignoriert</strong></li>
            </ul>

            <h3 id="ru-ausgleich">5.3 Зачёт требований (Ausgleich)</h3>
            <p>Технический документ, связывающий платёж со счётом. Создаётся автоматически. Раздел только для проверки.</p>

            <!-- БУХГАЛТЕРИЯ -->
            <h2 id="ru-buchhaltung">6. Бухгалтерия</h2>

            <h3 id="ru-buchungsjournal">6.1 Журнал проводок (Buchungsjournal)</h3>
            <p>Создаётся автоматически при фиксации счетов и платежей. Бухгалтер проверяет и при необходимости корректирует.</p>
            <p><strong>Меню → Buchungsjournale</strong></p>

            <h3 id="ru-auswertung">6.2 Отчёты бухгалтерии (Buchhaltung Auswertung)</h3>
            <p>Различные отчёты: журнал продаж, журнал закупок, платежи, банковская сверка, НДС, анализ задолженностей.</p>
            <p><strong>Меню → Buchhaltung Auswertungen</strong></p>
            <ul class="hb-steps">
                <li>Открыть нужный отчёт из списка</li>
                <li>Задать период (<strong>Von / Bis</strong>)</li>
                <li><kbd>Aktualisieren</kbd> или <kbd>Anzeigen</kbd></li>
            </ul>

            <!-- НАПОМИНАНИЯ -->
            <h2 id="ru-mahnwesen">7. Напоминания об оплате (Mahnwesen)</h2>

            <h3 id="ru-mahnung">7.2 Напоминания (Mahnung)</h3>
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
            <h2 id="ru-werkzeuge">8. Инструменты и оборудование</h2>

            <h3 id="ru-werkzeug">8.1 Инструменты (Werkzeug)</h3>
            <p>Учёт всех инструментов, машин и оборудования. Каждый инструмент имеет инвентарный номер и историю выдачи.</p>
            <p><strong>Меню → Werkzeuge</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Werkzeuge</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Name</strong>, <strong>Kategorie</strong>, <strong>Seriennummer</strong>, <strong>Zustand</strong>, <strong>Letzte Prüfung</strong>, <strong>Nächste Prüfung</strong>, <strong>Standort</strong></li>
                <li>Опционально: документы (<kbd>📎</kbd>)</li>
                <li><kbd>Speichern</kbd> — инвентарный номер и штрих-код генерируются автоматически</li>
            </ul>

            <h3 id="ru-ausgabe">8.2 Выдача инструментов (Werkzeugausgabe)</h3>
            <ul class="hb-steps">
                <li>Открыть карточку инструмента → вкладка <strong>Werkzeugausgaben</strong> → <kbd>Erstellen</kbd></li>
                <li>Заполнить: <strong>Ausgegeben am</strong>, статус <strong>Ausgegeben</strong> → <kbd>Speichern</kbd></li>
            </ul>
            <p><strong>Возврат:</strong> Открыть запись о выдаче → <kbd>Bearbeiten</kbd> → заполнить <strong>Zurückgegeben am</strong> → статус <strong>Zurückgegeben</strong> → <kbd>Speichern</kbd></p>

            <h3 id="ru-wartung">8.3 Техническое обслуживание (Wartung)</h3>
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
            <h2 id="ru-arbeitszeit">9. Учёт рабочего времени</h2>

            <h3 id="ru-az">9.1 Рабочее время (Arbeitszeit)</h3>
            <p>Данные приходят автоматически из мобильного приложения. Техник отмечается в приложении — данные синхронизируются с системой.</p>
            <p><strong>Меню → Arbeitszeiten</strong></p>
            <p>Отображается: дата, начало/конец, продолжительность, чистое время, переработки, GPS-координаты. Сводки по месяцам и годам — в соответствующих вкладках.</p>

            <h3 id="ru-stundenbericht">9.2 Отчёты по часам (Stundenbericht)</h3>
            <p>Сводный отчёт о выполненных работах — заполняется техником в приложении. Содержит объект, материалы, Notdienst, суммы.</p>
            <p><strong>Меню → Stundenberichte</strong></p>
            <ul class="hb-steps">
                <li>Фильтр <strong>Status = PDF erzeugt</strong> — отчёты, ожидающие проверки</li>
                <li>Проверить: объект, клиент, материалы и количество</li>
                <li><kbd>PDF erstellen</kbd> → отправить клиенту → статус <strong>Gesendet</strong></li>
                <li>По завершении: статус <strong>Archiviert</strong></li>
            </ul>

            <h3 id="ru-abwesenheit">9.3 Отсутствие (Abwesenheit)</h3>
            <p>Учёт отсутствий — отпуск, больничный, отгул. Отображается в общем календаре.</p>
            <p><strong>Меню → Abwesenheiten</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Abwesenheiten</strong> → <kbd>Erstellen</kbd> (или из Календаря)</li>
                <li>Заполнить: <strong>Assigned User</strong>, <strong>Typ</strong> (U=Urlaub, K=Krank, Freizeitausgleich), <strong>Datum Start / Ende</strong></li>
                <li><kbd>Speichern</kbd></li>
            </ul>

            <!-- ОТЧЁТЫ И ПИСЬМА -->
            <h2 id="ru-berichte">10. Технические отчёты и переписка</h2>

            <h3 id="ru-melder">10.1 Квартальные проверки (Melder Quartal)</h3>
            <p>Квартальные отчёты технического осмотра систем. Заполняются техником в приложении, автоматически появляются в системе.</p>
            <p><strong>Меню → Melder Quartale</strong></p>
            <p>В карточке объекта или клиента: вкладка <strong>Melder Gesamt PDFs</strong> — сводный PDF за год.</p>

            <h3 id="ru-briefe">10.2 Переписка (Briefe)</h3>
            <p>Исходящие письма, привязанные к клиентам, заказам или счетам.</p>
            <p><strong>Меню → Briefe</strong></p>
            <ul class="hb-steps">
                <li>Меню <strong>Briefe</strong> → <kbd>Erstellen</kbd> (или из карточки клиента/заказа)</li>
                <li>Заполнить: <strong>Betreff</strong>, <strong>Datum</strong>, <strong>Account</strong>, <strong>Kontakt</strong>, связи с Angebot/Auftrag/Rechnung, текст письма</li>
                <li><kbd>Speichern</kbd> → <kbd>PDF erstellen</kbd> → отправить → статус <strong>Final</strong></li>
            </ul>

        </div><!-- Ende RU -->

    </div><!-- hb-main -->
</div><!-- hb-wrap -->
