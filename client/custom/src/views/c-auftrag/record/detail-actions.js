console.log('>>> CAUFTRAG DETAIL-ACTIONS CUSTOM LOADED <<<');

define('custom:views/c-auftrag/record/detail-actions', ['views/record/detail-actions'], function (Dep) {
    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);

            this.actionList = [
                { name: 'edit' },
                { name: 'remove' },
                { name: 'pdfSave', label: 'Auftragsbestätigung erzeugen', style: 'primary' },
                { name: 'sendConfirmation', label: 'Auftragsbestätigung senden', style: 'default' },
                { name: 'recalc', label: 'Summen aktualisieren', style: 'default' }
            ];
        }
    });
});
