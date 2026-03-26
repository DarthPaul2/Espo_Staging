// Отчёт Kontenbewegungen.
// Что это: отдельный модуль рендера для auswertungTyp = kontenbewegungen.

define('custom:views/c-buchhaltung-auswertung/report/kontenbewegungen', [], function () {
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
                                    <div><strong>Anzahl Buchungen</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Soll</strong></div>
                                    <div class="kb-kpi-soll" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe Haben</strong></div>
                                    <div class="kb-kpi-haben" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Verwendete Konten</strong></div>
                                    <div class="kb-kpi-konten" style="font-size: 22px;">0</div>
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
                            Gefundene Buchungen: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über Kontenbewegungen der Phase 1.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Rechnungsnummer</th>
                                            <th>Belegdatum</th>
                                            <th>Konto</th>
                                            <th>Buchungsart</th>
                                            <th>Betrag</th>
                                            <th>Buchungsjournal</th>
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
                            <p>Erweiterte Sicht auf Kontenbewegungen mit Journal- und Dokumentbezug.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Buchungstext</th>
                                            <th>Rechnungsnummer</th>
                                            <th>Belegdatum</th>
                                            <th>Konto</th>
                                            <th>Konto-Bezeichnung</th>
                                            <th>Buchungsart</th>
                                            <th>Betrag</th>
                                            <th>Steuerfall</th>
                                            <th>Buchungsjournal</th>
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

            const where = [
                {
                    type: 'equals',
                    attribute: 'quelleTyp',
                    value: 'ausgangsrechnung'
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

            view.getCollectionFactory().create('CBuchung', (collection) => {
                collection.maxSize = 1000;

                collection.data.select = [
                    'id',
                    'buchungstext',
                    'betrag',
                    'kontoNummer',
                    'kontoBezeichnung',
                    'buchungsart',
                    'belegdatum',
                    'quelleIdExtern',
                    'quelleNummer',
                    'steuerFall',
                    'phase1Verwendet',
                    'buchungsjournalId',
                    'buchungsjournalName'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    let list = (collection.models || []).map(model => model.attributes || {});

                    // client-side страховка по bool
                    list = list.filter(item => item.phase1Verwendet === true);

                    list.sort((a, b) => {
                        const aBeleg = a.belegdatum || '';
                        const bBeleg = b.belegdatum || '';
                        if (aBeleg !== bBeleg) {
                            return bBeleg.localeCompare(aBeleg);
                        }

                        const aNr = a.quelleNummer || '';
                        const bNr = b.quelleNummer || '';
                        return bNr.localeCompare(aNr);
                    });

                    this.render(view, list);
                }).catch((err) => {
                    console.error('[Kontenbewegungen] load failed', err);
                    view.notify('Fehler beim Laden der Kontenbewegungen', 'error');
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumSoll = 0;
            let sumHaben = 0;
            const kontenSet = new Set();

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-muted">Keine Kontenbewegungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="9" class="text-muted">Keine Kontenbewegungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                view.updateInfoZeile_(0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const buchungsart = String(item.buchungsart || '').trim();

                if (buchungsart === 'debit') {
                    sumSoll += betrag;
                }
                if (buchungsart === 'credit') {
                    sumHaben += betrag;
                }

                const quelleIdExtern = String(item.quelleIdExtern || '').trim();
                const quelleNummerText = view.escapeHtml_(item.quelleNummer || '');
                const rechnungsnummer = quelleIdExtern
                    ? `<a href="#CRechnung/view/${view.escapeHtml_(quelleIdExtern)}">${quelleNummerText}</a>`
                    : quelleNummerText;

                const kontoNummer = view.escapeHtml_(item.kontoNummer || '');
                const kontoBezeichnung = view.escapeHtml_(item.kontoBezeichnung || '');
                if (kontoNummer) {
                    kontenSet.add(kontoNummer);
                }

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const steuerFall = view.escapeHtml_(item.steuerFall || '');
                const buchungstext = view.escapeHtml_(item.buchungstext || '');
                const buchungsartText = view.escapeHtml_(buchungsart);

                let journalLink = '<span class="text-muted">–</span>';
                const journalId = view.escapeHtml_(item.buchungsjournalId || '');
                const journalName = view.escapeHtml_(item.buchungsjournalName || 'Journal');
                if (journalId) {
                    journalLink = `<a href="#CBuchungsjournal/view/${journalId}">${journalName}</a>`;
                }

                htmlGf += `
                    <tr>
                        <td>${rechnungsnummer}</td>
                        <td>${belegdatum}</td>
                        <td>${kontoNummer}</td>
                        <td>${buchungsartText}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${buchungstext}</td>
                        <td>${rechnungsnummer}</td>
                        <td>${belegdatum}</td>
                        <td>${kontoNummer}</td>
                        <td>${kontoBezeichnung}</td>
                        <td>${buchungsartText}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${steuerFall}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(
                view,
                list.length,
                sumSoll,
                sumHaben,
                kontenSet.size
            );

            view.updateInfoZeile_(list.length);
        },

        updateKennzahlen(view, anzahl, soll, haben, anzahlKonten) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-soll').text(view.formatCurrency_(soll));
            view.$el.find('.kb-kpi-haben').text(view.formatCurrency_(haben));
            view.$el.find('.kb-kpi-konten').text(anzahlKonten);
        }
    };
});