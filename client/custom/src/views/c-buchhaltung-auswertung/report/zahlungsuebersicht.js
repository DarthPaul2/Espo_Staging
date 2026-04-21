// Отчёт Zahlungsübersicht.
// Что это: Phase-3-Bericht по всем festgeschriebene Zahlungen
// за выбранный период: входящие и исходящие вместе.

define('custom:views/c-buchhaltung-auswertung/report/zahlungsuebersicht', [], function () {
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
                                    <div><strong>Anzahl Zahlungen</strong></div>
                                    <div class="zu-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Eingänge</strong></div>
                                    <div class="zu-kpi-eingang" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Ausgänge</strong></div>
                                    <div class="zu-kpi-ausgang" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Saldo</strong></div>
                                    <div class="zu-kpi-saldo" style="font-size: 22px;">0,00 €</div>
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
                            Zeitraum: <strong><span class="zu-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Gefundene Zahlungen: <strong><span class="zu-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über alle festgeschriebenen Ein- und Auszahlungen im gewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsdatum</th>
                                            <th>Zahlungsnummer</th>
                                            <th>Richtung</th>
                                            <th>Partner</th>
                                            <th>Betrag</th>
                                            <th>Zahlungsart</th>
                                            <th>Buchungsjournal</th>
                                        </tr>
                                    </thead>
                                    <tbody class="zu-tbody-gf">
                                        <tr>
                                            <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Erweiterte Sicht auf festgeschriebene Zahlungen mit Partner-, Richtungs- und Journalbezug.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsdatum</th>
                                            <th>Zahlungsnummer</th>
                                            <th>Status</th>
                                            <th>Richtung</th>
                                            <th>Account</th>
                                            <th>Lieferant</th>
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
                                    <tbody class="zu-tbody-buha">
                                        <tr>
                                            <td colspan="15" class="text-muted">Noch keine Daten geladen.</td>
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
                    'zahlungsdatum',
                    'status',
                    'zahlungsRichtung',
                    'betrag',
                    'zahlungsart',
                    'bankbezugTyp',
                    'referenz',
                    'kontoauszugReferenz',
                    'festgeschriebenAm',
                    'testmodus',
                    'accountId',
                    'accountName',
                    'lieferantId',
                    'lieferantName',
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
                    console.error('[Zahlungsuebersicht] load failed', err);
                    view.notify('Fehler beim Laden der Zahlungsübersicht', 'error');
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.zu-tbody-gf');
            const $tbodyBuha = view.$el.find('.zu-tbody-buha');

            let sumEingang = 0;
            let sumAusgang = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine Zahlungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="15" class="text-muted">Keine Zahlungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfo(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const richtungRaw = String(item.zahlungsRichtung || '').trim();

                if (richtungRaw === 'eingang') {
                    sumEingang += betrag;
                } else if (richtungRaw === 'ausgang') {
                    sumAusgang += betrag;
                }

                const zahlungId = view.escapeHtml_(item.id || '');
                const zahlungsnummerText = view.escapeHtml_(item.zahlungsnummer || '');
                const zahlungsnummer = zahlungId
                    ? `<a href="#CZahlung/view/${zahlungId}">${zahlungsnummerText}</a>`
                    : zahlungsnummerText;

                const accountId = view.escapeHtml_(item.accountId || '');
                const accountName = view.escapeHtml_(item.accountName || '');
                const lieferantId = view.escapeHtml_(item.lieferantId || '');
                const lieferantName = view.escapeHtml_(item.lieferantName || '');

                let partner = '<span class="text-muted">–</span>';
                if (accountId && accountName) {
                    partner = `<a href="#Account/view/${accountId}">${accountName}</a>`;
                } else if (lieferantId && lieferantName) {
                    partner = `<a href="#CLieferant/view/${lieferantId}">${lieferantName}</a>`;
                }

                const account = (accountId && accountName)
                    ? `<a href="#Account/view/${accountId}">${accountName}</a>`
                    : '<span class="text-muted">–</span>';

                const lieferant = (lieferantId && lieferantName)
                    ? `<a href="#CLieferant/view/${lieferantId}">${lieferantName}</a>`
                    : '<span class="text-muted">–</span>';

                const zahlungsdatum = view.escapeHtml_(view.formatDateGerman_(item.zahlungsdatum));
                const festgeschriebenAm = view.escapeHtml_(view.formatDateTimeGerman_(item.festgeschriebenAm));
                const statusText = this.formatStatus_(item.status || '');
                const richtungText = this.formatRichtung_(item.zahlungsRichtung || '');
                const zahlungsartText = this.formatZahlungsart_(item.zahlungsart || '');
                const bankbezugText = this.formatBankbezug_(item.bankbezugTyp || '');
                const referenz = view.escapeHtml_(item.referenz || '');
                const kontoauszugReferenz = view.escapeHtml_(item.kontoauszugReferenz || '');

                const festgeschriebenVonId = view.escapeHtml_(item.festgeschriebenVonId || '');
                const festgeschriebenVonName = view.escapeHtml_(item.festgeschriebenVonName || '');
                const festgeschriebenVon = (festgeschriebenVonId && festgeschriebenVonName)
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
                        <td>${zahlungsdatum}</td>
                        <td>${zahlungsnummer}</td>
                        <td>${richtungText}</td>
                        <td>${partner}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${zahlungsartText}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${zahlungsdatum}</td>
                        <td>${zahlungsnummer}</td>
                        <td>${statusText}</td>
                        <td>${richtungText}</td>
                        <td>${account}</td>
                        <td>${lieferant}</td>
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

            this.updateKennzahlen(view, list.length, sumEingang, sumAusgang, sumEingang - sumAusgang);
            this.updateInfo(view, list.length);
        },

        updateKennzahlen(view, anzahl, eingang, ausgang, saldo) {
            view.$el.find('.zu-kpi-anzahl').text(anzahl);
            view.$el.find('.zu-kpi-eingang').text(view.formatCurrency_(eingang));
            view.$el.find('.zu-kpi-ausgang').text(view.formatCurrency_(ausgang));
            view.$el.find('.zu-kpi-saldo').text(view.formatCurrency_(saldo));
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

            view.$el.find('.zu-info-zeitraum').text(zeitraumText);
            view.$el.find('.zu-info-anzahl').text(anzahl);
        },

        formatStatus_(value) {
            value = String(value || '').trim();
            if (value === 'entwurf') return 'Entwurf';
            if (value === 'freigabe') return 'Freigabe';
            if (value === 'festgeschrieben') return 'Festgeschrieben';
            return value || '–';
        },

        formatRichtung_(value) {
            value = String(value || '').trim();
            if (value === 'eingang') return 'Zahlungseingang';
            if (value === 'ausgang') return 'Zahlungsausgang';
            return '–';
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