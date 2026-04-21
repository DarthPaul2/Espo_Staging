// Отчёт Verbindlichkeiten.
// Что это: Phase-3-Bericht по offenen Verbindlichkeiten
// на основе festgeschriebene Eingangsrechnungen с учётом restbetragOffen.

define('custom:views/c-buchhaltung-auswertung/report/verbindlichkeiten', [], function () {
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
                                    <div><strong>Anzahl Verbindlichkeiten</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Teilweise bezahlt</strong></div>
                                    <div class="kb-kpi-teilweise" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe offen</strong></div>
                                    <div class="kb-kpi-offen" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Ursprünglich brutto</strong></div>
                                    <div class="kb-kpi-brutto" style="font-size: 22px;">0,00 €</div>
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
                            Gefundene Verbindlichkeiten: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Überblick über aktuell offene Verbindlichkeiten nach bereits berücksichtigten Zahlungen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Eingangsrechnungsnummer</th>
                                            <th>Lieferant</th>
                                            <th>Belegdatum</th>
                                            <th>Fällig am</th>
                                            <th>Zahlungsstatus</th>
                                            <th>Offen</th>
                                            <th>Buchungsjournal</th>
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
                            <p>Erweiterte Sicht auf offene Verbindlichkeiten mit Restbetrag und Zahlungsstatus aus Phase 3.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Eingangsrechnungsnummer</th>
                                            <th>Lieferanten-Rechnungsnummer</th>
                                            <th>Lieferant</th>
                                            <th>Belegdatum</th>
                                            <th>Fällig am</th>
                                            <th>Brutto ursprünglich</th>
                                            <th>Restbetrag offen</th>
                                            <th>Zahlungsstatus</th>
                                            <th>Steuerfall</th>
                                            <th>Buchungsjournal</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="10" class="text-muted">Noch keine Daten geladen.</td>
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
                collection.maxSize = 200;

                collection.data.select = [
                    'id',
                    'name',
                    'eingangsrechnungsnummer',
                    'lieferantenRechnungsnummer',
                    'belegdatum',
                    'faelligAm',
                    'betragBrutto',
                    'restbetragOffen',
                    'steuerfall',
                    'lieferantId',
                    'lieferantName',
                    'status',
                    'zahlungsstatus',
                    'buchungsjournalId',
                    'buchungsjournalName'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    const list = (collection.models || [])
                        .map(model => model.attributes || {})
                        .filter(item =>
                            String(item.status || '').toLowerCase() === 'festgeschrieben' &&
                            Number(item.restbetragOffen || 0) > 0
                        );

                    list.sort((a, b) => {
                        const aFaellig = a.faelligAm || '';
                        const bFaellig = b.faelligAm || '';

                        if (aFaellig !== bFaellig) {
                            return aFaellig.localeCompare(bFaellig);
                        }

                        const aNr = a.eingangsrechnungsnummer || '';
                        const bNr = b.eingangsrechnungsnummer || '';
                        return aNr.localeCompare(bNr);
                    });

                    this.render(view, list);
                }).catch((err) => {
                    console.error('[Verbindlichkeiten] load failed', err);
                    view.notify('Fehler beim Laden der Verbindlichkeiten', 'error');
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumOffen = 0;
            let sumBrutto = 0;
            let anzahlTeilweise = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine offenen Verbindlichkeiten gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="10" class="text-muted">Keine offenen Verbindlichkeiten gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const brutto = Number(item.betragBrutto || 0);
                const rest = Number(item.restbetragOffen || 0);

                sumBrutto += brutto;
                sumOffen += rest;

                const zahlungsstatusRaw = String(item.zahlungsstatus || '').trim();
                if (zahlungsstatusRaw === 'teilweise_bezahlt') {
                    anzahlTeilweise++;
                }

                const nummerText = view.escapeHtml_(item.eingangsrechnungsnummer || item.name || '');
                const id = view.escapeHtml_(item.id || '');
                const nummer = `<a href="#CEingangsrechnung/view/${id}">${nummerText}</a>`;

                const lieferantText = view.escapeHtml_(item.lieferantName || '');
                const lieferantId = view.escapeHtml_(item.lieferantId || '');
                const lieferant = lieferantId
                    ? `<a href="#CLieferant/view/${lieferantId}">${lieferantText}</a>`
                    : lieferantText;

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const faelligAm = view.escapeHtml_(view.formatDateGerman_(item.faelligAm));
                const lieferantenRechnungsnummer = view.escapeHtml_(item.lieferantenRechnungsnummer || '');
                const steuerfall = view.escapeHtml_(item.steuerfall || '');
                const statusText = view.escapeHtml_(this.formatStatus_(zahlungsstatusRaw));

                let journalLink = '<span class="text-muted">–</span>';

                if (item.buchungsjournalId) {
                    const journalId = view.escapeHtml_(item.buchungsjournalId || '');
                    const journalNummerText = view.escapeHtml_(item.buchungsjournalName || 'Journal');
                    journalLink = `<a href="#CBuchungsjournal/view/${journalId}">${journalNummerText}</a>`;
                }

                htmlGf += `
                    <tr>
                        <td>${nummer}</td>
                        <td>${lieferant}</td>
                        <td>${belegdatum}</td>
                        <td>${faelligAm}</td>
                        <td>${statusText}</td>
                        <td>${view.formatCurrency_(rest)}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${nummer}</td>
                        <td>${lieferantenRechnungsnummer}</td>
                        <td>${lieferant}</td>
                        <td>${belegdatum}</td>
                        <td>${faelligAm}</td>
                        <td>${view.formatCurrency_(brutto)}</td>
                        <td>${view.formatCurrency_(rest)}</td>
                        <td>${statusText}</td>
                        <td>${steuerfall}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, anzahlTeilweise, sumOffen, sumBrutto);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, anzahl, teilweise, offen, brutto) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-teilweise').text(teilweise);
            view.$el.find('.kb-kpi-offen').text(view.formatCurrency_(offen));
            view.$el.find('.kb-kpi-brutto').text(view.formatCurrency_(brutto));
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

        formatStatus_(value) {
            if (value === 'offen') return 'Offen';
            if (value === 'teilweise_bezahlt') return 'Teilweise bezahlt';
            if (value === 'bezahlt') return 'Bezahlt';
            if (value === 'storniert') return 'Storniert';
            return value || '–';
        }
    };
});