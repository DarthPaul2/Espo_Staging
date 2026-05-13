// custom:views/c-buchhaltung-auswertung/report/bankbewegungen-uebersicht
// Что это:
// Phase 7 Bericht: Bankbewegungen Übersicht.
//
// Зачем:
// Показывает реальные Bankbewegungen как Grundlage für Bankabstimmung.
// Важно: Bericht только читает CBankbewegung и НЕ создаёт Zahlung, Ausgleich или Buchung.

console.log('[LOAD] custom:views/c-buchhaltung-auswertung/report/bankbewegungen-uebersicht');

define('custom:views/c-buchhaltung-auswertung/report/bankbewegungen-uebersicht', [], function () {
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
                                    <div><strong>Bankbewegungen</strong></div>
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
                                    <div><strong>Netto-Bewegung</strong></div>
                                    <div class="kb-kpi-netto" style="font-size: 22px;">0,00 €</div>
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
                            Bankbewegungen: <strong><span class="kb-info-anzahl">0</span></strong>
                            <br>
                            <span class="text-muted">
                                Übersicht realer Bankbewegungen aus CBankbewegung. Keine Zahlungs- oder Buchungswirkung.
                            </span>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte Übersicht über reale Bankbewegungen nach Eingang, Ausgang und Netto-Bewegung.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bankkonto</th>
                                            <th style="text-align: right;">Anzahl</th>
                                            <th style="text-align: right;">Eingänge</th>
                                            <th style="text-align: right;">Ausgänge</th>
                                            <th style="text-align: right;">Netto</th>
                                            <th style="text-align: right;">Offen</th>
                                            <th style="text-align: right;">Zugeordnet</th>
                                            <th style="text-align: right;">Ignoriert</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-gf">
                                        <tr>
                                            <td colspan="8" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Prüfansicht der einzelnen Bankbewegungen mit Status, Abstimmungsstatus und Zuordnung.</p>

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
                                            <th>Zahlung</th>
                                            <th>Rechnung</th>
                                            <th>Eingangsrechnung</th>
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
                        'valutadatum',
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
                        'eingangsrechnungName'
                    ].join(',')
                };

                if (zeitraumVon || zeitraumBis) {
                    params.where = [];
                }

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

            loadPage(0).then((bankbewegungen) => {
                this.render(view, bankbewegungen);
            }).catch((err) => {
                console.error('[BankbewegungenUebersicht] load failed', err);
                view.notify('Fehler beim Laden der Bankbewegungen Übersicht', 'error');
                this.render(view, []);
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');
            const $tfootBuha = view.$el.find('.kb-tfoot-buha');

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="8" class="text-muted">Keine Bankbewegungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="11" class="text-muted">Keine Bankbewegungen gefunden.</td></tr>');
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
                        ausgang: 0,
                        offen: 0,
                        zugeordnet: 0,
                        ignoriert: 0
                    };
                }

                bankkontoMap[bankkontoName].count++;

                const status = item.status || '';
                const abstimmungsstatus = item.abstimmungsstatus || '';

                const isIgnored = (
                    status === 'ignoriert' ||
                    abstimmungsstatus === 'nicht_relevant'
                );

                if (isIgnored) {
                    bankkontoMap[bankkontoName].ignoriert++;
                    return;
                }

                if (richtung === 'eingang') {
                    bankkontoMap[bankkontoName].eingang += betrag;
                    totalEingang += betrag;
                }

                if (richtung === 'ausgang') {
                    bankkontoMap[bankkontoName].ausgang += betrag;
                    totalAusgang += betrag;
                }

                if (
                    status === 'manuell_zugeordnet' ||
                    status === 'automatisch_erkannt' ||
                    abstimmungsstatus === 'zugeordnet' ||
                    abstimmungsstatus === 'gebucht'
                ) {
                    bankkontoMap[bankkontoName].zugeordnet++;
                } else {
                    bankkontoMap[bankkontoName].offen++;
                }
            });

            let htmlGf = '';

            Object.keys(bankkontoMap).sort().forEach((key) => {
                const row = bankkontoMap[key];
                const netto = row.eingang - row.ausgang;
                const nettoClass = netto < 0 ? 'text-danger' : 'text-success';

                htmlGf += `
                    <tr>
                        <td><strong>${view.escapeHtml_(row.bankkontoName)}</strong></td>
                        <td style="text-align: right;">${row.count}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.eingang)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.ausgang)}</td>
                        <td style="text-align: right;" class="${nettoClass}">
                            <strong>${view.formatCurrency_(netto)}</strong>
                        </td>
                        <td style="text-align: right;">${row.offen}</td>
                        <td style="text-align: right;">${row.zugeordnet}</td>
                        <td style="text-align: right;">${row.ignoriert}</td>
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

                const zahlung = item.zahlungId
                    ? `<a href="#CZahlung/view/${view.escapeHtml_(item.zahlungId)}">${view.escapeHtml_(item.zahlungName || 'Zahlung')}</a>`
                    : '<span class="text-muted">–</span>';

                const rechnung = item.rechnungId
                    ? `<a href="#CRechnung/view/${view.escapeHtml_(item.rechnungId)}">${view.escapeHtml_(item.rechnungName || 'Rechnung')}</a>`
                    : '<span class="text-muted">–</span>';

                const eingangsrechnung = item.eingangsrechnungId
                    ? `<a href="#CEingangsrechnung/view/${view.escapeHtml_(item.eingangsrechnungId)}">${view.escapeHtml_(item.eingangsrechnungName || 'Eingangsrechnung')}</a>`
                    : '<span class="text-muted">–</span>';

                const richtungText = this.formatRichtung_(item.richtung);
                const statusText = this.formatStatus_(item.status);
                const abstimmungText = this.formatAbstimmungsstatus_(item.abstimmungsstatus);

                const richtungClass = item.richtung === 'ausgang' ? 'text-warning' : 'text-info';

                htmlBuha += `
                    <tr>
                        <td>${view.escapeHtml_(view.formatDateGerman_(item.buchungstag) || '—')}<br><small>${bankbewegungLink}</small></td>
                        <td>${bankkonto}</td>
                        <td class="${richtungClass}"><strong>${view.escapeHtml_(richtungText)}</strong></td>
                        <td style="text-align: right;"><strong>${view.formatCurrency_(item.betrag)}</strong></td>
                        <td>${view.escapeHtml_(item.gegenparteiName || '—')}</td>
                        <td>${view.escapeHtml_(item.verwendungszweck || '—')}</td>
                        <td>${view.escapeHtml_(statusText)}</td>
                        <td>${view.escapeHtml_(abstimmungText)}</td>
                        <td>${zahlung}</td>
                        <td>${rechnung}</td>
                        <td>${eingangsrechnung}</td>
                    </tr>
                `;
            });

            const nettoTotal = totalEingang - totalAusgang;

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            $tfootBuha.html(`
                <tr>
                    <th colspan="4">Summe relevante Bankbewegungen</th>
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

        updateKennzahlen(view, anzahl, eingang, ausgang) {
            const netto = Number(eingang || 0) - Number(ausgang || 0);

            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-eingang').text(view.formatCurrency_(eingang));
            view.$el.find('.kb-kpi-ausgang').text(view.formatCurrency_(ausgang));
            view.$el.find('.kb-kpi-netto').text(view.formatCurrency_(netto));

            if (netto < 0) {
                view.$el.find('.kb-kpi-netto')
                    .removeClass('text-success')
                    .addClass('text-danger');
            } else {
                view.$el.find('.kb-kpi-netto')
                    .removeClass('text-danger')
                    .addClass('text-success');
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