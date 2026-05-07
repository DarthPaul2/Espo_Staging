// custom:views/c-buchhaltung-auswertung/report/offene-posten-abstimmung
// Что это:
// Phase 6 Bericht: Offene-Posten-Abstimmung.
//
// Зачем:
// Сравнивает journalbasierte Salden aus CBuchung с operativen Restbeträgen:
// - Konto 1200 Forderungen gegen CRechnung.restbetragOffen
// - Konto 3300 Verbindlichkeiten gegen CEingangsrechnung.restbetragOffen
//
// Важно:
// Это НЕ список offenen Forderungen/Verbindlichkeiten.
// Это контроль расхождений между Buchungsjournal и Operativdaten.

console.log('[LOAD] custom:views/c-buchhaltung-auswertung/report/offene-posten-abstimmung');

define('custom:views/c-buchhaltung-auswertung/report/offene-posten-abstimmung', [], function () {
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
                                    <div><strong>Forderungen Differenz</strong></div>
                                    <div class="kb-kpi-diff-forderungen" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Verbindlichkeiten Differenz</strong></div>
                                    <div class="kb-kpi-diff-verbindlichkeiten" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Gesamtdifferenz</strong></div>
                                    <div class="kb-kpi-diff-gesamt" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Status</strong></div>
                                    <div class="kb-kpi-status" style="font-size: 22px;">–</div>
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
                            Prüfbereiche: <strong><span class="kb-info-anzahl">2</span></strong>
                            <br>
                            <span class="text-muted">
                                Abstimmung zwischen CBuchung-Kontensalden und operativen Restbeträgen aus Rechnungen und Eingangsrechnungen.
                            </span>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte Kontrollsicht, ob offene Forderungen und offene Verbindlichkeiten laut Buchungsjournal mit den operativen Restbeträgen übereinstimmen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bereich</th>
                                            <th style="text-align: right;">Journal</th>
                                            <th style="text-align: right;">Operativ</th>
                                            <th style="text-align: right;">Differenz</th>
                                            <th>Status</th>
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
                            <p>Prüfansicht der offenen Posten: Konto 1200 und Konto 3300 gegen operative Restbeträge.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bereich</th>
                                            <th>Konto</th>
                                            <th>Quelle Journal</th>
                                            <th>Quelle Operativ</th>
                                            <th style="text-align: right;">Journal-Saldo</th>
                                            <th style="text-align: right;">Operativer Restbetrag</th>
                                            <th style="text-align: right;">Differenz</th>
                                            <th style="text-align: right;">Anzahl operative Belege</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="9" class="text-muted">Noch keine Daten geladen.</td>
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
            Promise.all([
                this.loadBuchungen(view),
                this.loadOffeneForderungenOperativ(view),
                this.loadOffeneVerbindlichkeitenOperativ(view)
            ]).then((results) => {
                const buchungen = results[0] || [];
                const offeneForderungen = results[1] || [];
                const offeneVerbindlichkeiten = results[2] || [];

                const data = this.buildData(buchungen, offeneForderungen, offeneVerbindlichkeiten);

                this.render(view, data);
            }).catch((err) => {
                console.error('[OffenePostenAbstimmung] load failed', err);
                view.notify('Fehler beim Laden der Offene-Posten-Abstimmung', 'error');
                this.render(view, []);
            });
        },

        loadBuchungen(view) {
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

                params.where = [
                    {
                        type: 'in',
                        attribute: 'kontoNummer',
                        value: ['1200', '3300']
                    }
                ];

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

            return loadPage(0);
        },

        loadOffeneForderungenOperativ(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            return new Promise((resolve, reject) => {
                const where = [
                    {
                        type: 'equals',
                        attribute: 'buchhaltungStatus',
                        value: 'festgeschrieben'
                    },
                    {
                        type: 'greaterThan',
                        attribute: 'restbetragOffen',
                        value: 0
                    }
                ];

                if (zeitraumVon) {
                    where.push({
                        type: 'greaterThanOrEquals',
                        attribute: 'belegdatum',
                        value: zeitraumVon
                    });
                }

                if (zeitraumBis) {
                    where.push({
                        type: 'lessThanOrEquals',
                        attribute: 'belegdatum',
                        value: zeitraumBis
                    });
                }

                view.getCollectionFactory().create('CRechnung', (collection) => {
                    collection.maxSize = 500;

                    collection.data.select = [
                        'id',
                        'rechnungsnummer',
                        'belegdatum',
                        'betragBrutto',
                        'restbetragOffen',
                        'buchhaltungStatus',
                        'status',
                        'istStorniert'
                    ];

                    collection.data.where = where;

                    collection.fetch().then(() => {
                        let list = (collection.models || []).map(model => model.attributes || {});

                        list = list.filter(item => {
                            const buchhaltungStatus = String(item.buchhaltungStatus || '').trim();
                            const status = String(item.status || '').toLowerCase();
                            const istStorniert = !!item.istStorniert;

                            return (
                                buchhaltungStatus === 'festgeschrieben' &&
                                status !== 'storniert' &&
                                !istStorniert &&
                                Number(item.restbetragOffen || 0) > 0
                            );
                        });

                        resolve(list);
                    }).catch(reject);
                });
            });
        },

        loadOffeneVerbindlichkeitenOperativ(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            return new Promise((resolve, reject) => {
                const where = [
                    {
                        type: 'equals',
                        attribute: 'status',
                        value: 'festgeschrieben'
                    },
                    {
                        type: 'greaterThan',
                        attribute: 'restbetragOffen',
                        value: 0
                    }
                ];

                if (zeitraumVon) {
                    where.push({
                        type: 'greaterThanOrEquals',
                        attribute: 'belegdatum',
                        value: zeitraumVon
                    });
                }

                if (zeitraumBis) {
                    where.push({
                        type: 'lessThanOrEquals',
                        attribute: 'belegdatum',
                        value: zeitraumBis
                    });
                }

                view.getCollectionFactory().create('CEingangsrechnung', (collection) => {
                    collection.maxSize = 500;

                    collection.data.select = [
                        'id',
                        'eingangsrechnungsnummer',
                        'lieferantenRechnungsnummer',
                        'belegdatum',
                        'betragBrutto',
                        'restbetragOffen',
                        'status',
                        'zahlungsstatus',
                        'istStorniert'
                    ];

                    collection.data.where = where;

                    collection.fetch().then(() => {
                        let list = (collection.models || []).map(model => model.attributes || {});

                        list = list.filter(item => {
                            const status = String(item.status || '').toLowerCase();
                            const istStorniert = !!item.istStorniert;

                            return (
                                status === 'festgeschrieben' &&
                                !istStorniert &&
                                Number(item.restbetragOffen || 0) > 0
                            );
                        });

                        resolve(list);
                    }).catch(reject);
                });
            });
        },

        buildData(buchungen, offeneForderungen, offeneVerbindlichkeiten) {
            const saldo1200 = this.calculateSaldoForKonto(buchungen, '1200');
            const saldo3300 = this.calculateSaldoForKonto(buchungen, '3300');

            const journalForderungen = saldo1200;

            // Konto 3300 ist ein Passivkonto.
            // In unserer Saldenlogik gilt: Saldo = Soll - Haben.
            // Offene Verbindlichkeit wird deshalb positiv als -Saldo dargestellt.
            const journalVerbindlichkeiten = saldo3300 * -1;

            const operativForderungen = this.sumRestbetrag(offeneForderungen);
            const operativVerbindlichkeiten = this.sumRestbetrag(offeneVerbindlichkeiten);

            const diffForderungen = journalForderungen - operativForderungen;
            const diffVerbindlichkeiten = journalVerbindlichkeiten - operativVerbindlichkeiten;

            return [
                {
                    bereich: 'Offene Forderungen',
                    konto: '1200',
                    quelleJournal: 'CBuchung / Konto 1200',
                    quelleOperativ: 'CRechnung.restbetragOffen',
                    journal: journalForderungen,
                    operativ: operativForderungen,
                    differenz: diffForderungen,
                    count: offeneForderungen.length
                },
                {
                    bereich: 'Offene Verbindlichkeiten',
                    konto: '3300',
                    quelleJournal: 'CBuchung / Konto 3300',
                    quelleOperativ: 'CEingangsrechnung.restbetragOffen',
                    journal: journalVerbindlichkeiten,
                    operativ: operativVerbindlichkeiten,
                    differenz: diffVerbindlichkeiten,
                    count: offeneVerbindlichkeiten.length
                }
            ];
        },

        calculateSaldoForKonto(buchungen, kontoNummer) {
            let saldo = 0;

            buchungen.forEach((b) => {
                const konto = String(this.getValue(b, ['kontoNummer', 'konto_nummer']) || '').trim();

                if (konto !== String(kontoNummer)) {
                    return;
                }

                const buchungsart = this.getValue(b, ['buchungsart']) || '';
                const betrag = this.toNumber(this.getValue(b, ['betrag']));

                if (buchungsart === 'debit') {
                    saldo += betrag;
                }

                if (buchungsart === 'credit') {
                    saldo -= betrag;
                }
            });

            return saldo;
        },

        sumRestbetrag(list) {
            let sum = 0;

            (list || []).forEach((item) => {
                sum += this.toNumber(item.restbetragOffen);
            });

            return sum;
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');
            const $tfootBuha = view.$el.find('.kb-tfoot-buha');

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="5" class="text-muted">Keine Daten gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="9" class="text-muted">Keine Daten gefunden.</td></tr>');
                $tfootBuha.html('');
                this.updateKennzahlen(view, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            let diffForderungen = 0;
            let diffVerbindlichkeiten = 0;

            list.forEach((row) => {
                const differenz = Number(row.differenz || 0);
                const status = this.getStatusByDifferenz(differenz);
                const statusClass = status === 'OK' ? 'text-success' : 'text-danger';

                if (row.konto === '1200') {
                    diffForderungen = differenz;
                }

                if (row.konto === '3300') {
                    diffVerbindlichkeiten = differenz;
                }

                htmlGf += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.bereich)}</strong></td>
                        <td style="text-align: right;">${view.formatCurrency_(row.journal)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.operativ)}</td>
                        <td style="text-align: right;" class="${statusClass}">
                            <strong>${view.formatCurrency_(differenz)}</strong>
                        </td>
                        <td class="${statusClass}"><strong>${view.escapeHtml_(status)}</strong></td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.bereich)}</strong></td>
                        <td>${view.escapeHtml_(row.konto)}</td>
                        <td>${view.escapeHtml_(row.quelleJournal)}</td>
                        <td>${view.escapeHtml_(row.quelleOperativ)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.journal)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.operativ)}</td>
                        <td style="text-align: right;" class="${statusClass}">
                            <strong>${view.formatCurrency_(differenz)}</strong>
                        </td>
                        <td style="text-align: right;">${row.count}</td>
                        <td class="${statusClass}"><strong>${view.escapeHtml_(status)}</strong></td>
                    </tr>
                `;
            });

            const diffGesamt = diffForderungen + diffVerbindlichkeiten;
            const statusGesamt = this.getStatusByDifferenz(diffGesamt);
            const statusGesamtClass = statusGesamt === 'OK' ? 'text-success' : 'text-danger';

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            $tfootBuha.html(`
                <tr>
                    <th colspan="6">Gesamtdifferenz</th>
                    <th style="text-align: right;" class="${statusGesamtClass}">
                        ${view.formatCurrency_(diffGesamt)}
                    </th>
                    <th></th>
                    <th class="${statusGesamtClass}">${view.escapeHtml_(statusGesamt)}</th>
                </tr>
            `);

            this.updateKennzahlen(view, diffForderungen, diffVerbindlichkeiten);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, diffForderungen, diffVerbindlichkeiten) {
            const diffGesamt = Number(diffForderungen || 0) + Number(diffVerbindlichkeiten || 0);
            const status = this.getStatusByDifferenz(diffGesamt);

            view.$el.find('.kb-kpi-diff-forderungen').text(view.formatCurrency_(diffForderungen));
            view.$el.find('.kb-kpi-diff-verbindlichkeiten').text(view.formatCurrency_(diffVerbindlichkeiten));
            view.$el.find('.kb-kpi-diff-gesamt').text(view.formatCurrency_(diffGesamt));
            view.$el.find('.kb-kpi-status').text(status);

            view.$el.find('.kb-kpi-diff-forderungen, .kb-kpi-diff-verbindlichkeiten, .kb-kpi-diff-gesamt, .kb-kpi-status')
                .removeClass('text-success text-danger');

            if (status === 'OK') {
                view.$el.find('.kb-kpi-diff-forderungen, .kb-kpi-diff-verbindlichkeiten, .kb-kpi-diff-gesamt, .kb-kpi-status')
                    .addClass('text-success');
            } else {
                view.$el.find('.kb-kpi-diff-forderungen, .kb-kpi-diff-verbindlichkeiten, .kb-kpi-diff-gesamt, .kb-kpi-status')
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

        getStatusByDifferenz(value) {
            const number = Number(value || 0);

            if (Math.abs(number) < 0.01) {
                return 'OK';
            }

            return 'Abweichung';
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