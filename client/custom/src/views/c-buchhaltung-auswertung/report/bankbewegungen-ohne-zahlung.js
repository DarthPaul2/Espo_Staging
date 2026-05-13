// custom:views/c-buchhaltung-auswertung/report/bankbewegungen-ohne-zahlung
// Что это:
// Phase 7 Bericht: Bankbewegungen ohne Zahlung.
//
// Зачем:
// Контрольный Bericht для relevanten Bankbewegungen, у которых ещё нет связанной CZahlung.
// Такие движения могут быть уже zugeordnet к Rechnung/Eingangsrechnung, но Zahlungswirkung ещё не создана.

console.log('[LOAD] custom:views/c-buchhaltung-auswertung/report/bankbewegungen-ohne-zahlung');

define('custom:views/c-buchhaltung-auswertung/report/bankbewegungen-ohne-zahlung', [], function () {
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
                                    <div><strong>Ohne Zahlung</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Eingänge</strong></div>
                                    <div class="kb-kpi-eingang" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Ausgänge</strong></div>
                                    <div class="kb-kpi-ausgang" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Zahlungswirkung</strong></div>
                                    <div class="kb-kpi-status text-warning" style="font-size: 22px;">Prüfen</div>
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
                        <div class="alert alert-warning kb-auswertung-info">
                            Zeitraum: <strong><span class="kb-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Bankbewegungen ohne Zahlung: <strong><span class="kb-info-anzahl">0</span></strong>
                            <br>
                            <span class="text-muted">
                                Relevante Bankbewegungen ohne verknüpfte CZahlung. Keine Zahlungswirkung vorhanden.
                            </span>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über Bankbewegungen, bei denen noch keine Zahlungswirkung im System vorhanden ist.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bankkonto</th>
                                            <th style="text-align: right;">Anzahl</th>
                                            <th style="text-align: right;">Eingänge</th>
                                            <th style="text-align: right;">Ausgänge</th>
                                            <th style="text-align: right;">Netto</th>
                                            <th>Bewertung</th>
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
                            <p>Prüfliste relevanter Bankbewegungen, die noch keine verknüpfte CZahlung haben.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Buchungstag</th>
                                            <th>Bankkonto</th>
                                            <th>Richtung</th>
                                            <th style="text-align: right;">Betrag</th>
                                            <th>Gegenpartei</th>
                                            <th>Verwendungszweck</th>
                                            <th>Status</th>
                                            <th>Abstimmung</th>
                                            <th>Rechnung</th>
                                            <th>Eingangsrechnung</th>
                                            <th>Hinweis</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="11" class="text-muted">Noch keine Daten geladen.</td>
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
                    orderBy: 'buchungstag',
                    order: 'desc',
                    select: [
                        'id',
                        'name',
                        'bankkontoId',
                        'bankkontoName',
                        'buchungstag',
                        'betrag',
                        'richtung',
                        'waehrung',
                        'gegenparteiName',
                        'verwendungszweck',
                        'status',
                        'abstimmungsstatus',
                        'zahlungId',
                        'zahlungName',
                        'rechnungId',
                        'rechnungName',
                        'eingangsrechnungId',
                        'eingangsrechnungName',
                        'zuordnungsHinweis'
                    ].join(',')
                };

                params.where = [
                    {
                        type: 'isNull',
                        attribute: 'zahlungId'
                    },
                    {
                        type: 'notEquals',
                        attribute: 'status',
                        value: 'ignoriert'
                    },
                    {
                        type: 'notEquals',
                        attribute: 'abstimmungsstatus',
                        value: 'nicht_relevant'
                    },
                    {
                        type: 'notEquals',
                        attribute: 'abstimmungsstatus',
                        value: 'gebucht'
                    }
                ];

                if (zeitraumVon) {
                    params.where.push({
                        type: 'greaterThanOrEquals',
                        attribute: 'buchungstag',
                        value: zeitraumVon
                    });
                }

                if (zeitraumBis) {
                    params.where.push({
                        type: 'lessThanOrEquals',
                        attribute: 'buchungstag',
                        value: zeitraumBis
                    });
                }

                return Espo.Ajax.getRequest('CBankbewegung', params).then((response) => {
                    const list = response && response.list ? response.list : [];

                    list.forEach(row => allRows.push(row));

                    if (list.length === 200) {
                        return loadPage(offset + 200);
                    }

                    return allRows;
                });
            };

            loadPage(0).then((rows) => {
                const filtered = rows.filter(item => this.isRelevantWithoutZahlung_(item));
                this.render(view, filtered);
            }).catch((err) => {
                console.error('[BankbewegungenOhneZahlung] load failed', err);
                view.notify('Fehler beim Laden der Bankbewegungen ohne Zahlung', 'error');
                this.render(view, []);
            });
        },

        isRelevantWithoutZahlung_(item) {
            const status = item.status || '';
            const abstimmung = item.abstimmungsstatus || '';

            if (item.zahlungId) return false;
            if (status === 'ignoriert') return false;
            if (abstimmung === 'nicht_relevant') return false;
            if (abstimmung === 'gebucht') return false;

            return true;
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');
            const $tfootBuha = view.$el.find('.kb-tfoot-buha');

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-success"><strong>Keine Bankbewegungen ohne Zahlung vorhanden.</strong></td></tr>');
                $tbodyBuha.html('<tr><td colspan="11" class="text-success"><strong>Alle relevanten Bankbewegungen sind mit Zahlungen verbunden oder nicht relevant.</strong></td></tr>');
                $tfootBuha.html('');

                this.updateKennzahlen(view, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            const bankkontoMap = {};

            let totalEingang = 0;
            let totalAusgang = 0;

            list.forEach((item) => {
                const bankkontoName = item.bankkontoName || 'Ohne Bankkonto';
                const richtung = item.richtung || '';
                const betrag = this.toNumber(item.betrag);

                if (!bankkontoMap[bankkontoName]) {
                    bankkontoMap[bankkontoName] = {
                        bankkontoName: bankkontoName,
                        count: 0,
                        eingang: 0,
                        ausgang: 0
                    };
                }

                bankkontoMap[bankkontoName].count++;

                if (richtung === 'eingang') {
                    bankkontoMap[bankkontoName].eingang += betrag;
                    totalEingang += betrag;
                }

                if (richtung === 'ausgang') {
                    bankkontoMap[bankkontoName].ausgang += betrag;
                    totalAusgang += betrag;
                }
            });

            let htmlGf = '';

            Object.keys(bankkontoMap).sort().forEach((key) => {
                const row = bankkontoMap[key];
                const netto = row.eingang - row.ausgang;
                const nettoClass = netto < 0 ? 'text-danger' : 'text-warning';

                htmlGf += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.bankkontoName)}</strong></td>
                        <td style="text-align: right;"><strong>${row.count}</strong></td>
                        <td style="text-align: right;">${view.formatCurrency_(row.eingang)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.ausgang)}</td>
                        <td style="text-align: right;" class="${nettoClass}">
                            <strong>${view.formatCurrency_(netto)}</strong>
                        </td>
                        <td><span class="text-warning"><strong>Zahlung fehlt</strong></span></td>
                    </tr>
                `;
            });

            let htmlBuha = '';

            list.forEach((item) => {
                const id = view.escapeHtml_(item.id || '');
                const linkName = view.escapeHtml_(item.name || 'Bankbewegung');

                const bankbewegungLink = id
                    ? `<a href="#CBankbewegung/view/${id}">${linkName}</a>`
                    : linkName;

                const bankkonto = item.bankkontoId
                    ? `<a href="#CBankkonto/view/${view.escapeHtml_(item.bankkontoId)}">${view.escapeHtml_(item.bankkontoName || 'Bankkonto')}</a>`
                    : view.escapeHtml_(item.bankkontoName || '—');

                const rechnung = item.rechnungId
                    ? `<a href="#CRechnung/view/${view.escapeHtml_(item.rechnungId)}">${view.escapeHtml_(item.rechnungName || 'Rechnung')}</a>`
                    : '<span class="text-muted">–</span>';

                const eingangsrechnung = item.eingangsrechnungId
                    ? `<a href="#CEingangsrechnung/view/${view.escapeHtml_(item.eingangsrechnungId)}">${view.escapeHtml_(item.eingangsrechnungName || 'Eingangsrechnung')}</a>`
                    : '<span class="text-muted">–</span>';

                const richtungText = this.formatRichtung_(item.richtung);
                const statusText = this.formatStatus_(item.status);
                const abstimmungText = this.formatAbstimmungsstatus_(item.abstimmungsstatus);
                const richtungClass = item.richtung === 'ausgang' ? 'text-danger' : 'text-success';

                const hinweis = item.zuordnungsHinweis || this.buildHinweis_(item);

                htmlBuha += `
                    <tr>
                        <td>
                            ${view.escapeHtml_(view.formatDateGerman_(item.buchungstag) || '—')}
                            <br>
                            <small>${bankbewegungLink}</small>
                        </td>
                        <td>${bankkonto}</td>
                        <td class="${richtungClass}"><strong>${view.escapeHtml_(richtungText)}</strong></td>
                        <td style="text-align: right;"><strong>${view.formatCurrency_(item.betrag)}</strong></td>
                        <td>${view.escapeHtml_(item.gegenparteiName || '—')}</td>
                        <td>${view.escapeHtml_(item.verwendungszweck || '—')}</td>
                        <td><span class="text-warning">${view.escapeHtml_(statusText)}</span></td>
                        <td><span class="text-warning">${view.escapeHtml_(abstimmungText)}</span></td>
                        <td>${rechnung}</td>
                        <td>${eingangsrechnung}</td>
                        <td>${view.escapeHtml_(hinweis)}</td>
                    </tr>
                `;
            });

            const nettoTotal = totalEingang - totalAusgang;

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            $tfootBuha.html(`
                <tr>
                    <th colspan="4">Summe Bankbewegungen ohne Zahlung</th>
                    <th colspan="7">
                        Eingänge: ${view.formatCurrency_(totalEingang)}
                        &nbsp;|&nbsp;
                        Ausgänge: ${view.formatCurrency_(totalAusgang)}
                        &nbsp;|&nbsp;
                        Netto: ${view.formatCurrency_(nettoTotal)}
                    </th>
                </tr>
            `);

            this.updateKennzahlen(view, list.length, totalEingang, totalAusgang);
            this.updateInfoZeile(view, list.length);
        },

        buildHinweis_(item) {
            const hasRechnung = !!item.rechnungId;
            const hasEingangsrechnung = !!item.eingangsrechnungId;

            if (hasRechnung || hasEingangsrechnung) {
                return 'Beleg ist verknüpft, aber keine CZahlung vorhanden.';
            }

            if (item.richtung === 'eingang') {
                return 'Eingang ohne Zahlung: Ausgangsrechnung oder sonstigen Zahlungseingang prüfen.';
            }

            if (item.richtung === 'ausgang') {
                return 'Ausgang ohne Zahlung: Eingangsrechnung, Rückzahlung oder sonstigen Zahlungsausgang prüfen.';
            }

            return 'Bankbewegung prüfen und mit einer CZahlung verbinden oder als nicht relevant markieren.';
        },

        updateKennzahlen(view, anzahl, eingang, ausgang) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-eingang').text(view.formatCurrency_(eingang));
            view.$el.find('.kb-kpi-ausgang').text(view.formatCurrency_(ausgang));

            const $status = view.$el.find('.kb-kpi-status');

            if (anzahl > 0) {
                $status
                    .removeClass('text-success')
                    .addClass('text-warning')
                    .text('Zahlung fehlt');
            } else {
                $status
                    .removeClass('text-warning')
                    .addClass('text-success')
                    .text('OK');
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

        formatRichtung_(value) {
            if (value === 'eingang') return 'Eingang';
            if (value === 'ausgang') return 'Ausgang';
            return value || '–';
        },

        formatStatus_(value) {
            if (value === 'importiert') return 'Importiert';
            if (value === 'automatisch_erkannt') return 'Automatisch erkannt';
            if (value === 'manuell_zugeordnet') return 'Manuell zugeordnet';
            if (value === 'unklar') return 'Unklar';
            if (value === 'ignoriert') return 'Ignoriert';
            return value || '–';
        },

        formatAbstimmungsstatus_(value) {
            if (value === 'offen') return 'Offen';
            if (value === 'vorschlag') return 'Vorschlag vorhanden';
            if (value === 'zugeordnet') return 'Zugeordnet';
            if (value === 'teilweise_zugeordnet') return 'Teilweise zugeordnet';
            if (value === 'gebucht') return 'Gebucht';
            if (value === 'nicht_relevant') return 'Nicht relevant';
            return value || '–';
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