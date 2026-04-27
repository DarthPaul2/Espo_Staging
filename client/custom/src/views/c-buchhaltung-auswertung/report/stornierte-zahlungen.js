// Отчёт Stornierte Zahlungen.
// Что это: отдельный модуль рендера для auswertungTyp = stornierte_zahlungen.
// Зачем: показывает все сторнированные оплаты в том же стиле, что и другие Auswertungen.

define('custom:views/c-buchhaltung-auswertung/report/stornierte-zahlungen', [], function () {
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
                                    <div><strong>Anzahl storniert</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Eingang</strong></div>
                                    <div class="kb-kpi-eingang" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Ausgang</strong></div>
                                    <div class="kb-kpi-ausgang" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Gesamt</strong></div>
                                    <div class="kb-kpi-gesamt" style="font-size: 22px;">0,00 €</div>
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
                        <div class="alert alert-danger kb-auswertung-info">
                            Zeitraum: <strong><span class="kb-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Stornierte Zahlungen: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über stornierte Zahlungen im ausgewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsnummer</th>
                                            <th>Richtung</th>
                                            <th>Partner</th>
                                            <th>Zahlungsdatum</th>
                                            <th>Betrag</th>
                                            <th>Storniert am</th>
                                            <th>Grund</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-gf">
                                        <tr>
                                            <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Erweiterte Sicht mit fachlicher Detailtiefe und Storno-Journal.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Zahlungsnummer</th>
                                            <th>Richtung</th>
                                            <th>Partner</th>
                                            <th>Zahlungsdatum</th>
                                            <th>Betrag</th>
                                            <th>Storniert am</th>
                                            <th>Grund</th>
                                            <th>Storno-Journal</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="8" class="text-muted">Noch keine Daten geladen.</td>
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
            }
        },

        load(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            const params = {};

            if (zeitraumVon) {
                params.von = zeitraumVon;
            }

            if (zeitraumBis) {
                params.bis = zeitraumBis;
            }

            Espo.Ajax.getRequest('CZahlung/action/stornierteZahlungenReport', params)
                .then((rows) => {
                    const list = Array.isArray(rows) ? rows : [];

                    list.forEach(item => {
                        item._stornoJournal = item.stornoJournalId
                            ? {
                                id: item.stornoJournalId || '',
                                journalNummer: item.stornoJournalNummer || ''
                            }
                            : null;
                    });

                    this.render(view, list);
                })
                .catch((err) => {
                    console.error('[StornierteZahlungen] load failed', err);
                    view.notify('Fehler beim Laden der stornierten Zahlungen', 'error');
                });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumEingang = 0;
            let sumAusgang = 0;
            let sumGesamt = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine stornierten Zahlungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="8" class="text-muted">Keine stornierten Zahlungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const richtungRaw = String(item.zahlungsRichtung || item.richtung || '').toLowerCase();

                if (richtungRaw === 'eingang' || richtungRaw === 'zahlungseingang') {
                    sumEingang += betrag;
                } else if (richtungRaw === 'ausgang' || richtungRaw === 'zahlungsausgang') {
                    sumAusgang += betrag;
                }

                sumGesamt += betrag;

                const zahlungsnummerText = view.escapeHtml_(item.zahlungsnummer || item.name || '');
                const zahlungId = view.escapeHtml_(item.id || '');
                const zahlungsnummer = `<a href="#CZahlung/view/${zahlungId}">${zahlungsnummerText}</a>`;

                const richtung = view.escapeHtml_(
                    (richtungRaw === 'eingang' || richtungRaw === 'zahlungseingang')
                        ? 'Eingang'
                        : (richtungRaw === 'ausgang' || richtungRaw === 'zahlungsausgang')
                            ? 'Ausgang'
                            : '—'
                );

                let partner = '—';
                if (item.accountId) {
                    const accountId = view.escapeHtml_(item.accountId || '');
                    const accountName = view.escapeHtml_(item.accountName || '');
                    partner = `<a href="#Account/view/${accountId}">${accountName}</a>`;
                } else if (item.lieferantId) {
                    const lieferantId = view.escapeHtml_(item.lieferantId || '');
                    const lieferantName = view.escapeHtml_(item.lieferantName || '');
                    partner = `<a href="#CLieferant/view/${lieferantId}">${lieferantName}</a>`;
                }

                const zahlungsdatum = view.escapeHtml_(view.formatDateGerman_(item.zahlungsdatum));
                const storniertAm = view.escapeHtml_(view.formatDateTimeGerman_(item.storniertAm));
                const stornoGrund = view.escapeHtml_(item.stornoGrund || '—');

                htmlGf += `
                    <tr>
                        <td>${zahlungsnummer}</td>
                        <td>${richtung}</td>
                        <td>${partner}</td>
                        <td>${zahlungsdatum}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${storniertAm}</td>
                        <td>${stornoGrund}</td>
                    </tr>
                `;

                let journalLink = '<span class="text-muted">–</span>';

                if (item._stornoJournal && item._stornoJournal.id) {
                    const journalId = view.escapeHtml_(item._stornoJournal.id);
                    const journalNummerText = view.escapeHtml_(item._stornoJournal.journalNummer || 'Journal');
                    journalLink = `<a href="#CBuchungsjournal/view/${journalId}">${journalNummerText}</a>`;
                }

                htmlBuha += `
                    <tr>
                        <td>${zahlungsnummer}</td>
                        <td>${richtung}</td>
                        <td>${partner}</td>
                        <td>${zahlungsdatum}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${storniertAm}</td>
                        <td>${stornoGrund}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, sumEingang, sumAusgang, sumGesamt);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, anzahl, eingang, ausgang, gesamt) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-eingang').text(view.formatCurrency_(eingang));
            view.$el.find('.kb-kpi-ausgang').text(view.formatCurrency_(ausgang));
            view.$el.find('.kb-kpi-gesamt').text(view.formatCurrency_(gesamt));
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
        }
    };
});