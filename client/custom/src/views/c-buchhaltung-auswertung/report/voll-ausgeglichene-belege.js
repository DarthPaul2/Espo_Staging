// Отчёт Voll ausgeglichene Belege.
// Что это: Phase-3-Bericht по документам, которые уже полностью оплачены
// и имеют Restbetrag = 0.

define('custom:views/c-buchhaltung-auswertung/report/voll-ausgeglichene-belege', [], function () {
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
                                    <div><strong>Anzahl Belege</strong></div>
                                    <div class="vb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Summe ursprünglich</strong></div>
                                    <div class="vb-kpi-brutto" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Ausgeglichen</strong></div>
                                    <div class="vb-kpi-ausgeglichen" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Restbetrag</strong></div>
                                    <div class="vb-kpi-rest" style="font-size: 22px;">0,00 €</div>
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
                            Zeitraum: <strong><span class="vb-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Gefundene Belege: <strong><span class="vb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über bereits vollständig ausgeglichene Ausgangs- und Eingangsbelege.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Belegtyp</th>
                                            <th>Nummer</th>
                                            <th>Partner</th>
                                            <th>Fällig am</th>
                                            <th>Ursprünglich</th>
                                            <th>Ausgeglichen</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="vb-tbody-gf">
                                        <tr>
                                            <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Erweiterte Sicht auf vollständig ausgeglichene Ausgangs- und Eingangsbelege.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Belegtyp</th>
                                            <th>Nummer</th>
                                            <th>Partner</th>
                                            <th>Belegdatum</th>
                                            <th>Fällig am</th>
                                            <th>Zahlungsstatus</th>
                                            <th>Ursprünglicher Betrag</th>
                                            <th>Ausgeglichen</th>
                                            <th>Restbetrag</th>
                                            <th>Buchungsjournal</th>
                                        </tr>
                                    </thead>
                                    <tbody class="vb-tbody-buha">
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
                return;
            }

            view.$el.append(html);
        },

        load(view) {
            const zeitraumVon = view.model.get('zeitraumVon') || null;
            const zeitraumBis = view.model.get('zeitraumBis') || null;

            this.loadRechnungen(view, zeitraumVon, zeitraumBis).then((rechnungen) => {
                this.loadEingangsrechnungen(view, zeitraumVon, zeitraumBis).then((eingangsrechnungen) => {
                    const list = [...rechnungen, ...eingangsrechnungen];

                    list.sort((a, b) => {
                        const aFaellig = a.faelligAm || '';
                        const bFaellig = b.faelligAm || '';
                        if (aFaellig !== bFaellig) {
                            return aFaellig.localeCompare(bFaellig);
                        }

                        const aDatum = a.belegdatum || '';
                        const bDatum = b.belegdatum || '';
                        if (aDatum !== bDatum) {
                            return bDatum.localeCompare(aDatum);
                        }

                        const aNummer = a.nummer || '';
                        const bNummer = b.nummer || '';
                        return aNummer.localeCompare(bNummer);
                    });

                    this.render(view, list);
                }).catch((err) => {
                    console.error('[VollAusgeglicheneBelege] load Eingangsrechnungen failed', err);
                    view.notify('Fehler beim Laden der Eingangsrechnungen', 'error');
                });
            }).catch((err) => {
                console.error('[VollAusgeglicheneBelege] load Rechnungen failed', err);
                view.notify('Fehler beim Laden der Rechnungen', 'error');
            });
        },

        loadRechnungen(view, zeitraumVon, zeitraumBis) {
            return new Promise((resolve, reject) => {
                const where = [
                    {
                        type: 'equals',
                        attribute: 'buchhaltungStatus',
                        value: 'festgeschrieben'
                    },
                    {
                        type: 'equals',
                        attribute: 'status',
                        value: 'bezahlt'
                    },
                    {
                        type: 'equals',
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

                view.getCollectionFactory().create('CRechnung', (collection) => {
                    collection.maxSize = 500;

                    collection.data.select = [
                        'id',
                        'rechnungsnummer',
                        'belegdatum',
                        'faelligAm',
                        'betragBrutto',
                        'restbetragOffen',
                        'status',
                        'accountId',
                        'accountName'
                    ];

                    collection.data.where = where;

                    collection.fetch().then(() => {
                        const list = (collection.models || []).map(model => model.attributes || {}).map(item => {
                            const brutto = Number(item.betragBrutto || 0);
                            const rest = Number(item.restbetragOffen || 0);

                            return {
                                belegTyp: 'Ausgangsrechnung',
                                entityType: 'CRechnung',
                                id: item.id || '',
                                nummer: item.rechnungsnummer || '',
                                partnerName: item.accountName || '',
                                partnerId: item.accountId || '',
                                partnerEntity: 'Account',
                                belegdatum: item.belegdatum || '',
                                faelligAm: item.faelligAm || '',
                                zahlungsstatus: item.status || '',
                                urspruenglich: brutto,
                                restbetrag: rest,
                                ausgeglichen: Math.max(0, brutto - rest),
                                buchungsjournalId: '',
                                buchungsjournalName: ''
                            };
                        });

                        this.loadJournaleForRechnungen(view, list).then(resolve).catch(reject);
                    }).catch(reject);
                });
            });
        },

        loadJournaleForRechnungen(view, list) {
            return new Promise((resolve, reject) => {
                if (!list.length) {
                    resolve(list);
                    return;
                }

                const ids = list.map(item => item.id).filter(Boolean);

                view.getCollectionFactory().create('CBuchungsjournal', (collection) => {
                    collection.maxSize = 500;
                    collection.data.select = ['id', 'journalNummer', 'rechnungId'];
                    collection.data.where = [{
                        type: 'in',
                        attribute: 'rechnungId',
                        value: ids
                    }];

                    collection.fetch().then(() => {
                        const journalMap = {};
                        (collection.models || []).forEach(model => {
                            const item = model.attributes || {};
                            if (item.rechnungId) {
                                journalMap[item.rechnungId] = {
                                    id: item.id || '',
                                    name: item.journalNummer || item.name || ''
                                };
                            }
                        });

                        list.forEach(item => {
                            const journal = journalMap[item.id] || null;
                            if (journal) {
                                item.buchungsjournalId = journal.id;
                                item.buchungsjournalName = journal.name;
                            }
                        });

                        resolve(list);
                    }).catch(reject);
                });
            });
        },

        loadEingangsrechnungen(view, zeitraumVon, zeitraumBis) {
            return new Promise((resolve, reject) => {
                const where = [
                    {
                        type: 'equals',
                        attribute: 'status',
                        value: 'festgeschrieben'
                    },
                    {
                        type: 'equals',
                        attribute: 'zahlungsstatus',
                        value: 'bezahlt'
                    },
                    {
                        type: 'equals',
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
                    collection.maxSize = 500;

                    collection.data.select = [
                        'id',
                        'eingangsrechnungsnummer',
                        'belegdatum',
                        'faelligAm',
                        'betragBrutto',
                        'restbetragOffen',
                        'zahlungsstatus',
                        'lieferantId',
                        'lieferantName',
                        'buchungsjournalId',
                        'buchungsjournalName'
                    ];

                    collection.data.where = where;

                    collection.fetch().then(() => {
                        const list = (collection.models || []).map(model => model.attributes || {}).map(item => {
                            const brutto = Number(item.betragBrutto || 0);
                            const rest = Number(item.restbetragOffen || 0);

                            return {
                                belegTyp: 'Eingangsrechnung',
                                entityType: 'CEingangsrechnung',
                                id: item.id || '',
                                nummer: item.eingangsrechnungsnummer || '',
                                partnerName: item.lieferantName || '',
                                partnerId: item.lieferantId || '',
                                partnerEntity: 'CLieferant',
                                belegdatum: item.belegdatum || '',
                                faelligAm: item.faelligAm || '',
                                zahlungsstatus: item.zahlungsstatus || '',
                                urspruenglich: brutto,
                                restbetrag: rest,
                                ausgeglichen: Math.max(0, brutto - rest),
                                buchungsjournalId: item.buchungsjournalId || '',
                                buchungsjournalName: item.buchungsjournalName || ''
                            };
                        });

                        resolve(list);
                    }).catch(reject);
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.vb-tbody-gf');
            const $tbodyBuha = view.$el.find('.vb-tbody-buha');

            let sumBrutto = 0;
            let sumAusgeglichen = 0;
            let sumRest = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine voll ausgeglichenen Belege gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="10" class="text-muted">Keine voll ausgeglichenen Belege gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfo(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                sumBrutto += Number(item.urspruenglich || 0);
                sumAusgeglichen += Number(item.ausgeglichen || 0);
                sumRest += Number(item.restbetrag || 0);

                const belegLink = `<a href="#${view.escapeHtml_(item.entityType)}/view/${view.escapeHtml_(item.id)}">${view.escapeHtml_(item.nummer || '')}</a>`;

                const partner = item.partnerId
                    ? `<a href="#${view.escapeHtml_(item.partnerEntity)}/view/${view.escapeHtml_(item.partnerId)}">${view.escapeHtml_(item.partnerName || '')}</a>`
                    : view.escapeHtml_(item.partnerName || '');

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const faelligAm = view.escapeHtml_(view.formatDateGerman_(item.faelligAm));
                const statusText = view.escapeHtml_(this.formatStatus_(item.zahlungsstatus || ''));

                let journalLink = '<span class="text-muted">–</span>';
                if (item.buchungsjournalId) {
                    journalLink = `<a href="#CBuchungsjournal/view/${view.escapeHtml_(item.buchungsjournalId)}">${view.escapeHtml_(item.buchungsjournalName || 'Journal')}</a>`;
                }

                htmlGf += `
                    <tr>
                        <td>${view.escapeHtml_(item.belegTyp)}</td>
                        <td>${belegLink}</td>
                        <td>${partner}</td>
                        <td>${faelligAm}</td>
                        <td>${view.formatCurrency_(item.urspruenglich)}</td>
                        <td>${view.formatCurrency_(item.ausgeglichen)}</td>
                        <td>${statusText}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${view.escapeHtml_(item.belegTyp)}</td>
                        <td>${belegLink}</td>
                        <td>${partner}</td>
                        <td>${belegdatum}</td>
                        <td>${faelligAm}</td>
                        <td>${statusText}</td>
                        <td>${view.formatCurrency_(item.urspruenglich)}</td>
                        <td>${view.formatCurrency_(item.ausgeglichen)}</td>
                        <td>${view.formatCurrency_(item.restbetrag)}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, sumBrutto, sumAusgeglichen, sumRest);
            this.updateInfo(view, list.length);
        },

        updateKennzahlen(view, anzahl, brutto, ausgeglichen, rest) {
            view.$el.find('.vb-kpi-anzahl').text(anzahl);
            view.$el.find('.vb-kpi-brutto').text(view.formatCurrency_(brutto));
            view.$el.find('.vb-kpi-ausgeglichen').text(view.formatCurrency_(ausgeglichen));
            view.$el.find('.vb-kpi-rest').text(view.formatCurrency_(rest));
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

            view.$el.find('.vb-info-zeitraum').text(zeitraumText);
            view.$el.find('.vb-info-anzahl').text(anzahl);
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