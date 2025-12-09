Espo.define('custom:views/c-material/record/detail', 'views/record/detail', function (Dep) {

    return Dep.extend({

        // базовый URL к Flask
        FLASK_BASE: 'https://klesec.pagekite.me/api',

        setup: function () {
            Dep.prototype.setup.call(this);

            // Кнопка "Etikett drucken"
            this.addButton({
                name: 'printLabel',
                label: 'Etikett drucken',
                style: 'default',
                acl: 'read'
            });
        },

        // Обработчик нажатия на кнопку
        actionPrintLabel: function () {
            var barcode = this.model.get('barcode');

            if (!barcode) {
                Espo.Ui.error('Kein Barcode im Material.');
                return;
            }

            // URL Flask-бэкенда, который вернёт PDF этикетки
            var url = this.FLASK_BASE + '/materials/' + encodeURIComponent(barcode) + '/label';

            // Открываем в новой вкладке – дальше обычное окно печати
            window.open(url, '_blank');
        }

    });
});
