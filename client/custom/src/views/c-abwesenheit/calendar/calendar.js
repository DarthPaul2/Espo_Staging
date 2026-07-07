define('custom:views/c-abwesenheit/calendar/calendar', ['views/meeting/calendar/calendar'], function (Base) {

    return Base.extend({

        buildEventObject: function (model) {
            let ev = Base.prototype.buildEventObject.call(this, model);
            console.log('[CAbwesenheit calendar] model attributes:', JSON.parse(JSON.stringify(model.attributes || {})));
            console.log('[CAbwesenheit calendar] ev.title:', ev.title);
            ev.title = model.get('calendarTitle') || model.get('name') || '';
            return ev;
        }

    });

});
