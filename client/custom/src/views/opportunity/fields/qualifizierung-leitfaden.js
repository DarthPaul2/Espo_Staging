// client/custom/src/views/opportunity/fields/qualifizierung-leitfaden.js
// Что это:
// AW-Bianca-Gerd Punkt 10 (19.09.2026): "der entsprechende Telefonleitfaden direkt verfügbar".
// Rein informativer Hinweistext im Panel "Qualifizierung" — kein echtes Datenfeld (notStorable),
// zeigt die im Prozess P-03 (Tobias und ChatGPT.txt, Zeilen 8285-8968, von Tobias am 05.09.2026
// fachlich freigegeben) festgelegten Qualifizierungskriterien direkt am Formular.
// Gleiches Muster wie custom:views/c-servicevorgang/fields/wartungshinweis.

define('custom:views/opportunity/fields/qualifizierung-leitfaden', 'views/fields/base', function (Dep) {

    const template = '<div style="border: 1px solid #a8c5da; border-radius: 4px; padding: 8px 12px; ' +
        'background: #f4f9fc; color: #000; line-height:1.6;">{{{hinweisText}}}</div>';

    return Dep.extend({

        detailTemplateContent: template,
        editTemplateContent: template,
        listTemplateContent: template,

        data: function () {
            const data = Dep.prototype.data.call(this);
            data.hinweisText = this.translate('qualifizierungLeitfaden', 'messages', 'Opportunity');
            return data;
        },

        fetch: function () {
            return {};
        }

    });
});
