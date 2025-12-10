Espo.define('custom:views/c-werkzeug/record/detail', 'views/record/detail', function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Кнопка печати этикетки
            this.addButton({
                name: 'printLabel',
                label: 'Etikett drucken',
                style: 'default',
                acl: 'read'
            });
        },

        actionPrintLabel: function () {
            var barcode = this.model.get('barcode') || '';
            var name = this.model.get('name') || '';

            if (!barcode) {
                Espo.Ui.error('Kein Barcode vorhanden.');
                return;
            }

            // Тот же Flask-маршрут, что и для материалов
            var url = 'https://klesec.pagekite.me/api/materials/label'
                + '?barcode=' + encodeURIComponent(barcode)
                + '&name=' + encodeURIComponent(name);

            window.open(url, '_blank');
        }

    });
});
