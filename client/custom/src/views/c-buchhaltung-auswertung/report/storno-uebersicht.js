define('custom:views/c-buchhaltung-auswertung/report/storno-uebersicht', [], function () {
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
                                    <div><strong>Storno-Vorgänge gesamt</strong></div>
                                    <div class="kb-kpi-anzahl" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Beleg-Stornos</strong></div>
                                    <div class="kb-kpi-belege" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Zahlung/Ausgleich</strong></div>
                                    <div class="kb-kpi-zahlung" style="font-size: 22px;">0</div>
                                </div>
                            </div>
                            <div class="col-sm-3">
                                <div class="well">
                                    <div><strong>Journale/Buchungen</strong></div>
                                    <div class="kb-kpi-buchung" style="font-size: 22px;">0</div>
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
                            Storno-Vorgänge: <strong><span class="kb-info-anzahl">0</span></strong>
                        </div>

                        <div class="kb-tab-panel" data-tab-panel="gf">
                            <p><strong>Geschäftsführung</strong></p>
                            <p>Kompakter Überblick über alle stornierten Vorgänge im ausgewählten Zeitraum.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bereich</th>
                                            <th>Anzahl</th>
                                            <th>Beschreibung</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-gf">
                                        <tr>
                                            <td colspan="3" class="text-muted">Noch keine Daten geladen.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="kb-tab-panel hidden" data-tab-panel="buha">
                            <p><strong>Buchhaltung</strong></p>
                            <p>Aggregierte Sicht auf alle Storno-Bereiche des Systems.</p>

                            <div class="table-responsive">
                                <table class="table table-bordered table-striped">
                                    <thead>
                                        <tr>
                                            <th>Bereich</th>
                                            <th>Anzahl</th>
                                            <th>Kategorie</th>
                                            <th>Hinweis</th>
                                        </tr>
                                    </thead>
                                    <tbody class="kb-tbody-buha">
                                        <tr>
                                            <td colspan="4" class="text-muted">Noch keine Daten geladen.</td>
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

            Promise.all([
                Espo.Ajax.getRequest('CRechnung/action/stornierteRechnungenReport', params).catch(() => []),
                Espo.Ajax.getRequest('CEingangsrechnung/action/stornierteEingangsrechnungenReport', params).catch(() => []),
                Espo.Ajax.getRequest('CZahlung/action/stornierteZahlungenReport', params).catch(() => []),
                Espo.Ajax.getRequest('CZahlung/action/stornierteAusgleicheReport', params).catch(() => []),
                Espo.Ajax.getRequest('CBuchungsjournal/action/stornierteJournaleReport', params).catch(() => []),
                Espo.Ajax.getRequest('CBuchungsjournal/action/stornierteKontenbewegungenReport', params).catch(() => [])
            ]).then(([
                stornierteRechnungen,
                stornierteEingangsrechnungen,
                stornierteZahlungen,
                stornierteAusgleiche,
                stornierteJournale,
                stornierteKontenbewegungen
            ]) => {
                const list = [
                    {
                        bereich: 'Stornierte Rechnungen',
                        anzahl: Array.isArray(stornierteRechnungen) ? stornierteRechnungen.length : 0,
                        kategorie: 'Beleg',
                        hinweis: 'Stornierte Ausgangsrechnungen'
                    },
                    {
                        bereich: 'Stornierte Eingangsrechnungen',
                        anzahl: Array.isArray(stornierteEingangsrechnungen) ? stornierteEingangsrechnungen.length : 0,
                        kategorie: 'Beleg',
                        hinweis: 'Stornierte Eingangsrechnungen'
                    },
                    {
                        bereich: 'Stornierte Zahlungen',
                        anzahl: Array.isArray(stornierteZahlungen) ? stornierteZahlungen.length : 0,
                        kategorie: 'Zahlung',
                        hinweis: 'Stornierte Zahlungsvorgänge'
                    },
                    {
                        bereich: 'Stornierte Ausgleiche',
                        anzahl: Array.isArray(stornierteAusgleiche) ? stornierteAusgleiche.length : 0,
                        kategorie: 'Zahlung',
                        hinweis: 'Deaktivierte und stornierte Ausgleiche'
                    },
                    {
                        bereich: 'Stornierte Journale',
                        anzahl: Array.isArray(stornierteJournale) ? stornierteJournale.length : 0,
                        kategorie: 'Buchung',
                        hinweis: 'Erzeugte Storno-Journale'
                    },
                    {
                        bereich: 'Stornierte Kontenbewegungen',
                        anzahl: Array.isArray(stornierteKontenbewegungen) ? stornierteKontenbewegungen.length : 0,
                        kategorie: 'Buchung',
                        hinweis: 'Einzelne Storno-Buchungszeilen'
                    }
                ];

                this.render(view, list);
            }).catch((err) => {
                console.error('[StornoUebersicht] load failed', err);
                view.notify('Fehler beim Laden der Storno-Übersicht', 'error');
            });
        },

        render(view, list) {
            const $tbodyGf = view.$el.find('.kb-tbody-gf');
            const $tbodyBuha = view.$el.find('.kb-tbody-buha');

            if (!list.length) {
                $tbodyGf.html('<tr><td colspan="3" class="text-muted">Keine Daten gefunden.</td></tr>');
                $tbodyBuha.html('<tr><td colspan="4" class="text-muted">Keine Daten gefunden.</td></tr>');
                this.updateKennzahlen(view, 0, 0, 0, 0);
                this.updateInfoZeile(view, 0);
                return;
            }

            let gesamt = 0;
            let sumBelege = 0;
            let sumZahlung = 0;
            let sumBuchung = 0;

            let htmlGf = '';
            let htmlBuha = '';

            list.forEach((item) => {
                const anzahl = Number(item.anzahl || 0);
                const bereich = view.escapeHtml_(item.bereich || '—');
                const kategorie = view.escapeHtml_(item.kategorie || '—');
                const hinweis = view.escapeHtml_(item.hinweis || '—');

                gesamt += anzahl;

                if (item.kategorie === 'Beleg') {
                    sumBelege += anzahl;
                }
                if (item.kategorie === 'Zahlung') {
                    sumZahlung += anzahl;
                }
                if (item.kategorie === 'Buchung') {
                    sumBuchung += anzahl;
                }

                htmlGf += `
                    <tr>
                        <td>${bereich}</td>
                        <td>${anzahl}</td>
                        <td>${hinweis}</td>
                    </tr>
                `;

                htmlBuha += `
                    <tr>
                        <td>${bereich}</td>
                        <td>${anzahl}</td>
                        <td>${kategorie}</td>
                        <td>${hinweis}</td>
                    </tr>
                `;
            });

            $tbodyGf.html(htmlGf);
            $tbodyBuha.html(htmlBuha);

            this.updateKennzahlen(view, gesamt, sumBelege, sumZahlung, sumBuchung);
            this.updateInfoZeile(view, gesamt);
        },

        updateKennzahlen(view, gesamt, belege, zahlung, buchung) {
            view.$el.find('.kb-kpi-anzahl').text(gesamt);
            view.$el.find('.kb-kpi-belege').text(belege);
            view.$el.find('.kb-kpi-zahlung').text(zahlung);
            view.$el.find('.kb-kpi-buchung').text(buchung);
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