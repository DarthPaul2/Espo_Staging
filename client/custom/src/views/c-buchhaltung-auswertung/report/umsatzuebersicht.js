// Отчёт Umsatzübersicht.
// Что это: отдельный модуль рендера для auswertungTyp = umsatzuebersicht.

define('custom:views/c-buchhaltung-auswertung/report/umsatzuebersicht', [], function () {
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
                                    <div class="kb-kpi-anzahl-buchungen" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Umsatz netto</strong></div>
                                    <div class="kb-kpi-umsatz-netto" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Anzahl Rechnungen</strong></div>
                                    <div class="kb-kpi-anzahl-rechnungen" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Erlöskonten</strong></div>
                                    <div class="kb-kpi-erloeskonten" style="font-size: 22px;">0</div>
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
                            <p>Kompakter Überblick über Umsätze auf Basis der Erlös-Buchungen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Rechnungsnummer</th>
                                            <th>Belegdatum</th>
                                            <th>Erlöskonto</th>
                                            <th>Umsatz netto</th>
                                            <th>Steuerfall</th>
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
                            <p>Erweiterte Sicht auf Erlös-Buchungen mit Konto- und Journal-Bezug.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Buchungstext</th>
                                            <th>Rechnungsnummer</th>
                                            <th>Belegdatum</th>
                                            <th>Konto</th>
                                            <th>Konto-Bezeichnung</th>
                                            <th>Betrag</th>
                                            <th>Steuerfall</th>
                                            <th>Buchungsjournal</th>
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

            const where = [
                {
                    type: 'equals',
                    attribute: 'quelleTyp',
                    value: 'ausgangsrechnung'
                },
                {
                    type: 'equals',
                    attribute: 'buchungsart',
                    value: 'credit'
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
                collection.maxSize = 500;

                collection.data.select = [
                    'id',
                    'buchungstext',
                    'betrag',
                    'kontoNummer',
                    'kontoBezeichnung',
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

                    // Что это: client-side страховка по bool, как и в festgeschriebene Rechnungen
                    list = list.filter(item => item.phase1Verwendet === true);

                    // Что это: оставляем только Erlös-Buchungen, исключая Forderung и Steuerkonten
                    list = list.filter(item => {
                        const konto = String(item.kontoNummer || '').trim();
                        if (!konto) return false;
                        if (konto === '1200') return false;
                        if (konto === '3806') return false;
                        if (konto === '3801') return false;
                        return true;
                    });

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
                    console.error('[Umsatzuebersicht] load failed', err);
                    view.notify('Fehler beim Laden der Umsatzübersicht', 'error');
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumUmsatz = 0;
            const rechnungenSet = new Set();
            const kontenSet = new Set();

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-muted">Keine Umsatz-Buchungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="8" class="text-muted">Keine Umsatz-Buchungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                view.updateInfoZeile_(0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                sumUmsatz += betrag;

                const quelleIdExtern = String(item.quelleIdExtern || '').trim();
                const quelleNummerText = view.escapeHtml_(item.quelleNummer || '');
                const rechnungsnummer = quelleIdExtern
                    ? `<a href="#CRechnung/view/${view.escapeHtml_(quelleIdExtern)}">${quelleNummerText}</a>`
                    : quelleNummerText;

                if (quelleIdExtern) {
                    rechnungenSet.add(quelleIdExtern);
                }

                const kontoNummer = view.escapeHtml_(item.kontoNummer || '');
                const kontoBezeichnung = view.escapeHtml_(item.kontoBezeichnung || '');
                if (kontoNummer) {
                    kontenSet.add(kontoNummer);
                }

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const steuerFall = view.escapeHtml_(item.steuerFall || '');
                const buchungstext = view.escapeHtml_(item.buchungstext || '');

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
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${steuerFall}</td>
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
                sumUmsatz,
                rechnungenSet.size,
                kontenSet.size
            );

            view.updateInfoZeile_(list.length);
        },

        updateKennzahlen(view, anzahlBuchungen, umsatzNetto, anzahlRechnungen, anzahlKonten) {
            view.$el.find('.kb-kpi-anzahl-buchungen').text(anzahlBuchungen);
            view.$el.find('.kb-kpi-umsatz-netto').text(view.formatCurrency_(umsatzNetto));
            view.$el.find('.kb-kpi-anzahl-rechnungen').text(anzahlRechnungen);
            view.$el.find('.kb-kpi-erloeskonten').text(anzahlKonten);
        }
    };
});