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

            this.selectedYear = new Date().getFullYear();
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.renderYearSelect_();
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

        bindEvents_: function () {
            var self = this;
            var $root = this.$el || $(this.el);

            $root.off('change.kbCockpit', '[data-name="yearFilter"]');
            $root.on('change.kbCockpit', '[data-name="yearFilter"]', function () {
                var year = parseInt($(this).val(), 10);

                if (!year || year === self.selectedYear) {
                    return;
                }

                self.selectedYear = year;
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

            return Espo.Ajax.getRequest('CBuchung/action/managementDashboard', {
                year: this.selectedYear
            }).then(function (data) {
                self.dashboardData = data || {};

                self.renderAll_();
                $root.find('[data-name="cockpitStatus"]').text(
                    'Quelle: CBuchung · Zeitraum: ' +
                    self.formatDateGerman_(data.period.dateFrom) +
                    ' – ' +
                    self.formatDateGerman_(data.period.dateTo) +
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
            this.renderCharts_(data.monthly || []);
            this.renderOpenItems_(data.kpi || {});
            this.renderTax_(data.kpi || {});
            this.renderKonten_(data.konten || []);
            this.renderTopOpenForderungen_(data.topOpenForderungen || []);

            this.renderTaxCheck_(data.kpi || {}, data.konten || []);
            this.renderOpCheck_(data.kpi || {}, data.checks || {});
            this.renderReportLinks_();

            // Что это:
            // Красивый Block "Auffälligkeiten / Arbeitsliste".
            // Зачем:
            // Показывает бухгалтеру и руководству, что хорошо, что требует внимания и что уже kritisch ist.
            this.renderArbeitsliste_(data.kpi || {}, data.checks || {}, data.topOpenForderungen || []);
        },

        renderKpi_: function (kpi) {
            var $root = this.$el || $(this.el);

            this.setKpi_($root, 'umsatz', kpi.umsatzNetto);
            this.setKpi_($root, 'aufwand', kpi.aufwandNetto);
            this.setKpi_($root, 'ergebnis', kpi.basisErgebnis, true);
            this.setKpi_($root, 'bank', kpi.bankSaldo, true);

            this.setKpi_($root, 'forderungen', kpi.offeneForderungen);
            this.setKpi_($root, 'verbindlichkeiten', kpi.offeneVerbindlichkeiten);
            this.setKpi_($root, 'steuer', kpi.steuerSaldo, true, true);
            this.setKpi_($root, 'liquiditaet', kpi.liquiditaetsbewegung, true);
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

        renderChecks_: function (checks) {
            var $root = this.$el || $(this.el);

            this.setCheck_($root, 'pruefsaldo', checks.pruefsaldo);
            this.setCheck_($root, 'op-forderungen', checks.opForderungenDifferenz);
            this.setCheck_($root, 'op-verbindlichkeiten', checks.opVerbindlichkeitenDifferenz);

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

            var forderungen = Number(kpi.offeneForderungen || 0);
            var verbindlichkeiten = Number(kpi.offeneVerbindlichkeiten || 0);
            var netto = forderungen - verbindlichkeiten;

            $root.find('[data-open-item="forderungen"]').text(this.formatCurrency_(forderungen));
            $root.find('[data-open-item="verbindlichkeiten"]').text(this.formatCurrency_(verbindlichkeiten));
            $root.find('[data-open-item="netto"]').text(this.formatCurrency_(netto));

            $root.find('[data-open-item="netto"]')
                .removeClass('text-success text-danger');

            if (netto < 0) {
                $root.find('[data-open-item="netto"]').addClass('text-danger');
            } else {
                $root.find('[data-open-item="netto"]').addClass('text-success');
            }
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

        renderKonten_: function (konten) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="kontenTableBody"]');

            if (!$tbody.length) {
                return;
            }

            if (!konten.length) {
                $tbody.html('<tr><td colspan="6" class="text-muted">Keine Konten gefunden.</td></tr>');
                return;
            }

            var html = '';

            konten.forEach(function (row) {
                html += `
                    <tr>
                        <td><strong>${this.escapeHtml_(row.konto_nummer || '')}</strong></td>
                        <td>${this.escapeHtml_(row.konto_bezeichnung || '')}</td>
                        <td style="text-align: right;">${this.formatCurrency_(row.soll)}</td>
                        <td style="text-align: right;">${this.formatCurrency_(row.haben)}</td>
                        <td style="text-align: right;">${this.formatCurrency_(row.saldo)}</td>
                        <td style="text-align: right;">${row.anzahl_buchungen || 0}</td>
                    </tr>
                `;
            }, this);

            $tbody.html(html);
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

        // Что это: kompakte Offene-Posten-Abstimmung für Buchhaltung-Tab.
        // Зачем: бухгалтер видит Journalwert, operativen Restbetrag и Differenz без открытия отдельного Berichts.
        renderOpCheck_: function (kpi, checks) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="opCheckBody"]');

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
                var status = Math.abs(Number(row.differenz || 0)) < 0.01 ? 'OK' : 'Abweichung';
                var statusClass = status === 'OK' ? 'text-success' : 'text-danger';

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

            // 8. Größte offene Forderung
            if ((topOpenForderungen || []).length) {
                var top = topOpenForderungen[0] || {};
                var kunde = top.accountName || '–';
                var nummer = top.rechnungsnummer || '–';
                var betrag = Number(top.restbetragOffen || 0);
                var rechnungId = top.id || '';

                items.push(this.makeArbeitsItem_(
                    'info',
                    'Größte offene Forderung',
                    kunde + ' · ' + nummer,
                    this.formatCurrency_(betrag),
                    rechnungId ? {
                        navKind: 'url',
                        url: '#CRechnung/view/' + rechnungId,
                        actionLabel: 'Zur Rechnung'
                    } : {
                        navKind: 'report',
                        reportType: 'offene_forderungen',
                        actionLabel: 'Zu offenen Forderungen'
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

        renderTopOpenForderungen_: function (rows) {
            var $root = this.$el || $(this.el);
            var $tbody = $root.find('[data-name="topOpenForderungenBody"]');

            if (!$tbody.length) {
                return;
            }

            if (!rows.length) {
                $tbody.html('<tr><td colspan="5" class="text-muted">Keine offenen Forderungen gefunden.</td></tr>');
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

                html += `
                    <tr>
                        <td>${kunde}</td>
                        <td>${rechnung}</td>
                        <td>${this.escapeHtml_(this.formatDateGerman_(row.faelligAm))}</td>
                        <td style="text-align: right;"><strong>${this.formatCurrency_(row.restbetragOffen)}</strong></td>
                        <td>${this.escapeHtml_(this.formatMahnstufe_(row.mahnstufe))}</td>
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