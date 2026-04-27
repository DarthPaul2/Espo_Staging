// Отчёт Stornierte Kontenbewegungen.
// Что это: отдельный модуль рендера для auswertungTyp = stornierte_kontenbewegungen.
// Зачем: показывает все сторно-проводки в едином стиле с остальными Buchhaltung-Auswertungen.

define('custom:views/c-buchhaltung-auswertung/report/stornierte-kontenbewegungen', [], function () {
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
                                    <div><strong>Soll gesamt</strong></div>
                                    <div class="kb-kpi-soll" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Haben gesamt</strong></div>
                                    <div class="kb-kpi-haben" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Journale</strong></div>
                                    <div class="kb-kpi-journale" style="font-size: 22px;">0</div>
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
                            Storno-Buchungen: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über storno-relevante Kontenbewegungen im ausgewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Datum</th>
                                            <th>Quelle</th>
                                            <th>Nummer</th>
                                            <th>Art</th>
                                            <th>Betrag</th>
                                            <th>Buchungstext</th>
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
                            <p>Erweiterte Sicht mit Buchungstext, Steuerfall und direktem Bezug auf Journal und Ursprung.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Datum</th>
                                            <th>Quelle</th>
                                            <th>Nummer</th>
                                            <th>Journal</th>
                                            <th>Konto</th>
                                            <th>Konto-Bezeichnung</th>
                                            <th>Art</th>
                                            <th>Betrag</th>
                                            <th>Steuerfall</th>
                                            <th>Buchungstext</th>
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

            const params = {};

            if (zeitraumVon) {
                params.von = zeitraumVon;
            }

            if (zeitraumBis) {
                params.bis = zeitraumBis;
            }

            Espo.Ajax.getRequest('CBuchungsjournal/action/stornierteKontenbewegungenReport', params)
                .then((rows) => {
                    const list = Array.isArray(rows) ? rows : [];

                    list.sort((a, b) => {
                        const aDate = a.belegdatum || '';
                        const bDate = b.belegdatum || '';

                        if (aDate !== bDate) {
                            return bDate.localeCompare(aDate);
                        }

                        const aCreated = a.createdAt || '';
                        const bCreated = b.createdAt || '';

                        if (aCreated !== bCreated) {
                            return bCreated.localeCompare(aCreated);
                        }

                        const aId = a.id || '';
                        const bId = b.id || '';
                        return bId.localeCompare(aId);
                    });

                    // Что это:
                    // Считаем уникальные сторно-журналы для KPI сверху.
                    const uniqueJournalIds = new Set();

                    list.forEach(item => {
                        if (item.buchungsjournalId) {
                            uniqueJournalIds.add(String(item.buchungsjournalId));
                        }
                    });

                    view._kbJournalCount = uniqueJournalIds.size;

                    this.render(view, list);
                })
                .catch((err) => {
                    console.error('[StornierteKontenbewegungen] load failed', err);
                    view.notify('Fehler beim Laden der stornierten Kontenbewegungen', 'error');
                });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumSoll = 0;
            let sumHaben = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="6" class="text-muted">Keine stornierten Kontenbewegungen gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="10" class="text-muted">Keine stornierten Kontenbewegungen gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            // Что это:
            // Счётчик уникальных сторно-журналов по загруженным строкам.
            //
            // Зачем:
            // KPI "Journale" должен показывать реальное число уникальных Journal-ID.
            const uniqueJournalIds = new Set();

            list.forEach((item) => {
                const betrag = Number(item.betrag || 0);
                const artRaw = String(item.buchungsart || '').toLowerCase();

                // Что это:
                // Добавляем Journal-ID в набор уникальных журналов.
                //
                // Зачем:
                // Один журнал может содержать несколько проводок,
                // но в KPI он должен считаться один раз.
                if (item.buchungsjournalId) {
                    uniqueJournalIds.add(String(item.buchungsjournalId));
                }

                if (artRaw === 'debit') {
                    sumSoll += betrag;
                }

                if (artRaw === 'credit') {
                    sumHaben += betrag;
                }

                const datum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));

                const quelleTypRaw = String(item.quelleTyp || '').toLowerCase();
                let quelleLabel = '—';

                if (quelleTypRaw === 'ausgangsrechnung') {
                    quelleLabel = 'Rechnung';
                } else if (quelleTypRaw === 'ceingangsrechnung') {
                    quelleLabel = 'Eingangsrechnung';
                } else if (quelleTypRaw === 'czahlung') {
                    quelleLabel = 'Zahlung';
                } else if (quelleTypRaw) {
                    quelleLabel = item.quelleTyp;
                }

                const quelle = view.escapeHtml_(quelleLabel);
                const nummerText = view.escapeHtml_(item.quelleNummer || '—');

                let nummerLink = nummerText;

                if (quelleTypRaw === 'ausgangsrechnung' && item.quelleIdExtern) {
                    nummerLink = `<a href="#CRechnung/view/${view.escapeHtml_(item.quelleIdExtern)}">${nummerText}</a>`;
                } else if (quelleTypRaw === 'ceingangsrechnung' && item.quelleIdExtern) {
                    nummerLink = `<a href="#CEingangsrechnung/view/${view.escapeHtml_(item.quelleIdExtern)}">${nummerText}</a>`;
                } else if (quelleTypRaw === 'czahlung' && item.quelleIdExtern) {
                    nummerLink = `<a href="#CZahlung/view/${view.escapeHtml_(item.quelleIdExtern)}">${nummerText}</a>`;
                }

                const art = view.escapeHtml_(
                    artRaw === 'debit'
                        ? 'Soll'
                        : artRaw === 'credit'
                            ? 'Haben'
                            : '—'
                );

                const kontoNummer = view.escapeHtml_(item.kontoNummer || '—');
                const kontoBezeichnung = view.escapeHtml_(item.kontoBezeichnung || '—');
                const steuerFall = view.escapeHtml_(item.steuerFall || '—');
                const buchungstext = view.escapeHtml_(item.buchungstext || '—');

                const journalLink = item.buchungsjournalId && item.journalNummer
                    ? `<a href="#CBuchungsjournal/view/${view.escapeHtml_(item.buchungsjournalId)}">${view.escapeHtml_(item.journalNummer)}</a>`
                    : '<span class="text-muted">–</span>';

                htmlGf += `
                    <tr>
                        <td>${datum}</td>
                        <td>${quelle}</td>
                        <td>${nummerLink}</td>
                        <td>${art}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${buchungstext}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${datum}</td>
                        <td>${quelle}</td>
                        <td>${nummerLink}</td>
                        <td>${journalLink}</td>
                        <td>${kontoNummer}</td>
                        <td>${kontoBezeichnung}</td>
                        <td>${art}</td>
                        <td>${view.formatCurrency_(betrag)}</td>
                        <td>${steuerFall}</td>
                        <td>${buchungstext}</td>
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
                uniqueJournalIds.size
            );
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, anzahl, sumSoll, sumHaben, journalCount) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-soll').text(view.formatCurrency_(sumSoll));
            view.$el.find('.kb-kpi-haben').text(view.formatCurrency_(sumHaben));
            view.$el.find('.kb-kpi-journale').text(journalCount || 0);
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