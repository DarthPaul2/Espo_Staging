// custom:c-brief/record/detail
console.log('[LOAD] custom:views/c-brief/record/detail');

define('custom:views/c-brief/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        // ✅ ПОДСТАВЬ СВОЙ URL (как у Stundenbericht)
        // Если у тебя brief-роут в Flask: /api/brief/<id>/save_pdf
        // то оставляй так:
        FLASK_BASE: 'https://klesec.pagekite.me/api',

        setup: function () {
            Dep.prototype.setup.call(this);

            // кнопка вверху
            this.buttonList = this.buttonList || [];
            this.buttonList.push({
                name: 'createPdf',
                label: 'PDF erstellen',
                style: 'primary',
                title: 'PDF erstellen'
            });
        },

        actionCreatePdf: function () {
            const id = this.model.id;

            if (!id) {
                Espo.Ui.error('Kein Datensatz-ID.');
                return;
            }

            const url = this.FLASK_BASE + '/brief/' + encodeURIComponent(id) + '/save_pdf';

            const notifyId = this.notify('PDF wird erzeugt…', 'loading');

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})   // override пока не нужен
            })
                .then(async (r) => {
                    const resp = await r.json().catch(() => null);

                    this.notify(false, 'loading', notifyId);

                    if (!r.ok || !resp) {
                        Espo.Ui.error('PDF Fehler (HTTP ' + r.status + ')');
                        return;
                    }

                    const pdfUrl = resp.pdfUrl || resp.file;
                    if (!pdfUrl) {
                        Espo.Ui.error('PDF-URL fehlt in der Antwort.');
                        console.log('Response:', resp);
                        return;
                    }

                    // записываем pdfUrl в поле и сохраняем
                    this.model.set('pdfUrl', pdfUrl);

                    // если хочешь: автоматически Final
                    // this.model.set('status', 'Final');

                    this.model.save().then(() => {
                        Espo.Ui.success('PDF erstellt');
                        window.open(pdfUrl, '_blank');
                        this.model.fetch(); // обновить карточку
                    });

                })
                .catch((err) => {
                    this.notify(false, 'loading', notifyId);
                    Espo.Ui.error('Serverfehler beim PDF-Erzeugen');
                    console.error(err);
                });
        }

    });

});
