// custom:views/c-bankkonto/record/detail
// Что это:
// Custom Detail View для CBankkonto.
//
// Зачем:
// Делает CBankkonto главным окном просмотра банковского счёта:
// Bankübersicht, KPI, последние Bankbewegungen и будущая кнопка Aktualisieren.
// Пока НЕ создаёт Bankbewegungen, Zahlungen, Ausgleiche или Buchungen.

console.log('[LOAD] custom:views/c-bankkonto/record/detail');

define('custom:views/c-bankkonto/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Что это:
            // Данные уже сохранённых Bankbewegungen из EspoCRM.
            //
            // Зачем:
            // Они показываются в блоке "Letzte Bankbewegungen dieses Kontos".
            this.bankbewegungenData = [];
            this.bankbewegungenLoaded = false;

            // Что это:
            // Preview свежих банковских данных из Enable Banking.
            //
            // Зачем:
            // После нажатия "Bankdaten aktualisieren" показываем данные из банка,
            // которые ещё НЕ сохранены как CBankbewegung.
            this.bankPreviewData = null;
            this.bankPreviewLoading = false;
            this.bankImportRunning = false;
            this.bankkontoMode = localStorage.getItem(this.getModeStorageKey_()) || 'bank';
            this.bankImportConfirmVisible = false;
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.applyBankkontoMode_();

            if (this.bankkontoMode === 'bank') {
                this.renderBankOverview_();
                this.loadBankbewegungen_();
            } else {
                this.renderBankkontoModeButton_();
            }

            this.listenTo(this.model, 'sync change', () => {
                this.applyBankkontoMode_();

                if (this.bankkontoMode === 'bank') {
                    this.renderBankOverview_();
                    this.loadBankbewegungen_();
                } else {
                    this.renderBankkontoModeButton_();
                }
            });
        },

        getModeStorageKey_: function () {
            return 'CBankkonto.detail.mode.' + (this.model && this.model.id ? this.model.id : 'new');
        },

        getModeStorageKey_: function () {
            return 'CBankkonto.detail.mode.' + (this.model && this.model.id ? this.model.id : 'new');
        },

        setBankkontoMode_: function (mode) {
            this.bankkontoMode = mode === 'stammdaten' ? 'stammdaten' : 'bank';

            localStorage.setItem(this.getModeStorageKey_(), this.bankkontoMode);

            if (this.bankkontoMode === 'bank') {
                this.$el.find('[data-name="kb-bankkonto-mode-button"]').remove();
                this.renderBankOverview_();
                this.loadBankbewegungen_();
            } else {
                this.$el.find('[data-name="kb-bank-overview"]').remove();
                this.restoreStammdaten_();
                this.renderBankkontoModeButton_();
            }

            this.applyBankkontoMode_();
        },

        applyBankkontoMode_: function () {
            if (this.bankkontoMode === 'bank') {
                this.hideStammdaten_();
            } else {
                this.restoreStammdaten_();
            }
        },

        hideStammdaten_: function () {
            const $overview = this.$el.find('[data-name="kb-bank-overview"]').first();

            if (!$overview.length) {
                return;
            }

            // Что это:
            // Скрываем стандартные EspoCRM-Stammdaten, которые идут после Bankübersicht.
            //
            // Зачем:
            // В Bankkontomodus пользователь должен видеть только Bank-Cockpit,
            // а Stammdaten открывать отдельной кнопкой.
            $overview.nextAll().each(function () {
                const $element = $(this);

                if ($element.attr('data-name') === 'kb-bankkonto-mode-button') {
                    return;
                }

                if ($element.attr('data-name') === 'kb-bank-overview') {
                    return;
                }

                $element.attr('data-kb-stammdaten-hidden', '1');
                $element.hide();
            });
        },

        restoreStammdaten_: function () {
            this.$el.find('[data-kb-stammdaten-hidden="1"]').each(function () {
                $(this).show();
                $(this).removeAttr('data-kb-stammdaten-hidden');
            });
        },

        renderBankkontoModeButton_: function () {
            // Что это:
            // Кнопка возврата из Stammdaten в Bankkontomodus.
            //
            // Зачем:
            // В Stammdaten-Ansicht кнопка должна стоять рядом с "Bearbeiten",
            // как в Buchhaltung-Auswertungen кнопка Berichtmodus/Stammdaten.
            if (this.bankkontoMode !== 'stammdaten') {
                this.$el.find('[data-name="kb-bankkonto-mode-button"]').remove();
                return;
            }

            const html = `
                <button type="button"
                        class="btn btn-danger"
                        data-name="kb-bankkonto-mode-button"
                        data-action="kbSwitchToBankmodus"
                        style="margin-left: 6px;">
                    <span class="fas fa-university"></span> Bankkontomodus
                </button>
            `;

            const $existing = this.$el.find('[data-name="kb-bankkonto-mode-button"]');

            if ($existing.length) {
                $existing.remove();
            }

            const $editButton = this.$el.find('[data-action="edit"]').first();

            if ($editButton.length) {
                $editButton.after(html);
            } else {
                const $buttonContainer = this.$el.find('.button-container').first();

                if ($buttonContainer.length) {
                    $buttonContainer.append(html);
                } else {
                    this.$el.prepend(html);
                }
            }

            this.$el.find('[data-action="kbSwitchToBankmodus"]').off('click').on('click', () => {
                this.setBankkontoMode_('bank');
            });
        },

        renderBankOverview_: function () {
            if (this.bankkontoMode !== 'bank') {
                this.$el.find('[data-name="kb-bank-overview"]').remove();
                this.restoreStammdaten_();
                return;
            }
            const name = this.model.get('name') || 'Bankkonto';
            const bankName = this.model.get('bankName') || '-';
            const iban = this.model.get('iban') || '';
            const bic = this.model.get('bic') || '-';
            const waehrung = this.model.get('waehrung') || 'eur';
            const aktiv = !!this.model.get('aktiv');
            const kontoNummer = this.model.get('kontoNummer') || '-';
            const letzterAbruf = this.model.get('letzterApiAbrufAm') || '-';

            const design = this.getBankDesign_();
            const stats = this.calculateBankbewegungenStats_();

            const html = `
                <div class="kb-bank-overview kb-bank-overview--${design}" data-name="kb-bank-overview">
                    <style>
                        .kb-bank-overview {
                            --kb-bank-main: #374151;
                            --kb-bank-main-dark: #111827;
                            --kb-bank-main-soft: #f3f4f6;
                            margin-bottom: 16px;
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            background: #fff;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                        }

                        .kb-bank-overview--sparkasse {
                            --kb-bank-main: #e30613;
                            --kb-bank-main-dark: #b00020;
                            --kb-bank-main-soft: #fff1f2;
                        }

                        .kb-bank-overview--default {
                            --kb-bank-main: #334155;
                            --kb-bank-main-dark: #0f172a;
                            --kb-bank-main-soft: #f8fafc;
                        }

                        .kb-bank-overview .kb-bank-topbar {
                            height: 7px;
                            background: linear-gradient(90deg, var(--kb-bank-main) 0%, var(--kb-bank-main-dark) 100%);
                        }

                        .kb-bank-overview .kb-bank-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            gap: 14px;
                            padding: 16px 18px 12px 18px;
                            border-bottom: 1px solid #edf0f2;
                            background: linear-gradient(180deg, #ffffff 0%, var(--kb-bank-main-soft) 100%);
                        }

                        .kb-bank-overview .kb-bank-title {
                            font-size: 20px;
                            font-weight: 700;
                            margin-bottom: 4px;
                            color: #1f2937;
                        }

                        .kb-bank-overview .kb-bank-subtitle {
                            color: #6b7280;
                            font-size: 12px;
                            line-height: 1.4;
                        }

                        .kb-bank-overview .kb-bank-badge {
                            display: inline-block;
                            border-radius: 999px;
                            padding: 4px 9px;
                            font-size: 12px;
                            font-weight: 700;
                            margin-left: 6px;
                            white-space: nowrap;
                        }

                        .kb-bank-overview .kb-bank-badge--active {
                            background: #dcfce7;
                            color: #166534;
                        }

                        .kb-bank-overview .kb-bank-badge--inactive {
                            background: #fee2e2;
                            color: #991b1b;
                        }

                        .kb-bank-overview .kb-bank-actions {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 8px;
                            justify-content: flex-end;
                        }

                        .kb-bank-overview .kb-bank-actions .btn-primary-bank {
                            background: var(--kb-bank-main);
                            border-color: var(--kb-bank-main);
                            color: #fff;
                        }

                        .kb-bank-overview .kb-bank-actions .btn-primary-bank:hover {
                            background: var(--kb-bank-main-dark);
                            border-color: var(--kb-bank-main-dark);
                            color: #fff;
                        }

                        .kb-bank-overview .kb-stammdaten-button {
                            font-weight: 600 !important;
                            background-color: #a595c9 !important;
                            border: 1px solid #9787bc !important;
                            color: #fff !important;
                            padding: 6px 12px !important;
                            line-height: 1.5 !important;
                            border-radius: 4px !important;
                            cursor: pointer !important;
                            margin-left: 14px !important;
                        }

                        .kb-bank-overview .kb-stammdaten-button:hover,
                        .kb-bank-overview .kb-stammdaten-button:focus {
                            background-color: #8e7db5 !important;
                            border-color: #8270ab !important;
                            color: #fff !important;
                        }

                        .kb-bank-overview .kb-bank-body {
                            padding: 14px 18px 16px 18px;
                        }

                        .kb-bank-overview .kb-bank-info-grid {
                            display: grid;
                            grid-template-columns: repeat(4, minmax(140px, 1fr));
                            gap: 10px;
                            margin-bottom: 14px;
                        }

                        .kb-bank-overview .kb-bank-info-card {
                            border: 1px solid #edf0f2;
                            border-radius: 10px;
                            padding: 10px 12px;
                            background: #fcfcfd;
                            min-height: 64px;
                        }

                        .kb-bank-overview .kb-bank-info-label {
                            font-size: 11px;
                            color: #6b7280;
                            margin-bottom: 4px;
                        }

                        .kb-bank-overview .kb-bank-info-value {
                            font-weight: 700;
                            color: #111827;
                            word-break: break-word;
                        }

                        .kb-bank-overview .kb-bank-kpi-grid {
                            display: grid;
                            grid-template-columns: repeat(6, minmax(120px, 1fr));
                            gap: 10px;
                            margin-bottom: 16px;
                        }

                        .kb-bank-overview .kb-bank-kpi {
                            border: 1px solid #edf0f2;
                            border-radius: 10px;
                            padding: 11px 12px;
                            background: #fff;
                        }

                        .kb-bank-overview .kb-bank-kpi-label {
                            font-size: 11px;
                            color: #6b7280;
                            margin-bottom: 5px;
                        }

                        .kb-bank-overview .kb-bank-kpi-value {
                            font-size: 18px;
                            font-weight: 800;
                            white-space: nowrap;
                        }

                        .kb-bank-overview .kb-green {
                            color: #15803d;
                        }

                        .kb-bank-overview .kb-red {
                            color: #b91c1c;
                        }

                        .kb-bank-overview .kb-muted {
                            color: #6b7280;
                        }

                        .kb-bank-overview .kb-bank-section-title {
                            font-weight: 700;
                            margin-bottom: 8px;
                            color: #1f2937;
                        }

                        .kb-bank-overview .kb-bank-table-wrap {
                            border: 1px solid #edf0f2;
                            border-radius: 10px;
                            overflow: hidden;
                        }

                        .kb-bank-overview table {
                            margin-bottom: 0;
                        }

                        .kb-bank-overview table th {
                            background: #f9fafb;
                            color: #6b7280;
                            font-weight: 600;
                        }

                        .kb-bank-overview .kb-bank-amount-in {
                            color: #15803d;
                            font-weight: 800;
                        }

                        .kb-bank-overview .kb-bank-amount-out {
                            color: #b91c1c;
                            font-weight: 800;
                        }

                        .kb-bank-overview .kb-bank-row-link {
                            cursor: pointer;
                        }

                        .kb-bank-overview .kb-bank-row-link:hover {
                            background: #f9fafb;
                        }

                        .kb-bank-overview .kb-source-card {
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            overflow: hidden;
                            margin-bottom: 16px;
                            background: #fff;
                        }

                        .kb-bank-overview .kb-source-header {
                            padding: 12px 14px;
                            border-bottom: 1px solid #edf0f2;
                        }

                        .kb-bank-overview .kb-source-title-row {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            flex-wrap: wrap;
                            margin-bottom: 4px;
                        }

                        .kb-bank-overview .kb-source-title {
                            font-size: 15px;
                            font-weight: 800;
                            color: #111827;
                        }

                        .kb-bank-overview .kb-source-subtitle {
                            color: #6b7280;
                            font-size: 12px;
                            line-height: 1.4;
                        }

                        .kb-bank-overview .kb-source-body {
                            padding: 12px 14px 14px 14px;
                        }

                        .kb-bank-overview .kb-source-badge {
                            display: inline-block;
                            border-radius: 999px;
                            padding: 3px 8px;
                            font-size: 11px;
                            font-weight: 800;
                            letter-spacing: 0.03em;
                        }

                        .kb-bank-overview .kb-source-card--bank {
                            border-color: #fecdd3;
                        }

                        .kb-bank-overview .kb-source-card--bank .kb-source-header {
                            background: linear-gradient(180deg, #fff 0%, #fff1f2 100%);
                            border-top: 5px solid var(--kb-bank-main);
                        }

                        .kb-bank-overview .kb-source-card--bank .kb-source-badge {
                            background: #e30613;
                            color: #fff;
                        }

                        .kb-bank-overview .kb-source-card--intern {
                            border-color: #bfdbfe;
                            background: #eff6ff;
                        }

                        .kb-bank-overview .kb-source-card--intern .kb-source-header {
                            background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%);
                            border-top: 5px solid #2563eb;
                            border-bottom-color: #bfdbfe;
                        }

                        .kb-bank-overview .kb-source-card--intern .kb-source-body {
                            background: #eff6ff;
                        }

                        .kb-bank-overview .kb-source-card--intern .kb-source-badge {
                            background: #2563eb;
                            color: #fff;
                        }

                        .kb-bank-overview .kb-source-card--intern .kb-bank-table-wrap {
                            border-color: #bfdbfe;
                            background: #ffffff;
                        }

                        .kb-bank-overview .kb-source-card--intern table th {
                            background: #dbeafe;
                            color: #1e3a8a;
                        }

                        .kb-bank-overview .kb-source-card .kb-bank-table-wrap {
                            margin-bottom: 0;
                        }

                        @media (max-width: 1200px) {
                            .kb-bank-overview .kb-bank-info-grid {
                                grid-template-columns: repeat(2, minmax(140px, 1fr));
                            }

                            .kb-bank-overview .kb-bank-kpi-grid {
                                grid-template-columns: repeat(3, minmax(120px, 1fr));
                            }
                        }

                        @media (max-width: 700px) {
                            .kb-bank-overview .kb-bank-header {
                                display: block;
                            }

                            .kb-bank-overview .kb-bank-actions {
                                justify-content: flex-start;
                                margin-top: 12px;
                            }

                            .kb-bank-overview .kb-bank-info-grid,
                            .kb-bank-overview .kb-bank-kpi-grid {
                                grid-template-columns: 1fr;
                            }
                        }
                    </style>

                    <div class="kb-bank-topbar"></div>

                    <div class="kb-bank-header">
                        <div>
                            <div class="kb-bank-title">
                                ${this.escapeHtml_(name)}
                                <span class="kb-bank-badge ${aktiv ? 'kb-bank-badge--active' : 'kb-bank-badge--inactive'}">
                                    ${aktiv ? 'Aktiv' : 'Inaktiv'}
                                </span>
                            </div>
                            <div class="kb-bank-subtitle">
                                ${this.escapeHtml_(bankName)} · IBAN ${this.escapeHtml_(this.maskIban_(iban))}
                                <br>
                                Buchhaltungskonto ${this.escapeHtml_(kontoNummer)} · ${this.escapeHtml_(String(waehrung).toUpperCase())}
                            </div>
                        </div>

                        <div class="kb-bank-actions">
                            <button type="button" class="btn btn-sm btn-primary-bank" data-action="kbBankAktualisieren">
                                <span class="fas fa-sync-alt"></span> Bankdaten aktualisieren
                            </button>

                            <button type="button" class="btn btn-default btn-sm" data-action="kbOpenBankbewegungen">
                                Bankbewegungen öffnen
                            </button>

                            <button type="button" class="btn btn-sm kb-stammdaten-button" data-action="kbSwitchToStammdaten">
                                <span class="fas fa-cog"></span> Stammdaten
                            </button>
                        </div>
                    </div>

                    <div class="kb-bank-body">
                        <div class="kb-bank-info-grid">
                            <div class="kb-bank-info-card">
                                <div class="kb-bank-info-label">Bank</div>
                                <div class="kb-bank-info-value">${this.escapeHtml_(bankName)}</div>
                            </div>

                            <div class="kb-bank-info-card">
                                <div class="kb-bank-info-label">IBAN</div>
                                <div class="kb-bank-info-value">${this.escapeHtml_(this.maskIban_(iban))}</div>
                            </div>

                            <div class="kb-bank-info-card">
                                <div class="kb-bank-info-label">BIC</div>
                                <div class="kb-bank-info-value">${this.escapeHtml_(bic)}</div>
                            </div>

                            <div class="kb-bank-info-card">
                                <div class="kb-bank-info-label">Letzter API-Abruf</div>
                                <div class="kb-bank-info-value">${this.escapeHtml_(letzterAbruf)}</div>
                            </div>
                        </div>

                        <div class="kb-bank-kpi-grid">
                            <div class="kb-bank-kpi">
                                <div class="kb-bank-kpi-label">Eingänge</div>
                                <div class="kb-bank-kpi-value kb-green">${this.formatCurrency_(stats.eingaenge)}</div>
                            </div>

                            <div class="kb-bank-kpi">
                                <div class="kb-bank-kpi-label">Ausgänge</div>
                                <div class="kb-bank-kpi-value kb-red">${this.formatCurrency_(stats.ausgaenge)}</div>
                            </div>

                            <div class="kb-bank-kpi">
                                <div class="kb-bank-kpi-label">Netto</div>
                                <div class="kb-bank-kpi-value ${stats.netto >= 0 ? 'kb-green' : 'kb-red'}">${this.formatCurrency_(stats.netto)}</div>
                            </div>

                            <div class="kb-bank-kpi">
                                <div class="kb-bank-kpi-label">Offen</div>
                                <div class="kb-bank-kpi-value">${stats.offen}</div>
                            </div>

                            <div class="kb-bank-kpi">
                                <div class="kb-bank-kpi-label">Gebucht</div>
                                <div class="kb-bank-kpi-value kb-green">${stats.gebucht}</div>
                            </div>

                            <div class="kb-bank-kpi">
                                <div class="kb-bank-kpi-label">Vorgemerkt</div>
                                <div class="kb-bank-kpi-value kb-muted">${stats.vorgemerkt}</div>
                            </div>
                        </div>

                        <div class="kb-source-card kb-source-card--bank">
                            <div class="kb-source-header">
                                <div class="kb-source-title-row">
                                    <span class="kb-source-badge">BANK / SPARKASSE</span>
                                    <span class="kb-source-title">Bankdaten direkt von Sparkasse</span>
                                </div>
                                <div class="kb-source-subtitle">
                                    Vorschau aus Enable Banking. Diese Bewegungen kommen direkt vom Bankkonto und sind noch nicht als CBankbewegung in EspoCRM gespeichert.
                                </div>
                            </div>
                            <div class="kb-source-body">
                                ${this.renderBankPreview_()}
                            </div>
                        </div>

                        <div class="kb-source-card kb-source-card--intern">
                            <div class="kb-source-header">
                                <div class="kb-source-title-row">
                                    <span class="kb-source-badge">ESPOCRM / INTERN</span>
                                    <span class="kb-source-title">Bankbewegungen in EspoCRM</span>
                                </div>
                                <div class="kb-source-subtitle">
                                    Bereits gespeicherte CBankbewegungen dieses Bankkontos. Diese Zeilen können geöffnet, geprüft und über „Zahlung vorbereiten“ weiterverarbeitet werden.
                                </div>
                            </div>
                            <div class="kb-source-body">
                                <div class="kb-bank-table-wrap">
                                    ${this.renderBankbewegungenTable_()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const $existing = this.$el.find('[data-name="kb-bank-overview"]');

            if ($existing.length) {
                $existing.replaceWith(html);
            } else {
                const $target = this.$el.find('.record').first();

                if ($target.length) {
                    $target.before(html);
                } else {
                    this.$el.prepend(html);
                }
            }

            this.bindBankOverviewEvents_();
            this.applyBankkontoMode_();
        },

        loadBankbewegungen_: function () {
            const bankkontoId = this.model.id;

            if (!bankkontoId) {
                return;
            }

            const params = {
                maxSize: 200,
                orderBy: 'buchungstag',
                order: 'desc',

                // Что это:
                // Явно запрашиваем поля, нужные для отображения и Dublettenprüfung.
                //
                // Зачем:
                // Preview из банка должен сравниваться с уже сохранёнными CBankbewegung.
                select: [
                    'id',
                    'name',
                    'bankkontoId',
                    'buchungstag',
                    'valutadatum',
                    'richtung',
                    'betrag',
                    'gegenparteiName',
                    'verwendungszweck',
                    'bankReferenz',
                    'apiEntryReference',
                    'status',
                    'abstimmungsstatus'
                ].join(','),

                where: [
                    {
                        type: 'equals',
                        attribute: 'bankkontoId',
                        value: bankkontoId
                    }
                ]
            };

            Espo.Ajax.getRequest('CBankbewegung', params).then((result) => {
                this.bankbewegungenData = result && result.list ? result.list : [];
                this.bankbewegungenLoaded = true;
                this.renderBankOverview_();
            }).catch((xhr) => {
                console.error('[CBankkonto/detail] Bankbewegungen load failed', xhr);
                this.bankbewegungenData = [];
                this.bankbewegungenLoaded = true;
                this.renderBankOverview_();
            });
        },

        isPreviewItemAlreadyInEspo_: function (previewItem) {
            const existingRows = this.bankbewegungenData || [];

            const previewReference = String(previewItem.bankReferenz || '').trim();
            const previewDate = String(previewItem.buchungstag || '').trim();
            const previewDirection = String(previewItem.richtung || '').trim();
            const previewAmount = Number(previewItem.betrag || 0).toFixed(2);
            const previewPurpose = String(previewItem.verwendungszweck || '').trim().toLowerCase();

            return existingRows.some((row) => {
                const rowReference = String(row.bankReferenz || row.apiEntryReference || '').trim();

                // Что это:
                // Сильная Dublettenprüfung über Bankreferenz.
                //
                // Зачем:
                // Если банк дал entry_reference и она уже есть в CBankbewegung,
                // это почти sicher dieselbe Bewegung.
                if (previewReference && rowReference && previewReference === rowReference) {
                    return true;
                }

                const rowDate = String(row.buchungstag || '').trim();
                const rowDirection = String(row.richtung || '').trim();
                const rowAmount = Number(row.betrag || 0).toFixed(2);
                const rowPurpose = String(row.verwendungszweck || '').trim().toLowerCase();

                // Что это:
                // Fallback-Dublettenprüfung, wenn Bankreferenz fehlt.
                //
                // Зачем:
                // Некоторые Bankbewegungen могут быть manuell или ohne Referenz.
                return (
                    previewDate &&
                    previewDate === rowDate &&
                    previewDirection === rowDirection &&
                    previewAmount === rowAmount &&
                    previewPurpose &&
                    rowPurpose &&
                    previewPurpose === rowPurpose
                );
            });
        },

        getImportablePreviewItems_: function () {
            const bookItems = this.bankPreviewData && this.bankPreviewData.bookItems
                ? this.bankPreviewData.bookItems
                : [];

            return bookItems.filter((item) => {
                const alreadyInEspo = this.isPreviewItemAlreadyInEspo_(item);

                if (alreadyInEspo) {
                    return false;
                }

                if (item.bankBuchungsstatus !== 'book') {
                    return false;
                }

                return true;
            });
        },

        renderBankPreview_: function () {
            if (this.bankPreviewLoading) {
                return `
                    <div class="kb-bank-table-wrap">
                        <div style="padding: 12px;" class="text-muted">
                            Bankdaten werden über Enable Banking geladen ...
                        </div>
                    </div>
                `;
            }

            if (!this.bankPreviewData) {
                return `
                    <div class="kb-bank-table-wrap">
                        <div style="padding: 12px;" class="text-muted">
                            Noch keine aktuellen Bankdaten geladen. Klicken Sie auf „Bankdaten aktualisieren“.
                        </div>
                    </div>
                `;
            }

            if (!this.bankPreviewData.success) {
                return `
                    <div class="kb-bank-table-wrap">
                        <div style="padding: 12px;" class="text-danger">
                            Bankdaten konnten nicht geladen werden.
                        </div>
                    </div>
                `;
            }

            const bookItems = this.bankPreviewData.bookItems || [];
            const pendingItems = this.bankPreviewData.pendingItems || [];

            const classifiedBookItems = bookItems.map((item) => {
                const alreadyInEspo = this.isPreviewItemAlreadyInEspo_(item);

                return Object.assign({}, item, {
                    previewImportStatus: alreadyInEspo ? 'duplicate' : 'new'
                });
            });

            const classifiedPendingItems = pendingItems.map((item) => {
                return Object.assign({}, item, {
                    previewImportStatus: 'pending'
                });
            });

            const allItems = classifiedBookItems.concat(classifiedPendingItems);

            const newCount = classifiedBookItems.filter((x) => x.previewImportStatus === 'new').length;
            const duplicateCount = classifiedBookItems.filter((x) => x.previewImportStatus === 'duplicate').length;
            const pendingCount = classifiedPendingItems.length;
            const importButtonDisabled = newCount <= 0 || this.bankImportRunning;
            const importButtonLabel = this.bankImportRunning
                ? 'Import läuft ...'
                : 'Neue Bewegungen importieren';


            const confirmBoxHtml = this.bankImportConfirmVisible ? `
                <div style="
                    border: 1px solid #fecaca;
                    background: #fff1f2;
                    border-radius: 10px;
                    padding: 12px 14px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                ">
                    <div>
                        <div style="font-weight: 800; color: #991b1b; margin-bottom: 3px;">
                            Import bestätigen
                        </div>
                        <div style="font-size: 12px; color: #7f1d1d;">
                            Es werden ${newCount} neue gebuchte Bankbewegungen als CBankbewegung importiert.
                            Es werden keine Zahlungen, Ausgleiche oder Buchungen erstellt.
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button type="button"
                                class="btn btn-sm btn-primary-bank"
                                data-action="kbConfirmImportNeueBankbewegungen">
                            Import bestätigen
                        </button>

                        <button type="button"
                                class="btn btn-default btn-sm"
                                data-action="kbCancelImportNeueBankbewegungen">
                            Abbrechen
                        </button>
                    </div>
                </div>
            ` : '';

            if (!allItems.length) {
                return `
                    <div class="kb-bank-table-wrap">
                        <div style="padding: 12px;" class="text-muted">
                            Keine Bankbewegungen im abgefragten Zeitraum gefunden.
                        </div>
                    </div>
                `;
            }

            const rows = allItems.slice(0, 30).map((row) => {
                const richtung = row.richtung || '-';
                const betrag = Number(row.betrag || 0);
                const isEingang = richtung === 'eingang';
                const amountClass = isEingang ? 'kb-bank-amount-in' : 'kb-bank-amount-out';
                const sign = isEingang ? '+' : '-';

                const bankStatus = row.bankBuchungsstatus === 'pdng'
                    ? 'Vorgemerkt'
                    : 'Gebucht';

                let importStatusLabel = 'Neu';
                let importStatusClass = 'label-success';

                if (row.previewImportStatus === 'duplicate') {
                    importStatusLabel = 'Bereits in EspoCRM';
                    importStatusClass = 'label-default';
                }

                if (row.previewImportStatus === 'pending') {
                    importStatusLabel = 'Vorgemerkt — nicht importieren';
                    importStatusClass = 'label-warning';
                }

                return `
                    <tr>
                        <td>${this.escapeHtml_(row.buchungstag || '-')}</td>
                        <td>${this.escapeHtml_(this.formatRichtung_(richtung))}</td>
                        <td class="text-right ${amountClass}">${sign} ${this.formatCurrency_(betrag)}</td>
                        <td>${this.escapeHtml_(this.truncate_(row.gegenparteiName || '-', 34))}</td>
                        <td>${this.escapeHtml_(this.truncate_(row.verwendungszweck || '', 52))}</td>
                        <td>${this.escapeHtml_(row.bankTyp || '-')}</td>
                        <td>${this.escapeHtml_(bankStatus)}</td>
                        <td>${row.bankReferenzVorhanden ? 'Ja' : 'Nein'}</td>
                        <td><span class="label ${importStatusClass}">${this.escapeHtml_(importStatusLabel)}</span></td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="kb-bank-kpi-grid" style="margin-bottom: 10px;">
                    <div class="kb-bank-kpi">
                        <div class="kb-bank-kpi-label">Zeitraum</div>
                        <div class="kb-bank-kpi-value kb-muted" style="font-size: 13px;">
                            ${this.escapeHtml_(this.bankPreviewData.dateFrom || '-')} – ${this.escapeHtml_(this.bankPreviewData.dateTo || '-')}
                        </div>
                    </div>

                    <div class="kb-bank-kpi">
                        <div class="kb-bank-kpi-label">Geliefert</div>
                        <div class="kb-bank-kpi-value">${this.bankPreviewData.count || 0}</div>
                    </div>

                    <div class="kb-bank-kpi">
                        <div class="kb-bank-kpi-label">Neu</div>
                        <div class="kb-bank-kpi-value kb-green">${newCount}</div>
                    </div>

                    <div class="kb-bank-kpi">
                        <div class="kb-bank-kpi-label">Bereits in EspoCRM</div>
                        <div class="kb-bank-kpi-value kb-muted">${duplicateCount}</div>
                    </div>

                    <div class="kb-bank-kpi">
                        <div class="kb-bank-kpi-label">Vorgemerkt</div>
                        <div class="kb-bank-kpi-value kb-muted">${pendingCount}</div>
                    </div>

                    <div class="kb-bank-kpi">
                        <div class="kb-bank-kpi-label">Netto Bank</div>
                        <div class="kb-bank-kpi-value ${(this.bankPreviewData.netto || 0) >= 0 ? 'kb-green' : 'kb-red'}">
                            ${this.formatCurrency_(this.bankPreviewData.netto || 0)}
                        </div>
                    </div>
                </div>

                ${confirmBoxHtml}

                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div class="text-muted" style="font-size: 12px;">
                        Importiert werden nur neue, endgültig gebuchte Bankbewegungen. Vorgemerkte Bewegungen werden nicht importiert.
                    </div>

                    <button type="button"
                            class="btn btn-sm btn-primary-bank"
                            data-action="kbImportNeueBankbewegungen"
                            ${importButtonDisabled ? 'disabled' : ''}>
                        ${this.escapeHtml_(importButtonLabel)}
                    </button>
                </div>

                <div class="kb-bank-table-wrap">
                    <div class="table-responsive">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>Buchungstag</th>
                                    <th>Richtung</th>
                                    <th class="text-right">Betrag</th>
                                    <th>Gegenpartei</th>
                                    <th>Verwendungszweck</th>
                                    <th>Bank-Typ</th>
                                    <th>Bankstatus</th>
                                    <th>Referenz</th>
                                    <th>Preview-Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },

        renderBankbewegungenTable_: function () {
            if (!this.bankbewegungenLoaded) {
                return `
                    <div style="padding: 12px;" class="text-muted">
                        Bankbewegungen werden geladen ...
                    </div>
                `;
            }

            const rows = this.bankbewegungenData || [];

            if (!rows.length) {
                return `
                    <div style="padding: 12px;" class="text-muted">
                        Noch keine Bankbewegungen für dieses Bankkonto vorhanden.
                    </div>
                `;
            }

            const htmlRows = rows.slice(0, 20).map((row) => {
                const id = row.id;
                const buchungstag = row.buchungstag || '-';
                const richtung = row.richtung || '-';
                const betrag = Number(row.betrag || 0);
                const gegenpartei = row.gegenparteiName || '-';
                const verwendungszweck = row.verwendungszweck || '';
                const status = row.status || '-';
                const abstimmungsstatus = row.abstimmungsstatus || '-';

                const isEingang = richtung === 'eingang';
                const amountClass = isEingang ? 'kb-bank-amount-in' : 'kb-bank-amount-out';
                const sign = isEingang ? '+' : '-';

                return `
                    <tr class="kb-bank-row-link" data-id="${this.escapeHtml_(id)}">
                        <td>${this.escapeHtml_(buchungstag)}</td>
                        <td>${this.escapeHtml_(this.formatRichtung_(richtung))}</td>
                        <td class="text-right ${amountClass}">${sign} ${this.formatCurrency_(betrag)}</td>
                        <td>${this.escapeHtml_(this.truncate_(gegenpartei, 34))}</td>
                        <td>${this.escapeHtml_(this.truncate_(verwendungszweck, 52))}</td>
                        <td>${this.escapeHtml_(status)}</td>
                        <td>${this.escapeHtml_(abstimmungsstatus)}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="table-responsive">
                    <table class="table table-bordered table-condensed">
                        <thead>
                            <tr>
                                <th>Buchungstag</th>
                                <th>Richtung</th>
                                <th class="text-right">Betrag</th>
                                <th>Gegenpartei</th>
                                <th>Verwendungszweck</th>
                                <th>Status</th>
                                <th>Abstimmung</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${htmlRows}
                        </tbody>
                    </table>
                </div>
            `;
        },

        calculateBankbewegungenStats_: function () {
            const rows = this.bankbewegungenData || [];

            let eingaenge = 0;
            let ausgaenge = 0;
            let offen = 0;
            let gebucht = 0;
            let vorgemerkt = 0;

            rows.forEach((row) => {
                const betrag = Number(row.betrag || 0);
                const richtung = row.richtung || '';
                const abstimmungsstatus = row.abstimmungsstatus || '';
                const bankBuchungsstatus = row.bankBuchungsstatus || '';

                if (richtung === 'eingang') {
                    eingaenge += betrag;
                }

                if (richtung === 'ausgang') {
                    ausgaenge += betrag;
                }

                if (abstimmungsstatus === 'gebucht') {
                    gebucht += 1;
                } else {
                    offen += 1;
                }

                if (bankBuchungsstatus === 'pdng') {
                    vorgemerkt += 1;
                }
            });

            return {
                eingaenge: eingaenge,
                ausgaenge: ausgaenge,
                netto: eingaenge - ausgaenge,
                offen: offen,
                gebucht: gebucht,
                vorgemerkt: vorgemerkt
            };
        },

        loadBankPreview_: function () {
            const bankkontoId = this.model.id;

            if (!bankkontoId) {
                this.notify('Kein Bankkonto geladen.', 'error');
                return;
            }

            this.bankPreviewLoading = true;
            this.bankPreviewData = null;
            this.bankImportConfirmVisible = false;
            this.renderBankOverview_();

            const url = 'https://klesec.pagekite.me/api/enablebanking/bankkonto/' + encodeURIComponent(bankkontoId) + '/preview';

            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }).then((response) => {
                return response.json().then((data) => {
                    if (!response.ok) {
                        throw data;
                    }

                    return data;
                });
            }).then((data) => {
                this.bankPreviewLoading = false;
                this.bankPreviewData = data;
                this.renderBankOverview_();

                if (data && data.success) {
                    this.notify('Bankdaten wurden geladen: ' + (data.count || 0) + ' Bewegungen.', 'success');
                } else {
                    this.notify('Bankdaten konnten nicht geladen werden.', 'error');
                }
            }).catch((error) => {
                console.error('[CBankkonto/detail] Enable Banking preview failed', error);

                this.bankPreviewLoading = false;
                this.bankPreviewData = {
                    success: false,
                    error: error
                };

                this.renderBankOverview_();
                this.notify('Fehler beim Laden der Bankdaten.', 'error');
            });
        },

        buildBankbewegungPayload_: function (item) {
            // Что это:
            // Формирует payload для новой CBankbewegung из Enable-Banking-Preview-Zeile.
            //
            // Зачем:
            // Импорт создаёт только банковскую строку.
            // Он НЕ создаёт CZahlung, CAusgleich, CBuchungsjournal или CBuchung.

            return {
                bankkontoId: this.model.id,

                buchungstag: item.buchungstag || null,
                valutadatum: item.valutadatum || null,

                richtung: item.richtung || null,
                betrag: Number(item.betrag || 0),
                waehrung: item.waehrung || 'eur',

                gegenparteiName: item.gegenparteiName || '',
                gegenparteiIban: item.gegenparteiIban || '',

                verwendungszweck: item.verwendungszweck || '',

                bankReferenz: item.bankReferenz || '',
                endToEndId: item.apiTransactionId || '',

                importQuelle: 'api',
                status: 'importiert',
                abstimmungsstatus: 'offen',

                bemerkung: 'Importiert über Enable Banking aus der Bankübersicht.'
            };
        },

        importNeueBankbewegungen_: function () {
            const items = this.getImportablePreviewItems_();

            if (!items.length) {
                this.notify('Keine neuen gebuchten Bankbewegungen zum Importieren vorhanden.', 'warning');
                return;
            }

            if (!this.bankImportConfirmVisible) {
                this.bankImportConfirmVisible = true;
                this.renderBankOverview_();
                return;
            }

            this.bankImportRunning = true;
            this.bankImportConfirmVisible = false;
            this.renderBankOverview_();

            let created = 0;
            let failed = 0;

            const createNext = (index) => {
                if (index >= items.length) {
                    this.bankImportRunning = false;

                    this.notify(
                        'Import abgeschlossen. Erstellt: ' + created + ', Fehler: ' + failed + '.',
                        failed > 0 ? 'warning' : 'success'
                    );

                    // Что это:
                    // После импорта заново загружаем сохранённые CBankbewegungen.
                    //
                    // Зачем:
                    // Только после свежей загрузки EspoCRM-строк preview сможет правильно
                    // показать импортированные банковские строки как "Bereits in EspoCRM".
                    this.loadBankbewegungen_();

                    return;
                }

                const payload = this.buildBankbewegungPayload_(items[index]);

                Espo.Ajax.postRequest('CBankbewegung', payload).then(() => {
                    created += 1;
                    createNext(index + 1);
                }).catch((xhr) => {
                    failed += 1;
                    console.error('[CBankkonto/detail] CBankbewegung import failed', xhr, payload);
                    createNext(index + 1);
                });
            };

            createNext(0);
        },

        bindBankOverviewEvents_: function () {
            this.$el.find('[data-action="kbBankAktualisieren"]').off('click').on('click', () => {
                this.loadBankPreview_();
            });

            this.$el.find('[data-action="kbSwitchToStammdaten"]').off('click').on('click', () => {
                this.setBankkontoMode_('stammdaten');
            });

            this.$el.find('[data-action="kbImportNeueBankbewegungen"]').off('click').on('click', () => {
                this.importNeueBankbewegungen_();
            });

            this.$el.find('[data-action="kbConfirmImportNeueBankbewegungen"]').off('click').on('click', () => {
                this.importNeueBankbewegungen_();
            });

            this.$el.find('[data-action="kbCancelImportNeueBankbewegungen"]').off('click').on('click', () => {
                this.bankImportConfirmVisible = false;
                this.renderBankOverview_();
            });

            this.$el.find('[data-action="kbOpenBankbewegungen"]').off('click').on('click', () => {
                window.location.hash = '#CBankbewegung';
            });

            this.$el.find('.kb-bank-row-link').off('click').on('click', (e) => {
                const id = $(e.currentTarget).data('id');

                if (id) {
                    window.location.hash = '#CBankbewegung/view/' + id;
                }
            });
        },

        getBankDesign_: function () {
            const bankName = String(this.model.get('bankName') || '').toLowerCase();
            const name = String(this.model.get('name') || '').toLowerCase();

            if (bankName.indexOf('sparkasse') !== -1 || name.indexOf('sparkasse') !== -1) {
                return 'sparkasse';
            }

            return 'default';
        },

        maskIban_: function (iban) {
            if (!iban) {
                return '-';
            }

            const clean = String(iban).replace(/\s+/g, '');

            if (clean.length <= 8) {
                return clean;
            }

            return clean.substring(0, 4) + ' **** **** **** ' + clean.substring(clean.length - 4);
        },

        formatCurrency_: function (value) {
            let number = Number(value || 0);

            if (Math.abs(number) < 0.005) {
                number = 0;
            }

            return number.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + ' €';
        },

        formatRichtung_: function (value) {
            if (value === 'eingang') return 'Eingang';
            if (value === 'ausgang') return 'Ausgang';
            return value || '-';
        },

        truncate_: function (value, maxLength) {
            const text = String(value || '').replace(/\s+/g, ' ').trim();

            if (text.length <= maxLength) {
                return text;
            }

            return text.substring(0, maxLength - 1) + '…';
        },

        escapeHtml_: function (value) {
            return String(value === null || value === undefined ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    });
});