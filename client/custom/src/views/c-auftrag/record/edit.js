// client/custom/src/views/c-auftrag/record/edit.js
console.log('[LOAD] custom:views/c-auftrag/record/edit');

define('custom:views/c-auftrag/record/edit', ['views/record/edit'], function (Dep) {
    const LOG = (t, p) => { try { console.log('[CAuftrag/edit]', t, p || ''); } catch (e) { } };

    return Dep.extend({
        FLASK_BASE: 'https://klesec.pagekite.me/api',

        setup: function () {
            Dep.prototype.setup.call(this);

            const syncFields = () => {
                ['betragNetto', 'betragBrutto', 'verrechnetNetto', 'verrechnetBrutto'].forEach(n => {
                    const fv = this.getFieldView && this.getFieldView(n);
                    if (fv && fv.setValue) fv.setValue(this.model.get(n) || 0, { render: true, fromModel: true });
                });
            };

            this.once('after:render', () => syncFields(), this);

            this.listenTo(this, 'after:save', () => {
                const id = this.model.id;
                if (!id) return;
                $.ajax({
                    url: `${this.FLASK_BASE}/auftrag/${encodeURIComponent(id)}/recalc_totals`,
                    method: 'POST',
                    complete: () => { this.model.fetch({ success: () => this.reRender() }); }
                });
            });
        }
    });
});
