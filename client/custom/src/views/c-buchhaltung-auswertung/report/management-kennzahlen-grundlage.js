// custom:views/c-buchhaltung-auswertung/report/management-kennzahlen-grundlage
// Что это:
// Phase 6 Bericht: Management-Kennzahlen-Grundlage.
//
// Зачем:
// Строит базовые управленческие Kennzahlen на основе CBuchung.
// Это не новый бухгалтерский источник, а kompakte Übersicht поверх journalbasierter Buchungen.

console.log('[LOAD] custom:views/c-buchhaltung-auswertung/report/management-kennzahlen-grundlage');

define('custom:views/c-buchhaltung-auswertung/report/management-kennzahlen-grundlage', [], function () {
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
                                    <div><strong>Umsatz netto</strong></div>
                                    <div class="kb-kpi-umsatz" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Aufwand netto</strong></div>
                                    <div class="kb-kpi-aufwand" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Basis-Ergebnis</strong></div>
                                    <div class="kb-kpi-ergebnis" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Bank-Saldo</strong></div>
                                    <div class="kb-kpi-bank" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                        </div>

                        <div class="row" style="margin-top: 12px;">
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Offene Forderungen</strong></div>
                                    <div class="kb-kpi-forderungen" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Offene Verbindlichkeiten</strong></div>
                                    <div class="kb-kpi-verbindlichkeiten" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Steuer-Saldo</strong></div>
                                    <div class="kb-kpi-steuer" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Liquiditätsbewegung</strong></div>
                                    <div class="kb-kpi-liquiditaet" style="font-size: 22px;">0,00 €</div>
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
                            Ausgewertete Konten: <strong><span class="kb-info-anzahl">0</span></strong>
                            <br>
                            <span class="text-muted">
                                Management-Grundlage auf Basis von CBuchung. Keine neue Buchungslogik, sondern Zusammenfassung geprüfter Journalwerte.
                            </span>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte Kennzahlenbasis für spätere Management-Dashboards.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Kennzahl</th>
                                            <th style="text-align: right;">Wert</th>
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
                            <p>Prüfansicht der verwendeten Konten und Berechnungslogik für die Management-Kennzahlen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th style="width: 100px;">Konto</th>
                                            <th>Bezeichnung</th>
                                            <th>Kategorie</th>
                                            <th style="text-align: right;">Soll</th>
                                            <th style="text-align: right;">Haben</th>
                                            <th style="text-align: right;">Saldo</th>
                                            <th style="text-align: right;">Wirkung</th>
                                            <th style="text-align: right;">Buchungen</th>
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
                const data = this.buildData(buchungen);
                this.render(view, data);
            }).catch((err) => {
                console.error('[ManagementKennzahlenGrundlage] load failed', err);
                view.notify('Fehler beim Laden der Management-Kennzahlen-Grundlage', 'error');
                this.render(view, {
                    rows: [],
                    totals: this.emptyTotals()
                });
            });
        },

        buildData(buchungen) {
            const map = {};

            buchungen.forEach((b) => {
                const kontoNummer = this.getValue(b, ['kontoNummer', 'konto_nummer']) || 'ohne Konto';
                const kontoBezeichnung = this.getValue(b, ['kontoBezeichnung', 'konto_bezeichnung']) || '';
                const buchungsart = this.getValue(b, ['buchungsart']) || '';
                const betrag = this.toNumber(this.getValue(b, ['betrag']));

                if (!map[kontoNummer]) {
                    map[kontoNummer] = {
                        kontoNummer: kontoNummer,
                        kontoBezeichnung: kontoBezeichnung,
                        kategorie: this.detectKategorie(kontoNummer, kontoBezeichnung),
                        soll: 0,
                        haben: 0,
                        saldo: 0,
                        wirkung: 0,
                        count: 0
                    };
                }

                if (buchungsart === 'debit') {
                    map[kontoNummer].soll += betrag;
                    map[kontoNummer].saldo += betrag;
                }

                if (buchungsart === 'credit') {
                    map[kontoNummer].haben += betrag;
                    map[kontoNummer].saldo -= betrag;
                }

                map[kontoNummer].count++;
            });

            const rows = Object.keys(map).map(key => {
                const row = map[key];

                row.wirkung = this.calculateWirkung(row);

                return row;
            });

            rows.sort((a, b) => {
                return String(a.kontoNummer).localeCompare(String(b.kontoNummer), 'de', {
                    numeric: true
                });
            });

            const totals = this.calculateTotals(rows);

            return {
                rows: rows,
                totals: totals
            };
        },

        calculateTotals(rows) {
            const totals = this.emptyTotals();

            rows.forEach((row) => {
                const kategorie = row.kategorie;
                const wirkung = Number(row.wirkung || 0);
                const saldo = Number(row.saldo || 0);

                if (kategorie === 'umsatz') {
                    totals.umsatz += wirkung;
                }

                if (kategorie === 'aufwand') {
                    totals.aufwand += wirkung;
                }

                if (kategorie === 'forderungen') {
                    totals.forderungen += saldo;
                }

                if (kategorie === 'verbindlichkeiten') {
                    totals.verbindlichkeiten += saldo * -1;
                }

                if (kategorie === 'bank') {
                    totals.bank += saldo;
                    totals.zahlungseingaenge += Number(row.soll || 0);
                    totals.zahlungsausgaenge += Number(row.haben || 0);
                }

                if (kategorie === 'umsatzsteuer') {
                    totals.umsatzsteuer += wirkung;
                }

                if (kategorie === 'vorsteuer') {
                    totals.vorsteuer += wirkung;
                }
            });

            totals.ergebnis = totals.umsatz - totals.aufwand;
            totals.steuerSaldo = totals.umsatzsteuer - totals.vorsteuer;
            totals.liquiditaetsbewegung = totals.zahlungseingaenge - totals.zahlungsausgaenge;

            return totals;
        },

        emptyTotals() {
            return {
                umsatz: 0,
                aufwand: 0,
                ergebnis: 0,
                forderungen: 0,
                verbindlichkeiten: 0,
                bank: 0,
                umsatzsteuer: 0,
                vorsteuer: 0,
                steuerSaldo: 0,
                zahlungseingaenge: 0,
                zahlungsausgaenge: 0,
                liquiditaetsbewegung: 0
            };
        },

        detectKategorie(kontoNummer, kontoBezeichnung) {
            const konto = String(kontoNummer || '').trim();
            const text = String(kontoBezeichnung || '').toLowerCase();

            if (konto === '1200') {
                return 'forderungen';
            }

            if (konto === '3300') {
                return 'verbindlichkeiten';
            }

            if (konto === '1800') {
                return 'bank';
            }

            if (konto === '3806' || text.includes('umsatzsteuer')) {
                return 'umsatzsteuer';
            }

            if (konto === '1401' || konto === '1406' || text.includes('vorsteuer')) {
                return 'vorsteuer';
            }

            if (konto === '4400' || text.includes('erlöse') || text.includes('erloese')) {
                return 'umsatz';
            }

            if (konto === '6300' || text.includes('aufwendung') || text.includes('aufwand')) {
                return 'aufwand';
            }

            return 'sonstige';
        },

        calculateWirkung(row) {
            const kategorie = row.kategorie;
            const soll = Number(row.soll || 0);
            const haben = Number(row.haben || 0);
            const saldo = Number(row.saldo || 0);

            if (kategorie === 'umsatz') {
                return haben - soll;
            }

            if (kategorie === 'aufwand') {
                return soll - haben;
            }

            if (kategorie === 'umsatzsteuer') {
                return haben - soll;
            }

            if (kategorie === 'vorsteuer') {
                return soll - haben;
            }

            if (kategorie === 'verbindlichkeiten') {
                return saldo * -1;
            }

            return saldo;
        },

        render(view, data) {
            const rows = data.rows || [];
            const totals = data.totals || this.emptyTotals();

            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');
            const $tfootBuha = view.$el.find('.kb-tfoot-buha');

            if (!rows.length) {
                $tbodyGf.html('<tr><td colspan="3" class="text-muted">Keine Buchungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="8" class="text-muted">Keine Buchungen gefunden.</td></tr>');
                $tfootBuha.html('');
                this.updateKennzahlen(view, totals);
                this.updateInfoZeile(view, 0);
                return;
            }

            const htmlGf = this.renderGfRows(view, totals);
            const htmlBuha = this.renderBuhaRows(view, rows);

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            $tfootBuha.html(`
                <tr>
                    <th colspan="6">Basis-Ergebnis Umsatz ./. Aufwand</th>
                    <th style="text-align: right;">${view.formatCurrency_(totals.ergebnis)}</th>
                    <th></th>
                </tr>
                <tr>
                    <th colspan="6">Steuer-Saldo Umsatzsteuer ./. Vorsteuer</th>
                    <th style="text-align: right;">${view.formatCurrency_(totals.steuerSaldo)}</th>
                    <th></th>
                </tr>
                <tr>
                    <th colspan="6">Liquiditätsbewegung Bank Soll ./. Bank Haben</th>
                    <th style="text-align: right;">${view.formatCurrency_(totals.liquiditaetsbewegung)}</th>
                    <th></th>
                </tr>
            `);

            this.updateKennzahlen(view, totals);
            this.updateInfoZeile(view, rows.filter(row => row.kategorie !== 'sonstige').length);
        },

        renderGfRows(view, totals) {
            const ergebnisClass = totals.ergebnis < 0 ? 'text-danger' : 'text-success';
            const bankClass = totals.bank < 0 ? 'text-danger' : 'text-success';
            const steuerClass = totals.steuerSaldo > 0 ? 'text-danger' : 'text-success';

            return `
                <tr>
                    <td><strong>Umsatz netto</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totals.umsatz)}</td>
                    <td>Erlöswirkung aus journalisierten Ausgangsrechnungen.</td>
                </tr>
                <tr>
                    <td><strong>Aufwand netto</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totals.aufwand)}</td>
                    <td>Aufwandswirkung aus journalisierten Eingangsrechnungen.</td>
                </tr>
                <tr>
                    <td><strong>Basis-Ergebnis</strong></td>
                    <td style="text-align: right;" class="${ergebnisClass}">
                        <strong>${view.formatCurrency_(totals.ergebnis)}</strong>
                    </td>
                    <td>Umsatz netto abzüglich Aufwand netto. Noch keine vollständige BWA.</td>
                </tr>
                <tr>
                    <td><strong>Offene Forderungen</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totals.forderungen)}</td>
                    <td>Journal-Saldo Konto 1200.</td>
                </tr>
                <tr>
                    <td><strong>Offene Verbindlichkeiten</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totals.verbindlichkeiten)}</td>
                    <td>Journal-Saldo Konto 3300 als positive Verbindlichkeit dargestellt.</td>
                </tr>
                <tr>
                    <td><strong>Bank-Saldo</strong></td>
                    <td style="text-align: right;" class="${bankClass}">
                        <strong>${view.formatCurrency_(totals.bank)}</strong>
                    </td>
                    <td>Journal-Saldo Konto 1800.</td>
                </tr>
                <tr>
                    <td><strong>Steuer-Saldo</strong></td>
                    <td style="text-align: right;" class="${steuerClass}">
                        <strong>${view.formatCurrency_(totals.steuerSaldo)}</strong>
                    </td>
                    <td>Umsatzsteuer abzüglich Vorsteuer. Positiv = Zahllast.</td>
                </tr>
                <tr>
                    <td><strong>Zahlungseingänge</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totals.zahlungseingaenge)}</td>
                    <td>Bank-Sollbuchungen im ausgewählten Zeitraum.</td>
                </tr>
                <tr>
                    <td><strong>Zahlungsausgänge</strong></td>
                    <td style="text-align: right;">${view.formatCurrency_(totals.zahlungsausgaenge)}</td>
                    <td>Bank-Habenbuchungen im ausgewählten Zeitraum.</td>
                </tr>
                <tr>
                    <td><strong>Liquiditätsbewegung</strong></td>
                    <td style="text-align: right;">
                        <strong>${view.formatCurrency_(totals.liquiditaetsbewegung)}</strong>
                    </td>
                    <td>Zahlungseingänge abzüglich Zahlungsausgänge.</td>
                </tr>
            `;
        },

        renderBuhaRows(view, rows) {
            let html = '';

            rows.forEach((row) => {
                if (row.kategorie === 'sonstige') {
                    return;
                }

                html += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.kontoNummer)}</strong></td>
                        <td>${view.escapeHtml_(row.kontoBezeichnung || '—')}</td>
                        <td>${view.escapeHtml_(this.formatKategorie(row.kategorie))}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.soll)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.haben)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.saldo)}</td>
                        <td style="text-align: right;"><strong>${view.formatCurrency_(row.wirkung)}</strong></td>
                        <td style="text-align: right;">${row.count}</td>
                    </tr>
                `;
            });

            return html || '<tr><td colspan="8" class="text-muted">Keine relevanten Konten gefunden.</td></tr>';
        },

        updateKennzahlen(view, totals) {
            view.$el.find('.kb-kpi-umsatz').text(view.formatCurrency_(totals.umsatz));
            view.$el.find('.kb-kpi-aufwand').text(view.formatCurrency_(totals.aufwand));
            view.$el.find('.kb-kpi-ergebnis').text(view.formatCurrency_(totals.ergebnis));
            view.$el.find('.kb-kpi-bank').text(view.formatCurrency_(totals.bank));
            view.$el.find('.kb-kpi-forderungen').text(view.formatCurrency_(totals.forderungen));
            view.$el.find('.kb-kpi-verbindlichkeiten').text(view.formatCurrency_(totals.verbindlichkeiten));
            view.$el.find('.kb-kpi-steuer').text(view.formatCurrency_(totals.steuerSaldo));
            view.$el.find('.kb-kpi-liquiditaet').text(view.formatCurrency_(totals.liquiditaetsbewegung));

            view.$el.find('.kb-kpi-ergebnis, .kb-kpi-bank, .kb-kpi-steuer, .kb-kpi-liquiditaet')
                .removeClass('text-success text-danger');

            if (Number(totals.ergebnis || 0) < 0) {
                view.$el.find('.kb-kpi-ergebnis').addClass('text-danger');
            } else {
                view.$el.find('.kb-kpi-ergebnis').addClass('text-success');
            }

            if (Number(totals.bank || 0) < 0) {
                view.$el.find('.kb-kpi-bank').addClass('text-danger');
            } else {
                view.$el.find('.kb-kpi-bank').addClass('text-success');
            }

            if (Number(totals.steuerSaldo || 0) > 0) {
                view.$el.find('.kb-kpi-steuer').addClass('text-danger');
            } else {
                view.$el.find('.kb-kpi-steuer').addClass('text-success');
            }

            if (Number(totals.liquiditaetsbewegung || 0) < 0) {
                view.$el.find('.kb-kpi-liquiditaet').addClass('text-danger');
            } else {
                view.$el.find('.kb-kpi-liquiditaet').addClass('text-success');
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

        formatKategorie(value) {
            if (value === 'umsatz') return 'Umsatz';
            if (value === 'aufwand') return 'Aufwand';
            if (value === 'forderungen') return 'Forderungen';
            if (value === 'verbindlichkeiten') return 'Verbindlichkeiten';
            if (value === 'bank') return 'Bank';
            if (value === 'umsatzsteuer') return 'Umsatzsteuer';
            if (value === 'vorsteuer') return 'Vorsteuer';
            return 'Sonstige';
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