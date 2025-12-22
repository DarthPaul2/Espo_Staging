define('custom:views/calendar/calendar', ['views/calendar'], function (Dep) {

    console.log('[CUSTOM CALENDAR] loaded');

    return Dep.extend({

        getCalendarOptions: function () {
            const options = Dep.prototype.getCalendarOptions.call(this);

            const origTransform = options.eventDataTransform;

            options.eventDataTransform = function (eventData) {
                if (eventData && (eventData.scope === 'Task' || eventData.entityType === 'Task')) {
                    console.log('[TASK EVENTDATA RAW]', JSON.parse(JSON.stringify(eventData)));
                }
                // сохраним стандартное поведение Espo
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

                    // Espo может отдавать разные поля. Берём всё, что похоже на старт/финиш.
                    const startRaw =
                        eventData.dateStartDate || eventData.dateStart ||
                        eventData.startDate || eventData.start;

                    const endRaw =
                        eventData.dateEndDate || eventData.dateEnd ||
                        eventData.dateDueDate || eventData.dateDue ||
                        eventData.endDate || eventData.end;

                    if (startRaw && endRaw && window.moment) {
                        // FullCalendar: end — EXCLUSIVE, поэтому +1 день
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
