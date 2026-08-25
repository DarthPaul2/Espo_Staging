define('custom:handlers/c-eingangsrechnung/mass-zahlungsavis-erstellen', [], function () {

    function Handler(view) {
        this.view = view;
    }

    Handler.prototype.actionZahlungsavisErstellen = function (data) {
        const params = (data && data.params) ? data.params : {};
        const ids = params.ids || [];

        if (!Array.isArray(ids) || !ids.length) {
            Espo.Ui.warning('Bitte zuerst Eingangsrechnungen auswählen.');
            return;
        }

        this.view.createView(
            'zahlungsavisErstellenModal',
            'custom:views/c-eingangsrechnung/modals/zahlungsavis-erstellen',
            {ids: ids},
            (view) => {
                view.render();
                view.once('zahlungsavis-erstellt', () => {
                    this.view.collection.fetch();
                });
            }
        );
    };

    return Handler;
});
