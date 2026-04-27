define('custom:views/c-buchhaltung-auswertung/report/stornierte-journale', [], function () {
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
                                    <div><strong>Anzahl Journale</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Soll</strong></div>
                                    <div class="kb-kpi-soll" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Haben</strong></div>
                                    <div class="kb-kpi-haben" style="font-size: 22px;">0,00 €</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Buchungszeilen</strong></div>
                                    <div class="kb-kpi-zeilen" style="font-size: 22px;">0</div>
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
                            Stornierte Journale: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über stornierte Journale im ausgewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Journalnummer</th>
                                            <th>Quelle</th>
                                            <th>Nummer</th>
                                            <th>Belegdatum</th>
                                            <th>Soll</th>
                                            <th>Haben</th>
                                            <th>Storno-Grund</th>
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
                            <p>Erweiterte Sicht mit Buchungstext, Status und Anzahl Buchungszeilen.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Journalnummer</th>
                                            <th>Quelle</th>
                                            <th>Nummer</th>
                                            <th>Belegdatum</th>
                                            <th>Buchungstext</th>
                                            <th>Status</th>
                                            <th>Buchungszeilen</th>
                                            <th>Soll</th>
                                            <th>Haben</th>
                                            <th>Storno-Grund</th>
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

            Espo.Ajax.getRequest('CBuchungsjournal/action/stornierteJournaleReport', params)
                .then((rows) => {
                    const list = Array.isArray(rows) ? rows : [];

                    list.sort((a, b) => {
                        const aCreated = a.createdAt || '';
                        const bCreated = b.createdAt || '';

                        if (aCreated !== bCreated) {
                            return bCreated.localeCompare(aCreated);
                        }

                        const aNr = a.journalNummer || '';
                        const bNr = b.journalNummer || '';
                        return bNr.localeCompare(aNr);
                    });

                    this.render(view, list);
                })
                .catch((err) => {
                    console.error('[StornierteJournale] load failed', err);
                    view.notify('Fehler beim Laden der stornierten Journale', 'error');
                });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            let sumSoll = 0;
            let sumHaben = 0;
            let sumZeilen = 0;

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="7" class="text-muted">Keine stornierten Journale gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="10" class="text-muted">Keine stornierten Journale gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const soll = Number(item.sumSoll || 0);
                const haben = Number(item.sumHaben || 0);
                const zeilen = Number(item.anzahlBuchungen || 0);

                sumSoll += soll;
                sumHaben += haben;
                sumZeilen += zeilen;

                const journalId = view.escapeHtml_(item.id || '');
                const journalNummerText = view.escapeHtml_(item.journalNummer || item.name || '—');
                const journalLink = `<a href="#CBuchungsjournal/view/${journalId}">${journalNummerText}</a>`;

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

                const belegdatum = view.escapeHtml_(view.formatDateGerman_(item.belegdatum));
                const buchungstext = view.escapeHtml_(item.buchungstext || '—');
                const status = view.escapeHtml_(item.buchhaltungStatus || '—');
                const stornoGrund = view.escapeHtml_(item.stornoGrund || '—');

                htmlGf += `
                    <tr>
                        <td>${journalLink}</td>
                        <td>${quelle}</td>
                        <td>${nummerLink}</td>
                        <td>${belegdatum}</td>
                        <td>${view.formatCurrency_(soll)}</td>
                        <td>${view.formatCurrency_(haben)}</td>
                        <td>${stornoGrund}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${journalLink}</td>
                        <td>${quelle}</td>
                        <td>${nummerLink}</td>
                        <td>${belegdatum}</td>
                        <td>${buchungstext}</td>
                        <td>${status}</td>
                        <td>${zeilen}</td>
                        <td>${view.formatCurrency_(soll)}</td>
                        <td>${view.formatCurrency_(haben)}</td>
                        <td>${stornoGrund}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, list.length, sumSoll, sumHaben, sumZeilen);
            this.updateInfoZeile(view, list.length);
        },

        updateKennzahlen(view, anzahl, sumSoll, sumHaben, sumZeilen) {
            view.$el.find('.kb-kpi-anzahl').text(anzahl);
            view.$el.find('.kb-kpi-soll').text(view.formatCurrency_(sumSoll));
            view.$el.find('.kb-kpi-haben').text(view.formatCurrency_(sumHaben));
            view.$el.find('.kb-kpi-zeilen').text(sumZeilen);
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