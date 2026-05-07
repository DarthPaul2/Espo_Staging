// Что это:
// Кастомный list view для CBuchhaltungAuswertung.
//
// Зачем:
// 1. Убирает Löschen у строк и массовое удаление сверху.
// 2. Делает строки-разделители auswertungTyp = gruppe_header визуальными заголовками:
//    - Name не ссылка
//    - строка подсвечена
//    - row actions скрыты
//    - checkbox скрыт

define('custom:views/c-buchhaltung-auswertung/record/list', ['views/record/list'], function (Dep) {
    return Dep.extend({

        rowActionsView: 'views/record/row-actions/view-and-edit',

        setup() {
            Dep.prototype.setup.call(this);
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);

            const run = () => {
                this.hideDeleteActions_();
                this.decorateGroupHeaderRows_();
            };

            run();
            window.requestAnimationFrame(run);
            setTimeout(run, 50);
            setTimeout(run, 200);
        },

        // Что это:
        // Убирает массовое удаление и пункты Löschen.
        //
        // Зачем:
        // Справочник Auswertungen не должен случайно чиститься через список.
        hideDeleteActions_() {
            // верхние массовые действия
            this.$el.find('[data-action="removeSelected"]').hide();
            this.$el.find('[data-action="deleteSelected"]').hide();

            this.$el.find('button[data-action="removeSelected"]').hide();
            this.$el.find('button[data-action="deleteSelected"]').hide();

            this.$el.find('a[data-action="removeSelected"]').closest('li').hide();
            this.$el.find('a[data-action="deleteSelected"]').closest('li').hide();

            // если Espo рисует это как пункт в общем dropdown Aktionen
            this.$el.find('[data-action="massRemove"]').hide();
            this.$el.find('[data-action="massDelete"]').hide();
            this.$el.find('a[data-action="massRemove"]').closest('li').hide();
            this.$el.find('a[data-action="massDelete"]').closest('li').hide();

            // дополнительная страховка по тексту пункта меню
            this.$el.find('.dropdown-menu li').each(function () {
                const text = ($(this).text() || '').trim().toLowerCase();

                if (text === 'löschen' || text === 'delete' || text === 'remove') {
                    $(this).hide();
                }
            });
        },

        // Что это:
        // Находит строки, где auswertungTyp = gruppe_header,
        // и превращает их в визуальные разделители таблицы.
        //
        // Зачем:
        // Чтобы группы отчётов в списке выглядели как настоящие заголовки,
        // а не как обычные кликабельные записи.
        decorateGroupHeaderRows_() {
            if (!this.collection || !this.collection.models) {
                return;
            }

            this.ensureGroupHeaderStyles_();

            this.collection.models.forEach((model) => {
                const auswertungTyp = model.get('auswertungTyp');

                if (auswertungTyp !== 'gruppe_header') {
                    return;
                }

                const id = model.id;

                if (!id) {
                    return;
                }

                const $row = this.findRowById_(id);

                if (!$row || !$row.length) {
                    return;
                }

                $row.addClass('kb-auswertung-group-header-row');
                $row.css('cursor', 'default');

                // Name-Link entfernen und durch normalen Text ersetzen.
                const name = model.get('name') || '';

                const $nameCell = $row.find('td[data-name="name"], .cell[data-name="name"]').first();

                if ($nameCell.length) {
                    $nameCell.find('a').each(function () {
                        const text = $(this).text() || name;
                        $(this).replaceWith(
                            $('<span>')
                                .addClass('kb-auswertung-group-header-title')
                                .text(text)
                        );
                    });

                    // Falls kein Link gefunden wurde, aber Zelle leer/normal ist.
                    if (!$nameCell.find('.kb-auswertung-group-header-title').length) {
                        $nameCell.html(
                            $('<span>')
                                .addClass('kb-auswertung-group-header-title')
                                .text(name)
                        );
                    }
                }

                // Checkbox ausblenden.
                // Что это: скрывает checkbox только у строк-разделителей.
                // Зачем: Gruppenüberschriften не должны выглядеть как выбираемые записи.
                $row.find('input[type="checkbox"]').each(function () {
                    $(this).prop('checked', false);
                    $(this).hide();

                    const $cell = $(this).closest('td, th, .cell');
                    if ($cell.length) {
                        $cell.css({
                            'visibility': 'hidden',
                            'pointer-events': 'none'
                        });
                    }
                });

                $row.find('td.cell-checkbox, th.cell-checkbox, .cell-checkbox, .cell[data-name="select"]')
                    .css({
                        'visibility': 'hidden',
                        'pointer-events': 'none'
                    });

                // Row actions ausblenden.
                $row.find('td.cell-actions, .cell-actions').css('visibility', 'hidden');

                // Auswertungstyp / Standardzeitraum / Beschreibung optisch leeren,
                // falls Espo trotz leerem Label etwas rendert.
                $row.find('td[data-name="auswertungTyp"], .cell[data-name="auswertungTyp"]').html('');
                $row.find('td[data-name="standardzeitraum"], .cell[data-name="standardzeitraum"]').html('');
                $row.find('td[data-name="standardZeitraum"], .cell[data-name="standardZeitraum"]').html('');
                $row.find('td[data-name="description"], .cell[data-name="description"]').html('');
            });
        },

        // Что это:
        // Ищет строку таблицы по id записи.
        //
        // Зачем:
        // В разных Espo-версиях id может лежать в data-id или data-record-id.
        findRowById_(id) {
            let $row = this.$el.find('tr[data-id="' + id + '"]').first();

            if ($row.length) {
                return $row;
            }

            $row = this.$el.find('tr[data-record-id="' + id + '"]').first();

            if ($row.length) {
                return $row;
            }

            // fallback: ищем ссылку на запись и берём ближайшую строку
            const $link = this.$el.find('a[href="#CBuchhaltungAuswertung/view/' + id + '"]').first();

            if ($link.length) {
                return $link.closest('tr');
            }

            return $();
        },

        // Что это:
        // Добавляет CSS для строк-разделителей один раз.
        //
        // Зачем:
        // Чтобы группы визуально выделялись прямо в таблице.
        ensureGroupHeaderStyles_() {
            if (document.getElementById('kb-auswertung-group-header-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'kb-auswertung-group-header-styles';

            style.textContent = `
                .kb-auswertung-group-header-row td {
                    background: #eef2f7 !important;
                    border-top: 2px solid #b8c2d2 !important;
                    border-bottom: 1px solid #cbd5e1 !important;
                }

                .kb-auswertung-group-header-row:hover td {
                    background: #e2e8f0 !important;
                }

                .kb-auswertung-group-header-title {
                    display: inline-block;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    color: #2f3b52;
                    text-transform: uppercase;
                    padding: 2px 0;
                }

                .kb-auswertung-group-header-row a {
                    pointer-events: none !important;
                    cursor: default !important;
                    text-decoration: none !important;
                }
            `;

            document.head.appendChild(style);
        }
    });
});