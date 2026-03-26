// Отчёт Offene Forderungen.
// Что это: отдельный модуль рендера для auswertungTyp = offene_forderungen.

define('custom:views/c-buchhaltung-auswertung/report/offene-forderungen', [], function () {
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
                                    <div><strong>Anzahl offene Forderungen</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Netto</strong></div>
                                    <div class="kb-kpi-netto" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>USt</strong></div>
                                    <div class="kb-kpi-ust" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Brutto</strong></div>
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
                            Gefundene Forderungen: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über offene Forderungen der festgeschriebenen Ausgangsrechnungen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Rechnungsnummer</th>
                                            <th>Kunde</th>
                                            <th>Belegdatum</th>
                                            <th>Fällig am</th>
                                            <th>Brutto offen</th>
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
                            <p>Erweiterte Sicht auf offene Forderungen der Phase 1 ohne Zahlungsausgleich.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Rechnungsnummer</th>
                                            <th>Kunde</th>
                                            <th>Belegdatum</th>
                                            <th>Fällig am</th>
                                            <th>Netto</th>
                                            <th>USt</th>
                                            <th>Brutto</th>
                                            <th>Steuerfall</th>
                                            <th>Buchungsjournal</th>
                                            <th>Festgeschrieben am</th>
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
                    attribute: 'buchhaltungStatus',
                    value: 'festgeschrieben'
                },
                {
                    type: 'equals',
                    attribute: 'rechnungstyp',
                    value: 'einzelrechnung'
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

            view.getCollectionFactory().create('CRechnung', (collection) => {
                collection.maxSize = 500;

                collection.data.select = [
                    'id',
                    'name',
                    'rechnungsnummer',
                    'belegdatum',
                    'faelligAm',
                    'betragNetto',
                    'betragBrutto',
                    'ustBetrag',
                    'festgeschriebenAm',
                    'accountId',
                    'accountName',
                    'istFestgeschrieben',
                    'buchhaltungStatus',
                    'rechnungstyp',
                    'gesetzOption13b',
                    'gesetzOption12'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    let list = (collection.models || []).map(model => model.attributes || {});

                    // Что это: client-side страховка по bool
                    list = list.filter(item => item.istFestgeschrieben === true);

                    list.sort((a, b) => {
                        const aFaellig = a.faelligAm || '';
                        const bFaellig = b.faelligAm || '';
                        if (aFaellig !== bFaellig) {
                            return aFaellig.localeCompare(bFaellig);
                        }

                        const aBeleg = a.belegdatum || '';
                        const bBeleg = b.belegdatum || '';
                        if (aBeleg !== bBeleg) {
                            return bBeleg.localeCompare(aBeleg);
                        }

                        const aNr = a.rechnungsnummer || '';
                        const bNr = b.rechnungsnummer || '';
                        return bNr.localeCompare(aNr);
                    });

                    this.loadJournaleForRechnungen(view, list);
                }).catch((err) => {
                    console.error('[OffeneForderungen] load failed', err);
                    view.notify('Fehler beim Laden der offenen Forderungen', 'error');
                });
            });
        },

        loadJournaleForRechnungen(view, list) {
            if (!list.length) {
                this.render(view, list);
                return;
            }

            const ids = list.map(item => item.id).filter(Boolean);

            const where = [
                {
                    type: 'in',
                    attribute: 'rechnungId',
                    value: ids
                }
            ];

            view.getCollectionFactory().create('CBuchungsjournal', (collection) => {
                collection.maxSize = 500;

                collection.data.select = [
                    'id',
                    'journalNummer',
                    'rechnungId'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    const journalMap = {};

                    (collection.models || []).forEach(model => {
                        const item = model.attributes || {};
                        const rechnungId = item.rechnungId || null;
                        if (!rechnungId) return;

                        journalMap[rechnungId] = {
                            id: item.id || '',
                            journalNummer: item.journalNummer || item.name || ''
                        };
                    });

                    list.forEach(item => {
                        item._journal = journalMap[item.id] || null;
                    });

                    this.render(view, list);
                }).catch((err) => {
                    console.error('[OffeneForderungen] load journals failed', err);
                    this.render(view, list);
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumNetto = 0;
            let sumUst = 0;
            let sumBrutto = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-muted">Keine offenen Forderungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="10" class="text-muted">Keine offenen Forderungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                view.updateInfoZeile_(0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const netto = Number(item.betragNetto || 0);
                const ust = Number(item.ustBetrag || 0);
                const brutto = Number(item.betragBrutto || 0);

                sumNetto += netto;
                sumUst += ust;
                sumBrutto += brutto;

                const rechnungsnummerText = view.escapeHtml_(item.rechnungsnummer || item.name || '');
                const rechnungId = view.escapeHtml_(item.id || '');
                const rechnungsnummer = `<a href="#CRechnung/view/${rechnungId}">${rechnungsnummerText}</a>`;

                const kundeText = view.escapeHtml_(item.accountName || '');
                const accountId = view.escapeHtml_(item.accountId || '');
                const kunde = accountId
                    ? `<a href="#Account/view/${accountId}">${kundeText}</a>`
                    : kundeText;

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const faelligAm = view.escapeHtml_(view.formatDateGerman_(item.faelligAm));
                const festgeschriebenAm = view.escapeHtml_(view.formatDateTimeGerman_(item.festgeschriebenAm));

                let steuerFall = 'normal';
                if (item.gesetzOption13b) {
                    steuerFall = '13b';
                } else if (item.gesetzOption12) {
                    steuerFall = 'ermäßigt';
                }
                steuerFall = view.escapeHtml_(steuerFall);

                let journalLink = '<span class="text-muted">–</span>';
                if (item._journal && item._journal.id) {
                    const journalId = view.escapeHtml_(item._journal.id);
                    const journalNummerText = view.escapeHtml_(item._journal.journalNummer || 'Journal');
                    journalLink = `<a href="#CBuchungsjournal/view/${journalId}">${journalNummerText}</a>`;
                }

                htmlGf += `
                    <tr>
                        <td>${rechnungsnummer}</td>
                        <td>${kunde}</td>
                        <td>${belegdatum}</td>
                        <td>${faelligAm}</td>
                        <td>${view.formatCurrency_(brutto)}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${rechnungsnummer}</td>
                        <td>${kunde}</td>
                        <td>${belegdatum}</td>
                        <td>${faelligAm}</td>
                        <td>${view.formatCurrency_(netto)}</td>
                        <td>${view.formatCurrency_(ust)}</td>
                        <td>${view.formatCurrency_(brutto)}</td>
                        <td>${steuerFall}</td>
                        <td>${journalLink}</td>
                        <td>${festgeschriebenAm}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, sumNetto, sumUst, sumBrutto);
            view.updateInfoZeile_(list.length);
        },

        updateKennzahlen(view, anzahl, netto, ust, brutto) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-netto').text(view.formatCurrency_(netto));
            view.$el.find('.kb-kpi-ust').text(view.formatCurrency_(ust));
            view.$el.find('.kb-kpi-brutto').text(view.formatCurrency_(brutto));
        }
    };
});