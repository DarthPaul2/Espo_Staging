// client/custom/src/views/c-servicevorgang/fields/wartungshinweis.js
// Что это:
// Rein informativer Hinweistext im Panel "Wartungsmangel" (16.09.2026, auf Pavels Wunsch) —
// kein echtes Datenfeld (notStorable), erklärt an Ort und Stelle, dass für den normalen
// Wartungsablauf kein Servicevorgang nötig ist, sondern nur bei einem gefundenen Mangel.
// Text kommt aus i18n (messages), damit er sprachabhängig korrekt angezeigt wird, analog zu
// den Feld-Tooltips derselben Entity. WICHTIG: sowohl detail- als auch edit-Template auf
// denselben reinen Anzeigetext gesetzt — sonst würde der Edit-Modus (Erstellen/Bearbeiten)
// auf das Standard-Textfeld-Template zurückfallen und ein leeres, editierbares Feld zeigen.

define('custom:views/c-servicevorgang/fields/wartungshinweis', 'views/fields/base', function (Dep) {

    const template = '<div style="border: 2px solid #c0392b; border-radius: 4px; padding: 8px 12px; ' +
        'color: #000; line-height:1.6;">{{{hinweisText}}}</div>';

    return Dep.extend({

        detailTemplateContent: template,
        editTemplateContent: template,
        listTemplateContent: template,

        data: function () {
            const data = Dep.prototype.data.call(this);
            data.hinweisText = this.translate('wartungshinweis', 'messages', 'CServicevorgang');
            return data;
        },

        fetch: function () {
            return {};
        }

    });
});
