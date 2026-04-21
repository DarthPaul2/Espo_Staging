// Отчёт Festgeschriebene Zahlungen.
// Что это: отдельный модуль рендера для auswertungTyp = festgeschriebene_zahlungen.

define('custom:views/c-buchhaltung-auswertung/report/festgeschriebene-zahlungen', [], function () {
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
                                    <div class="fz-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Eingänge</strong></div>
                                    <div class="fz-kpi-eingaenge" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Ausgänge</strong></div>
                                    <div class="fz-kpi-ausgaenge" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Gesamtsumme</strong></div>
                                    <div class="fz-kpi-gesamt" style="font-size: 22px;">0,00 €</div>
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
                                <a href="#" data-action="fz-show-tab" data-tab="gf">Geschäftsführung</a>
                            </li>
                            <li>
                                <a href="#" data-action="fz-show-tab" data-tab="buha">Buchhaltung</a>
                            </li>
                        </ul>
                    </div>
                    <div class="panel-body">
                        <div class="alert alert-info kb-auswertung-info">
                            Zeitraum: <strong><span class="fz-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Gefundene Zahlungen: <strong><span class="fz-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über bereits festgeschriebene Zahlungen der Phase 3.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsnummer</th>
                                            <th>Zahlungsdatum</th>
                                            <th>Richtung</th>
                                            <th>Betrag</th>
                                            <th>Partner</th>
                                            <th>Zahlungsart</th>
                                            <th>Buchungsjournal</th>
                                        </tr>
                                    </thead>
                                    <tbody class="fz-tbody-gf">
                                        <tr>
                                            <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Erweiterte Sicht auf festgeschriebene Zahlungen mit Partner- und Journalbezug.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsnummer</th>
                                            <th>Status</th>
                                            <th>Zahlungsdatum</th>
                                            <th>Richtung</th>
                                            <th>Betrag</th>
                                            <th>Account</th>
                                            <th>Lieferant</th>
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
                                    <tbody class="fz-tbody-buha">
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

            const $filter = view.$el.find('.kb-auswertung-filter, .auswertung-filter, .header-buttons').first();
            if ($filter.length) {
                $filter.after(html);
                return;
            }

            view.$el.append(html);
        },

        bindUi(view) {
            view.$el.off('click.kbFzTabs');

            view.$el.on('click.kbFzTabs', '[data-action="fz-show-tab"]', function (e) {
                e.preventDefault();

                const tab = $(this).data('tab');

                view.$el.find('.kb-auswertung-tabs .nav-tabs li').removeClass('active');
                $(this).closest('li').addClass('active');

                view.$el.find('.kb-tab-panel').addClass('hidden');
                view.$el.find(`.kb-tab-panel[data-tab-panel="${tab}"]`).removeClass('hidden');
            });

            view.$el.on('click.kbFzTabs', '[data-action="kb-switch-to-standard"]', function (e) {
                e.preventDefault();

                if (typeof view.switchToStandardModus_ === 'function') {
                    view.switchToStandardModus_();
                    return;
                }

                if (typeof view.switchMode_ === 'function') {
                    view.switchMode_('standard');
                    return;
                }

                if (typeof view.actionSwitchToStandard === 'function') {
                    view.actionSwitchToStandard();
                    return;
                }

                window.location.reload();
            });
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
                    'name',
                    'zahlungsnummer',
                    'status',
                    'zahlungsdatum',
                    'betrag',
                    'zahlungsRichtung',
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
                    console.error('[Festgeschriebene Zahlungen] load failed', err);
                    view.notify('Fehler beim Laden der festgeschriebenen Zahlungen', 'error');
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.fz-tbody-gf');
            const $tbodyBuha = view.$el.find('.fz-tbody-buha');

            let sumEingaenge = 0;
            let sumAusgaenge = 0;
            let sumGesamt = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine festgeschriebenen Zahlungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="15" class="text-muted">Keine festgeschriebenen Zahlungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfo(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const richtung = String(item.zahlungsRichtung || '').trim();
                const status = String(item.status || '').trim();

                sumGesamt += betrag;
                if (richtung === 'eingang') {
                    sumEingaenge += betrag;
                }
                if (richtung === 'ausgang') {
                    sumAusgaenge += betrag;
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

                const zahlungsdatum = view.escapeHtml_(view.formatDateGerman_(item.zahlungsdatum));
                const festgeschriebenAm = view.escapeHtml_(view.formatDateTimeGerman_(item.festgeschriebenAm));
                const richtungText = this.formatRichtung_(richtung);
                const statusText = this.formatStatus_(status);
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

                const accountLink = accountId && accountName
                    ? `<a href="#Account/view/${accountId}">${accountName}</a>`
                    : '<span class="text-muted">–</span>';

                const lieferantLink = lieferantId && lieferantName
                    ? `<a href="#CLieferant/view/${lieferantId}">${lieferantName}</a>`
                    : '<span class="text-muted">–</span>';

                const testmodus = item.testmodus === true ? 'Ja' : 'Nein';

                htmlGf += `
                    <tr>
                        <td>${zahlungsnummer}</td>
                        <td>${zahlungsdatum}</td>
                        <td>${richtungText}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${partner}</td>
                        <td>${zahlungsartText}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${zahlungsnummer}</td>
                        <td>${statusText}</td>
                        <td>${zahlungsdatum}</td>
                        <td>${richtungText}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${accountLink}</td>
                        <td>${lieferantLink}</td>
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

            this.updateKennzahlen(view, list.length, sumEingaenge, sumAusgaenge, sumGesamt);
            this.updateInfo(view, list.length);
        },

        updateKennzahlen(view, anzahl, eingaenge, ausgaenge, gesamt) {
            view.$el.find('.fz-kpi-anzahl').text(anzahl);
            view.$el.find('.fz-kpi-eingaenge').text(view.formatCurrency_(eingaenge));
            view.$el.find('.fz-kpi-ausgaenge').text(view.formatCurrency_(ausgaenge));
            view.$el.find('.fz-kpi-gesamt').text(view.formatCurrency_(gesamt));
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

            view.$el.find('.fz-info-zeitraum').text(zeitraumText);
            view.$el.find('.fz-info-anzahl').text(anzahl);
        },

        formatRichtung_(value) {
            value = String(value || '').trim();
            if (value === 'eingang') return 'Zahlungseingang';
            if (value === 'ausgang') return 'Zahlungsausgang';
            return '–';
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