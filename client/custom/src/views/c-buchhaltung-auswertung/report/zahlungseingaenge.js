// Отчёт Zahlungseingänge.
// Что это: отдельный модуль рендера для auswertungTyp = zahlungseingaenge.

define('custom:views/c-buchhaltung-auswertung/report/zahlungseingaenge', [], function () {
    return {

        renderKennzahlenBlock(view) {
            if (view.$el.find('.kb-auswertung-summary').length) {
                return;
            }

            const html = `
                <div class="panel panel-default kb-auswertung-summary">
                    <div class="panel-heading" style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 class="panel-title" style="margin: 0;">Kennzahlen</h4>

                        <button
                            class="kb-stammdaten-button"
                            data-action="kb-switch-to-standard"
                            title="Wechselt in den Stammdaten-Modus, damit Name, Hinweise, Zeitraum und weitere Einstellungen bearbeitet werden können."
                        >
                            <span class="fas fa-cog" style="margin-right: 6px;"></span>
                            Stammdaten
                        </button>
                    </div>

                    <div class="panel-body">
                        <div class="row">
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Anzahl Eingänge</strong></div>
                                    <div class="ze-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Eingänge</strong></div>
                                    <div class="ze-kpi-summe" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Bank</strong></div>
                                    <div class="ze-kpi-bank" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Bar / Sonstige</strong></div>
                                    <div class="ze-kpi-andere" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const $header = view.$el.find('.header-buttons');
            if ($header.length) {
                $header.after(html);
                return;
            }

            view.$el.prepend(html);
        },

        renderTabsBlock(view) {
            if (view.$el.find('.kb-auswertung-tabs').length) {
                return;
            }

            const html = `
                <div class="panel panel-default kb-auswertung-tabs">
                    <div class="panel-heading">
                        <ul class="nav nav-tabs">
                            <li class="active">
                                <a href="#" data-action="kb-show-tab" data-tab="gf">Geschäftsführung</a>
                            </li>
                            <li>
                                <a href="#" data-action="kb-show-tab" data-tab="buha">Buchhaltung</a>
                            </li>
                        </ul>
                    </div>
                    <div class="panel-body">
                        <div class="alert alert-info kb-auswertung-info">
                            Zeitraum: <strong><span class="ze-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Gefundene Zahlungseingänge: <strong><span class="ze-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über reale Zahlungseingänge von Kunden im gewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsnummer</th>
                                            <th>Zahlungsdatum</th>
                                            <th>Kunde</th>
                                            <th>Betrag</th>
                                            <th>Zahlungsart</th>
                                            <th>Buchungsjournal</th>
                                        </tr>
                                    </thead>
                                    <tbody class="ze-tbody-gf">
                                        <tr>
                                            <td colspan="6" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Erweiterte Sicht auf festgeschriebene Zahlungseingänge mit Kunden-, Referenz- und Journalbezug.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsnummer</th>
                                            <th>Status</th>
                                            <th>Zahlungsdatum</th>
                                            <th>Kunde</th>
                                            <th>Betrag</th>
                                            <th>Zahlungsart</th>
                                            <th>Bankbezug</th>
                                            <th>Referenz</th>
                                            <th>Kontoauszug-Referenz</th>
                                            <th>Festgeschrieben am</th>
                                            <th>Festgeschrieben von</th>
                                            <th>Buchungsjournal</th>
                                            <th>Testmodus</th>
                                        </tr>
                                    </thead>
                                    <tbody class="ze-tbody-buha">
                                        <tr>
                                            <td colspan="13" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const $filter = view.$el.find('.kb-auswertung-filter');
            if ($filter.length) {
                $filter.after(html);
                return;
            }

            view.$el.append(html);
        },

        load(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            const where = [
                {
                    type: 'equals',
                    attribute: 'status',
                    value: 'festgeschrieben'
                },
                {
                    type: 'equals',
                    attribute: 'zahlungsRichtung',
                    value: 'eingang'
                }
            ];

            if (zeitraumVon) {
                where.push({
                    type: 'greaterThanOrEquals',
                    attribute: 'zahlungsdatum',
                    value: zeitraumVon
                });
            }

            if (zeitraumBis) {
                where.push({
                    type: 'lessThanOrEquals',
                    attribute: 'zahlungsdatum',
                    value: zeitraumBis
                });
            }

            view.getCollectionFactory().create('CZahlung', (collection) => {
                collection.maxSize = 1000;

                collection.data.select = [
                    'id',
                    'zahlungsnummer',
                    'status',
                    'zahlungsdatum',
                    'betrag',
                    'zahlungsart',
                    'bankbezugTyp',
                    'referenz',
                    'kontoauszugReferenz',
                    'festgeschriebenAm',
                    'testmodus',
                    'accountId',
                    'accountName',
                    'festgeschriebenVonId',
                    'festgeschriebenVonName',
                    'buchungsjournalId',
                    'buchungsjournalName'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    let list = (collection.models || []).map(model => model.attributes || {});

                    list.sort((a, b) => {
                        const aDatum = a.zahlungsdatum || '';
                        const bDatum = b.zahlungsdatum || '';
                        if (aDatum !== bDatum) {
                            return bDatum.localeCompare(aDatum);
                        }

                        const aNr = a.zahlungsnummer || '';
                        const bNr = b.zahlungsnummer || '';
                        return bNr.localeCompare(aNr);
                    });

                    this.render(view, list);
                }).catch((err) => {
                    console.error('[Zahlungseingänge] load failed', err);
                    view.notify('Fehler beim Laden der Zahlungseingänge', 'error');
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.ze-tbody-gf');
            const $tbodyBuha = view.$el.find('.ze-tbody-buha');

            let summe = 0;
            let sumBank = 0;
            let sumAndere = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-muted">Keine Zahlungseingänge gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="13" class="text-muted">Keine Zahlungseingänge gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfo(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const zahlungsart = String(item.zahlungsart || '').trim();

                summe += betrag;
                if (zahlungsart === 'bank') {
                    sumBank += betrag;
                } else {
                    sumAndere += betrag;
                }

                const zahlungId = view.escapeHtml_(item.id || '');
                const zahlungsnummerText = view.escapeHtml_(item.zahlungsnummer || '');
                const zahlungsnummer = zahlungId
                    ? `<a href="#CZahlung/view/${zahlungId}">${zahlungsnummerText}</a>`
                    : zahlungsnummerText;

                const accountId = view.escapeHtml_(item.accountId || '');
                const accountName = view.escapeHtml_(item.accountName || '');
                const kunde = accountId && accountName
                    ? `<a href="#Account/view/${accountId}">${accountName}</a>`
                    : '<span class="text-muted">–</span>';

                const zahlungsdatum = view.escapeHtml_(view.formatDateGerman_(item.zahlungsdatum));
                const festgeschriebenAm = view.escapeHtml_(view.formatDateTimeGerman_(item.festgeschriebenAm));
                const statusText = this.formatStatus_(item.status || '');
                const zahlungsartText = this.formatZahlungsart_(item.zahlungsart || '');
                const bankbezugText = this.formatBankbezug_(item.bankbezugTyp || '');
                const referenz = view.escapeHtml_(item.referenz || '');
                const kontoauszugReferenz = view.escapeHtml_(item.kontoauszugReferenz || '');

                const festgeschriebenVonId = view.escapeHtml_(item.festgeschriebenVonId || '');
                const festgeschriebenVonName = view.escapeHtml_(item.festgeschriebenVonName || '');
                const festgeschriebenVon = festgeschriebenVonId && festgeschriebenVonName
                    ? `<a href="#User/view/${festgeschriebenVonId}">${festgeschriebenVonName}</a>`
                    : '<span class="text-muted">–</span>';

                let journalLink = '<span class="text-muted">–</span>';
                const journalId = view.escapeHtml_(item.buchungsjournalId || '');
                const journalName = view.escapeHtml_(item.buchungsjournalName || 'Journal');
                if (journalId) {
                    journalLink = `<a href="#CBuchungsjournal/view/${journalId}">${journalName}</a>`;
                }

                const testmodus = item.testmodus === true ? 'Ja' : 'Nein';

                htmlGf += `
                    <tr>
                        <td>${zahlungsnummer}</td>
                        <td>${zahlungsdatum}</td>
                        <td>${kunde}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${zahlungsartText}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${zahlungsnummer}</td>
                        <td>${statusText}</td>
                        <td>${zahlungsdatum}</td>
                        <td>${kunde}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${zahlungsartText}</td>
                        <td>${bankbezugText}</td>
                        <td>${referenz || '<span class="text-muted">–</span>'}</td>
                        <td>${kontoauszugReferenz || '<span class="text-muted">–</span>'}</td>
                        <td>${festgeschriebenAm || '<span class="text-muted">–</span>'}</td>
                        <td>${festgeschriebenVon}</td>
                        <td>${journalLink}</td>
                        <td>${testmodus}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, summe, sumBank, sumAndere);
            this.updateInfo(view, list.length);
        },

        updateKennzahlen(view, anzahl, summe, bank, andere) {
            view.$el.find('.ze-kpi-anzahl').text(anzahl);
            view.$el.find('.ze-kpi-summe').text(view.formatCurrency_(summe));
            view.$el.find('.ze-kpi-bank').text(view.formatCurrency_(bank));
            view.$el.find('.ze-kpi-andere').text(view.formatCurrency_(andere));
        },

        updateInfo(view, anzahl) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            let zeitraumText = 'Gesamt';
            if (zeitraumVon || zeitraumBis) {
                const von = zeitraumVon ? view.formatDateGerman_(zeitraumVon) : '…';
                const bis = zeitraumBis ? view.formatDateGerman_(zeitraumBis) : '…';
                zeitraumText = `${von} – ${bis}`;
            }

            view.$el.find('.ze-info-zeitraum').text(zeitraumText);
            view.$el.find('.ze-info-anzahl').text(anzahl);
        },

        formatStatus_(value) {
            value = String(value || '').trim();
            if (value === 'entwurf') return 'Entwurf';
            if (value === 'freigabe') return 'Freigabe';
            if (value === 'festgeschrieben') return 'Festgeschrieben';
            return value || '–';
        },

        formatZahlungsart_(value) {
            value = String(value || '').trim();
            if (value === 'bank') return 'Bank';
            if (value === 'bar') return 'Bar';
            if (value === 'sonstige') return 'Sonstige';
            return '–';
        },

        formatBankbezug_(value) {
            value = String(value || '').trim();
            if (value === 'bank') return 'Bank';
            if (value === 'kasse') return 'Kasse';
            if (value === 'manuell') return 'Manuell';
            if (value === 'sonstige') return 'Sonstige';
            return '–';
        }
    };
});