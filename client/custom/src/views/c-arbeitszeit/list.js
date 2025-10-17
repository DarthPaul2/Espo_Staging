define('custom:views/c-arbeitszeit/list', ['views/list'], function (Dep) {
    return Dep.extend({
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this._renderStatPanelsOnce();
        },

        _renderStatPanelsOnce: function () {
            if (!this.$el.find('#arbeitszeit-statistik').length) {
                const html = `
                    <div id="arbeitszeit-statistik" style="margin-top:30px;border-top:1px solid #ddd;padding-top:15px;">
                        <h4><i class="fas fa-chart-line"></i> Statistik Monatsübersicht</h4>
                        <div id="panelMonat"></div>

                        <h4 style="margin-top:30px;"><i class="fas fa-calendar"></i> Statistik Jahresübersicht</h4>
                        <div id="panelJahr"></div>
                    </div>
                `;
                this.$el.append(html);

                // ВАЖНО: передаём СТРОКУ-СЕЛЕКТОР
                this.createView(
                    'panelMonat',
                    'custom:views/c-arbeitszeit/panels/panel-monat',
                    { el: '#panelMonat' },
                    view => view.render()
                );

                this.createView(
                    'panelJahr',
                    'custom:views/c-arbeitszeit/panels/panel-jahr',
                    { el: '#panelJahr' },
                    view => view.render()
                );
            }
        },
    });
});
