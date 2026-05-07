// custom:views/c-buchhaltung-auswertung/report/summen-saldenliste
// Что это:
// Phase 6 Bericht: Summen- und Saldenliste.
//
// Зачем:
// Строит journalbasierte Summen- und Saldenliste на основе CBuchung.
// Storno-Buchungen НЕ исключаются, потому что они являются частью корректной бухгалтерской Wirkung.

console.log('[LOAD] custom:views/c-buchhaltung-auswertung/report/summen-saldenliste');

define('custom:views/c-buchhaltung-auswertung/report/summen-saldenliste', [], function () {
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
                                    <div><strong>Konten</strong></div>
                                    <div class="kb-kpi-konten" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Soll</strong></div>
                                    <div class="kb-kpi-soll" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Haben</strong></div>
                                    <div class="kb-kpi-haben" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Prüfsaldo Soll/Haben</strong></div>
                                    <div class="kb-kpi-saldo" style="font-size: 22px;">0,00 €</div>
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
                            Konten: <strong><span class="kb-info-anzahl">0</span></strong>
                            <br>
                            <span class="text-muted">
                                Journalbasierte Auswertung aus CBuchung. Storno-Buchungen werden mitgerechnet.
                            </span>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte Übersicht über Kontensalden als Grundlage für spätere Management-Dashboards.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Konto</th>
                                            <th>Bezeichnung</th>
                                            <th style="text-align: right;">Saldo</th>
                                            <th style="text-align: right;">Buchungen</th>
                                            <th>Letzte Buchung</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-gf">
                                        <tr>
                                            <td colspan="5" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Prüfansicht mit Soll, Haben, Saldo, Anzahl Buchungen und letzter Buchung je Konto.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Konto</th>
                                            <th>Bezeichnung</th>
                                            <th style="text-align: right;">Soll</th>
                                            <th style="text-align: right;">Haben</th>
                                            <th style="text-align: right;">Saldo</th>
                                            <th style="text-align: right;">Buchungen</th>
                                            <th>Letzte Buchung</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
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
                const list = this.buildRows(view, buchungen);
                this.render(view, list);
            }).catch((err) => {
                console.error('[SummenSaldenliste] load failed', err);
                view.notify('Fehler beim Laden der Summen- und Saldenliste', 'error');
                this.render(view, []);
            });
        },

        buildRows(view, buchungen) {
            const map = {};

            buchungen.forEach((b) => {
                const kontoNummer = this.getValue(b, ['kontoNummer', 'konto_nummer']) || 'ohne Konto';
                const kontoBezeichnung = this.getValue(b, ['kontoBezeichnung', 'konto_bezeichnung']) || '';

                const buchungsart = this.getValue(b, ['buchungsart']) || '';
                const betrag = this.toNumber(this.getValue(b, ['betrag']));
                const belegdatum = this.getValue(b, ['belegdatum', 'belegDatum']);

                if (!map[kontoNummer]) {
                    map[kontoNummer] = {
                        kontoNummer: kontoNummer,
                        kontoBezeichnung: kontoBezeichnung,
                        soll: 0,
                        haben: 0,
                        saldo: 0,
                        count: 0,
                        letzteBuchung: null
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

                if (belegdatum) {
                    if (!map[kontoNummer].letzteBuchung || belegdatum > map[kontoNummer].letzteBuchung) {
                        map[kontoNummer].letzteBuchung = belegdatum;
                    }
                }
            });

            const rows = Object.keys(map).map(key => map[key]);

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
                $tbodyGf.html('<tr><td colspan="5" class="text-muted">Keine Buchungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="7" class="text-muted">Keine Buchungen gefunden.</td></tr>');
                $tfootBuha.html('');

                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            let totalSoll = 0;
            let totalHaben = 0;
            let totalSaldo = 0;

            list.forEach((row) => {
                totalSoll += Number(row.soll || 0);
                totalHaben += Number(row.haben || 0);
                totalSaldo += Number(row.saldo || 0);

                const saldoClass = Number(row.saldo || 0) < 0 ? 'text-danger' : '';

                htmlGf += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.kontoNummer)}</strong></td>
                        <td>${view.escapeHtml_(row.kontoBezeichnung || '—')}</td>
                        <td style="text-align: right;" class="${saldoClass}">
                            <strong>${view.formatCurrency_(row.saldo)}</strong>
                        </td>
                        <td style="text-align: right;">${row.count}</td>
                        <td>${view.escapeHtml_(view.formatDateGerman_(row.letzteBuchung) || '—')}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.kontoNummer)}</strong></td>
                        <td>${view.escapeHtml_(row.kontoBezeichnung || '—')}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.soll)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.haben)}</td>
                        <td style="text-align: right;" class="${saldoClass}">
                            <strong>${view.formatCurrency_(row.saldo)}</strong>
                        </td>
                        <td style="text-align: right;">${row.count}</td>
                        <td>${view.escapeHtml_(view.formatDateGerman_(row.letzteBuchung) || '—')}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            $tfootBuha.html(`
                <tr>
                    <th colspan="2">Summe</th>
                    <th style="text-align: right;">${view.formatCurrency_(totalSoll)}</th>
                    <th style="text-align: right;">${view.formatCurrency_(totalHaben)}</th>
                    <th style="text-align: right;">${view.formatCurrency_(totalSaldo)}</th>
                    <th colspan="2"></th>
                </tr>
            `);

            this.updateKennzahlen(view, list.length, totalSoll, totalHaben, totalSaldo);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, konten, soll, haben, saldo) {
            view.$el.find('.kb-kpi-konten').text(konten);
            view.$el.find('.kb-kpi-soll').text(view.formatCurrency_(soll));
            view.$el.find('.kb-kpi-haben').text(view.formatCurrency_(haben));
            view.$el.find('.kb-kpi-saldo').text(view.formatCurrency_(saldo));

            if (Math.abs(Number(saldo || 0)) < 0.01) {
                view.$el.find('.kb-kpi-saldo')
                    .removeClass('text-danger')
                    .addClass('text-success');
            } else {
                view.$el.find('.kb-kpi-saldo')
                    .removeClass('text-success')
                    .addClass('text-danger');
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