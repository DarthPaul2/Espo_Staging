// custom:views/c-buchhaltung-auswertung/report/kontenblatt
// Что это:
// Phase 6 Bericht: Kontenblatt.
//
// Зачем:
// Показывает Einzelbuchungen для выбранного Kontos на основе CBuchung.
// Это детализация Summen- und Saldenliste до уровня отдельных Buchungssätze.

console.log('[LOAD] custom:views/c-buchhaltung-auswertung/report/kontenblatt');

define('custom:views/c-buchhaltung-auswertung/report/kontenblatt', [], function () {
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
                                    <div><strong>Konto</strong></div>
                                    <div class="kb-kpi-konto" style="font-size: 22px;">–</div>
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
                                    <div><strong>Saldo</strong></div>
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
                            Konto: <strong><span class="kb-info-konto">–</span></strong>
                            &nbsp;|&nbsp;
                            Buchungen: <strong><span class="kb-info-anzahl">0</span></strong>
                            <br>
                            <span class="text-muted">
                                Journalbasierte Detailansicht aus CBuchung. Storno-Buchungen werden mitgerechnet.
                            </span>
                        </div>

                        <div class="row" style="margin-bottom: 15px;">
                            <div class="col-sm-6">
                                <label class="control-label">Konto auswählen</label>
                                <select class="form-control" data-name="kb-konto-select">
                                    <option value="">Buchungen werden geladen ...</option>
                                </select>
                            </div>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte Kontenansicht mit Soll, Haben und Saldo für das ausgewählte Konto.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Konto</th>
                                            <th>Bezeichnung</th>
                                            <th style="text-align: right;">Summe Soll</th>
                                            <th style="text-align: right;">Summe Haben</th>
                                            <th style="text-align: right;">Saldo</th>
                                            <th style="text-align: right;">Buchungen</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-gf">
                                        <tr>
                                            <td colspan="6" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Einzelbuchungen des ausgewählten Kontos mit laufendem Saldo.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th style="width: 110px;">Belegdatum</th>
                                            <th style="width: 190px;">Quelle</th>
                                            <th>Buchungstext</th>
                                            <th style="text-align: right; width: 130px;">Soll</th>
                                            <th style="text-align: right; width: 130px;">Haben</th>
                                            <th style="text-align: right; width: 130px;">Laufender Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="6" class="text-muted">Noch keine Daten geladen.</td>
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

            this.bindUi(view);
        },

        bindUi(view) {
            view.$el.off('change.kbKontenblatt', '[data-name="kb-konto-select"]');

            view.$el.on('change.kbKontenblatt', '[data-name="kb-konto-select"]', (e) => {
                const kontoNummer = $(e.currentTarget).val();

                this.selectedKontoNummer = kontoNummer;
                this.renderSelectedKonto(view);
            });
        },

        load(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            const allRows = [];

            const loadPage = (offset) => {
                const params = {
                    maxSize: 200,
                    offset: offset,
                    orderBy: 'belegdatum',
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
                this.allBuchungen = this.sortBuchungen(buchungen);
                this.konten = this.buildKontenList(this.allBuchungen);

                this.renderKontoSelect(view);

                if (!this.selectedKontoNummer && this.konten.length) {
                    this.selectedKontoNummer = this.konten[0].kontoNummer;
                }

                view.$el.find('[data-name="kb-konto-select"]').val(this.selectedKontoNummer);

                this.renderSelectedKonto(view);
            }).catch((err) => {
                console.error('[Kontenblatt] load failed', err);
                view.notify('Fehler beim Laden des Kontenblatts', 'error');
                this.allBuchungen = [];
                this.konten = [];
                this.renderEmpty(view, 'Fehler beim Laden des Kontenblatts.');
            });
        },

        sortBuchungen(buchungen) {
            return buchungen.sort((a, b) => {
                const dateA = this.getValue(a, ['belegdatum', 'belegDatum']) || '';
                const dateB = this.getValue(b, ['belegdatum', 'belegDatum']) || '';

                if (dateA !== dateB) {
                    return String(dateA).localeCompare(String(dateB));
                }

                const createdA = this.getValue(a, ['createdAt']) || '';
                const createdB = this.getValue(b, ['createdAt']) || '';

                return String(createdA).localeCompare(String(createdB));
            });
        },

        buildKontenList(buchungen) {
            const map = {};

            buchungen.forEach((b) => {
                const kontoNummer = this.getValue(b, ['kontoNummer', 'konto_nummer']) || 'ohne Konto';
                const kontoBezeichnung = this.getValue(b, ['kontoBezeichnung', 'konto_bezeichnung']) || '';

                if (!map[kontoNummer]) {
                    map[kontoNummer] = {
                        kontoNummer: kontoNummer,
                        kontoBezeichnung: kontoBezeichnung
                    };
                }
            });

            const list = Object.keys(map).map(key => map[key]);

            list.sort((a, b) => {
                return String(a.kontoNummer).localeCompare(String(b.kontoNummer), 'de', {
                    numeric: true
                });
            });

            return list;
        },

        renderKontoSelect(view) {
            const $select = view.$el.find('[data-name="kb-konto-select"]');

            if (!this.konten.length) {
                $select.html('<option value="">Keine Konten gefunden</option>');
                return;
            }

            let html = '';

            this.konten.forEach((konto) => {
                html += `
                    <option value="${view.escapeHtml_(konto.kontoNummer)}">
                        ${view.escapeHtml_(konto.kontoNummer)} — ${view.escapeHtml_(konto.kontoBezeichnung || '')}
                    </option>
                `;
            });

            $select.html(html);
        },

        renderSelectedKonto(view) {
            if (!this.selectedKontoNummer) {
                this.renderEmpty(view, 'Bitte Konto auswählen.');
                return;
            }

            const rows = (this.allBuchungen || []).filter((b) => {
                const kontoNummer = this.getValue(b, ['kontoNummer', 'konto_nummer']) || 'ohne Konto';
                return String(kontoNummer) === String(this.selectedKontoNummer);
            });

            this.render(view, rows);
        },

        render(view, rows) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');
            const $tfootBuha = view.$el.find('.kb-tfoot-buha');

            if (!rows.length) {
                this.renderEmpty(view, 'Keine Buchungen für dieses Konto gefunden.');
                return;
            }

            const first = rows[0];

            const kontoNummer = this.getValue(first, ['kontoNummer', 'konto_nummer']) || 'ohne Konto';
            const kontoBezeichnung = this.getValue(first, ['kontoBezeichnung', 'konto_bezeichnung']) || '';

            let totalSoll = 0;
            let totalHaben = 0;
            let laufenderSaldo = 0;

            let htmlBuha = '';

            rows.forEach((b) => {
                const buchungsart = this.getValue(b, ['buchungsart']) || '';
                const betrag = this.toNumber(this.getValue(b, ['betrag']));

                let soll = 0;
                let haben = 0;

                if (buchungsart === 'debit') {
                    soll = betrag;
                    totalSoll += betrag;
                    laufenderSaldo += betrag;
                }

                if (buchungsart === 'credit') {
                    haben = betrag;
                    totalHaben += betrag;
                    laufenderSaldo -= betrag;
                }

                const saldoClass = laufenderSaldo < 0 ? 'text-danger' : '';

                const belegdatum = this.getValue(b, ['belegdatum', 'belegDatum']);
                const quelle = this.getQuelleText(view, b);
                const buchungstext = this.getValue(b, ['buchungstext', 'name', 'description']) || '';

                htmlBuha += `
                    <tr>
                        <td>${view.escapeHtml_(view.formatDateGerman_(belegdatum) || '—')}</td>
                        <td style="white-space: nowrap;">${view.escapeHtml_(quelle || '—')}</td>
                        <td>${view.escapeHtml_(buchungstext || '—')}</td>
                        <td style="text-align: right;">${soll ? view.formatCurrency_(soll) : ''}</td>
                        <td style="text-align: right;">${haben ? view.formatCurrency_(haben) : ''}</td>
                        <td style="text-align: right;" class="${saldoClass}">
                            <strong>${view.formatCurrency_(laufenderSaldo)}</strong>
                        </td>
                    </tr>
                `;
            });

            const saldo = totalSoll - totalHaben;
            const saldoClass = saldo < 0 ? 'text-danger' : '';

            const htmlGf = `
                <tr>
                    <td><strong>${view.escapeHtml_(kontoNummer)}</strong></td>
                    <td>${view.escapeHtml_(kontoBezeichnung || '—')}</td>
                    <td style="text-align: right;">${view.formatCurrency_(totalSoll)}</td>
                    <td style="text-align: right;">${view.formatCurrency_(totalHaben)}</td>
                    <td style="text-align: right;" class="${saldoClass}">
                        <strong>${view.formatCurrency_(saldo)}</strong>
                    </td>
                    <td style="text-align: right;">${rows.length}</td>
                </tr>
            `;

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            $tfootBuha.html(`
                <tr>
                    <th colspan="3">Summe</th>
                    <th style="text-align: right;">${view.formatCurrency_(totalSoll)}</th>
                    <th style="text-align: right;">${view.formatCurrency_(totalHaben)}</th>
                    <th style="text-align: right;">${view.formatCurrency_(saldo)}</th>
                </tr>
            `);

            this.updateKennzahlen(view, kontoNummer, totalSoll, totalHaben, saldo);
            this.updateInfoZeile(view, rows.length, kontoNummer);
        },

        renderEmpty(view, message) {
            view.$el.find('.kb-tbody-gf').html(
                '<tr><td colspan="6" class="text-muted">' + view.escapeHtml_(message) + '</td></tr>'
            );

            view.$el.find('.kb-tbody-buha').html(
                '<tr><td colspan="6" class="text-muted">' + view.escapeHtml_(message) + '</td></tr>'
            );

            view.$el.find('.kb-tfoot-buha').html('');

            this.updateKennzahlen(view, '–', 0, 0, 0);
            this.updateInfoZeile(view, 0, '–');
        },

        updateKennzahlen(view, konto, soll, haben, saldo) {
            view.$el.find('.kb-kpi-konto').text(konto || '–');
            view.$el.find('.kb-kpi-soll').text(view.formatCurrency_(soll));
            view.$el.find('.kb-kpi-haben').text(view.formatCurrency_(haben));
            view.$el.find('.kb-kpi-saldo').text(view.formatCurrency_(saldo));

            if (Number(saldo || 0) < 0) {
                view.$el.find('.kb-kpi-saldo')
                    .removeClass('text-success')
                    .addClass('text-danger');
            } else {
                view.$el.find('.kb-kpi-saldo')
                    .removeClass('text-danger')
                    .addClass('text-success');
            }
        },

        updateInfoZeile(view, anzahl, konto) {
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
            view.$el.find('.kb-info-konto').text(konto || '–');
        },

        getQuelleText(view, b) {
            const quelleTyp = this.getValue(b, ['quelleTyp', 'quelle_typ']) || '';
            const quelleNummer = this.getValue(b, ['quelleNummer', 'quelle_nummer']) || '';
            const journalName = this.getValue(b, ['buchungsjournalName', 'buchungsJournalName']) || '';

            if (quelleTyp && quelleNummer) {
                return quelleTyp + ' ' + quelleNummer;
            }

            if (quelleNummer) {
                return quelleNummer;
            }

            if (journalName) {
                return journalName;
            }

            return '';
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