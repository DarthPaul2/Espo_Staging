console.log('[CUSTOM datetime.js] loaded');

define('custom:views/fields/datetime', ['views/fields/datetime', 'moment'], function (Dep, moment) {

    // === Глобальный патч moment ===
    (function patchMoment() {
        try {
            if (moment && moment.updateLocale) {
                moment.updateLocale('de', {
                    calendar: {
                        sameDay: 'DD.MM.YYYY HH:mm',
                        nextDay: 'DD.MM.YYYY HH:mm',
                        nextWeek: 'DD.MM.YYYY HH:mm',
                        lastDay: 'DD.MM.YYYY HH:mm',
                        lastWeek: 'DD.MM.YYYY HH:mm',
                        sameElse: 'DD.MM.YYYY HH:mm'
                    },
                    longDateFormat: {
                        LT: 'HH:mm',
                        LTS: 'HH:mm:ss',
                        L: 'DD.MM.YYYY',
                        LL: 'DD.MM.YYYY',
                        LLL: 'DD.MM.YYYY HH:mm',
                        LLLL: 'DD.MM.YYYY HH:mm'
                    }
                });
                console.log('[CUSTOM datetime.js] patched moment.updateLocale → absolute + German format');
            }
        } catch (e) {
            console.error('[CUSTOM datetime.js] moment patch failed', e);
        }
    })();

    return Dep.extend({
        getDateTimeStringValue: function () {
            const v = this.model.get(this.name);
            if (!v) return '';
            return this.getDateTime().toMoment(v).format('DD.MM.YYYY HH:mm');
        },

        formatDateTime: function (value) {
            if (!value) return '';
            return this.getDateTime().toMoment(value).format('DD.MM.YYYY HH:mm');
        },

        getValueForList: function () {
            const v = this.model.get(this.name);
            if (!v) return '';
            return this.getDateTime().toMoment(v).format('DD.MM.YYYY HH:mm');
        },

        getValueForDisplay: function () {
            const v = this.model.get(this.name);
            if (!v) return '';
            return this.getDateTime().toMoment(v).format('DD.MM.YYYY HH:mm');
        },

        data: function () {
            const data = Dep.prototype.data.call(this);
            const v = this.model.get(this.name);
            data.value = v ? this.getDateTime().toMoment(v).format('DD.MM.YYYY HH:mm') : '';
            return data;
        },
    });
});
