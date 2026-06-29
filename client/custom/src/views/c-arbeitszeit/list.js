define('custom:views/c-arbeitszeit/list', [
    'views/list',
    'custom:views/c-arbeitszeit/panels/panel-monat',
    'custom:views/c-arbeitszeit/panels/panel-jahr',
], function (Dep, PanelMonat, PanelJahr) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this._renderPanels();
        },

        _renderPanels: function () {
            if (this.$el.find('#az-panels-container').length) return;

            const $wrap = $(`
                <div id="az-panels-container" style="margin-top: 32px;">
                    <div class="panel panel-default az-panel-wrap" style="margin-bottom: 20px;">
                        <div class="panel-heading">
                            <h4 class="panel-title">
                                <i class="fas fa-calendar-alt"></i> Monatsübersicht
                            </h4>
                        </div>
                        <div class="panel-body" id="az-panel-monat-body"></div>
                    </div>
                    <div class="panel panel-default az-panel-wrap">
                        <div class="panel-heading">
                            <h4 class="panel-title">
                                <i class="fas fa-chart-bar"></i> Jahresübersicht
                            </h4>
                        </div>
                        <div class="panel-body" id="az-panel-jahr-body"></div>
                    </div>
                </div>
            `);

            this.$el.find('.list-container').after($wrap);

            this.createView('panelMonat', 'custom:views/c-arbeitszeit/panels/panel-monat', {
                el: '#az-panel-monat-body',
            }, view => view.render());

            this.createView('panelJahr', 'custom:views/c-arbeitszeit/panels/panel-jahr', {
                el: '#az-panel-jahr-body',
            }, view => view.render());
        },

    });
});
