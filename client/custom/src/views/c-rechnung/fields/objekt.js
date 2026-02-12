define('custom:views/c-rechnung/fields/objekt', 'views/fields/link', function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.listenTo(this.model, 'change:accountId', function () {
                this.model.set({
                    objektId: null,
                    objektName: null
                });
                this.checkHasObjectsAndToggle();
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.checkHasObjectsAndToggle();
        },

        getSelectFilters: function () {
            const accountId = this.model.get('accountId');
            const accountName = this.model.get('accountName');

            if (!accountId) {
                return null;
            }

            return {
                'byAccount': {
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

        checkHasObjectsAndToggle: function () {
            const accountId = this.model.get('accountId');

            if (!accountId) {
                this.hideField();
                return;
            }

            Espo.Ajax.getRequest('CObjekt', {
                maxSize: 1,
                where: [
                    {
                        type: 'equals',
                        attribute: 'accountId',
                        value: accountId
                    }
                ]
            }).then((res) => {
                const has = res && Array.isArray(res.list) && res.list.length > 0;

                if (!has) {
                    this.model.set({
                        objektId: null,
                        objektName: null
                    });
                    this.hideField();
                } else {
                    this.showField();
                }
            });
        },

        hideField: function () {
            const $container = this.$el.closest('.cell, .field, .form-group');
            ($container.length ? $container : this.$el).hide();
        },

        showField: function () {
            const $container = this.$el.closest('.cell, .field, .form-group');
            ($container.length ? $container : this.$el).show();
        }

    });
});
