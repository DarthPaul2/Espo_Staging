// custom:views/c-zahlungsavis/list
define('custom:views/c-zahlungsavis/list', [
    'views/list'
], function (Dep) {

    return Dep.extend({

        // Что это: überschreibt den Klick auf den Standard-"Erstellen"-Button —
        // öffnet statt des generischen Create-Formulars unseren Wizard (Lieferant wählen ->
        // passende Eingangsrechnungen ankreuzen -> Bankkonto -> alles andere füllt sich automatisch).
        actionCreate: function () {
            this.createView('zahlungsavisErstellenModal', 'custom:views/c-zahlungsavis/modals/erstellen', {}, (view) => {
                view.render();
                this.listenToOnce(view, 'zahlungsavis-erstellt', () => {
                    this.collection.fetch();
                });
            });
        }

    });
});
