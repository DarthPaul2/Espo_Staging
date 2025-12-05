// client/custom/src/views/c-auftrag/record/edit.js
console.log('[LOAD] custom:views/c-auftrag/record/edit');

define('custom:views/c-auftrag/record/edit', ['views/record/edit'], function (Dep) {
    const LOG = (t, p) => { try { console.log('[CAuftrag/edit]', t, p || ''); } catch (e) { } };

    return Dep.extend({

        // Оставляю на случай будущих нужд (не используется здесь)
        FLASK_BASE: 'https://klesec.pagekite.me/api',

        setup: function () {
            // Стандартная инициализация формы редактирования заказа
            Dep.prototype.setup.call(this);

            // НИКАКИХ блокировок/переключений режима/disable-инпутов.
            // НИКАКОЙ чистки полей перед сохранением.
            // НИКАКИХ вызовов автопересчёта после сохранения.
            // Всё редактируется пользователем и сохраняется как есть.

            // Если когда-то захочешь мягкую нормализацию числовых полей — расскомментируй ниже.
            /*
            const TOTAL_FIELDS = ['betragNetto', 'betragBrutto', 'verrechnetNetto', 'verrechnetBrutto'];
            this.on('before:save', (attrs) => {
                if (!attrs || typeof attrs !== 'object') return;
                TOTAL_FIELDS.forEach(n => {
                    // пример: пустые строки превращать в null (или 0 — по желанию)
                    if (attrs[n] === '' || attrs[n] === undefined) attrs[n] = null; // или 0
                });
            });
            */
        },

    });
});
