Espo.define('custom:views/dashboard/umsatz-statistik', [
    'view',
    'lib!Chart'
], function (Dep, Chart) {


    return Dep.extend({

        name: 'umsatzStatistik',
        template: 'custom:dashboard/umsatz-statistik',

        monthChart: null,
        yearChart: null,
        yearList: [],
        selectedYear: null,
        jahresData: null,

        // Заголовок в шапке дашлета
        getTitle: function () {
            return 'Umsatz & Zahlungen';
        },
        // Цвет рамки/иконки дашлета — вернём стандарт
        getColor: function () {
            // варианты: 'default', 'success', 'danger', 'warning', 'info'
            return 'default';
        },

        // Дашлет ожидает список action-кнопок; нам они не нужны → возвращаем пустой список
        getActionItemDataList: function () {
            return [];
        },

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            var self = this;

            this.fetchYears()
                .then(function () {
                    self.initYearSelect();
                    return self.loadAll();
                })
                .catch(function (err) {
                    console.error('Umsatz-Dashlet init error', err);
                });

            this.bindYearChange();
        },

        // ---------- Загрузка данных ----------

        fetchYears: function () {
            var self = this;

            return Espo.Ajax.getRequest('CRechnung/action/jahresStatistik')
                .then(function (rows) {
                    self.yearList = (rows || []).map(function (r) { return r.year; }).sort();
                    if (self.yearList.length) {
                        self.selectedYear = self.yearList[self.yearList.length - 1]; // последний год
                    }
                    self.jahresData = rows || [];
                });
        },

        loadAll: function () {
            var self = this;

            if (!this.selectedYear) {
                return Promise.resolve();
            }

            var year = this.selectedYear;

            var pMonat = Espo.Ajax.getRequest(
                'CRechnung/action/monatlicheStatistik',
                { year: year }
            );

            // ВАЖНО: передаём year во второй запрос
            var pSummary = Espo.Ajax.getRequest(
                'CRechnung/action/rechnungStatusSummary',
                { year: year }
            );

            return Promise.all([pMonat, pSummary]).then(function (result) {
                var monatRows = result[0] || [];
                var summary = result[1] || {};

                self.renderKpi(summary);
                self.renderMonthChart(monatRows);
                self.renderYearChart(self.jahresData || []);
            }).catch(function (err) {
                console.error('Umsatz-Dashlet loadAll error', err);
            });
        },


        // ---------- Переключатель года ----------

        initYearSelect: function () {
            var $root = this.$el || $(this.el);
            var $select = $root.find('[data-name="yearFilter"]');
            $select.empty();

            var self = this;

            (this.yearList || []).forEach(function (y) {
                var $opt = $('<option>')
                    .attr('value', y)
                    .text(y);

                if (y === self.selectedYear) {
                    $opt.attr('selected', 'selected');
                }
                $select.append($opt);
            });
        },

        bindYearChange: function () {
            var self = this;
            var $root = this.$el || $(this.el);

            $root.on('change', '[data-name="yearFilter"]', function () {
                var val = parseInt($(this).val(), 10);
                if (!val || val === self.selectedYear) return;

                self.selectedYear = val;
                self.loadAll();
            });
        },

        // ---------- KPI-карточки ----------

        renderKpi: function (summary) {
            var year = this.selectedYear;
            var yearData = (this.jahresData || []).find(function (r) { return r.year === year; }) || {};

            var umsatzNetto = yearData.umsatzNetto || 0;
            var umsatzBrutto = yearData.umsatzBrutto || 0;
            var bezahltNetto = yearData.bezahltNetto || 0;
            var bezahltBrutto = yearData.bezahltBrutto || 0;
            var offenNetto = yearData.offenNetto || 0;
            var offenBrutto = yearData.offenBrutto || 0;

            // работаем только через корневой элемент
            var $root = this.$el || $(this.el);

            // Umsatz (gestellt)
            $root.find('.kls-kpi--umsatz .kls-kpi__value-netto')
                .text(this.formatCurrency(umsatzNetto));
            $root.find('.kls-kpi--umsatz .kls-kpi__value-brutto')
                .text(this.formatCurrency(umsatzBrutto));

            // Bezahlt
            $root.find('.kls-kpi--bezahlt .kls-kpi__value-netto')
                .text(this.formatCurrency(bezahltNetto));
            $root.find('.kls-kpi--bezahlt .kls-kpi__value-brutto')
                .text(this.formatCurrency(bezahltBrutto));

            // Offene Posten
            $root.find('.kls-kpi--offen .kls-kpi__value-netto')
                .text(this.formatCurrency(offenNetto));
            $root.find('.kls-kpi--offen .kls-kpi__value-brutto')
                .text(this.formatCurrency(offenBrutto));

            // Gesamt (summary по всем счетам)
            if (summary) {
                $root.find('.kls-kpi--gesamt .kls-kpi__value-total').text(
                    (summary.totalCount || 0) + ' Rechnungen'
                );
                $root.find('.kls-kpi--gesamt .kls-kpi__line-bezahlt').text(
                    (summary.bezahltCount || 0) + ' bezahlt'
                );
                $root.find('.kls-kpi--gesamt .kls-kpi__line-offen').text(
                    (summary.offenCount || 0) + ' offen'
                );
            }
        },


        // ---------- График по месяцам ----------

        renderMonthChart: function (rows) {
            var $root = this.$el || $(this.el);
            var ctx = $root.find('#kls-chart-month')[0];
            if (!ctx) return;

            if (this.monthChart) {
                this.monthChart.destroy();
                this.monthChart = null;
            }

            var self = this;

            var labels = rows.map(function (r) { return self.formatMonthLabel(r.month); });
            var umsatzNetto = rows.map(function (r) { return r.umsatzNetto || 0; });
            var bezahltNetto = rows.map(function (r) { return r.bezahltNetto || 0; });
            var offenNetto = rows.map(function (r) { return r.offenNetto || 0; });

            var C = window.Chart || Chart;
            if (!C) {
                console.error('Chart.js nicht geladen');
                return;
            }

            this.monthChart = new C(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Gestellt (Netto)',
                            data: umsatzNetto,
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 3,
                            fill: false,
                            borderColor: '#2563eb',
                            pointBackgroundColor: '#2563eb'
                        },
                        {
                            label: 'Bezahlt (Netto)',
                            data: bezahltNetto,
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 3,
                            fill: false,
                            borderColor: '#16a34a',
                            pointBackgroundColor: '#16a34a'
                        },
                        {
                            label: 'Offen (Netto)',
                            data: offenNetto,
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 3,
                            fill: false,
                            borderColor: '#f97316',
                            pointBackgroundColor: '#f97316'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    var v = ctx.parsed.y || 0;
                                    return ctx.dataset.label + ': ' + self.formatCurrency(v);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function (value) {
                                    return self.formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });

        },

        // ---------- График по годам ----------

        renderYearChart: function (rows) {
            var $root = this.$el || $(this.el);
            var ctx = $root.find('#kls-chart-year')[0];
            if (!ctx) return;

            if (this.yearChart) {
                this.yearChart.destroy();
                this.yearChart = null;
            }

            var self = this;

            var labels = rows.map(function (r) { return r.year; });
            var umsatzNetto = rows.map(function (r) { return r.umsatzNetto || 0; });
            var bezahltNetto = rows.map(function (r) { return r.bezahltNetto || 0; });

            var C = window.Chart || Chart;
            if (!C) {
                console.error('Chart.js nicht geladen');
                return;
            }

            this.yearChart = new C(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Umsatz (Netto)',
                            data: umsatzNetto,
                            borderWidth: 1,
                            backgroundColor: '#1d4ed8'
                        },
                        {
                            label: 'Bezahlt (Netto)',
                            data: bezahltNetto,
                            borderWidth: 1,
                            backgroundColor: '#16a34a'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    var v = ctx.parsed.y || 0;
                                    return ctx.dataset.label + ': ' + self.formatCurrency(v);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function (value) {
                                    return self.formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });

        },

        // ---------- Форматирование ----------

        formatCurrency: function (value) {
            var n = Number(value || 0);

            if (this.getHelper && this.getHelper().formatNumber) {
                return this.getHelper().formatNumber(n, 2) + ' €';
            }

            return n.toFixed(2) + ' €';
        },

        formatMonthLabel: function (monthStr) {
            if (!monthStr) return '';
            var parts = monthStr.split('-');
            if (parts.length !== 2) return monthStr;

            var m = parseInt(parts[1], 10);
            var names = [
                'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
                'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
            ];

            return (names[m - 1] || monthStr) + ' ' + parts[0];
        },

        dispose: function () {
            if (this.monthChart) {
                this.monthChart.destroy();
                this.monthChart = null;
            }
            if (this.yearChart) {
                this.yearChart.destroy();
                this.yearChart = null;
            }
            Dep.prototype.dispose.call(this);
        }
    });
});
