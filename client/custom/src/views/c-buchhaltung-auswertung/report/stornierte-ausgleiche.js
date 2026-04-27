// Отчёт Stornierte Ausgleiche.
// Что это: отдельный модуль рендера для auswertungTyp = stornierte_ausgleiche.
// Зачем: показывает все сторнированные Ausgleiche в том же стиле, что и остальные Storno-Auswertungen.

define('custom:views/c-buchhaltung-auswertung/report/stornierte-ausgleiche', [], function () {
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
                                    <div><strong>Gesamtbetrag</strong></div>
                                    <div class="kb-kpi-betrag" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Forderungsausgleiche</strong></div>
                                    <div class="kb-kpi-forderung" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Verbindlichkeitsausgleiche</strong></div>
                                    <div class="kb-kpi-verbindlichkeit" style="font-size: 22px;">0,00 €</div>
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
                            Stornierte Ausgleiche: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über stornierte Ausgleiche im ausgewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Ausgleich</th>
                                            <th>Typ</th>
                                            <th>Beleg</th>
                                            <th>Zahlung</th>
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
                            <p>Erweiterte Sicht mit Richtung, Dokumentbezug und Zahlungsbezug.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Ausgleich</th>
                                            <th>Richtung</th>
                                            <th>Typ</th>
                                            <th>Rechnung</th>
                                            <th>Eingangsrechnung</th>
                                            <th>Zahlung</th>
                                            <th>Betrag</th>
                                            <th>Storniert am</th>
                                            <th>Grund</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="9" class="text-muted">Noch keine Daten geladen.</td>
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

            Espo.Ajax.getRequest('CZahlung/action/stornierteAusgleicheReport', params)
                .then((rows) => {
                    const list = Array.isArray(rows) ? rows : [];

                    list.sort((a, b) => {
                        const aStorno = a.storniertAm || '';
                        const bStorno = b.storniertAm || '';
                        if (aStorno !== bStorno) {
                            return bStorno.localeCompare(aStorno);
                        }

                        const aName = a.name || '';
                        const bName = b.name || '';
                        return bName.localeCompare(aName);
                    });

                    this.render(view, list);
                })
                .catch((err) => {
                    console.error('[StornierteAusgleiche] load failed', err);
                    view.notify('Fehler beim Laden der stornierten Ausgleiche', 'error');
                });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumBetrag = 0;
            let sumForderung = 0;
            let sumVerbindlichkeit = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine stornierten Ausgleiche gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="9" class="text-muted">Keine stornierten Ausgleiche gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const richtungRaw = String(item.richtung || '').toLowerCase();
                const typRaw = String(item.ausgleichTyp || '').toLowerCase();

                sumBetrag += betrag;

                if (richtungRaw === 'forderungsausgleich') {
                    sumForderung += betrag;
                }

                if (richtungRaw === 'verbindlichkeitsausgleich') {
                    sumVerbindlichkeit += betrag;
                }

                const ausgleichText = view.escapeHtml_(item.name || item.id || '');
                const ausgleichId = view.escapeHtml_(item.id || '');
                const ausgleichLink = `<a href="#CAusgleich/view/${ausgleichId}">${ausgleichText}</a>`;

                const richtung = view.escapeHtml_(
                    richtungRaw === 'forderungsausgleich'
                        ? 'Forderungsausgleich'
                        : richtungRaw === 'verbindlichkeitsausgleich'
                            ? 'Verbindlichkeitsausgleich'
                            : '—'
                );

                const typ = view.escapeHtml_(
                    typRaw === 'voll'
                        ? 'Voll'
                        : typRaw === 'teil'
                            ? 'Teil'
                            : '—'
                );

                let beleg = '—';
                if (item.rechnungId) {
                    const rechnungId = view.escapeHtml_(item.rechnungId || '');
                    const rechnungName = view.escapeHtml_(item.rechnungName || '');
                    beleg = `<a href="#CRechnung/view/${rechnungId}">${rechnungName}</a>`;
                } else if (item.eingangsrechnungId) {
                    const eingangsrechnungId = view.escapeHtml_(item.eingangsrechnungId || '');
                    const eingangsrechnungName = view.escapeHtml_(item.eingangsrechnungName || '');
                    beleg = `<a href="#CEingangsrechnung/view/${eingangsrechnungId}">${eingangsrechnungName}</a>`;
                }

                let zahlung = '—';
                if (item.zahlungId) {
                    const zahlungId = view.escapeHtml_(item.zahlungId || '');
                    const zahlungName = view.escapeHtml_(item.zahlungName || '');
                    zahlung = `<a href="#CZahlung/view/${zahlungId}">${zahlungName}</a>`;
                }

                let rechnungLink = '<span class="text-muted">–</span>';
                if (item.rechnungId) {
                    const rechnungId = view.escapeHtml_(item.rechnungId || '');
                    const rechnungName = view.escapeHtml_(item.rechnungName || '');
                    rechnungLink = `<a href="#CRechnung/view/${rechnungId}">${rechnungName}</a>`;
                }

                let eingangsrechnungLink = '<span class="text-muted">–</span>';
                if (item.eingangsrechnungId) {
                    const eingangsrechnungId = view.escapeHtml_(item.eingangsrechnungId || '');
                    const eingangsrechnungName = view.escapeHtml_(item.eingangsrechnungName || '');
                    eingangsrechnungLink = `<a href="#CEingangsrechnung/view/${eingangsrechnungId}">${eingangsrechnungName}</a>`;
                }

                const storniertAm = view.escapeHtml_(view.formatDateTimeGerman_(item.storniertAm));
                const stornoGrund = view.escapeHtml_(item.stornoGrund || '—');

                htmlGf += `
                    <tr>
                        <td>${ausgleichLink}</td>
                        <td>${typ}</td>
                        <td>${beleg}</td>
                        <td>${zahlung}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${storniertAm}</td>
                        <td>${stornoGrund}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${ausgleichLink}</td>
                        <td>${richtung}</td>
                        <td>${typ}</td>
                        <td>${rechnungLink}</td>
                        <td>${eingangsrechnungLink}</td>
                        <td>${zahlung}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${storniertAm}</td>
                        <td>${stornoGrund}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, sumBetrag, sumForderung, sumVerbindlichkeit);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, anzahl, betrag, forderung, verbindlichkeit) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-betrag').text(view.formatCurrency_(betrag));
            view.$el.find('.kb-kpi-forderung').text(view.formatCurrency_(forderung));
            view.$el.find('.kb-kpi-verbindlichkeit').text(view.formatCurrency_(verbindlichkeit));
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