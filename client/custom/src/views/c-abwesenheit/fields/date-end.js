define('custom:views/c-abwesenheit/fields/date-end', ['views/fields/datetime-optional'], function (Dep) {
    return Dep.extend({
        getStartDateForDatePicker: function () {
            return null;
        }
    });
});
