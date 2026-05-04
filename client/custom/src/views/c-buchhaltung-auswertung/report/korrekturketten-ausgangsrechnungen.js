// Что это:
// Phase-5-Report: Korrekturketten Ausgangsrechnungen.
//
// Зачем:
// Показывает связь между stornierten Ausgangsrechnungen и их korrigierten Nachfolgebelegen.
// Это контрольный бухгалтерский отчёт: Ursprung -> Nachfolger.

define('custom:views/c-buchhaltung-auswertung/report/korrekturketten-ausgangsrechnungen', [], function () {
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
                                    <div><strong>Korrekturketten</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Stornierte Ursprünge</strong></div>
                                    <div class="kb-kpi-storniert" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Aktive Nachfolger</strong></div>
                                    <div class="kb-kpi-aktive-nachfolger" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Brutto Nachfolger</strong></div>
                                    <div class="kb-kpi-brutto-nachfolger" style="font-size: 22px;">0,00 €</div>
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
                            Korrekturketten: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte Übersicht über korrigierte Ausgangsrechnungen und ihre Nachfolgebelege.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Ursprung</th>
                                            <th>Nachfolger</th>
                                            <th>Kunde</th>
                                            <th>Auftrag</th>
                                            <th>Korrekturtyp</th>
                                            <th>Status</th>
                                            <th style="text-align: right;">Brutto Nachfolger</th>
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
                            <p>Detaillierte Prüfansicht der Korrekturketten für Ausgangsrechnungen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Ursprung</th>
                                            <th>Typ</th>
                                            <th>Status Ursprung</th>
                                            <th style="text-align: right;">Betrag Ursprung</th>
                                            <th>Nachfolger</th>
                                            <th>Status Nachfolger</th>
                                            <th style="text-align: right;">Betrag Nachfolger</th>
                                            <th>Korrekturtyp</th>
                                            <th>Korrekturgrund</th>
                                            <th>Storno-Grund</th>
                                            <th>Kunde</th>
                                            <th>Auftrag</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="12" class="text-muted">Noch keine Daten geladen.</td>
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

            Espo.Ajax.getRequest('CRechnung/action/korrekturkettenReport', params)
                .then((data) => {
                    if (data && data.success === false) {
                        view.notify(data.message || data.error || 'Korrekturketten konnten nicht geladen werden.', 'error');
                        this.render(view, []);
                        return;
                    }

                    const list = Array.isArray(data) ? data : [];
                    this.render(view, list);
                })
                .catch((err) => {
                    console.error('[KorrekturkettenAusgangsrechnungen] load failed', err);
                    view.notify('Fehler beim Laden der Korrekturketten Ausgangsrechnungen', 'error');
                    this.render(view, []);
                });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine Korrekturketten gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="12" class="text-muted">Keine Korrekturketten gefunden.</td></tr>');

                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            let anzahl = 0;
            let storniertCount = 0;
            let aktiveNachfolgerCount = 0;
            let bruttoNachfolgerSum = 0;

            list.forEach((row) => {
                anzahl++;

                const ursprungIstStorniert =
                    Number(row.ursprungIstStorniert || 0) === 1 ||
                    String(row.ursprungStatus || '').toLowerCase() === 'storniert';

                const nachfolgerIstAktiv =
                    Number(row.nachfolgerIstStorniert || 0) !== 1 &&
                    String(row.nachfolgerStatus || '').toLowerCase() !== 'storniert';

                if (ursprungIstStorniert) {
                    storniertCount++;
                }

                if (nachfolgerIstAktiv) {
                    aktiveNachfolgerCount++;
                    bruttoNachfolgerSum += Number(row.nachfolgerBetragBrutto || 0);
                }

                htmlGf += `
                    <tr>
                        <td>
                            ${this.renderCRechnungLink(view, row.ursprungId, row.ursprungRechnungsnummer || row.ursprungName)}
                        </td>

                        <td>
                            ${this.renderCRechnungLink(view, row.nachfolgerId, row.nachfolgerRechnungsnummer || row.nachfolgerName)}
                        </td>

                        <td>
                            ${this.renderAccountLink(view, row.accountId, row.accountName)}
                        </td>

                        <td>
                            ${this.renderAuftragLink(view, row.auftragId, row.auftragName)}
                        </td>

                        <td>
                            ${this.renderLabel(view, row.korrekturTyp)}
                        </td>

                        <td>
                            ${this.renderChainStatus(view, row)}
                        </td>

                        <td style="text-align: right;">
                            ${view.formatCurrency_(row.nachfolgerBetragBrutto)}
                        </td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>
                            ${this.renderCRechnungLink(view, row.ursprungId, row.ursprungRechnungsnummer || row.ursprungName)}
                            <div class="text-muted small">${view.escapeHtml_(row.ursprungName || '')}</div>
                        </td>

                        <td>
                            ${this.renderLabel(view, row.ursprungRechnungstyp)}
                        </td>

                        <td>
                            ${this.renderStatus(view, row.ursprungStatus, row.ursprungIstStorniert)}
                            <div class="text-muted small">BH: ${view.escapeHtml_(row.ursprungBuchhaltungStatus || '—')}</div>
                        </td>

                        <td style="text-align: right;">
                            <div>Netto: ${view.formatCurrency_(row.ursprungBetragNetto)}</div>
                            <div>USt: ${view.formatCurrency_(row.ursprungUstBetrag)}</div>
                            <strong>Brutto: ${view.formatCurrency_(row.ursprungBetragBrutto)}</strong>
                        </td>

                        <td>
                            ${this.renderCRechnungLink(view, row.nachfolgerId, row.nachfolgerRechnungsnummer || row.nachfolgerName)}
                            <div class="text-muted small">${view.escapeHtml_(row.nachfolgerName || '')}</div>
                        </td>

                        <td>
                            ${this.renderStatus(view, row.nachfolgerStatus, row.nachfolgerIstStorniert)}
                            <div class="text-muted small">BH: ${view.escapeHtml_(row.nachfolgerBuchhaltungStatus || '—')}</div>
                        </td>

                        <td style="text-align: right;">
                            <div>Netto: ${view.formatCurrency_(row.nachfolgerBetragNetto)}</div>
                            <div>USt: ${view.formatCurrency_(row.nachfolgerUstBetrag)}</div>
                            <strong>Brutto: ${view.formatCurrency_(row.nachfolgerBetragBrutto)}</strong>
                        </td>

                        <td>
                            ${this.renderLabel(view, row.korrekturTyp)}
                        </td>

                        <td style="max-width: 260px;">
                            ${view.escapeHtml_(row.korrekturGrund || '—')}
                        </td>

                        <td style="max-width: 260px;">
                            ${view.escapeHtml_(row.ursprungStornoGrund || '—')}
                        </td>

                        <td>
                            ${this.renderAccountLink(view, row.accountId, row.accountName)}
                        </td>

                        <td>
                            ${this.renderAuftragLink(view, row.auftragId, row.auftragName)}
                        </td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, anzahl, storniertCount, aktiveNachfolgerCount, bruttoNachfolgerSum);
            this.updateInfoZeile(view, anzahl);
        },

        updateKennzahlen(view, anzahl, storniertCount, aktiveNachfolgerCount, bruttoNachfolgerSum) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-storniert').text(storniertCount);
            view.$el.find('.kb-kpi-aktive-nachfolger').text(aktiveNachfolgerCount);
            view.$el.find('.kb-kpi-brutto-nachfolger').text(view.formatCurrency_(bruttoNachfolgerSum));
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

        renderCRechnungLink(view, id, label) {
            if (!id) {
                return view.escapeHtml_(label || '—');
            }

            return `<a href="#CRechnung/view/${id}">${view.escapeHtml_(label || id)}</a>`;
        },

        renderAccountLink(view, id, label) {
            if (!id) {
                return view.escapeHtml_(label || '—');
            }

            return `<a href="#Account/view/${id}">${view.escapeHtml_(label || id)}</a>`;
        },

        renderAuftragLink(view, id, label) {
            if (!id) {
                return view.escapeHtml_(label || '—');
            }

            return `<a href="#CAuftrag/view/${id}">${view.escapeHtml_(label || id)}</a>`;
        },

        renderLabel(view, value) {
            if (!value) {
                return '<span class="text-muted">—</span>';
            }

            return `<span class="label label-default">${view.escapeHtml_(value)}</span>`;
        },

        renderStatus(view, status, istStorniert) {
            const value = String(status || '').toLowerCase();

            if (Number(istStorniert || 0) === 1 || value === 'storniert') {
                return '<span class="label label-danger">Storniert</span>';
            }

            if (value === 'bezahlt') {
                return '<span class="label label-success">Bezahlt</span>';
            }

            if (value === 'offen') {
                return '<span class="label label-primary">Offen</span>';
            }

            if (value === 'teilweise_bezahlt') {
                return '<span class="label label-info">Teilweise bezahlt</span>';
            }

            if (value === 'festgeschrieben') {
                return '<span class="label label-primary">Festgeschrieben</span>';
            }

            if (value === 'freigabe') {
                return '<span class="label label-warning">Freigabe</span>';
            }

            if (value === 'entwurf') {
                return '<span class="label label-default">Entwurf</span>';
            }

            return `<span class="label label-default">${view.escapeHtml_(status || '—')}</span>`;
        },

        renderChainStatus(view, row) {
            const ursprungStorniert =
                Number(row.ursprungIstStorniert || 0) === 1 ||
                String(row.ursprungStatus || '').toLowerCase() === 'storniert';

            const nachfolgerStorniert =
                Number(row.nachfolgerIstStorniert || 0) === 1 ||
                String(row.nachfolgerStatus || '').toLowerCase() === 'storniert';

            if (ursprungStorniert && !nachfolgerStorniert) {
                return '<span class="label label-success">Saubere Kette</span>';
            }

            if (ursprungStorniert && nachfolgerStorniert) {
                return '<span class="label label-warning">Nachfolger ebenfalls storniert</span>';
            }

            return '<span class="label label-default">Prüfen</span>';
        }
    };
});