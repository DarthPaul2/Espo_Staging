// Отчёт Kontenbewegungen Eingang.
// Что это: Phase-2-Bericht по всем Buchungen из CEingangsrechnung.

define('custom:views/c-buchhaltung-auswertung/report/kontenbewegungen-eingang', [], function () {
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
                            title="Wechselt in den Stammdaten-Modus."
                        >
                            <span class="fas fa-cog" style="margin-right: 6px;"></span>
                            Stammdaten
                        </button>
                    </div>

                    <div class="panel-body">
                        <div class="row">
                            <div class="col-sm-4">
                                <div class="well">
                                    <div><strong>Anzahl Buchungen</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-4">
                                <div class="well">
                                    <div><strong>Soll</strong></div>
                                    <div class="kb-kpi-debit" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-4">
                                <div class="well">
                                    <div><strong>Haben</strong></div>
                                    <div class="kb-kpi-credit" style="font-size: 22px;">0,00 €</div>
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
                            <p>Überblick über Kontenbewegungen aus festgeschriebenen Eingangsrechnungen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Belegdatum</th>
                                            <th>Eingangsrechnung</th>
                                            <th>Konto</th>
                                            <th>Buchungsart</th>
                                            <th>Betrag</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-gf">
                                        <tr>
                                            <td colspan="5" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Vollständige Sicht auf alle Buchungen aus Eingangsrechnungen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Belegdatum</th>
                                            <th>Quelle</th>
                                            <th>Quelle-Nr.</th>
                                            <th>Buchungsart</th>
                                            <th>Konto</th>
                                            <th>Konto-Bezeichnung</th>
                                            <th>Buchungstext</th>
                                            <th>Betrag</th>
                                            <th>Steuerfall</th>
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
                    value: 'CEingangsrechnung'
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
                    'belegdatum',
                    'quelleTyp',
                    'quelleIdExtern',
                    'quelleNummer',
                    'buchungsart',
                    'kontoNummer',
                    'kontoBezeichnung',
                    'buchungstext',
                    'betrag',
                    'steuerFall'
                ];

                collection.data.where = where;

                collection.fetch().then(() => {
                    const list = (collection.models || [])
                        .map(model => model.attributes || {})
                        .filter(item => String(item.quelleTyp || '') === 'CEingangsrechnung');

                    list.sort((a, b) => {
                        const aDate = a.belegdatum || '';
                        const bDate = b.belegdatum || '';
                        if (aDate !== bDate) {
                            return bDate.localeCompare(aDate);
                        }

                        const aNum = a.quelleNummer || '';
                        const bNum = b.quelleNummer || '';
                        if (aNum !== bNum) {
                            return bNum.localeCompare(aNum);
                        }

                        const aArt = a.buchungsart || '';
                        const bArt = b.buchungsart || '';
                        return aArt.localeCompare(bArt);
                    });

                    this.render(view, list);
                }).catch((err) => {
                    console.error('[KontenbewegungenEingang] load failed', err);
                    view.notify('Fehler beim Laden der Kontenbewegungen Eingang', 'error');
                });
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumDebit = 0;
            let sumCredit = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="5" class="text-muted">Keine Kontenbewegungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="9" class="text-muted">Keine Kontenbewegungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const buchungsart = String(item.buchungsart || '').toLowerCase();

                if (buchungsart === 'debit') {
                    sumDebit += betrag;
                } else if (buchungsart === 'credit') {
                    sumCredit += betrag;
                }

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const quelleNummerText = view.escapeHtml_(item.quelleNummer || '');
                const quelleId = view.escapeHtml_(item.quelleIdExtern || '');
                const quelleLink = quelleId
                    ? `<a href="#CEingangsrechnung/view/${quelleId}">${quelleNummerText}</a>`
                    : quelleNummerText;

                const kontoNummer = view.escapeHtml_(item.kontoNummer || '');
                const kontoBezeichnung = view.escapeHtml_(item.kontoBezeichnung || '');
                const buchungstext = view.escapeHtml_(item.buchungstext || '');
                const steuerFall = view.escapeHtml_(item.steuerFall || '');
                const quelleTyp = view.escapeHtml_(item.quelleTyp || '');
                const buchungsartText = view.escapeHtml_(item.buchungsart || '');

                htmlGf += `
                    <tr>
                        <td>${belegdatum}</td>
                        <td>${quelleLink}</td>
                        <td>${kontoNummer}</td>
                        <td>${buchungsartText}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${belegdatum}</td>
                        <td>${quelleTyp}</td>
                        <td>${quelleLink}</td>
                        <td>${buchungsartText}</td>
                        <td>${kontoNummer}</td>
                        <td>${kontoBezeichnung}</td>
                        <td>${buchungstext}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${steuerFall}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, sumDebit, sumCredit);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, anzahl, debit, credit) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-debit').text(view.formatCurrency_(debit));
            view.$el.find('.kb-kpi-credit').text(view.formatCurrency_(credit));
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