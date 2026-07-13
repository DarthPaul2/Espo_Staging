// custom:views/c-einstellungstest/list
console.log('[LOAD] custom:views/c-einstellungstest/list');

define('custom:views/c-einstellungstest/list', [
    'views/list'
], function (Dep) {

    return Dep.extend({

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this._renderNeuerTestButton();
        },

        _renderNeuerTestButton: function () {
            const $container = this.$el.find('.header-buttons').first();
            if (!$container.length || $container.find('[data-name="neuerTest"]').length) {
                return;
            }

            const $btn = $(
                '<a role="button" tabindex="0" data-name="neuerTest" ' +
                'class="btn btn-primary btn-xs-wide main-header-manu-action action" ' +
                'style="margin-left: 5px;">' +
                '<span class="fas fa-plus"></span> <span>Neuen Test erstellen</span></a>'
            );
            $btn.on('click', () => this._openNeuerTestModal());
            $container.prepend($btn);
        },

        _openNeuerTestModal: function () {
            this.createView('neuerTestModal', 'custom:views/c-einstellungstest/modals/neuer-test', {
                parentView: this
            }, (view) => {
                view.render();
                this.listenToOnce(view, 'test-angelegt', () => {
                    this.collection.fetch();
                });
            });
        }

    });
});
