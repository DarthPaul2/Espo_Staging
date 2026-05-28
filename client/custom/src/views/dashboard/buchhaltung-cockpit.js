// custom:views/dashboard/buchhaltung-cockpit
// Что это:
// Dashboard-Dashlet "Buchhaltung Cockpit".
//
// Зачем:
// Показывает руководству и бухгалтерии journalbasierte Kennzahlen,
// графики и Prüfindikatoren на основе CBuchung/action/managementDashboard.

Espo.define('custom:views/dashboard/buchhaltung-cockpit', [
    'view',
    'lib!Chart'
], function (Dep, Chart) {

    return Dep.extend({

        name: 'buchhaltungCockpit',
        template: 'custom:dashboard/buchhaltung-cockpit',

        umsatzChart: null,
        liquiditaetChart: null,

        selectedYear: null,
        selectedPeriodMode: 'monat',
        selectedMonth: null,
        selectedQuarter: null,
        dashboardData: null,

        getTitle: function () {
            return 'Buchhaltung Cockpit';
        },

        getColor: function () {
            return 'default';
        },

        getActionItemDataList: function () {
            return [
                {
                    label: 'Print',
                    action: function () {
                        window.print();
                    }
                }
            ];
        },

        setup: function () {
            Dep.prototype.setup.call(this);

            var now = new Date();

            this.selectedYear = now.getFullYear();
            this.selectedMonth = now.getMonth() + 1;
            this.selectedQuarter = Math.floor(now.getMonth() / 3) + 1;
            this.selectedPeriodMode = 'jahr';
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.renderPeriodFilters_();
            this.bindEvents_();
            this.loadDashboard_();
        },

        renderYearSelect_: function () {
            var $root = this.$el || $(this.el);
            var $select = $root.find('[data-name="yearFilter"]');

            if (!$select.length) {
                return;
            }

            var currentYear = new Date().getFullYear();
            var startYear = currentYear - 3;
            var endYear = currentYear + 1;

            $select.empty();

            for (var y = startYear; y <= endYear; y++) {
                var $option = $('<option>')
                    .attr('value', y)
                    .text(y);

                if (y === this.selectedYear) {
                    $option.attr('selected', 'selected');
                }

                $select.append($option);
            }
        },

        renderPeriodFilters_: function () {
            this.renderYearSelect_();

            var $root = this.$el || $(this.el);

            $root.find('[data-name="periodMode"]').val(this.selectedPeriodMode);
            $root.find('[data-name="monthFilter"]').val(String(this.selectedMonth));
            $root.find('[data-name="quarterFilter"]').val(String(this.selectedQuarter));

            this.updatePeriodFilterVisibility_();
        },

        // Что это:
        // Управляет видимостью Month/Quarter Filter.
        //
        // Зачем:
        // В режиме Jahr не нужен ни Monat, ни Quartal — остаётся только выбор года.

        updatePeriodFilterVisibility_: function () {
            var $root = this.$el || $(this.el);

            if (this.selectedPeriodMode === 'jahr') {
                $root.find('[data-name="monthFilter"]').addClass('hidden');
                $root.find('[data-name="quarterFilter"]').addClass('hidden');
                return;
            }

            if (this.selectedPeriodMode === 'quartal') {
                $root.find('[data-name="monthFilter"]').addClass('hidden');
                $root.find('[data-name="quarterFilter"]').removeClass('hidden');
                return;
            }

            $root.find('[data-name="quarterFilter"]').addClass('hidden');
            $root.find('[data-name="monthFilter"]').removeClass('hidden');
        },

        getSelectedPeriod_: function () {
            var year = Number(this.selectedYear || new Date().getFullYear());
            var mode = this.selectedPeriodMode || 'monat';

            if (mode === 'jahr') {
                return {
                    mode: 'jahr',
                    label: String(year),
                    dateFrom: this.makeDateString_(year, 1, 1),
                    dateTo: this.makeDateString_(year, 12, 31)
                };
            }

            if (mode === 'quartal') {
                var quarter = Number(this.selectedQuarter || 1);
                var startMonth = ((quarter - 1) * 3) + 1;
                var endMonth = startMonth + 2;

                return {
                    mode: 'quartal',
                    label: 'Q' + quarter + ' ' + year,
                    dateFrom: this.makeDateString_(year, startMonth, 1),
                    dateTo: this.makeDateString_(year, endMonth, this.getLastDayOfMonth_(year, endMonth))
                };
            }

            var month = Number(this.selectedMonth || 1);

            return {
                mode: 'monat',
                label: this.getMonthName_(month) + ' ' + year,
                dateFrom: this.makeDateString_(year, month, 1),
                dateTo: this.makeDateString_(year, month, this.getLastDayOfMonth_(year, month))
            };
        },

        makeDateString_: function (year, month, day) {
            return [
                String(year),
                String(month).padStart(2, '0'),
                String(day).padStart(2, '0')
            ].join('-');
        },

        getLastDayOfMonth_: function (year, month) {
            return new Date(year, month, 0).getDate();
        },

        getMonthName_: function (month) {
            var names = [
                'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
            ];

            return names[month - 1] || '';
        },

        bindEvents_: function () {
            var self = this;
            var $root = this.$el || $(this.el);

            $root.off('change.kbCockpitPeriod', '[data-name="periodMode"], [data-name="yearFilter"], [data-name="monthFilter"], [data-name="quarterFilter"]');
            $root.on('change.kbCockpitPeriod', '[data-name="periodMode"], [data-name="yearFilter"], [data-name="monthFilter"], [data-name="quarterFilter"]', function () {
                var mode = $root.find('[data-name="periodMode"]').val() || 'monat';
                var year = parseInt($root.find('[data-name="yearFilter"]').val(), 10);
                var month = parseInt($root.find('[data-name="monthFilter"]').val(), 10);
                var quarter = parseInt($root.find('[data-name="quarterFilter"]').val(), 10);

                if (!year) {
                    year = new Date().getFullYear();
                }

                self.selectedPeriodMode = mode;
                self.selectedYear = year;
                self.selectedMonth = month || 1;
                self.selectedQuarter = quarter || 1;

                self.updatePeriodFilterVisibility_();
                self.loadDashboard_();
            });

            $root.off('click.kbCockpitTab', '[data-action="kb-cockpit-tab"]');
            $root.on('click.kbCockpitTab', '[data-action="kb-cockpit-tab"]', function (e) {
                e.preventDefault();

                var tab = $(this).data('tab');
                self.switchTab_(tab);
            });

            $root.off('click.kbCockpitPrint', '[data-action="kb-cockpit-print"]');
            $root.on('click.kbCockpitPrint', '[data-action="kb-cockpit-print"]', function () {
                window.print();
            });

            // Что это: обработчик кнопок Detailberichte.
            // Зачем: позволяет бухгалтеру быстро открыть нужную Auswertung из Cockpit.
            $root.off('click.kbOpenReport', '[data-action="kb-open-report"]');
            $root.on('click.kbOpenReport', '[data-action="kb-open-report"]', function (e) {
                e.preventDefault();

                var reportType = $(this).data('report-type');

                if (!reportType) {
                    return;
                }

                self.openReport_(reportType);
            });

            // Что это:
            // Клик по карточке Arbeitsliste.
            // Зачем:
            // Позволяет открывать нужный Bericht или конкретную Rechnung прямо по клику на красивый Block.
            $root.off('click.kbWorkItemNav', '.kb-work-item--clickable');
            $root.on('click.kbWorkItemNav', '.kb-work-item--clickable', function (e) {
                e.preventDefault();

                var $item = $(this);
                var navKind = $item.data('nav-kind');

                if (navKind === 'report') {
                    var reportType = $item.data('report-type');
                    if (reportType) {
                        self.openReport_(reportType);
                    }
                    return;
                }

                if (navKind === 'url') {
                    var url = $item.data('url');
                    if (url) {
                        window.location.href = url;
                    }
                }
            });
        },

        switchTab_: function (tab) {
            var $root = this.$el || $(this.el);

            $root.find('.kb-cockpit-tabs li').removeClass('active');
            $root.find('[data-action="kb-cockpit-tab"][data-tab="' + tab + '"]').closest('li').addClass('active');

            $root.find('.kb-cockpit-tab-panel').addClass('hidden');
            $root.find('[data-tab-panel="' + tab + '"]').removeClass('hidden');
        },

        loadDashboard_: function () {
            var self = this;
            var $root = this.$el || $(this.el);

            $root.find('[data-name="cockpitStatus"]').text('Lade Buchhaltungsdaten ...');

            var period = this.getSelectedPeriod_();

            return Espo.Ajax.getRequest('CBuchung/action/managementDashboard', {
                year: this.selectedYear,
                dateFrom: period.dateFrom,
                dateTo: period.dateTo,
                periodMode: period.mode
            }).then(function (data) {
                self.dashboardData = data || {};

                self.renderAll_();
                $root.find('[data-name="cockpitStatus"]').text(
                    'Quelle: CBuchung · Zeitraum: ' +
                    period.label +
                    ' · Bewegungswerte: ' +
                    self.formatDateGerman_(data.period.dateFrom) +
                    ' – ' +
                    self.formatDateGerman_(data.period.dateTo) +
                    ' · Offene Posten/Vorschau: aktueller Stand' +
                    ' · Prüfsaldo Soll/Haben: ' +
                    self.formatCurrency_(data.checks.pruefsaldo || 0)
                );
            }).catch(function (err) {
                console.error('[BuchhaltungCockpit] load failed', err);
                $root.find('[data-name="cockpitStatus"]').text('Fehler beim Laden der Buchhaltungsdaten.');
            });
        },

        renderAll_: function () {
            var data = this.dashboardData || {};

            this.renderKpi_(data.kpi || {});
            this.renderChecks_(data.checks || {});
            this.renderChartTitles_();
            this.renderCharts_(data.monthly || []);
            this.renderOpenItems_(data.kpi || {});
            this.renderTax_(data.kpi || {});
            this.renderKonten_(data.konten || []);
            this.renderTopOpenForderungen_(data.topOpenForderungen || []);
            this.renderVorschauNaechsteWochen_(data.vorschauNaechsteWochen || []);

            this.renderTaxCheck_(data.kpi || {}, data.konten || []);
            this.renderOpCheck_(data.kpi || {}, data.checks || {});
            this.renderReportLinks_();

            // Что это:
            // Красивый Block "Auffälligkeiten / Arbeitsliste".
            // Зачем:
            // Показывает бухгалтеру и руководству, что хорошо, что требует внимания и что уже kritisch ist.
            this.renderArbeitsliste_(data.kpi || {}, data.checks || {}, data.topOpenForderungen || []);
        },

        // Что это:
        // Rendert die oberen KPI-Karten im Geschäftsführungs-Cockpit.
        //
        // Зачем:
        // Offene Verbindlichkeiten werden in der Management-Sicht als positiver Betrag angezeigt,
        // aber farblich als Abzug / zu zahlender Betrag markiert.
        // Dadurch ist klar: Das ist keine "negative Verbindlichkeit", sondern eine Belastung.

        renderKpi_: function (kpi) {
            var $root = this.$el || $(this.el);

            var forderungen = Math.max(0, Number(kpi.offeneForderungen || 0));
            var verbindlichkeiten = Math.abs(Number(kpi.offeneVerbindlichkeiten || 0));
            var bankbewegung = Number(kpi.bankSaldo || 0);

            var liquiditaetsbild = bankbewegung + forderungen - verbindlichkeiten;

            this.setKpi_($root, 'umsatz', kpi.umsatzNetto);
            this.setKpi_($root, 'aufwand', kpi.aufwandNetto);
            this.setKpi_($root, 'ergebnis', kpi.basisErgebnis, true);
            this.setKpi_($root, 'bank', bankbewegung, true);

            this.setKpi_($root, 'forderungen', forderungen);
            this.setKpiExpense_($root, 'verbindlichkeiten', verbindlichkeiten);

            this.setKpi_($root, 'steuer', kpi.steuerSaldo, true, true);
            this.setKpi_($root, 'liquiditaet', kpi.liquiditaetsbewegung, true);
            this.setKpi_($root, 'erwartete-liquiditaet', liquiditaetsbild, true);
        },

        setKpi_: function ($root, key, value, colorBySign, reverseGoodBad) {
            var $value = $root.find('[data-kpi="' + key + '"]');
            var number = Number(value || 0);

            $value.text(this.formatCurrency_(number));
            $value.removeClass('text-success text-danger text-warning');

            if (!colorBySign) {
                return;
            }

            if (reverseGoodBad) {
                if (number > 0) {
                    $value.addClass('text-warning');
                } else {
                    $value.addClass('text-success');
                }
                return;
            }

            if (number < 0) {
                $value.addClass('text-danger');
            } else {
                $value.addClass('text-success');
            }
        },

        // Что это:
        // Rendert eine KPI-Zahl als Belastung / Abzug.
        //
        // Зачем:
        // Offene Verbindlichkeiten sollen als positiver Betrag lesbar sein,
        // aber optisch klar zeigen: Dieser Betrag ist zu zahlen und mindert die Liquidität.

        setKpiExpense_: function ($root, key, value) {
            var $value = $root.find('[data-kpi="' + key + '"]');
            var number = Math.abs(Number(value || 0));

            $value.text(this.formatCurrency_(number));
            $value.removeClass('text-success text-danger text-warning');
            $value.addClass('text-danger');
        },

        // Что это:
        // Rendert die Prüfkacheln im Buchhaltung-Tab.
        //
        // Зачем:
        // Prüfsaldo bleibt echte Journalprüfung.
        // OP-Abstimmung wird bei Monat/Quartal als Hinweis angezeigt,
        // weil hier Journal-Zeitraum gegen aktuellen operativen Stand verglichen wird.

        renderChecks_: function (checks) {
            var $root = this.$el || $(this.el);
            var isPeriodView = this.selectedPeriodMode === 'monat' || this.selectedPeriodMode === 'quartal';

            this.setCheck_($root, 'pruefsaldo', checks.pruefsaldo);

            if (isPeriodView) {
                this.setInfoCheck_(
                    $root,
                    'op-forderungen',
                    checks.opForderungenDifferenz,
                    'Aktueller Stand'
                );

                this.setInfoCheck_(
                    $root,
                    'op-verbindlichkeiten',
                    checks.opVerbindlichkeitenDifferenz,
                    'Aktueller Stand'
                );
            } else {
                this.setCheck_($root, 'op-forderungen', checks.opForderungenDifferenz);
                this.setCheck_($root, 'op-verbindlichkeiten', checks.opVerbindlichkeitenDifferenz);
            }

            $root.find('[data-check="summe-soll"]').text(this.formatCurrency_(checks.summeSoll || 0));
            $root.find('[data-check="summe-haben"]').text(this.formatCurrency_(checks.summeHaben || 0));
            $root.find('[data-check="anzahl-buchungen"]').text(checks.anzahlBuchungen || 0);
        },

        setCheck_: function ($root, key, value) {
            var number = Number(value || 0);
            var status = Math.abs(number) < 0.01 ? 'OK' : 'Abweichung';

            var $value = $root.find('[data-check="' + key + '"]');
            var $status = $root.find('[data-check-status="' + key + '"]');

            $value.text(this.formatCurrency_(number));
            $status.text(status);

            $value.removeClass('text-success text-danger');
            $status.removeClass('text-success text-danger');

            if (status === 'OK') {
                $value.addClass('text-success');
                $status.addClass('text-success');
            } else {
                $value.addClass('text-danger');
                $status.addClass('text-danger');
            }
        },

        // Что это:
        // Zeigt eine Prüf-Kachel als Hinweis statt als Fehler.
        //
        // Зачем:
        // Bei Monat/Quartal ist die OP-Differenz keine echte Fehlermeldung,
        // weil der Journalwert im Zeitraum mit dem aktuellen operativen Stand verglichen wird.

        setInfoCheck_: function ($root, key, value, statusText) {
            var number = Number(value || 0);

            var $value = $root.find('[data-check="' + key + '"]');
            var $status = $root.find('[data-check-status="' + key + '"]');

            $value.text(this.formatCurrency_(number));
            $status.text(statusText || 'Hinweis');

            $value.removeClass('text-success text-danger text-warning text-info');
            $status.removeClass('text-success text-danger text-warning text-info');

            $value.addClass('text-warning');
            $status.addClass('text-warning');
        },

        // Что это:
        // Setzt sprechende Titel für die beiden Diagramme.
        //
        // Зачем:
        // Der Zeitraumfilter kann Monat, Quartal oder Jahr sein.
        // Deshalb sollen die Diagrammtitel nicht statisch "nach Monat" heißen,
        // sondern zur aktuellen Auswahl passen.

        renderChartTitles_: function () {
            var $root = this.$el || $(this.el);
            var mode = this.selectedPeriodMode || 'monat';

            var umsatzTitle = 'Wirtschaftliches Ergebnis';
            var liquiditaetTitle = 'Liquiditätsbewegung';

            if (mode === 'jahr') {
                umsatzTitle = 'Wirtschaftliches Ergebnis nach Monaten im Jahr';
                liquiditaetTitle = 'Liquiditätsbewegung nach Monaten im Jahr';
            } else if (mode === 'quartal') {
                umsatzTitle = 'Wirtschaftliches Ergebnis nach Monaten im Quartal';
                liquiditaetTitle = 'Liquiditätsbewegung nach Monaten im Quartal';
            } else {
                umsatzTitle = 'Wirtschaftliches Ergebnis im Monat';
                liquiditaetTitle = 'Liquiditätsbewegung im Monat';
            }

            $root.find('[data-name="umsatzChartTitle"]').text(umsatzTitle);
            $root.find('[data-name="liquiditaetChartTitle"]').text(liquiditaetTitle);
        },

        renderCharts_: function (monthly) {
            this.renderUmsatzChart_(monthly);
            this.renderLiquiditaetChart_(monthly);
        },

        renderUmsatzChart_: function (rows) {
            var $root = this.$el || $(this.el);
            var ctx = $root.find('#kb-chart-umsatz')[0];

            if (!ctx) {
                return;
            }

            if (this.umsatzChart) {
                this.umsatzChart.destroy();
                this.umsatzChart = null;
            }

            var self = this;
            var C = window.Chart || Chart;

            if (!C) {
                console.error('Chart.js nicht geladen');
                return;
            }

            var labels = rows.map(function (r) {
                return self.formatMonthLabel_(r.month);
            });

            this.umsatzChart = new C(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Umsatz netto',
                            data: rows.map(function (r) { return r.umsatzNetto || 0; }),
                            borderWidth: 1
                        },
                        {
                            label: 'Aufwand-Wirkung',
                            data: rows.map(function (r) { return r.aufwandNetto || 0; }),
                            borderWidth: 1
                        },
                        {
                            label: 'Basis-Ergebnis',
                            data: rows.map(function (r) { return r.basisErgebnis || 0; }),
                            type: 'line',
                            tension: 0.25,
                            borderWidth: 2,
                            pointRadius: 3
                        }
                    ]
                },
                options: this.getChartOptions_()
            });
        },

        renderLiquiditaetChart_: function (rows) {
            var $root = this.$el || $(this.el);
            var ctx = $root.find('#kb-chart-liquiditaet')[0];

            if (!ctx) {
                return;
            }

            if (this.liquiditaetChart) {
                this.liquiditaetChart.destroy();
                this.liquiditaetChart = null;
            }

            var self = this;
            var C = window.Chart || Chart;

            if (!C) {
                console.error('Chart.js nicht geladen');
                return;
            }

            var labels = rows.map(function (r) {
                return self.formatMonthLabel_(r.month);
            });

            this.liquiditaetChart = new C(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Zahlungseingänge',
                            data: rows.map(function (r) { return r.zahlungseingaenge || 0; }),
                            borderWidth: 1
                        },
                        {
                            label: 'Zahlungsausgänge',
                            data: rows.map(function (r) { return r.zahlungsausgaenge || 0; }),
                            borderWidth: 1
                        },
                        {
                            label: 'Liquiditätsbewegung',
                            data: rows.map(function (r) { return r.liquiditaetsbewegung || 0; }),
                            type: 'line',
                            tension: 0.25,
                            borderWidth: 2,
                            pointRadius: 3
                        }
                    ]
                },
                options: this.getChartOptions_()
            });
        },

        getChartOptions_: function () {
            var self = this;

            return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                var value = 0;

                                if (context.parsed && context.parsed.y != null) {
                                    value = context.parsed.y;
                                } else if (context.yLabel != null) {
                                    value = context.yLabel;
                                }

                                return context.dataset.label + ': ' + self.formatCurrency_(value);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function (value) {
                                return self.formatCurrency_(value);
                            }
                        }
                    }
                }
            };
        },

        renderOpenItems_: function (kpi) {
            var $root = this.$el || $(this.el);

            // Что это:
            // Management-Darstellung der offenen Posten.
            //
            // Зачем:
            // Forderungen und Verbindlichkeiten werden beide als positive Beträge angezeigt.
            // Verbindlichkeiten sind aber fachlich ein Abzug in der Liquiditätsformel.

            var forderungen = Math.max(0, Number(kpi.offeneForderungen || 0));
            var verbindlichkeiten = Math.abs(Number(kpi.offeneVerbindlichkeiten || 0));
            var bankSaldo = Number(kpi.bankSaldo || 0);

            var netto = forderungen - verbindlichkeiten;
            var erwarteteLiquiditaet = bankSaldo + forderungen - verbindlichkeiten;

            $root.find('[data-open-item="forderungen"]').text(this.formatCurrency_(forderungen));
            $root.find('[data-open-item="verbindlichkeiten"]').text(this.formatCurrency_(verbindlichkeiten));
            $root.find('[data-open-item="netto"]').text(this.formatCurrency_(netto));
            $root.find('[data-open-item="erwartete-liquiditaet"]').text(this.formatCurrency_(erwarteteLiquiditaet));

            $root.find('[data-open-item="verbindlichkeiten"]')
                .removeClass('text-success text-danger text-warning')
                .addClass('text-danger');

            $root.find('[data-open-item="netto"]')
                .removeClass('text-success text-danger');

            if (netto < 0) {
                $root.find('[data-open-item="netto"]').addClass('text-danger');
            } else {
                $root.find('[data-open-item="netto"]').addClass('text-success');
            }

            $root.find('[data-open-item="erwartete-liquiditaet"]')
                .removeClass('text-success text-danger');

            if (erwarteteLiquiditaet < 0) {
                $root.find('[data-open-item="erwartete-liquiditaet"]').addClass('text-danger');
            } else {
                $root.find('[data-open-item="erwartete-liquiditaet"]').addClass('text-success');
            }

            this.renderOffenePostenGraph_(
                forderungen,
                verbindlichkeiten,
                netto
            );
        },

        // Что это:
        // Aktualisiert die grafische Darstellung der offenen Posten.
        //
        // Зачем:
        // Zeigt Forderungen und Verbindlichkeiten als relative Balken.
        // Die größeren offenen Posten erhalten 100%, die kleineren proportional dazu.
        renderOffenePostenGraph_: function (forderungen, verbindlichkeiten, netto) {
            var $root = this.$el || $(this.el);

            forderungen = Math.max(0, Number(forderungen || 0));
            verbindlichkeiten = Math.max(0, Number(verbindlichkeiten || 0));
            netto = Number(netto || 0);

            var max = Math.max(forderungen, verbindlichkeiten, 1);

            var forderungenWidth = Math.round((forderungen / max) * 100);
            var verbindlichkeitenWidth = Math.round((verbindlichkeiten / max) * 100);

            $root.find('[data-op-bar="forderungen"]').css('width', forderungenWidth + '%');
            $root.find('[data-op-bar="verbindlichkeiten"]').css('width', verbindlichkeitenWidth + '%');

            $root.find('[data-op-graph-value="forderungen"]').text(this.formatCurrency_(forderungen));
            $root.find('[data-op-graph-value="verbindlichkeiten"]').text(this.formatCurrency_(verbindlichkeiten));

            $root.find('[data-op-graph-value="verbindlichkeiten"]')
                .removeClass('text-success text-danger text-warning')
                .addClass('text-danger');

            $root.find('[data-op-graph-value="netto"]')
                .text(this.formatCurrency_(netto))
                .removeClass('text-success text-danger')
                .addClass(netto < 0 ? 'text-danger' : 'text-success');
        },

        renderTax_: function (kpi) {
            var $root = this.$el || $(this.el);

            var steuerSaldo = Number(kpi.steuerSaldo || 0);
            var result = steuerSaldo > 0 ? 'Zahllast' : (steuerSaldo < 0 ? 'Erstattung' : 'Ausgeglichen');

            $root.find('[data-tax="umsatzsteuer"]').text(this.formatCurrency_(kpi.umsatzsteuer || 0));
            $root.find('[data-tax="vorsteuer"]').text(this.formatCurrency_(kpi.vorsteuer || 0));
            $root.find('[data-tax="saldo"]').text(this.formatCurrency_(steuerSaldo));
            $root.find('[data-tax="result"]').text(result);
        },

        // Что это:
        // Рендерит kompakte Kontenübersicht im Buchhaltung-Cockpit.
        //
        // Зачем:
        // Phase 7A.4: сохраняем технический Saldo = Soll - Haben,
        // но дополнительно показываем wirtschaftliche Wirkung,
        // чтобы Erlöskonten, Umsatzsteuer и Verbindlichkeiten не выглядели "неправильным минусом".
        renderKonten_: function (konten) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="kontenTableBody"]');

            if (!$tbody.length) {
                return;
            }

            if (!konten.length) {
                $tbody.html('<tr><td colspan="7" class="text-muted">Keine Konten gefunden.</td></tr>');
                return;
            }

            var html = '';

            konten.forEach(function (row) {
                var kontoNummer = String(row.konto_nummer || '').trim();

                var soll = Number(row.soll || 0);
                var haben = Number(row.haben || 0);
                var saldo = Number(row.saldo || 0);
                var wirkung = this.getKontoWirkung_(kontoNummer, soll, haben, saldo);
                var wirkungLabel = this.getKontoWirkungLabel_(kontoNummer);

                html += `
                    <tr>
                        <td><strong>${this.escapeHtml_(kontoNummer)}</strong></td>
                        <td>${this.escapeHtml_(row.konto_bezeichnung || '')}</td>
                        <td style="text-align: right;">${this.formatCurrency_(soll)}</td>
                        <td style="text-align: right;">${this.formatCurrency_(haben)}</td>
                        <td style="text-align: right;">${this.formatCurrency_(saldo)}</td>
                        <td style="text-align: right;">
                            <strong title="${this.escapeHtml_(wirkungLabel)}">
                                ${this.formatCurrency_(wirkung)}
                            </strong>
                            <div class="text-muted" style="font-size: 11px;">
                                ${this.escapeHtml_(wirkungLabel)}
                            </div>
                        </td>
                        <td style="text-align: right;">${row.anzahl_buchungen || 0}</td>
                    </tr>
                `;
            }, this);

            $tbody.html(html);
        },


        // Что это:
        // Рассчитывает wirtschaftliche Wirkung eines Kontos.
        //
        // Зачем:
        // Management-Sicht darf nicht nur technischen Saldo = Soll - Haben zeigen.
        // Für Erlöse, Umsatzsteuer und Verbindlichkeiten ist die fachliche Wirkung Haben - Soll.
        getKontoWirkung_: function (kontoNummer, soll, haben, saldo) {
            kontoNummer = String(kontoNummer || '').trim();

            soll = Number(soll || 0);
            haben = Number(haben || 0);
            saldo = Number(saldo || 0);

            // Aktivkonten / Forderungen / Bank / Vorsteuer / Aufwand:
            // Wirkung = Soll - Haben
            if (
                kontoNummer === '1200' ||
                kontoNummer === '1401' ||
                kontoNummer === '1406' ||
                kontoNummer === '1800' ||
                kontoNummer === '6300'
            ) {
                return soll - haben;
            }

            // Verbindlichkeiten / Umsatzsteuer / Erlöse:
            // Wirkung = Haben - Soll
            if (
                kontoNummer === '3300' ||
                kontoNummer === '3806' ||
                kontoNummer === '4337' ||
                kontoNummer === '4400'
            ) {
                return haben - soll;
            }

            // Fallback:
            // Wenn Konto fachlich noch nicht klassifiziert ist, bleibt technischer Saldo sichtbar.
            return saldo;
        },

        // Что это:
        // Возвращает fachliche Bezeichnung der Wirkung.
        //
        // Зачем:
        // Бухгалтер и руководство должны видеть, почему Wirkung bei 4400 positiv ist,
        // obwohl der technische Saldo negativ sein kann.
        getKontoWirkungLabel_: function (kontoNummer) {
            kontoNummer = String(kontoNummer || '').trim();

            if (kontoNummer === '1200') {
                return 'Forderungen: Soll - Haben';
            }

            if (kontoNummer === '1401' || kontoNummer === '1406') {
                return 'Vorsteuer: Soll - Haben';
            }

            if (kontoNummer === '1800') {
                return 'Bank: Soll - Haben';
            }

            if (kontoNummer === '3300') {
                return 'Verbindlichkeiten: Haben - Soll';
            }

            if (kontoNummer === '3806') {
                return 'Umsatzsteuer: Haben - Soll';
            }

            if (kontoNummer === '4337') {
                return '§13b-Erlöse: Haben - Soll';
            }

            if (kontoNummer === '4400') {
                return 'Erlöse: Haben - Soll';
            }

            if (kontoNummer === '6300') {
                return 'Aufwand: Soll - Haben';
            }

            return 'Saldo: Soll - Haben';
        },

        // Что это: компактная Steuerprüfung для Buchhaltung-Tab.
        // Зачем: бухгалтер видит Umsatzsteuer, Vorsteuer и Zahllast прямо в Dashboard.
        renderTaxCheck_: function (kpi, konten) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="taxCheckBody"]');

            if (!$tbody.length) {
                return;
            }

            var rows = [];

            (konten || []).forEach(function (konto) {
                var kontoNummer = String(konto.konto_nummer || '').trim();

                if (kontoNummer !== '1401' && kontoNummer !== '1406' && kontoNummer !== '3806') {
                    return;
                }

                var soll = Number(konto.soll || 0);
                var haben = Number(konto.haben || 0);

                var steuerart = '';
                var wirkung = 0;

                if (kontoNummer === '3806') {
                    steuerart = 'Umsatzsteuer';
                    wirkung = haben - soll;
                } else {
                    steuerart = 'Vorsteuer';
                    wirkung = soll - haben;
                }

                rows.push({
                    konto: kontoNummer,
                    bezeichnung: konto.konto_bezeichnung || '',
                    steuerart: steuerart,
                    wirkung: wirkung
                });
            });

            if (!rows.length) {
                $tbody.html('<tr><td colspan="4" class="text-muted">Keine Steuerkonten gefunden.</td></tr>');
                return;
            }

            rows.sort(function (a, b) {
                return String(a.konto).localeCompare(String(b.konto), 'de', { numeric: true });
            });

            var html = '';

            rows.forEach(function (row) {
                html += `
            <tr>
                <td><strong>${this.escapeHtml_(row.konto)}</strong></td>
                <td>${this.escapeHtml_(row.bezeichnung)}</td>
                <td>${this.escapeHtml_(row.steuerart)}</td>
                <td class="text-right"><strong>${this.formatCurrency_(row.wirkung)}</strong></td>
            </tr>
        `;
            }, this);

            var steuerSaldo = Number(kpi.steuerSaldo || 0);
            var ergebnis = steuerSaldo > 0 ? 'Zahllast' : (steuerSaldo < 0 ? 'Erstattung' : 'Ausgeglichen');

            html += `
        <tr>
            <th colspan="3">Steuer-Saldo</th>
            <th class="text-right">${this.formatCurrency_(steuerSaldo)} · ${this.escapeHtml_(ergebnis)}</th>
        </tr>
    `;

            $tbody.html(html);
        },

        // Что это:
        // Setzt die Spaltenüberschriften der kompakten OP-Abstimmung.
        //
        // Зачем:
        // Im Jahresmodus ist die OP-Abstimmung eine echte Abstimmung über den Jahresstand.
        // Im Monats- und Quartalsmodus wird dagegen der Journalwert des gewählten Zeitraums
        // mit dem aktuellen operativen Stand verglichen.

        updateOpCheckHeaders_: function () {
            var $root = this.$el || $(this.el);
            var mode = this.selectedPeriodMode || 'monat';

            var journalHeader = 'Journal';
            var operativHeader = 'Operativ';

            if (mode === 'monat' || mode === 'quartal') {
                journalHeader = 'Journal Zeitraum';
                operativHeader = 'Operativ aktueller Stand';
            }

            $root.find('[data-name="opCheckJournalHeader"]').text(journalHeader);
            $root.find('[data-name="opCheckOperativHeader"]').text(operativHeader);
        },

        // Что это: kompakte Offene-Posten-Abstimmung für Buchhaltung-Tab.
        // Зачем: бухгалтер видит Journalwert, operativen Restbetrag и Differenz без открытия отдельного Berichts.
        renderOpCheck_: function (kpi, checks) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="opCheckBody"]');
            this.updateOpCheckHeaders_();

            if (!$tbody.length) {
                return;
            }

            var journalForderungen = Number(kpi.offeneForderungen || 0);
            var journalVerbindlichkeiten = Number(kpi.offeneVerbindlichkeiten || 0);

            var operativeForderungen = checks.operativeForderungen || {};
            var operativeVerbindlichkeiten = checks.operativeVerbindlichkeiten || {};

            var opForderungenSumme = Number(operativeForderungen.summe || 0);
            var opVerbindlichkeitenSumme = Number(operativeVerbindlichkeiten.summe || 0);

            var diffForderungen = Number(checks.opForderungenDifferenz || 0);
            var diffVerbindlichkeiten = Number(checks.opVerbindlichkeitenDifferenz || 0);

            var rows = [
                {
                    bereich: 'Forderungen',
                    journal: journalForderungen,
                    operativ: opForderungenSumme,
                    differenz: diffForderungen,
                    anzahl: operativeForderungen.anzahl || 0
                },
                {
                    bereich: 'Verbindlichkeiten',
                    journal: journalVerbindlichkeiten,
                    operativ: opVerbindlichkeitenSumme,
                    differenz: diffVerbindlichkeiten,
                    anzahl: operativeVerbindlichkeiten.anzahl || 0
                }
            ];

            var html = '';

            rows.forEach(function (row) {
                var isPeriodView = this.selectedPeriodMode === 'monat' || this.selectedPeriodMode === 'quartal';

                var status = Math.abs(Number(row.differenz || 0)) < 0.01 ? 'OK' : 'Abweichung';
                var statusClass = status === 'OK' ? 'text-success' : 'text-danger';

                if (isPeriodView && status !== 'OK') {
                    status = 'Aktueller Stand';
                    statusClass = 'text-warning';
                }

                html += `
            <tr>
                <td><strong>${this.escapeHtml_(row.bereich)}</strong></td>
                <td class="text-right">${this.formatCurrency_(row.journal)}</td>
                <td class="text-right">${this.formatCurrency_(row.operativ)}</td>
                <td class="text-right ${statusClass}"><strong>${this.formatCurrency_(row.differenz)}</strong></td>
                <td class="text-right">${row.anzahl}</td>
                <td class="${statusClass}"><strong>${this.escapeHtml_(status)}</strong></td>
            </tr>
        `;
            }, this);

            $tbody.html(html);
        },

        // Что это: готовит кнопки Detailberichte.
        // Зачем: бухгалтер быстро переходит из Cockpit в проверочные отчёты Phase 6.
        renderReportLinks_: function () {
            var $root = this.$el || $(this.el);
            var $box = $root.find('[data-name="detailReportButtons"]');

            if (!$box.length) {
                return;
            }

            var reports = [
                {
                    type: 'summen_saldenliste',
                    label: 'Summen- und Saldenliste'
                },
                {
                    type: 'kontenblatt',
                    label: 'Kontenblatt'
                },
                {
                    type: 'steueruebersicht_gesamt',
                    label: 'Steuerübersicht gesamt'
                },
                {
                    type: 'offene_posten_abstimmung',
                    label: 'Offene-Posten-Abstimmung'
                },
                {
                    type: 'management_kennzahlen_grundlage',
                    label: 'Management-Kennzahlen'
                }
            ];

            var html = '';

            reports.forEach(function (report) {
                html += `
            <button
                type="button"
                class="btn btn-default btn-sm"
                data-action="kb-open-report"
                data-report-type="${this.escapeHtml_(report.type)}"
                style="margin-right: 6px; margin-bottom: 6px;"
            >
                ${this.escapeHtml_(report.label)}
            </button>
        `;
            }, this);

            $box.html(html);
        },

        // Что это: открывает passende CBuchhaltungAuswertung по auswertungTyp.
        // Зачем: кнопки Detailberichte ведут не просто в список, а прямо в нужный Bericht.
        openReport_: function (reportType) {
            var self = this;

            if (!reportType) {
                return;
            }

            if (this._reportIdMap && this._reportIdMap[reportType]) {
                window.location.href = '#CBuchhaltungAuswertung/view/' + this._reportIdMap[reportType];
                return;
            }

            this.getCollectionFactory().create('CBuchhaltungAuswertung', function (collection) {
                collection.maxSize = 50;

                collection.data.select = [
                    'id',
                    'name',
                    'auswertungTyp',
                    'aktiv'
                ];

                collection.data.where = [
                    {
                        type: 'in',
                        attribute: 'auswertungTyp',
                        value: [
                            'summen_saldenliste',
                            'kontenblatt',
                            'steueruebersicht_gesamt',
                            'offene_posten_abstimmung',
                            'management_kennzahlen_grundlage',
                            'offene_forderungen',
                            'verbindlichkeiten'
                        ]
                    }
                ];

                collection.fetch().then(function () {
                    self._reportIdMap = {};

                    (collection.models || []).forEach(function (model) {
                        var item = model.attributes || {};

                        if (!item.auswertungTyp || !item.id) {
                            return;
                        }

                        self._reportIdMap[item.auswertungTyp] = item.id;
                    });

                    if (self._reportIdMap[reportType]) {
                        window.location.href = '#CBuchhaltungAuswertung/view/' + self._reportIdMap[reportType];
                        return;
                    }

                    window.location.href = '#CBuchhaltungAuswertung';
                }).catch(function (err) {
                    console.error('[BuchhaltungCockpit] open report failed', err);
                    window.location.href = '#CBuchhaltungAuswertung';
                });
            });
        },

        // Что это:
        // Рендер красивого блока "Auffälligkeiten / Arbeitsliste" с прямой навигацией.
        // Зачем:
        // Каждая карточка не только информирует, но и ведёт в нужный Bericht или запись.
        renderArbeitsliste_: function (kpi, checks, topOpenForderungen) {
            var $root = this.$el || $(this.el);
            var $box = $root.find('[data-name="arbeitslisteItems"]');

            if (!$box.length) {
                return;
            }

            var items = [];

            var pruefsaldo = Number(checks.pruefsaldo || 0);
            var opForderungenDiff = Number(checks.opForderungenDifferenz || 0);
            var opVerbindlichkeitenDiff = Number(checks.opVerbindlichkeitenDifferenz || 0);

            var offeneForderungen = checks.operativeForderungen || {};
            var offeneVerbindlichkeiten = checks.operativeVerbindlichkeiten || {};

            var offeneForderungenCount = Number(offeneForderungen.anzahl || 0);
            var offeneForderungenSumme = Number(offeneForderungen.summe || 0);

            var offeneVerbindlichkeitenCount = Number(offeneVerbindlichkeiten.anzahl || 0);
            var offeneVerbindlichkeitenSumme = Number(offeneVerbindlichkeiten.summe || 0);

            var steuerSaldo = Number(kpi.steuerSaldo || 0);

            // 1. Soll/Haben
            if (Math.abs(pruefsaldo) < 0.01) {
                items.push(this.makeArbeitsItem_(
                    'success',
                    'Prüfsaldo Soll/Haben',
                    'Journal ist ausgeglichen.',
                    'Differenz: ' + this.formatCurrency_(pruefsaldo),
                    {
                        navKind: 'report',
                        reportType: 'summen_saldenliste',
                        actionLabel: 'Zur Summen- und Saldenliste'
                    }
                ));
            } else {
                items.push(this.makeArbeitsItem_(
                    'danger',
                    'Prüfsaldo Soll/Haben',
                    'Journal ist nicht ausgeglichen.',
                    'Differenz: ' + this.formatCurrency_(pruefsaldo),
                    {
                        navKind: 'report',
                        reportType: 'summen_saldenliste',
                        actionLabel: 'Zum Prüfbericht'
                    }
                ));
            }

            // 2. OP Forderungen
            // Что это:
            // Bewertet die OP-Abstimmung Forderungen für die Arbeitsliste.
            //
            // Зачем:
            // Bei Monat/Quartal ist eine Differenz zwischen Journal-Zeitraum
            // und aktuellem operativem Stand kein Fehler, sondern ein Hinweis.

            var isPeriodView = this.selectedPeriodMode === 'monat' || this.selectedPeriodMode === 'quartal';

            if (Math.abs(opForderungenDiff) < 0.01) {
                items.push(this.makeArbeitsItem_(
                    'success',
                    'OP-Abstimmung Forderungen',
                    'Journal und operative Forderungen stimmen überein.',
                    offeneForderungenCount + ' Belege · ' + this.formatCurrency_(offeneForderungenSumme),
                    {
                        navKind: 'report',
                        reportType: 'offene_posten_abstimmung',
                        actionLabel: 'Zur OP-Abstimmung'
                    }
                ));
            } else if (isPeriodView) {
                items.push(this.makeArbeitsItem_(
                    'warning',
                    'OP-Abstimmung Forderungen',
                    'Aktueller operativer Stand ist unabhängig vom gewählten Zeitraum.',
                    offeneForderungenCount + ' Belege · ' + this.formatCurrency_(offeneForderungenSumme),
                    {
                        navKind: 'report',
                        reportType: 'offene_posten_abstimmung',
                        actionLabel: 'Zur OP-Abstimmung'
                    }
                ));
            } else {
                items.push(this.makeArbeitsItem_(
                    'danger',
                    'OP-Abstimmung Forderungen',
                    'Abweichung zwischen Journal und operativen offenen Forderungen.',
                    'Differenz: ' + this.formatCurrency_(opForderungenDiff),
                    {
                        navKind: 'report',
                        reportType: 'offene_posten_abstimmung',
                        actionLabel: 'Zur Abweichung'
                    }
                ));
            }

            // 3. OP Verbindlichkeiten
            // Что это:
            // Bewertet die OP-Abstimmung Verbindlichkeiten für die Arbeitsliste.
            //
            // Зачем:
            // Bei Monat/Quartal ist eine Differenz zwischen Journal-Zeitraum
            // und aktuellem operativem Stand kein Fehler, sondern ein Hinweis.

            if (Math.abs(opVerbindlichkeitenDiff) < 0.01) {
                items.push(this.makeArbeitsItem_(
                    'success',
                    'OP-Abstimmung Verbindlichkeiten',
                    'Journal und operative Verbindlichkeiten stimmen überein.',
                    offeneVerbindlichkeitenCount + ' Belege · ' + this.formatCurrency_(offeneVerbindlichkeitenSumme),
                    {
                        navKind: 'report',
                        reportType: 'offene_posten_abstimmung',
                        actionLabel: 'Zur OP-Abstimmung'
                    }
                ));
            } else if (isPeriodView) {
                items.push(this.makeArbeitsItem_(
                    'warning',
                    'OP-Abstimmung Verbindlichkeiten',
                    'Aktueller operativer Stand ist unabhängig vom gewählten Zeitraum.',
                    offeneVerbindlichkeitenCount + ' Belege · ' + this.formatCurrency_(offeneVerbindlichkeitenSumme),
                    {
                        navKind: 'report',
                        reportType: 'offene_posten_abstimmung',
                        actionLabel: 'Zur OP-Abstimmung'
                    }
                ));
            } else {
                items.push(this.makeArbeitsItem_(
                    'danger',
                    'OP-Abstimmung Verbindlichkeiten',
                    'Abweichung zwischen Journal und operativen Verbindlichkeiten.',
                    'Differenz: ' + this.formatCurrency_(opVerbindlichkeitenDiff),
                    {
                        navKind: 'report',
                        reportType: 'offene_posten_abstimmung',
                        actionLabel: 'Zur Abweichung'
                    }
                ));
            }

            // 4. Steuer-Saldo
            if (steuerSaldo > 0) {
                items.push(this.makeArbeitsItem_(
                    'warning',
                    'Steuer-Saldo',
                    'Aktuell besteht eine Zahllast.',
                    this.formatCurrency_(steuerSaldo),
                    {
                        navKind: 'report',
                        reportType: 'steueruebersicht_gesamt',
                        actionLabel: 'Zur Steuerübersicht'
                    }
                ));
            } else if (steuerSaldo < 0) {
                items.push(this.makeArbeitsItem_(
                    'info',
                    'Steuer-Saldo',
                    'Aktuell besteht ein Erstattungsanspruch.',
                    this.formatCurrency_(Math.abs(steuerSaldo)),
                    {
                        navKind: 'report',
                        reportType: 'steueruebersicht_gesamt',
                        actionLabel: 'Zur Steuerübersicht'
                    }
                ));
            } else {
                items.push(this.makeArbeitsItem_(
                    'success',
                    'Steuer-Saldo',
                    'Steuerlich aktuell ausgeglichen.',
                    this.formatCurrency_(steuerSaldo),
                    {
                        navKind: 'report',
                        reportType: 'steueruebersicht_gesamt',
                        actionLabel: 'Zur Steuerübersicht'
                    }
                ));
            }

            // 5. Offene Forderungen
            if (offeneForderungenCount > 0) {
                items.push(this.makeArbeitsItem_(
                    'warning',
                    'Offene Forderungen',
                    'Es bestehen noch offene Ausgangsrechnungen.',
                    offeneForderungenCount + ' Belege · ' + this.formatCurrency_(offeneForderungenSumme),
                    {
                        navKind: 'report',
                        reportType: 'offene_forderungen',
                        actionLabel: 'Zu offenen Forderungen'
                    }
                ));
            } else {
                items.push(this.makeArbeitsItem_(
                    'success',
                    'Offene Forderungen',
                    'Keine offenen Ausgangsrechnungen.',
                    this.formatCurrency_(offeneForderungenSumme),
                    {
                        navKind: 'report',
                        reportType: 'offene_forderungen',
                        actionLabel: 'Zum Bericht'
                    }
                ));
            }

            // 6. Offene Verbindlichkeiten
            if (offeneVerbindlichkeitenCount > 0) {
                items.push(this.makeArbeitsItem_(
                    'warning',
                    'Offene Verbindlichkeiten',
                    'Es bestehen noch offene Eingangsrechnungen.',
                    offeneVerbindlichkeitenCount + ' Belege · ' + this.formatCurrency_(offeneVerbindlichkeitenSumme),
                    {
                        navKind: 'report',
                        reportType: 'verbindlichkeiten',
                        actionLabel: 'Zu offenen Verbindlichkeiten'
                    }
                ));
            } else {
                items.push(this.makeArbeitsItem_(
                    'success',
                    'Offene Verbindlichkeiten',
                    'Keine offenen Eingangsrechnungen.',
                    this.formatCurrency_(offeneVerbindlichkeitenSumme),
                    {
                        navKind: 'report',
                        reportType: 'verbindlichkeiten',
                        actionLabel: 'Zum Bericht'
                    }
                ));
            }

            // 7. Mahnstufen / Inkasso
            var inkassoCount = 0;
            var mahnungCount = 0;

            (topOpenForderungen || []).forEach(function (row) {
                var stufe = String(row.mahnstufe || '').trim();

                if (stufe === 'inkasso') {
                    inkassoCount++;
                } else if (
                    stufe === 'mahnung1' ||
                    stufe === 'mahnung2' ||
                    stufe === 'mahnung3' ||
                    stufe === 'zahlungserinnerung'
                ) {
                    mahnungCount++;
                }
            });

            if (inkassoCount > 0) {
                items.push(this.makeArbeitsItem_(
                    'danger',
                    'Inkasso-Fälle',
                    'Unter den offenen Forderungen gibt es kritische Inkasso-Fälle.',
                    inkassoCount + ' Fall/Fälle',
                    {
                        navKind: 'report',
                        reportType: 'offene_forderungen',
                        actionLabel: 'Zu kritischen Forderungen'
                    }
                ));
            } else if (mahnungCount > 0) {
                items.push(this.makeArbeitsItem_(
                    'warning',
                    'Mahnfälle',
                    'Unter den offenen Forderungen befinden sich gemahnte Belege.',
                    mahnungCount + ' Fall/Fälle',
                    {
                        navKind: 'report',
                        reportType: 'offene_forderungen',
                        actionLabel: 'Zu offenen Forderungen'
                    }
                ));
            } else {
                items.push(this.makeArbeitsItem_(
                    'success',
                    'Mahnstatus',
                    'Keine gemahnten oder kritischen offenen Forderungen in der Top-Liste.',
                    'OK',
                    {
                        navKind: 'report',
                        reportType: 'offene_forderungen',
                        actionLabel: 'Zum Bericht'
                    }
                ));
            }

            // 8. Wichtigste kritische Forderung
            if ((topOpenForderungen || []).length) {
                var top = topOpenForderungen[0] || {};
                var kunde = top.accountName || '–';
                var nummer = top.rechnungsnummer || '–';
                var betrag = Number(top.restbetragOffen || 0);
                var rechnungId = top.id || '';
                var grund = top.kritischGrund || 'kritisch';

                items.push(this.makeArbeitsItem_(
                    'info',
                    'Wichtigste kritische Forderung',
                    kunde + ' · ' + nummer,
                    this.formatCurrency_(betrag) + ' · ' + grund,
                    rechnungId ? {
                        navKind: 'url',
                        url: '#CRechnung/view/' + rechnungId,
                        actionLabel: 'Zur Rechnung'
                    } : {
                        navKind: 'report',
                        reportType: 'offene_forderungen',
                        actionLabel: 'Zu kritischen Forderungen'
                    }
                ));
            }

            var html = '';

            items.forEach(function (item) {
                var isClickable = !!(item.navKind && ((item.navKind === 'report' && item.reportType) || (item.navKind === 'url' && item.url)));
                var extraClass = isClickable ? ' kb-work-item--clickable' : '';

                var navAttrs = '';
                if (item.navKind === 'report' && item.reportType) {
                    navAttrs += ' data-nav-kind="report"';
                    navAttrs += ' data-report-type="' + this.escapeHtml_(item.reportType) + '"';
                }
                if (item.navKind === 'url' && item.url) {
                    navAttrs += ' data-nav-kind="url"';
                    navAttrs += ' data-url="' + this.escapeHtml_(item.url) + '"';
                }

                var actionHtml = '';
                if (item.actionLabel) {
                    actionHtml = `
                        <div class="kb-work-item__footer">
                            <span class="kb-work-item__action">
                                ${this.escapeHtml_(item.actionLabel)} →
                            </span>
                        </div>
                    `;
                }

                html += `
                    <div class="kb-work-item kb-work-item--${this.escapeHtml_(item.type)}${extraClass}"${navAttrs}>
                        <div class="kb-work-item__icon">${this.escapeHtml_(item.icon)}</div>
                        <div class="kb-work-item__content">
                            <div class="kb-work-item__title">${this.escapeHtml_(item.title)}</div>
                            <div class="kb-work-item__text">${this.escapeHtml_(item.text)}</div>
                            <div class="kb-work-item__meta">${this.escapeHtml_(item.meta)}</div>
                            ${actionHtml}
                        </div>
                    </div>
                `;
            }, this);

            $box.html(html);
        },

        // Что это:
        // Создаёт единый объект карточки Arbeitsliste.
        // Зачем:
        // Чтобы карточки были красивыми, единообразными и могли содержать навигацию.
        makeArbeitsItem_: function (type, title, text, meta, options) {
            var icon = '•';

            if (type === 'success') icon = '✓';
            if (type === 'warning') icon = '!';
            if (type === 'danger') icon = '×';
            if (type === 'info') icon = 'i';

            options = options || {};

            return {
                type: type || 'info',
                icon: icon,
                title: title || '',
                text: text || '',
                meta: meta || '',
                navKind: options.navKind || '',
                reportType: options.reportType || '',
                url: options.url || '',
                actionLabel: options.actionLabel || ''
            };
        },

        // Что это:
        // Рендерит Liquiditätsvorschau nächste Wochen.
        //
        // Зачем:
        // Phase 7A.5: zeigt erwartete Zahlungseingänge,
        // erwartete Zahlungsausgänge und Netto-Ausblick für 7/14/30 Tage.
        renderVorschauNaechsteWochen_: function (rows) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="vorschauNaechsteWochenBody"]');

            if (!$tbody.length) {
                return;
            }

            if (!rows.length) {
                $tbody.html('<tr><td colspan="5" class="text-muted">Keine Vorschau-Daten gefunden.</td></tr>');
                return;
            }

            var html = '';

            rows.forEach(function (row) {
                var eingang = Number(row.zahlungseingaenge || 0);
                var ausgang = Number(row.zahlungsausgaenge || 0);
                var netto = Number(row.nettoAusblick || 0);

                var nettoClass = netto < 0 ? 'text-danger' : 'text-success';

                var anzahlText =
                    String(row.anzahlEingaenge || 0) +
                    ' Eingänge / ' +
                    String(row.anzahlAusgaenge || 0) +
                    ' Ausgänge';

                html += `
                    <tr>
                        <td><strong>${this.escapeHtml_(row.label || '')}</strong></td>
                        <td class="text-right">${this.formatCurrency_(eingang)}</td>
                        <td class="text-right">${this.formatCurrency_(ausgang)}</td>
                        <td class="text-right ${nettoClass}">
                            <strong>${this.formatCurrency_(netto)}</strong>
                        </td>
                        <td class="text-muted">${this.escapeHtml_(anzahlText)}</td>
                    </tr>
                `;
            }, this);

            $tbody.html(html);
        },

        // Что это:
        // Рендерит список kritische Forderungen.
        //
        // Зачем:
        // Phase 7A.5: руководство должно видеть Forderungen, по которым нужно действовать:
        // сначала ab 5.000 €, затем остальные kritische Forderungen.
        renderTopOpenForderungen_: function (rows) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="topOpenForderungenBody"]');

            if (!$tbody.length) {
                return;
            }

            if (!rows.length) {
                $tbody.html('<tr><td colspan="7" class="text-muted">Keine kritischen Forderungen gefunden.</td></tr>');
                return;
            }

            var html = '';

            rows.forEach(function (row) {
                var rechnung = row.id
                    ? `<a href="#CRechnung/view/${this.escapeHtml_(row.id)}">${this.escapeHtml_(row.rechnungsnummer || '')}</a>`
                    : this.escapeHtml_(row.rechnungsnummer || '');

                var kunde = row.accountId
                    ? `<a href="#Account/view/${this.escapeHtml_(row.accountId)}">${this.escapeHtml_(row.accountName || '')}</a>`
                    : this.escapeHtml_(row.accountName || '');

                var tage = Number(row.tageUeberfaellig || 0);
                var tageText = tage > 0 ? String(tage) : '–';

                var betrag = Number(row.restbetragOffen || 0);
                var istGross = !!row.istGrosseForderung;

                var grund = row.kritischGrund || 'Prüfen';
                var mahnstufe = this.formatMahnstufe_(row.mahnstufe);

                var priorityBadge = '';

                if (istGross) {
                    priorityBadge = `
                        <span style="
                            display: inline-block;
                            padding: 2px 7px;
                            border-radius: 999px;
                            background: #fee2e2;
                            color: #991b1b;
                            font-size: 11px;
                            font-weight: 700;
                            margin-right: 5px;
                            white-space: nowrap;
                        ">
                            AB 5.000 €
                        </span>
                    `;
                }

                html += `
                    <tr>
                        <td>${kunde}</td>
                        <td>${rechnung}</td>
                        <td>${this.escapeHtml_(this.formatDateGerman_(row.faelligAm))}</td>
                        <td class="text-right">${this.escapeHtml_(tageText)}</td>
                        <td class="text-right"><strong>${this.formatCurrency_(betrag)}</strong></td>
                        <td>${this.escapeHtml_(mahnstufe)}</td>
                        <td>
                            ${priorityBadge}
                            <span>${this.escapeHtml_(grund)}</span>
                            ${row.id ? `
                                <div style="margin-top: 4px;">
                                    <a href="#CRechnung/view/${this.escapeHtml_(row.id)}" class="small">
                                        Zur Rechnung →
                                    </a>
                                </div>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }, this);

            $tbody.html(html);
        },

        formatCurrency_: function (value) {
            var number = Number(value || 0);

            if (Math.abs(number) < 0.005) {
                number = 0;
            }

            return number.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + ' €';
        },

        formatDateGerman_: function (value) {
            if (!value) {
                return '–';
            }

            var m = window.moment(value);

            if (!m.isValid()) {
                return String(value);
            }

            return m.format('DD.MM.YYYY');
        },

        formatMonthLabel_: function (monthStr) {
            if (!monthStr) {
                return '';
            }

            var parts = String(monthStr).split('-');

            if (parts.length !== 2) {
                return monthStr;
            }

            var m = parseInt(parts[1], 10);
            var names = [
                'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
            ];

            return (names[m - 1] || monthStr) + ' ' + parts[0];
        },

        formatMahnstufe_: function (value) {
            if (value === 'zahlungserinnerung') return 'Zahlungserinnerung';
            if (value === 'mahnung1') return 'Mahnung 1';
            if (value === 'mahnung2') return 'Mahnung 2';
            if (value === 'mahnung3') return 'Mahnung 3';
            if (value === 'inkasso') return 'Inkasso';
            return value || '–';
        },

        escapeHtml_: function (value) {
            return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        },

        dispose: function () {
            if (this.umsatzChart) {
                this.umsatzChart.destroy();
                this.umsatzChart = null;
            }

            if (this.liquiditaetChart) {
                this.liquiditaetChart.destroy();
                this.liquiditaetChart = null;
            }

            Dep.prototype.dispose.call(this);
        }
    });
});