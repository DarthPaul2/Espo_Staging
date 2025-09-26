console.log('[CUSTOM date.js] loaded');

define('custom:views/fields/date', ['views/fields/date'], function (Dep) {
    return Dep.extend({

        getDateStringValue: function () {
            const value = this.model.get(this.name);
            if (!value) return '';
            // всегда абсолютная дата в формате DD.MM.YYYY
            return this.getDateTime().toMoment(value).format('DD.MM.YYYY');
        }

    });
});
