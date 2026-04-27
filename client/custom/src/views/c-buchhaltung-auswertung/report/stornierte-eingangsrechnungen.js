// Отчёт Stornierte Eingangsrechnungen.
// Что это: отдельный модуль рендера для auswertungTyp = stornierte_eingangsrechnungen.
// Зачем: показывает все сторнированные входящие счета в том же стиле, что и stornierte_rechnungen.

define('custom:views/c-buchhaltung-auswertung/report/stornierte-eingangsrechnungen', [], function () {
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
                                    <div><strong>Netto</strong></div>
                                    <div class="kb-kpi-netto" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Steuer</strong></div>
                                    <div class="kb-kpi-steuer" style="font-size: 22px;">0,00 €</div>
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
                        <div class="alert alert-danger kb-auswertung-info">
                            Zeitraum: <strong><span class="kb-info-zeitraum">–</span></strong>
                            &nbsp;|&nbsp;
                            Stornierte Eingangsrechnungen: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über stornierte Eingangsrechnungen im ausgewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Eingangsrechnungsnummer</th>
                                            <th>Lieferant</th>
                                            <th>Belegdatum</th>
                                            <th>Brutto</th>
                                            <th>Storniert am</th>
                                            <th>Grund</th>
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
                            <p>Erweiterte Sicht mit Storno-Journal und fachlichen Details.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Eingangsrechnungsnummer</th>
                                            <th>Lieferant</th>
                                            <th>Belegdatum</th>
                                            <th>Netto</th>
                                            <th>Steuer</th>
                                            <th>Brutto</th>
                                            <th>Storniert am</th>
                                            <th>Grund</th>
                                            <th>Storno-Journal</th>
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
                    attribute: 'status',
                    value: 'festgeschrieben'
                },
                {
                    type: 'equals',
                    attribute: 'zahlungsstatus',
                    value: 'storniert'
                }
            ];

            if (zeitraumVon) {
                where.push({
                    type: 'greaterThanOrEquals',
                    attribute: 'storniertAm',
                    value: zeitraumVon + ' 00:00:00'
                });
            }

            if (zeitraumBis) {
                where.push({
                    type: 'lessThanOrEquals',
                    attribute: 'storniertAm',
                    value: zeitraumBis + ' 23:59:59'
                });
            }

            view.getCollectionFactory().create('CEingangsrechnung', (collection) => {
                collection.maxSize = 200;

                collection.data.select = [
                    'id',
                    'name',
                    'eingangsrechnungsnummer',
                    'belegdatum',
                    'betragNetto',
                    'steuerBetrag',
                    'betragBrutto',
                    'lieferantId',
                    'lieferantName',
                    'storniertAm',
                    'stornoGrund',
                    'istStorniert',
                    'status',
                    'zahlungsstatus'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    const list = (collection.models || [])
                        .map(model => model.attributes || {});

                    list.sort((a, b) => {
                        const aStorno = a.storniertAm || '';
                        const bStorno = b.storniertAm || '';

                        if (aStorno !== bStorno) {
                            return bStorno.localeCompare(aStorno);
                        }

                        const aNr = a.eingangsrechnungsnummer || '';
                        const bNr = b.eingangsrechnungsnummer || '';
                        return bNr.localeCompare(aNr);
                    });

                    this.loadStornoJournale(view, list);
                }).catch((err) => {
                    console.error('[StornierteEingangsrechnungen] load failed', err);
                    view.notify('Fehler beim Laden der stornierten Eingangsrechnungen', 'error');
                });
            });
        },

        // Что это:
        // Загружает все журналы по найденным Eingangsrechnungen
        // и потом уже на клиенте выбирает именно сторно-журнал.
        //
        // Зачем:
        // Чтобы не зависеть от того, как именно gespeichert/angezeigt поле quelleTyp
        // и не отрезать нужный Journal слишком жёстким where-фильтром.
        loadStornoJournale(view, list) {
            if (!list.length) {
                this.render(view, list);
                return;
            }

            const ids = list.map(item => item.id).filter(Boolean);

            const where = [
                {
                    type: 'in',
                    attribute: 'quelleIdExtern',
                    value: ids
                }
            ];

            view.getCollectionFactory().create('CBuchungsjournal', (collection) => {
                collection.maxSize = 500;

                collection.data.select = [
                    'id',
                    'journalNummer',
                    'quelleIdExtern',
                    'quelleTyp',
                    'quelleNummer',
                    'buchungstext',
                    'istStorno',
                    'createdAt'
                ];

                collection.data.where = where;
                collection.data.orderBy = 'createdAt';
                collection.data.order = 'desc';

                collection.fetch().then(() => {
                    const journalMap = {};

                    (collection.models || []).forEach(model => {
                        const item = model.attributes || {};
                        const quelleIdExtern = item.quelleIdExtern || null;

                        if (!quelleIdExtern) return;
                        if (journalMap[quelleIdExtern]) return;

                        const journalNummer = String(item.journalNummer || item.name || '');
                        const buchungstext = String(item.buchungstext || '');
                        const quelleTyp = String(item.quelleTyp || '');
                        const istStorno = !!item.istStorno;

                        // Что это:
                        // Erkennung des echten Storno-Journals.
                        //
                        // Зачем:
                        // Берём только сторно-журнал, а не ursprüngliches Festschreibungsjournal.
                        const isStornoJournal =
                            istStorno === true ||
                            journalNummer.indexOf('ESTR-JRN-') === 0 ||
                            buchungstext.indexOf('Storno Eingangsrechnung ') === 0;

                        const looksLikeOriginalJournal =
                            journalNummer.indexOf('EJR-') === 0 &&
                            journalNummer.indexOf('ESTR-JRN-') !== 0 &&
                            buchungstext.indexOf('Festschreibung Eingangsrechnung ') === 0;

                        // Что это:
                        // Дополнительная мягкая проверка Quelle-Typ.
                        //
                        // Зачем:
                        // Принимаем и technische, и fachliche Darstellung.
                        const quelleTypPasst =
                            quelleTyp === 'CEingangsrechnung' ||
                            quelleTyp === 'Eingangsrechnung' ||
                            quelleTyp === '';

                        if (!quelleTypPasst) return;
                        if (!isStornoJournal || looksLikeOriginalJournal) return;

                        journalMap[quelleIdExtern] = {
                            id: item.id || '',
                            journalNummer: item.journalNummer || item.name || ''
                        };
                    });

                    list.forEach(item => {
                        item._stornoJournal = journalMap[item.id] || null;
                    });

                    this.render(view, list);
                }).catch((err) => {
                    console.error('[StornierteEingangsrechnungen] load journals failed', err);
                    this.render(view, list);
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumNetto = 0;
            let sumSteuer = 0;
            let sumBrutto = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-muted">Keine stornierten Eingangsrechnungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="9" class="text-muted">Keine stornierten Eingangsrechnungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const netto = Number(item.betragNetto || 0);
                const steuer = Number(item.steuerBetrag || 0);
                const brutto = Number(item.betragBrutto || 0);

                sumNetto += netto;
                sumSteuer += steuer;
                sumBrutto += brutto;

                const nummerText = view.escapeHtml_(item.eingangsrechnungsnummer || item.name || '');
                const id = view.escapeHtml_(item.id || '');
                const nummer = `<a href="#CEingangsrechnung/view/${id}">${nummerText}</a>`;

                const lieferantText = view.escapeHtml_(item.lieferantName || '');
                const lieferantId = view.escapeHtml_(item.lieferantId || '');
                const lieferant = lieferantId
                    ? `<a href="#CLieferant/view/${lieferantId}">${lieferantText}</a>`
                    : lieferantText;

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const storniertAm = view.escapeHtml_(view.formatDateTimeGerman_(item.storniertAm));
                const stornoGrund = view.escapeHtml_(item.stornoGrund || '—');

                htmlGf += `
                    <tr>
                        <td>${nummer}</td>
                        <td>${lieferant}</td>
                        <td>${belegdatum}</td>
                        <td>${view.formatCurrency_(brutto)}</td>
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
                        <td>${nummer}</td>
                        <td>${lieferant}</td>
                        <td>${belegdatum}</td>
                        <td>${view.formatCurrency_(netto)}</td>
                        <td>${view.formatCurrency_(steuer)}</td>
                        <td>${view.formatCurrency_(brutto)}</td>
                        <td>${storniertAm}</td>
                        <td>${stornoGrund}</td>
                        <td>${journalLink}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, sumNetto, sumSteuer, sumBrutto);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, anzahl, netto, steuer, brutto) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-netto').text(view.formatCurrency_(netto));
            view.$el.find('.kb-kpi-steuer').text(view.formatCurrency_(steuer));
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
        }
    };
});