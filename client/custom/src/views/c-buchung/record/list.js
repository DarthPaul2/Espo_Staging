// Что это:
// Кастомный list view для CBuchung.
//
// Зачем:
// Phase 7A.1: показывает Buchungen в бухгалтерском виде:
// debit  -> Soll
// credit -> Haben
// без новых DB-полей sollBetrag / habenBetrag.

define('custom:views/c-buchung/record/list', ['views/record/list'], function (Dep) {
    return Dep.extend({

        setup() {
            Dep.prototype.setup.call(this);
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);

            const run = () => {
                this.ensureStyles_();
                this.renameHeaders_();
                this.decorateRows_();
            };

            run();
            window.requestAnimationFrame(run);
            setTimeout(run, 50);
            setTimeout(run, 200);
        },

        // Что это:
        // Меняет подписи существующих колонок.
        //
        // Зачем:
        // В layout пока физически остаются поля buchungsart и betrag,
        // но в UI бухгалтер видит Soll и Haben.
        renameHeaders_() {
            this.$el.find('th[data-name="buchungsart"], .cell[data-name="buchungsart"]').each(function () {
                const $el = $(this);

                if ($el.is('th')) {
                    $el.text('Soll');
                    $el.css('text-align', 'right');
                }
            });

            this.$el.find('th[data-name="betrag"], .cell[data-name="betrag"]').each(function () {
                const $el = $(this);

                if ($el.is('th')) {
                    $el.text('Haben');
                    $el.css('text-align', 'right');
                }
            });
        },

        // Что это:
        // Обходит строки CBuchung и заменяет техническое отображение
        // buchungsart/betrag на Soll/Haben.
        //
        // Зачем:
        // Сохраняем старую Datenlogik, но показываем привычную Buchhaltungsdarstellung.
        decorateRows_() {
            if (!this.collection || !this.collection.models) {
                return;
            }

            this.collection.models.forEach((model) => {
                const id = model.id;

                if (!id) {
                    return;
                }

                const $row = this.findRowById_(id);

                if (!$row || !$row.length) {
                    return;
                }

                const buchungsart = model.get('buchungsart');
                const betrag = this.toNumber_(model.get('betrag'));
                const formatted = this.formatCurrency_(betrag);
                const isStorno = !!model.get('istStorno');

                const sollValue = buchungsart === 'debit' ? formatted : '–';
                const habenValue = buchungsart === 'credit' ? formatted : '–';

                const $sollCell = $row.find('td[data-name="buchungsart"], .cell[data-name="buchungsart"]').first();
                const $habenCell = $row.find('td[data-name="betrag"], .cell[data-name="betrag"]').first();

                if ($sollCell.length) {
                    $sollCell
                        .addClass('kb-buchung-money-cell kb-buchung-soll-cell')
                        .html(this.escapeHtml_(sollValue));
                }

                if ($habenCell.length) {
                    $habenCell
                        .addClass('kb-buchung-money-cell kb-buchung-haben-cell')
                        .html(this.escapeHtml_(habenValue));
                }

                this.decorateStornoRow_($row, model, isStorno);
            });
        },

        // Что это:
        // Визуально отмечает Storno-Buchungen.
        //
        // Зачем:
        // Это подготовка к Phase 7A.2: Storno не исключается из Salden,
        // а только ясно выделяется в UI.
        decorateStornoRow_($row, model, isStorno) {
            if (!isStorno) {
                return;
            }

            $row.addClass('kb-buchung-storno-row');

            const $stornoCell = $row.find('td[data-name="istStorno"], .cell[data-name="istStorno"]').first();

            if ($stornoCell.length) {
                $stornoCell.html(
                    '<span class="kb-buchung-storno-badge">STORNO</span>'
                );
            }

            const $textCell = $row.find('td[data-name="buchungstext"], .cell[data-name="buchungstext"]').first();

            if ($textCell.length && !$textCell.find('.kb-buchung-gegenbuchung-hint').length) {
                $textCell.append(
                    ' <span class="kb-buchung-gegenbuchung-hint">Gegenbuchung</span>'
                );
            }
        },

        // Что это:
        // Ищет строку таблицы по ID записи.
        //
        // Зачем:
        // В разных местах Espo может использовать data-id, data-record-id
        // или ссылку на запись.
        findRowById_(id) {
            let $row = this.$el.find('tr[data-id="' + id + '"]').first();

            if ($row.length) {
                return $row;
            }

            $row = this.$el.find('tr[data-record-id="' + id + '"]').first();

            if ($row.length) {
                return $row;
            }

            const $link = this.$el.find('a[href="#CBuchung/view/' + id + '"]').first();

            if ($link.length) {
                return $link.closest('tr');
            }

            return $();
        },

        // Что это:
        // Приводит значение к числу.
        //
        // Зачем:
        // Betrag может прийти как число или строка.
        toNumber_(value) {
            if (value === null || value === undefined || value === '') {
                return 0;
            }

            if (typeof value === 'number') {
                return value;
            }

            const normalized = String(value)
                .replace(/\./g, '')
                .replace(',', '.')
                .replace(/[^\d.-]/g, '');

            const number = parseFloat(normalized);

            return isNaN(number) ? 0 : number;
        },

        // Что это:
        // Форматирует сумму в немецком формате валюты.
        //
        // Зачем:
        // Бухгалтер должен видеть 1.234,56 €, а не 1234.56.
        formatCurrency_(value) {
            return new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value || 0);
        },

        // Что это:
        // Безопасно экранирует текст перед вставкой в HTML.
        //
        // Зачем:
        // Чтобы не вставлять необработанный текст напрямую в DOM.
        escapeHtml_(value) {
            return $('<div>').text(value === null || value === undefined ? '' : String(value)).html();
        },

        // Что это:
        // Добавляет CSS для Soll/Haben и Storno.
        //
        // Зачем:
        // Чтобы Darstellung была читаемой без отдельного CSS-файла.
        ensureStyles_() {
            if (document.getElementById('kb-buchung-list-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'kb-buchung-list-styles';

            style.textContent = `
                .kb-buchung-money-cell {
                    text-align: right !important;
                    white-space: nowrap;
                    font-variant-numeric: tabular-nums;
                    font-weight: 600;
                }

                .kb-buchung-soll-cell {
                    color: #1f2937;
                }

                .kb-buchung-haben-cell {
                    color: #1f2937;
                }

                .kb-buchung-storno-row td {
                    background: #fff1f2 !important;
                }

                .kb-buchung-storno-row:hover td {
                    background: #ffe4e6 !important;
                }

                .kb-buchung-storno-badge {
                    display: inline-block;
                    padding: 2px 7px;
                    border-radius: 999px;
                    background: #b91c1c;
                    color: #ffffff;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                }

                .kb-buchung-gegenbuchung-hint {
                    display: inline-block;
                    margin-left: 6px;
                    padding: 1px 6px;
                    border-radius: 999px;
                    background: #fee2e2;
                    color: #991b1b;
                    font-size: 11px;
                    font-weight: 600;
                }
            `;

            document.head.appendChild(style);
        }

    });
});