// custom:views/c-buchhaltung-auswertung/report/steueruebersicht-gesamt
// Что это:
// Phase 6 Bericht: Steuerübersicht gesamt.
//
// Зачем:
// Объединяет Umsatzsteuer и Vorsteuer на основе CBuchung.
// Показывает rechnerische Zahllast или Erstattungsanspruch.
// Это контрольный Bericht, а не замена отдельных Umsatzsteuer-/Vorsteuer-Auswertungen.

console.log('[LOAD] custom:views/c-buchhaltung-auswertung/report/steueruebersicht-gesamt');

define('custom:views/c-buchhaltung-auswertung/report/steueruebersicht-gesamt', [], function () {
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
                                    <div><strong>Umsatzsteuer</strong></div>
                                    <div class="kb-kpi-ust" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Vorsteuer</strong></div>
                                    <div class="kb-kpi-vorsteuer" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Steuer-Saldo</strong></div>
                                    <div class="kb-kpi-steuersaldo" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Ergebnis</strong></div>
                                    <div class="kb-kpi-ergebnis" style="font-size: 22px;">–</div>
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
                            Zeitraum: <strong><span class="kb-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Steuerkonten: <strong><span class="kb-info-anzahl">0</span></strong>
                            <br>
                            <span class="text-muted">
                                Journalbasierte Steuerübersicht aus CBuchung. Umsatzsteuer und Vorsteuer werden zusammengeführt.
                            </span>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte steuerliche Gesamtsicht: Umsatzsteuer abzüglich Vorsteuer ergibt Zahllast oder Erstattungsanspruch.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Position</th>
                                            <th style="text-align: right;">Betrag</th>
                                            <th>Bewertung</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-gf">
                                        <tr>
                                            <td colspan="3" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Prüfansicht der Steuerkonten mit Soll, Haben und steuerlicher Wirkung.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th style="width: 110px;">Konto</th>
                                            <th>Bezeichnung</th>
                                            <th style="width: 140px;">Steuerart</th>
                                            <th style="text-align: right; width: 130px;">Soll</th>
                                            <th style="text-align: right; width: 130px;">Haben</th>
                                            <th style="text-align: right; width: 150px;">Steuerliche Wirkung</th>
                                            <th style="text-align: right; width: 100px;">Buchungen</th>
                                            <th style="width: 130px;">Letzte Buchung</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="8" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                    <tfoot class="kb-tfoot-buha"></tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const $filter = view.$el.find('.kb-auswertung-filter');

            if ($filter.length) {
                $filter.after(html);
            }
        },

        load(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            const allRows = [];

            const loadPage = (offset) => {
                const params = {
                    maxSize: 200,
                    offset: offset,
                    orderBy: 'kontoNummer',
                    order: 'asc'
                };

                if (zeitraumVon || zeitraumBis) {
                    params.where = [];
                }

                if (zeitraumVon) {
                    params.where.push({
                        type: 'greaterThanOrEquals',
                        attribute: 'belegdatum',
                        value: zeitraumVon
                    });
                }

                if (zeitraumBis) {
                    params.where.push({
                        type: 'lessThanOrEquals',
                        attribute: 'belegdatum',
                        value: zeitraumBis
                    });
                }

                return Espo.Ajax.getRequest('CBuchung', params).then((response) => {
                    const list = response && response.list ? response.list : [];

                    list.forEach(row => allRows.push(row));

                    if (list.length === 200) {
                        return loadPage(offset + 200);
                    }

                    return allRows;
                });
            };

            loadPage(0).then((buchungen) => {
                const steuerBuchungen = buchungen.filter((b) => {
                    const steuerart = this.detectSteuerart(b);
                    return steuerart === 'umsatzsteuer' || steuerart === 'vorsteuer';
                });

                const list = this.buildRows(steuerBuchungen);
                this.render(view, list);
            }).catch((err) => {
                console.error('[SteueruebersichtGesamt] load failed', err);
                view.notify('Fehler beim Laden der Steuerübersicht gesamt', 'error');
                this.render(view, []);
            });
        },

        buildRows(buchungen) {
            const map = {};

            buchungen.forEach((b) => {
                const kontoNummer = this.getValue(b, ['kontoNummer', 'konto_nummer']) || 'ohne Konto';
                const kontoBezeichnung = this.getValue(b, ['kontoBezeichnung', 'konto_bezeichnung']) || '';
                const steuerart = this.detectSteuerart(b);

                if (!steuerart) {
                    return;
                }

                const key = kontoNummer + '|' + steuerart;

                if (!map[key]) {
                    map[key] = {
                        kontoNummer: kontoNummer,
                        kontoBezeichnung: kontoBezeichnung,
                        steuerart: steuerart,
                        soll: 0,
                        haben: 0,
                        wirkung: 0,
                        count: 0,
                        letzteBuchung: null
                    };
                }

                const buchungsart = this.getValue(b, ['buchungsart']) || '';
                const betrag = this.toNumber(this.getValue(b, ['betrag']));
                const belegdatum = this.getValue(b, ['belegdatum', 'belegDatum']);

                if (buchungsart === 'debit') {
                    map[key].soll += betrag;
                }

                if (buchungsart === 'credit') {
                    map[key].haben += betrag;
                }

                map[key].count++;

                if (belegdatum) {
                    if (!map[key].letzteBuchung || belegdatum > map[key].letzteBuchung) {
                        map[key].letzteBuchung = belegdatum;
                    }
                }
            });

            const rows = Object.keys(map).map(key => {
                const row = map[key];

                if (row.steuerart === 'umsatzsteuer') {
                    row.wirkung = row.haben - row.soll;
                }

                if (row.steuerart === 'vorsteuer') {
                    row.wirkung = row.soll - row.haben;
                }

                return row;
            });

            rows.sort((a, b) => {
                return String(a.kontoNummer).localeCompare(String(b.kontoNummer), 'de', {
                    numeric: true
                });
            });

            return rows;
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');
            const $tfootBuha = view.$el.find('.kb-tfoot-buha');

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="3" class="text-muted">Keine Steuerbuchungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="8" class="text-muted">Keine Steuerbuchungen gefunden.</td></tr>');
                $tfootBuha.html('');

                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let totalUmsatzsteuer = 0;
            let totalVorsteuer = 0;

            let totalSoll = 0;
            let totalHaben = 0;

            let htmlBuha = '';

            list.forEach((row) => {
                totalSoll += Number(row.soll || 0);
                totalHaben += Number(row.haben || 0);

                if (row.steuerart === 'umsatzsteuer') {
                    totalUmsatzsteuer += Number(row.wirkung || 0);
                }

                if (row.steuerart === 'vorsteuer') {
                    totalVorsteuer += Number(row.wirkung || 0);
                }

                const steuerartLabel = row.steuerart === 'umsatzsteuer' ? 'Umsatzsteuer' : 'Vorsteuer';

                htmlBuha += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.kontoNummer)}</strong></td>
                        <td>${view.escapeHtml_(row.kontoBezeichnung || '—')}</td>
                        <td>${view.escapeHtml_(steuerartLabel)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.soll)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.haben)}</td>
                        <td style="text-align: right;"><strong>${view.formatCurrency_(row.wirkung)}</strong></td>
                        <td style="text-align: right;">${row.count}</td>
                        <td>${view.escapeHtml_(view.formatDateGerman_(row.letzteBuchung) || '—')}</td>
                    </tr>
                `;
            });

            const steuerSaldo = totalUmsatzsteuer - totalVorsteuer;

            let ergebnisLabel = 'Ausgeglichen';
            let ergebnisText = 'Keine Zahllast und kein Erstattungsanspruch.';

            if (steuerSaldo > 0.004) {
                ergebnisLabel = 'Zahllast';
                ergebnisText = 'Voraussichtliche Zahllast gegenüber dem Finanzamt.';
            }

            if (steuerSaldo < -0.004) {
                ergebnisLabel = 'Erstattungsanspruch';
                ergebnisText = 'Voraussichtlicher Erstattungsanspruch gegenüber dem Finanzamt.';
            }

            const htmlGf = `
                <tr>
                    <td><strong>Umsatzsteuer</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totalUmsatzsteuer)}</td>
                    <td>Steuer aus Ausgangsrechnungen</td>
                </tr>
                <tr>
                    <td><strong>abzüglich Vorsteuer</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totalVorsteuer)}</td>
                    <td>Steuer aus Eingangsrechnungen</td>
                </tr>
                <tr>
                    <td><strong>${view.escapeHtml_(ergebnisLabel)}</strong></td>
                    <td style="text-align: right;"><strong>${view.formatCurrency_(Math.abs(steuerSaldo))}</strong></td>
                    <td>${view.escapeHtml_(ergebnisText)}</td>
                </tr>
            `;

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            $tfootBuha.html(`
                <tr>
                    <th colspan="3">Summe Steuerkonten</th>
                    <th style="text-align: right;">${view.formatCurrency_(totalSoll)}</th>
                    <th style="text-align: right;">${view.formatCurrency_(totalHaben)}</th>
                    <th colspan="3"></th>
                </tr>
                <tr>
                    <th colspan="5">Umsatzsteuer ./. Vorsteuer</th>
                    <th style="text-align: right;">${view.formatCurrency_(steuerSaldo)}</th>
                    <th colspan="2">${view.escapeHtml_(ergebnisLabel)}</th>
                </tr>
            `);

            this.updateKennzahlen(view, totalUmsatzsteuer, totalVorsteuer, steuerSaldo, list.length);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, umsatzsteuer, vorsteuer, steuerSaldo, anzahlKonten) {
            view.$el.find('.kb-kpi-ust').text(view.formatCurrency_(umsatzsteuer));
            view.$el.find('.kb-kpi-vorsteuer').text(view.formatCurrency_(vorsteuer));

            if (Math.abs(Number(steuerSaldo || 0)) < 0.005) {
                steuerSaldo = 0;
            }

            view.$el.find('.kb-kpi-steuersaldo').text(view.formatCurrency_(steuerSaldo));

            let ergebnis = 'Ausgeglichen';

            if (steuerSaldo > 0) {
                ergebnis = 'Zahllast';
            }

            if (steuerSaldo < 0) {
                ergebnis = 'Erstattung';
            }

            view.$el.find('.kb-kpi-ergebnis').text(ergebnis);

            view.$el.find('.kb-kpi-steuersaldo')
                .removeClass('text-success text-danger');

            view.$el.find('.kb-kpi-ergebnis')
                .removeClass('text-success text-danger');

            if (steuerSaldo > 0) {
                view.$el.find('.kb-kpi-steuersaldo').addClass('text-danger');
                view.$el.find('.kb-kpi-ergebnis').addClass('text-danger');
            } else {
                view.$el.find('.kb-kpi-steuersaldo').addClass('text-success');
                view.$el.find('.kb-kpi-ergebnis').addClass('text-success');
            }
        },

        updateInfoZeile(view, anzahl) {
            const von = view.model.get('zeitraumVon');
            const bis = view.model.get('zeitraumBis');

            let text = 'Gesamter verfügbarer Zeitraum';

            if (von && bis) {
                text = `${view.formatDateGerman_(von)} – ${view.formatDateGerman_(bis)}`;
            } else if (von) {
                text = `ab ${view.formatDateGerman_(von)}`;
            } else if (bis) {
                text = `bis ${view.formatDateGerman_(bis)}`;
            }

            view.$el.find('.kb-info-zeitraum').text(text);
            view.$el.find('.kb-info-anzahl').text(anzahl);
        },

        detectSteuerart(b) {
            const kontoNummer = String(this.getValue(b, ['kontoNummer', 'konto_nummer']) || '').trim();
            const kontoBezeichnung = String(this.getValue(b, ['kontoBezeichnung', 'konto_bezeichnung']) || '').toLowerCase();

            if (
                kontoNummer === '3806' ||
                kontoBezeichnung.includes('umsatzsteuer')
            ) {
                return 'umsatzsteuer';
            }

            if (
                kontoNummer === '1401' ||
                kontoNummer === '1406' ||
                kontoBezeichnung.includes('vorsteuer')
            ) {
                return 'vorsteuer';
            }

            return null;
        },

        getValue(record, names) {
            for (let i = 0; i < names.length; i++) {
                if (record[names[i]] !== undefined && record[names[i]] !== null) {
                    return record[names[i]];
                }
            }

            return null;
        },

        toNumber(value) {
            if (value === null || value === undefined || value === '') {
                return 0;
            }

            if (typeof value === 'number') {
                return value;
            }

            return parseFloat(String(value).replace(',', '.')) || 0;
        }
    };
});