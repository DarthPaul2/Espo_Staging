// custom:views/c-zahlungsavis/fields/pdf-url
define('custom:views/c-zahlungsavis/fields/pdf-url', [
    'views/fields/url'
], function (Dep) {

    return Dep.extend({

        // Что это: zeigt statt der vollen URL nur einen kurzen Hinweistext an —
        // der Link (href) bleibt über getUrl() unverändert funktionsfähig.
        getValueForDisplay: function () {
            return this.model.get(this.name) ? 'Zahlungsavis gespeichert' : null;
        }

    });
});
