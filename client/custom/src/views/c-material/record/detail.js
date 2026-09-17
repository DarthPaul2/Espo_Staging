Espo.define('custom:views/c-material/record/detail', 'views/record/detail', function (Dep) {

    return Dep.extend({

        // 17.09.2026, Pavel: beim Speichern mit leerem Pflichtfeld zeigt Espo nur ganz oben
        // ein generisches "Ungültig"-Banner - die eigentliche Meldung existiert bereits als
        // Popover direkt am betroffenen Feld, ist aber unsichtbar, wenn der Nutzer weiter
        // oben im Formular steht. Rein additiv (Dep.prototype.afterNotValid laeuft zuerst
        // unveraendert) - scrollt zusaetzlich zum sichtbar gewordenen Popover.
        afterNotValid: function () {
            Dep.prototype.afterNotValid.call(this);

            setTimeout(() => {
                const popovers = document.querySelectorAll('.popover');
                const popover = popovers.length ? popovers[popovers.length - 1] : null;

                if (popover) {
                    popover.scrollIntoView({behavior: 'smooth', block: 'center'});
                }
            }, 50);
        },

        FLASK_BASE: 'https://klesec.pagekite.me/api',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.addButton({
                name: 'printLabel',
                label: 'Etikett drucken',
                style: 'default',
                acl: 'read'
            });
        },

        actionPrintLabel: function () {
            var barcode = this.model.get('barcode');
            var name = this.model.get('name') || '';

            if (!barcode) {
                Espo.Ui.error('Kein Barcode im Material.');
                return;
            }

            var url = this.FLASK_BASE
                + '/materials/label?barcode=' + encodeURIComponent(barcode)
                + '&name=' + encodeURIComponent(name);

            window.open(url, '_blank');
        }

    });
});
