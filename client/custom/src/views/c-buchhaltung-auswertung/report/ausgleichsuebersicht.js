// Отчёт Ausgleichsübersicht.
// Что это: отдельный модуль рендера для auswertungTyp = ausgleichsuebersicht.

define('custom:views/c-buchhaltung-auswertung/report/ausgleichsuebersicht', [], function () {
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
                                    <div><strong>Anzahl Ausgleiche</strong></div>
                                    <div class="au-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Ausgleich</strong></div>
                                    <div class="au-kpi-summe" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Vollausgleich</strong></div>
                                    <div class="au-kpi-voll" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Teilausgleich</strong></div>
                                    <div class="au-kpi-teil" style="font-size: 22px;">0</div>
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
                            Zeitraum: <strong><span class="au-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Gefundene Ausgleiche: <strong><span class="au-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick darüber, welche Zahlungen welche Belege in welcher Höhe geschlossen haben.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Ausgleichsdatum</th>
                                            <th>Zahlung</th>
                                            <th>Beleg</th>
                                            <th>Richtung</th>
                                            <th>Ausgleichstyp</th>
                                            <th>Betrag</th>
                                            <th>Restbetrag</th>
                                        </tr>
                                    </thead>
                                    <tbody class="au-tbody-gf">
                                        <tr>
                                            <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Erweiterte Sicht auf Ausgleich mit Zahlungs-, Dokument- und Statusbezug.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Ausgleichsdatum</th>
                                            <th>Zahlung</th>
                                            <th>Zahlungsdatum</th>
                                            <th>Zahlungsrichtung</th>
                                            <th>Rechnung</th>
                                            <th>Eingangsrechnung</th>
                                            <th>Richtung</th>
                                            <th>Ausgleichstyp</th>
                                            <th>Ausgleichsstatus</th>
                                            <th>Betrag</th>
                                            <th>Restbetrag nach Ausgleich</th>
                                            <th>Testmodus</th>
                                        </tr>
                                    </thead>
                                    <tbody class="au-tbody-buha">
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
                return;
            }

            view.$el.append(html);
        },

        load(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            const where = [
                {
                    type: 'isTrue',
                    attribute: 'istAktiv'
                },
                {
                    type: 'equals',
                    attribute: 'ausgleichStatus',
                    value: 'aktiv'
                }
            ];

            if (zeitraumVon) {
                where.push({
                    type: 'greaterThanOrEquals',
                    attribute: 'ausgleichsdatum',
                    value: zeitraumVon
                });
            }

            if (zeitraumBis) {
                where.push({
                    type: 'lessThanOrEquals',
                    attribute: 'ausgleichsdatum',
                    value: zeitraumBis
                });
            }

            view.getCollectionFactory().create('CAusgleich', (collection) => {
                collection.maxSize = 1000;

                collection.data.select = [
                    'id',
                    'ausgleichsdatum',
                    'betrag',
                    'richtung',
                    'ausgleichTyp',
                    'ausgleichStatus',
                    'restbetragNachAusgleich',
                    'testmodus',
                    'zahlungId',
                    'zahlungName',
                    'rechnungId',
                    'rechnungName',
                    'eingangsrechnungId',
                    'eingangsrechnungName'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    let list = (collection.models || []).map(model => model.attributes || {});

                    list.sort((a, b) => {
                        const aDatum = a.ausgleichsdatum || '';
                        const bDatum = b.ausgleichsdatum || '';
                        if (aDatum !== bDatum) {
                            return bDatum.localeCompare(aDatum);
                        }

                        const aId = a.id || '';
                        const bId = b.id || '';
                        return bId.localeCompare(aId);
                    });

                    this.loadZahlungDetails(view, list);
                }).catch((err) => {
                    console.error('[Ausgleichsübersicht] load failed', err);
                    view.notify('Fehler beim Laden der Ausgleichsübersicht', 'error');
                });
            });
        },

        loadZahlungDetails(view, list) {
            const zahlungIds = [...new Set(
                list.map(item => item.zahlungId).filter(Boolean)
            )];

            if (!zahlungIds.length) {
                this.render(view, list, {});
                return;
            }

            view.getCollectionFactory().create('CZahlung', (collection) => {
                collection.maxSize = 1000;

                collection.data.select = [
                    'id',
                    'zahlungsnummer',
                    'zahlungsdatum',
                    'zahlungsRichtung',
                    'status'
                ];

                collection.data.where = [
                    {
                        type: 'in',
                        attribute: 'id',
                        value: zahlungIds
                    }
                ];

                collection.fetch().then(() => {
                    const zahlungMap = {};

                    (collection.models || []).forEach(model => {
                        const item = model.attributes || {};
                        zahlungMap[item.id] = item;
                    });

                    this.render(view, list, zahlungMap);
                }).catch((err) => {
                    console.error('[Ausgleichsübersicht] load Zahlung details failed', err);
                    this.render(view, list, {});
                });
            });
        },

        render(view, list, zahlungMap) {
            const $tbodyGf = view.$el.find('.au-tbody-gf');
            const $tbodyBuha = view.$el.find('.au-tbody-buha');

            let summe = 0;
            let anzahlVoll = 0;
            let anzahlTeil = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine Ausgleiche gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="12" class="text-muted">Keine Ausgleiche gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfo(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const restbetrag = Number(item.restbetragNachAusgleich || 0);
                const ausgleichTyp = String(item.ausgleichTyp || '').trim();

                summe += betrag;
                if (ausgleichTyp === 'voll') anzahlVoll++;
                if (ausgleichTyp === 'teil') anzahlTeil++;

                const zahlung = zahlungMap[item.zahlungId] || {};

                const ausgleichsdatum = view.escapeHtml_(view.formatDateGerman_(item.ausgleichsdatum));
                const zahlungsdatum = view.escapeHtml_(view.formatDateGerman_(zahlung.zahlungsdatum));
                const richtungText = this.formatRichtung_(item.richtung || '');
                const ausgleichTypText = this.formatAusgleichTyp_(item.ausgleichTyp || '');
                const ausgleichStatusText = this.formatAusgleichStatus_(item.ausgleichStatus || '');
                const zahlungsRichtungText = this.formatZahlungsRichtung_(zahlung.zahlungsRichtung || '');

                const zahlungId = view.escapeHtml_(item.zahlungId || '');
                const zahlungLabel = view.escapeHtml_(zahlung.zahlungsnummer || item.zahlungName || '');
                const zahlungLink = zahlungId
                    ? `<a href="#CZahlung/view/${zahlungId}">${zahlungLabel}</a>`
                    : (zahlungLabel || '<span class="text-muted">–</span>');

                let belegLink = '<span class="text-muted">–</span>';
                if (item.rechnungId) {
                    const id = view.escapeHtml_(item.rechnungId);
                    const name = view.escapeHtml_(item.rechnungName || '');
                    belegLink = `<a href="#CRechnung/view/${id}">${name}</a>`;
                } else if (item.eingangsrechnungId) {
                    const id = view.escapeHtml_(item.eingangsrechnungId);
                    const name = view.escapeHtml_(item.eingangsrechnungName || '');
                    belegLink = `<a href="#CEingangsrechnung/view/${id}">${name}</a>`;
                }

                const rechnungLink = item.rechnungId
                    ? `<a href="#CRechnung/view/${view.escapeHtml_(item.rechnungId)}">${view.escapeHtml_(item.rechnungName || '')}</a>`
                    : '<span class="text-muted">–</span>';

                const eingangsrechnungLink = item.eingangsrechnungId
                    ? `<a href="#CEingangsrechnung/view/${view.escapeHtml_(item.eingangsrechnungId)}">${view.escapeHtml_(item.eingangsrechnungName || '')}</a>`
                    : '<span class="text-muted">–</span>';

                const testmodus = item.testmodus === true ? 'Ja' : 'Nein';

                htmlGf += `
                    <tr>
                        <td>${ausgleichsdatum}</td>
                        <td>${zahlungLink}</td>
                        <td>${belegLink}</td>
                        <td>${richtungText}</td>
                        <td>${ausgleichTypText}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${view.formatCurrency_(restbetrag)}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${ausgleichsdatum}</td>
                        <td>${zahlungLink}</td>
                        <td>${zahlungsdatum || '<span class="text-muted">–</span>'}</td>
                        <td>${zahlungsRichtungText}</td>
                        <td>${rechnungLink}</td>
                        <td>${eingangsrechnungLink}</td>
                        <td>${richtungText}</td>
                        <td>${ausgleichTypText}</td>
                        <td>${ausgleichStatusText}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${view.formatCurrency_(restbetrag)}</td>
                        <td>${testmodus}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, summe, anzahlVoll, anzahlTeil);
            this.updateInfo(view, list.length);
        },

        updateKennzahlen(view, anzahl, summe, voll, teil) {
            view.$el.find('.au-kpi-anzahl').text(anzahl);
            view.$el.find('.au-kpi-summe').text(view.formatCurrency_(summe));
            view.$el.find('.au-kpi-voll').text(voll);
            view.$el.find('.au-kpi-teil').text(teil);
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

            view.$el.find('.au-info-zeitraum').text(zeitraumText);
            view.$el.find('.au-info-anzahl').text(anzahl);
        },

        formatRichtung_(value) {
            value = String(value || '').trim();
            if (value === 'forderungsausgleich') return 'Forderungsausgleich';
            if (value === 'verbindlichkeitsausgleich') return 'Verbindlichkeitsausgleich';
            return '–';
        },

        formatAusgleichTyp_(value) {
            value = String(value || '').trim();
            if (value === 'voll') return 'Vollausgleich';
            if (value === 'teil') return 'Teilausgleich';
            return '–';
        },

        formatAusgleichStatus_(value) {
            value = String(value || '').trim();
            if (value === 'aktiv') return 'Aktiv';
            if (value === 'storniert') return 'Storniert';
            return '–';
        },

        formatZahlungsRichtung_(value) {
            value = String(value || '').trim();
            if (value === 'eingang') return 'Zahlungseingang';
            if (value === 'ausgang') return 'Zahlungsausgang';
            return '–';
        }
    };
});