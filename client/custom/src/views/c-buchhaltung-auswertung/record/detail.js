// Кастомный detail view для CBuchhaltungAuswertung.
// Что это: два режима работы.
// 1) standard -> обычная карточка + кнопка "Berichtmodus"
// 2) bericht  -> экран отчёта + кнопка "Stammdaten"

define(
    'custom:views/c-buchhaltung-auswertung/record/detail',
    [
        'views/record/detail',
        'custom:views/c-buchhaltung-auswertung/report/festgeschriebene-rechnungen',
        'custom:views/c-buchhaltung-auswertung/report/festgeschriebene-eingangsrechnungen',
        'custom:views/c-buchhaltung-auswertung/report/verbindlichkeiten',
        'custom:views/c-buchhaltung-auswertung/report/aufwand',
        'custom:views/c-buchhaltung-auswertung/report/vorsteuer',
        'custom:views/c-buchhaltung-auswertung/report/kontenbewegungen-eingang',
        'custom:views/c-buchhaltung-auswertung/report/umsatzuebersicht',
        'custom:views/c-buchhaltung-auswertung/report/umsatzsteuer-uebersicht',
        'custom:views/c-buchhaltung-auswertung/report/offene-forderungen',
        'custom:views/c-buchhaltung-auswertung/report/kontenbewegungen'
    ],
    function (
        Dep,
        FestgeschriebeneRechnungenReport,
        FestgeschriebeneEingangsrechnungenReport,
        VerbindlichkeitenReport,
        AufwandReport,
        VorsteuerReport,
        KontenbewegungenEingangReport,
        UmsatzuebersichtReport,
        UmsatzsteuerUebersichtReport,
        OffeneForderungenReport,
        KontenbewegungenReport
    ) {
        return Dep.extend({

            setup() {
                Dep.prototype.setup.call(this);

                // Что это: при подгрузке или смене записи повторно применяем нужный режим.
                this.listenTo(this.model, 'sync', () => this.scheduleApplyRenderMode_());
                this.listenTo(this.model, 'change:renderModus', () => this.scheduleApplyRenderMode_());
                this.listenTo(this.model, 'change:auswertungTyp', () => this.scheduleApplyRenderMode_());
            },

            afterRender() {
                Dep.prototype.afterRender.call(this);
                this.scheduleApplyRenderMode_();
            },

            // Что это: повторно пытается применить режим, пока model не отдаст renderModus / auswertungTyp.
            scheduleApplyRenderMode_() {
                if (this._applyRenderModeTimer) {
                    clearTimeout(this._applyRenderModeTimer);
                }

                this._applyRenderModeAttempts = 0;

                const run = () => {
                    if (this.isDisposed && this.isDisposed()) {
                        return;
                    }

                    this._applyRenderModeAttempts++;

                    const renderModus = this.model ? this.model.get('renderModus') : null;
                    const auswertungTyp = this.model ? this.model.get('auswertungTyp') : null;

                    this.applyRenderMode_();

                    // Если ключевые поля ещё не подгружены, пробуем ещё несколько раз.
                    if ((!renderModus || !auswertungTyp) && this._applyRenderModeAttempts < 20) {
                        this._applyRenderModeTimer = setTimeout(run, 100);
                        return;
                    }

                };

                run();
            },

            // Что это: защита от повторной загрузки одного и того же отчёта с теми же параметрами.
            shouldLoadReport_(auswertungTyp) {
                const signature = JSON.stringify({
                    id: this.model.id,
                    auswertungTyp: auswertungTyp,
                    renderModus: this.model.get('renderModus'),
                    zeitraumVon: this.model.get('zeitraumVon') || null,
                    zeitraumBis: this.model.get('zeitraumBis') || null
                });

                if (this._lastReportLoadSignature === signature) {
                    return false;
                }

                this._lastReportLoadSignature = signature;
                return true;
            },

            applyRenderMode_() {
                const renderModus = this.model.get('renderModus');
                const auswertungTyp = this.model.get('auswertungTyp');
                console.log('[CBuchhaltungAuswertung] renderModus =', renderModus, 'auswertungTyp =', auswertungTyp);

                this.$el.removeClass('kb-bericht-mode');
                this.$el.find('.kb-berichtmodus-button').remove();

                // Что это: если модель ещё не подгрузилась, просто выходим и ждём следующий retry.
                if (!renderModus || !auswertungTyp) {
                    return;
                }

                if (renderModus === 'standard') {
                    this.renderStandardModeButton_();
                    return;
                }

                if (renderModus !== 'bericht') {
                    return;
                }

                this.renderButtonStyles_();

                if (auswertungTyp === 'festgeschriebene_rechnungen') {
                    FestgeschriebeneRechnungenReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    FestgeschriebeneRechnungenReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        FestgeschriebeneRechnungenReport.load(this);
                    }
                }

                if (auswertungTyp === 'festgeschriebene_eingangsrechnungen') {
                    console.log('[CBuchhaltungAuswertung] entering festgeschriebene_eingangsrechnungen branch');
                    FestgeschriebeneEingangsrechnungenReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    FestgeschriebeneEingangsrechnungenReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        FestgeschriebeneEingangsrechnungenReport.load(this);
                    }
                }

                if (auswertungTyp === 'verbindlichkeiten') {
                    VerbindlichkeitenReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    VerbindlichkeitenReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        VerbindlichkeitenReport.load(this);
                    }
                }

                if (auswertungTyp === 'aufwand') {
                    AufwandReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    AufwandReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        AufwandReport.load(this);
                    }
                }

                if (auswertungTyp === 'vorsteuer') {
                    VorsteuerReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    VorsteuerReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        VorsteuerReport.load(this);
                    }
                }

                if (auswertungTyp === 'kontenbewegungen_eingang') {
                    KontenbewegungenEingangReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    KontenbewegungenEingangReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        KontenbewegungenEingangReport.load(this);
                    }
                }

                if (auswertungTyp === 'umsatzuebersicht') {
                    UmsatzuebersichtReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    UmsatzuebersichtReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        UmsatzuebersichtReport.load(this);
                    }
                }

                if (auswertungTyp === 'umsatzsteuer_uebersicht') {
                    UmsatzsteuerUebersichtReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    UmsatzsteuerUebersichtReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        UmsatzsteuerUebersichtReport.load(this);
                    }
                }

                if (auswertungTyp === 'offene_forderungen') {
                    OffeneForderungenReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    OffeneForderungenReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        OffeneForderungenReport.load(this);
                    }
                }

                if (auswertungTyp === 'kontenbewegungen') {
                    KontenbewegungenReport.renderKennzahlenBlock(this);
                    this.renderFilterBlock_();
                    KontenbewegungenReport.renderTabsBlock(this);
                    this.updateZeitraumButtons_();

                    if (this.shouldLoadReport_(auswertungTyp)) {
                        KontenbewegungenReport.load(this);
                    }
                }

                this.hideStandardRecordUi_();
            },

            renderButtonStyles_() {
                if (document.getElementById('kb-auswertung-button-styles')) {
                    return;
                }

                const style = document.createElement('style');
                style.id = 'kb-auswertung-button-styles';
                style.textContent = `
                    .kb-stammdaten-button {
                        font-weight: 600 !important;
                        background-color: #a595c9 !important;
                        border: 1px solid #9787bc !important;
                        color: #fff !important;
                        padding: 6px 12px !important;
                        line-height: 1.5 !important;
                        border-radius: 4px !important;
                        cursor: pointer !important;
                    }

                    .kb-stammdaten-button:hover,
                    .kb-stammdaten-button:focus {
                        background-color: #8e7db5 !important;
                        border-color: #8270ab !important;
                        color: #fff !important;
                    }

                    .kb-bericht-mode .button-container,
                    .kb-bericht-mode .record-bottom,
                    .kb-bericht-mode .bottom,
                    .kb-bericht-mode .middle .record-panels,
                    .kb-bericht-mode .side .record-panels {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
            },

            renderStandardModeButton_() {
                this.$el.find('.kb-berichtmodus-button').remove();

                const group = this.el.querySelector('div.btn-group.actions-btn-group');
                if (!group) {
                    return;
                }

                const dropdownToggle = group.querySelector('button.dropdown-toggle');

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-info kb-berichtmodus-button';
                button.setAttribute('data-action', 'kb-switch-to-bericht');
                button.setAttribute('title', 'Wechselt zurück in den Berichtsmodus dieser Auswertung.');
                button.style.fontWeight = '600';
                button.innerHTML = '<span class="fas fa-chart-bar" style="margin-right: 6px;"></span>Berichtmodus';

                if (dropdownToggle) {
                    group.insertBefore(button, dropdownToggle);
                } else {
                    group.appendChild(button);
                }
            },

            renderFilterBlock_() {
                if (this.$el.find('.kb-auswertung-filter').length) {
                    return;
                }

                const zeitraumVon = this.model.get('zeitraumVon') || '';
                const zeitraumBis = this.model.get('zeitraumBis') || '';

                const html = `
                <div class="panel panel-default kb-auswertung-filter">
                    <div class="panel-heading">
                        <h4 class="panel-title">Zeitraum</h4>
                    </div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-sm-3">
                                <label class="control-label">Von</label>
                                <input type="date" class="form-control" data-name="kb-zeitraum-von" value="${zeitraumVon}">
                            </div>
                            <div class="col-sm-3">
                                <label class="control-label">Bis</label>
                                <input type="date" class="form-control" data-name="kb-zeitraum-bis" value="${zeitraumBis}">
                            </div>
                            <div class="col-sm-6" style="padding-top: 25px;">
                                <button class="btn btn-default" data-action="kb-set-zeitraum" data-mode="monat">Monat</button>
                                <button class="btn btn-default" data-action="kb-set-zeitraum" data-mode="quartal">Quartal</button>
                                <button class="btn btn-default" data-action="kb-set-zeitraum" data-mode="jahr">Jahr</button>

                                <span style="display: inline-block; width: 28px;"></span>

                                <button class="btn btn-default" data-action="kb-set-zeitraum" data-mode="alles">Alles</button>

                                <span style="display: inline-block; width: 22px;"></span>

                                <button class="btn btn-primary" data-action="kb-aktualisieren">Aktualisieren</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

                const $summary = this.$el.find('.kb-auswertung-summary');
                if ($summary.length) {
                    $summary.after(html);
                }
            },


            // Что это: скрывает всю стандартную карточку в Bericht-Modus,
            // оставляя только наши кастомные Bericht-Panels.
            hideStandardRecordUi_() {
                this.$el.addClass('kb-bericht-mode');

                const hide = () => {
                    this.$el.find('.button-container').hide();

                    // Скрываем все стандартные панели, кроме наших Bericht-Panels
                    this.$el.find('.panel').not(
                        '.kb-auswertung-summary, .kb-auswertung-filter, .kb-auswertung-tabs'
                    ).hide();

                    // Скрываем стандартные form-cells карточки
                    this.$el.find('.cell').hide();

                    // На всякий случай ещё эти контейнеры
                    this.$el.find('.record-bottom').hide();
                    this.$el.find('.bottom').hide();
                };

                hide();
                window.requestAnimationFrame(hide);
                setTimeout(hide, 50);
                setTimeout(hide, 200);
            },

            switchTab_(tab) {
                const $tabs = this.$el.find('.kb-auswertung-tabs');

                $tabs.find('.nav-tabs li').removeClass('active');
                $tabs.find(`[data-action="kb-show-tab"][data-tab="${tab}"]`).closest('li').addClass('active');

                $tabs.find('.kb-tab-panel').addClass('hidden');
                $tabs.find(`[data-tab-panel="${tab}"]`).removeClass('hidden');
            },

            updateInfoZeile_(anzahl) {
                const von = this.model.get('zeitraumVon');
                const bis = this.model.get('zeitraumBis');

                let text = 'Gesamter verfügbarer Zeitraum';
                if (von && bis) {
                    text = `${this.formatDateGerman_(von)} – ${this.formatDateGerman_(bis)}`;
                } else if (von) {
                    text = `ab ${this.formatDateGerman_(von)}`;
                } else if (bis) {
                    text = `bis ${this.formatDateGerman_(bis)}`;
                }

                this.$el.find('.kb-info-zeitraum').text(text);
                this.$el.find('.kb-info-anzahl').text(anzahl);
            },

            setZeitraumByMode_(mode) {
                const now = window.moment();

                let von = null;
                let bis = null;

                if (mode === 'monat') {
                    von = now.clone().startOf('month').format('YYYY-MM-DD');
                    bis = now.clone().endOf('month').format('YYYY-MM-DD');
                }

                if (mode === 'quartal') {
                    von = now.clone().startOf('quarter').format('YYYY-MM-DD');
                    bis = now.clone().endOf('quarter').format('YYYY-MM-DD');
                }

                if (mode === 'jahr') {
                    von = now.clone().startOf('year').format('YYYY-MM-DD');
                    bis = now.clone().endOf('year').format('YYYY-MM-DD');
                }

                if (mode === 'alles') {
                    von = null;
                    bis = null;
                }

                this.model.set('zeitraumVon', von);
                this.model.set('zeitraumBis', bis);

                this.$el.find('[data-name="kb-zeitraum-von"]').val(von || '');
                this.$el.find('[data-name="kb-zeitraum-bis"]').val(bis || '');
            },

            updateZeitraumButtons_() {
                const von = this.model.get('zeitraumVon') || null;
                const bis = this.model.get('zeitraumBis') || null;
                const now = window.moment();

                let activeMode = null;

                const monatVon = now.clone().startOf('month').format('YYYY-MM-DD');
                const monatBis = now.clone().endOf('month').format('YYYY-MM-DD');

                const quartalVon = now.clone().startOf('quarter').format('YYYY-MM-DD');
                const quartalBis = now.clone().endOf('quarter').format('YYYY-MM-DD');

                const jahrVon = now.clone().startOf('year').format('YYYY-MM-DD');
                const jahrBis = now.clone().endOf('year').format('YYYY-MM-DD');

                if (von === monatVon && bis === monatBis) {
                    activeMode = 'monat';
                } else if (von === quartalVon && bis === quartalBis) {
                    activeMode = 'quartal';
                } else if (von === jahrVon && bis === jahrBis) {
                    activeMode = 'jahr';
                } else if (!von && !bis) {
                    activeMode = 'alles';
                }

                this.$el.find('[data-action="kb-set-zeitraum"]')
                    .removeClass('btn-primary btn-success kb-zeitraum-active')
                    .addClass('btn-default');

                if (activeMode) {
                    this.$el.find(`[data-action="kb-set-zeitraum"][data-mode="${activeMode}"]`)
                        .removeClass('btn-default')
                        .addClass('kb-zeitraum-active');
                }
            },

            formatCurrency_(value) {
                const number = Number(value || 0);
                return number.toLocaleString('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) + ' €';
            },

            formatDateGerman_(value) {
                if (!value) return '';

                const m = window.moment(value);
                if (!m.isValid()) return String(value);

                return m.format('DD.MM.YYYY');
            },

            formatDateTimeGerman_(value) {
                if (!value) return '';

                const m = window.moment(value);
                if (!m.isValid()) return String(value);

                return m.format('DD.MM.YYYY HH:mm');
            },

            escapeHtml_(value) {
                return String(value)
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
                    .replaceAll("'", '&#039;');
            },

            events: {
                'click [data-action="kb-switch-to-standard"]': function (e) {
                    e.preventDefault();

                    this.model.save({ renderModus: 'standard' }, {
                        patch: true,
                        success: () => {
                            this.notify('In Stammdaten-Modus gewechselt', 'success');
                            window.location.reload();
                        },
                        error: () => {
                            this.notify('Fehler beim Wechsel in den Stammdaten-Modus', 'error');
                        }
                    });
                },

                'click [data-action="kb-switch-to-bericht"]': function (e) {
                    e.preventDefault();

                    this.model.save({ renderModus: 'bericht' }, {
                        patch: true,
                        success: () => {
                            this.notify('In Berichtmodus gewechselt', 'success');
                            window.location.reload();
                        },
                        error: () => {
                            this.notify('Fehler beim Wechsel in den Berichtmodus', 'error');
                        }
                    });
                },

                'click [data-action="kb-aktualisieren"]': function () {
                    const von = this.$el.find('[data-name="kb-zeitraum-von"]').val() || null;
                    const bis = this.$el.find('[data-name="kb-zeitraum-bis"]').val() || null;
                    const auswertungTyp = this.model.get('auswertungTyp');

                    this.model.set('zeitraumVon', von);
                    this.model.set('zeitraumBis', bis);

                    this.model.save(null, {
                        patch: true,
                        success: () => {
                            if (auswertungTyp === 'festgeschriebene_rechnungen') {
                                this._lastReportLoadSignature = null;
                                FestgeschriebeneRechnungenReport.load(this);
                            }

                            if (auswertungTyp === 'festgeschriebene_eingangsrechnungen') {
                                this._lastReportLoadSignature = null;
                                FestgeschriebeneEingangsrechnungenReport.load(this);
                            }

                            if (auswertungTyp === 'verbindlichkeiten') {
                                this._lastReportLoadSignature = null;
                                VerbindlichkeitenReport.load(this);
                            }

                            if (auswertungTyp === 'aufwand') {
                                this._lastReportLoadSignature = null;
                                AufwandReport.load(this);
                            }

                            if (auswertungTyp === 'vorsteuer') {
                                this._lastReportLoadSignature = null;
                                VorsteuerReport.load(this);
                            }

                            if (auswertungTyp === 'kontenbewegungen_eingang') {
                                this._lastReportLoadSignature = null;
                                KontenbewegungenEingangReport.load(this);
                            }

                            if (auswertungTyp === 'umsatzuebersicht') {
                                this._lastReportLoadSignature = null;
                                UmsatzuebersichtReport.load(this);
                            }

                            if (auswertungTyp === 'umsatzsteuer_uebersicht') {
                                this._lastReportLoadSignature = null;
                                UmsatzsteuerUebersichtReport.load(this);
                            }

                            if (auswertungTyp === 'offene_forderungen') {
                                this._lastReportLoadSignature = null;
                                OffeneForderungenReport.load(this);
                            }

                            if (auswertungTyp === 'kontenbewegungen') {
                                this._lastReportLoadSignature = null;
                                KontenbewegungenReport.load(this);
                            }

                            this.updateZeitraumButtons_();
                            this.notify('Zeitraum gespeichert', 'success');
                        },
                        error: () => {
                            this.notify('Fehler beim Speichern des Zeitraums', 'error');
                        }
                    });
                },

                'click [data-action="kb-show-tab"]': function (e) {
                    e.preventDefault();

                    const tab = $(e.currentTarget).data('tab');
                    this.switchTab_(tab);
                },

                'click [data-action="kb-set-zeitraum"]': function (e) {
                    e.preventDefault();

                    const mode = $(e.currentTarget).data('mode');
                    const auswertungTyp = this.model.get('auswertungTyp');

                    this.setZeitraumByMode_(mode);

                    this.model.save(null, {
                        patch: true,
                        success: () => {
                            if (auswertungTyp === 'festgeschriebene_rechnungen') {
                                this._lastReportLoadSignature = null;
                                FestgeschriebeneRechnungenReport.load(this);
                            }

                            if (auswertungTyp === 'festgeschriebene_eingangsrechnungen') {
                                this._lastReportLoadSignature = null;
                                FestgeschriebeneEingangsrechnungenReport.load(this);
                            }

                            if (auswertungTyp === 'verbindlichkeiten') {
                                this._lastReportLoadSignature = null;
                                VerbindlichkeitenReport.load(this);
                            }

                            if (auswertungTyp === 'aufwand') {
                                this._lastReportLoadSignature = null;
                                AufwandReport.load(this);
                            }

                            if (auswertungTyp === 'vorsteuer') {
                                this._lastReportLoadSignature = null;
                                VorsteuerReport.load(this);
                            }

                            if (auswertungTyp === 'kontenbewegungen_eingang') {
                                this._lastReportLoadSignature = null;
                                KontenbewegungenEingangReport.load(this);
                            }

                            if (auswertungTyp === 'umsatzuebersicht') {
                                this._lastReportLoadSignature = null;
                                UmsatzuebersichtReport.load(this);
                            }

                            if (auswertungTyp === 'umsatzsteuer_uebersicht') {
                                this._lastReportLoadSignature = null;
                                UmsatzsteuerUebersichtReport.load(this);
                            }

                            if (auswertungTyp === 'offene_forderungen') {
                                this._lastReportLoadSignature = null;
                                OffeneForderungenReport.load(this);
                            }

                            if (auswertungTyp === 'kontenbewegungen') {
                                this._lastReportLoadSignature = null;
                                KontenbewegungenReport.load(this);
                            }

                            this.updateZeitraumButtons_();
                            this.notify('Zeitraum gesetzt', 'success');
                        },
                        error: () => {
                            this.notify('Fehler beim Setzen des Zeitraums', 'error');
                        }
                    });
                },
            }
        });
    });