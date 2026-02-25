define('custom:views/c-wartung/fields/objekt', 'views/fields/link', function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // 1) Клиент поменяли -> очищаем объект + Ort и решаем показывать поле или нет
            this.listenTo(this.model, 'change:accountId', function () {
                this.model.set({
                    objektId: null,
                    objektName: null,
                    objektOrt: null     // <-- поле Ort в CWartung (varchar)
                });
                this.checkHasObjectsAndToggle();
            });

            // 2) Объект поменяли -> подтягиваем Ort из CObjekt.cOrt
            this.listenTo(this.model, 'change:objektId', function () {
                this._syncObjektOrtFromObjekt();
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            // в list-режиме не дергаем лишние запросы и не ломаем верстку
            if (this.mode === 'list') return;

            this.checkHasObjectsAndToggle();
        },

        // фильтр выбора объектов по клиенту
        getSelectFilters: function () {
            const accountId = this.model.get('accountId');
            const accountName = this.model.get('accountName');

            if (!accountId) {
                return null;
            }

            return {
                byAccount: {
                    type: 'equals',
                    attribute: 'accountId',
                    value: accountId,
                    data: {
                        type: 'equals',
                        nameValue: accountName || ''
                    }
                }
            };
        },

        // проверяем: есть ли объекты у клиента → показываем/скрываем поле objekt (но НЕ в list)
        checkHasObjectsAndToggle: function () {
            const accountId = this.model.get('accountId');

            if (!accountId) {
                this.hideField();
                return;
            }

            Espo.Ajax.getRequest('CObjekt', {
                maxSize: 1,
                where: [
                    { type: 'equals', attribute: 'accountId', value: accountId }
                ]
            }).then(res => {
                const has = res && Array.isArray(res.list) && res.list.length > 0;

                if (!has) {
                    this.model.set({
                        objektId: null,
                        objektName: null,
                        objektOrt: null
                    });
                    this.hideField();
                } else {
                    this.showField();
                }
            });
        },

        // тянем город объекта и кладём в Wartung.objektOrt
        _syncObjektOrtFromObjekt: function () {
            const objektId = this.model.get('objektId');

            if (!objektId) {
                this.model.set({ objektOrt: null });
                return;
            }

            // только cOrt, чтобы запрос был лёгкий
            Espo.Ajax.getRequest('CObjekt/' + encodeURIComponent(objektId)).then(obj => {
                const ort = (obj && obj.cOrt) ? String(obj.cOrt) : '';
                this.model.set({ objektOrt: ort || null });
            }).catch(() => {
                // если не удалось загрузить объект — лучше просто очистить
                this.model.set({ objektOrt: null });
            });
        },

        hideField: function () {
            // В LIST-режиме не скрываем ячейку, иначе ломается layout таблицы
            if (this.mode === 'list') {
                const $value = this.$el.find('.value-container, .value, .link-container').first();
                if ($value.length) $value.text('—');
                return;
            }

            const $container = this.$el.closest('.cell, .field, .form-group');
            ($container.length ? $container : this.$el).hide();
        },

        showField: function () {
            if (this.mode === 'list') {
                const $value = this.$el.find('.value-container, .value, .link-container').first();
                if ($value.length && $value.text().trim() === '—') $value.text('');
                return;
            }

            const $container = this.$el.closest('.cell, .field, .form-group');
            ($container.length ? $container : this.$el).show();
        }

    });
});