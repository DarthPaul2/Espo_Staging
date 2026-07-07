define('custom:views/calendar/calendar', ['crm:views/calendar/calendar'], function (Dep) {

    return Dep.extend({

        convertToFcEvent: function (o) {
            const event = Dep.prototype.convertToFcEvent.call(this, o);

            if (o.scope === 'CAbwesenheit' && o.calendarTitle) {
                event.title = o.calendarTitle;
            }

            return event;
        },

        getCalendarOptions: function () {
            const options = Dep.prototype.getCalendarOptions.call(this);

            const origTransform = options.eventDataTransform;

            options.eventDataTransform = function (eventData) {
                if (typeof origTransform === 'function') {
                    eventData = origTransform(eventData) || eventData;
                }

                try {
                    const isTask =
                        eventData &&
                        (eventData.scope === 'Task' ||
                            eventData.entityType === 'Task' ||
                            eventData.type === 'Task');

                    if (!isTask) return eventData;

                    const startRaw =
                        eventData.dateStartDate || eventData.dateStart ||
                        eventData.startDate || eventData.start;

                    const endRaw =
                        eventData.dateEndDate || eventData.dateEnd ||
                        eventData.dateDueDate || eventData.dateDue ||
                        eventData.endDate || eventData.end;

                    if (startRaw && endRaw && window.moment) {
                        eventData.start = moment(startRaw).format();
                        eventData.end = moment(endRaw).add(1, 'days').format();
                        eventData.allDay = true;
                    }
                } catch (e) { }

                return eventData;
            };

            return options;
        }

    });
});
