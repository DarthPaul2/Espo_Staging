// Что это:
// Kontrollbericht für stornierte Belege ohne/mit Nachfolger.
//
// Зачем:
// Показывает все stornierten Ausgangsrechnungen und Eingangsrechnungen
// и контролирует, есть ли к ним Nachfolgebeleg.

define('custom:views/c-buchhaltung-auswertung/report/stornierte-belege-kontrolle', [], function () {
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
                                    <div><strong>Stornierte Belege</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Mit Nachfolger</strong></div>
                                    <div class="kb-kpi-mit-nachfolger" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Ohne Nachfolger</strong></div>
                                    <div class="kb-kpi-ohne-nachfolger" style="font-size: 22px;">0</div>
                                </div>
                            </div>

                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Brutto storniert</strong></div>
                                    <div class="kb-kpi-brutto-storniert" style="font-size: 22px;">0,00 €</div>
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
                            Stornierte Belege: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakte Kontrollsicht über stornierte Belege und deren Nachfolger-Status.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bereich</th>
                                            <th>Beleg</th>
                                            <th>Partner</th>
                                            <th>Status</th>
                                            <th>Nachfolger</th>
                                            <th style="text-align: right;">Brutto</th>
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
                            <p>Prüfansicht für stornierte Ausgangs- und Eingangsrechnungen mit oder ohne Nachfolgebeleg.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bereich</th>
                                            <th>Beleg</th>
                                            <th>Typ</th>
                                            <th>Partner</th>
                                            <th>Status</th>
                                            <th>Storniert am</th>
                                            <th>Storno-Grund</th>
                                            <th>Nachfolger</th>
                                            <th>Nachfolger-Status</th>
                                            <th>Korrekturtyp</th>
                                            <th>Korrekturgrund</th>
                                            <th style="text-align: right;">Netto</th>
                                            <th style="text-align: right;">Steuer</th>
                                            <th style="text-align: right;">Brutto</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="14" class="text-muted">Noch keine Daten geladen.</td>
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

            Promise.all([
                Espo.Ajax.getRequest('CRechnung/action/stornierteBelegeKontrolleReport', params).catch(() => []),
                Espo.Ajax.getRequest('CEingangsrechnung/action/stornierteBelegeKontrolleReport', params).catch(() => [])
            ]).then(([ausgang, eingang]) => {
                const list = [];

                if (Array.isArray(ausgang)) {
                    ausgang.forEach(row => list.push(row));
                }

                if (Array.isArray(eingang)) {
                    eingang.forEach(row => list.push(row));
                }

                list.sort((a, b) => {
                    const av = String(a.storniertAm || '');
                    const bv = String(b.storniertAm || '');
                    return bv.localeCompare(av);
                });

                this.render(view, list);
            }).catch((err) => {
                console.error('[StornierteBelegeKontrolle] load failed', err);
                view.notify('Fehler beim Laden der Kontrollansicht für stornierte Belege', 'error');
                this.render(view, []);
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-muted">Keine stornierten Belege gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="14" class="text-muted">Keine stornierten Belege gefunden.</td></tr>');

                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            let anzahl = 0;
            let mitNachfolger = 0;
            let ohneNachfolger = 0;
            let bruttoSumme = 0;

            list.forEach((row) => {
                anzahl++;

                const hasNachfolger = !!row.nachfolgerId;
                const brutto = Number(row.betragBrutto || 0);

                if (hasNachfolger) {
                    mitNachfolger++;
                } else {
                    ohneNachfolger++;
                }

                bruttoSumme += brutto;

                htmlGf += `
                    <tr>
                        <td>${this.renderBereichLabel(view, row.bereich)}</td>

                        <td>
                            ${this.renderBelegLink(view, row)}
                        </td>

                        <td>${view.escapeHtml_(row.partnerName || '—')}</td>

                        <td>${this.renderNachfolgerKontrollStatus(view, row)}</td>

                        <td>
                            ${this.renderNachfolgerLink(view, row)}
                        </td>

                        <td style="text-align: right;">
                            ${view.formatCurrency_(brutto)}
                        </td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${this.renderBereichLabel(view, row.bereich)}</td>

                        <td>
                            ${this.renderBelegLink(view, row)}
                            <div class="text-muted small">${view.escapeHtml_(row.name || '')}</div>
                        </td>

                        <td>${this.renderLabel(view, row.belegTyp)}</td>

                        <td>${view.escapeHtml_(row.partnerName || '—')}</td>

                        <td>
                            ${this.renderStatus(view, row.status, row.zahlungsstatus, row.istStorniert)}
                            ${row.zahlungsstatus ? `<div class="text-muted small">Zahlung: ${view.escapeHtml_(row.zahlungsstatus)}</div>` : ''}
                        </td>

                        <td>${view.escapeHtml_(view.formatDateTimeGerman_(row.storniertAm) || '—')}</td>

                        <td style="max-width: 260px;">${view.escapeHtml_(row.stornoGrund || '—')}</td>

                        <td>${this.renderNachfolgerLink(view, row)}</td>

                        <td>${this.renderNachfolgerStatus(view, row)}</td>

                        <td>${this.renderLabel(view, row.korrekturTyp)}</td>

                        <td style="max-width: 260px;">${view.escapeHtml_(row.korrekturGrund || '—')}</td>

                        <td style="text-align: right;">${view.formatCurrency_(row.betragNetto)}</td>
                        <td style="text-align: right;">${view.formatCurrency_(row.steuerBetrag)}</td>
                        <td style="text-align: right;"><strong>${view.formatCurrency_(row.betragBrutto)}</strong></td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, anzahl, mitNachfolger, ohneNachfolger, bruttoSumme);
            this.updateInfoZeile(view, anzahl);
        },

        updateKennzahlen(view, anzahl, mitNachfolger, ohneNachfolger, bruttoSumme) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-mit-nachfolger').text(mitNachfolger);
            view.$el.find('.kb-kpi-ohne-nachfolger').text(ohneNachfolger);
            view.$el.find('.kb-kpi-brutto-storniert').text(view.formatCurrency_(bruttoSumme));
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

        renderBereichLabel(view, bereich) {
            if (bereich === 'ausgang') {
                return '<span class="label label-primary">Ausgangsrechnung</span>';
            }

            if (bereich === 'eingang') {
                return '<span class="label label-warning">Eingangsrechnung</span>';
            }

            return `<span class="label label-default">${view.escapeHtml_(bereich || '—')}</span>`;
        },

        renderBelegLink(view, row) {
            if (!row.id) {
                return view.escapeHtml_(row.belegNummer || row.name || '—');
            }

            const scope = row.bereich === 'eingang' ? 'CEingangsrechnung' : 'CRechnung';
            const label = row.belegNummer || row.name || row.id;

            return `<a href="#${scope}/view/${row.id}">${view.escapeHtml_(label)}</a>`;
        },

        renderNachfolgerLink(view, row) {
            if (!row.nachfolgerId) {
                return '<span class="label label-danger">Ohne Nachfolger</span>';
            }

            const scope = row.bereich === 'eingang' ? 'CEingangsrechnung' : 'CRechnung';
            const label = row.nachfolgerNummer || row.nachfolgerName || row.nachfolgerId;

            return `<a href="#${scope}/view/${row.nachfolgerId}">${view.escapeHtml_(label)}</a>`;
        },

        renderNachfolgerKontrollStatus(view, row) {
            if (!row.nachfolgerId) {
                return '<span class="label label-danger">Storno offen</span>';
            }

            if (Number(row.nachfolgerIstStorniert || 0) === 1) {
                return '<span class="label label-warning">Nachfolger storniert</span>';
            }

            return '<span class="label label-success">Mit Nachfolger</span>';
        },

        renderNachfolgerStatus(view, row) {
            if (!row.nachfolgerId) {
                return '<span class="text-muted">—</span>';
            }

            return this.renderStatus(
                view,
                row.nachfolgerStatus,
                row.nachfolgerZahlungsstatus,
                row.nachfolgerIstStorniert
            );
        },

        renderStatus(view, status, zahlungsstatus, istStorniert) {
            const s = String(status || '').toLowerCase();
            const z = String(zahlungsstatus || '').toLowerCase();

            if (Number(istStorniert || 0) === 1 || s === 'storniert' || z === 'storniert') {
                return '<span class="label label-danger">Storniert</span>';
            }

            if (s === 'bezahlt' || z === 'bezahlt') {
                return '<span class="label label-success">Bezahlt</span>';
            }

            if (s === 'offen' || z === 'offen') {
                return '<span class="label label-primary">Offen</span>';
            }

            if (s === 'festgeschrieben') {
                return '<span class="label label-primary">Festgeschrieben</span>';
            }

            if (s === 'freigabe') {
                return '<span class="label label-warning">Freigabe</span>';
            }

            if (s === 'entwurf') {
                return '<span class="label label-default">Entwurf</span>';
            }

            return `<span class="label label-default">${view.escapeHtml_(status || zahlungsstatus || '—')}</span>`;
        },

        renderLabel(view, value) {
            if (!value) {
                return '<span class="text-muted">—</span>';
            }

            return `<span class="label label-default">${view.escapeHtml_(value)}</span>`;
        }
    };
});