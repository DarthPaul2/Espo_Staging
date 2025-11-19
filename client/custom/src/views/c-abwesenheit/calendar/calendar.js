define('custom:views/c-abwesenheit/calendar/calendar', ['views/meeting/calendar/calendar'], function (Base) {

    return Base.extend({

        buildEventObject: function (model) {
            let ev = Base.prototype.buildEventObject.call(this, model);

            const name = model.get('name') || '';
            const typ = model.get('typ') || '';

            // Человекочитаемая метка (если есть перевод)
            const typLabel = this.getLanguage().translateOption(typ, 'typ', 'CAbwesenheit') || typ;

            ev.title = name && typLabel ? (name + ' - ' + typLabel) : name;

            return ev;
        }

    });
});
