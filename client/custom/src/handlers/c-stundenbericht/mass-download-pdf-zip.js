define('custom:handlers/c-stundenbericht/mass-download-pdf-zip', [], function () {

    function Handler(view) {
        this.view = view;
    }

    Handler.prototype.actionDownloadPdfZip = function (data) {

        const params = (data && data.params) ? data.params : {};
        const ids = params.ids || [];

        if (!Array.isArray(ids) || !ids.length) {
            Espo.Ui.warning('Bitte zuerst Stundenberichte auswählen.');
            return;
        }

        Espo.Ui.notify('ZIP wird erstellt…', 'loading');
        const notifyId = Espo.Ui.lastNotifyId;

        // Важно: прямой API URL (Espo.Ajax тут не используем)
        let basePath = this.view.getBasePath ? this.view.getBasePath() : '';
        if (!basePath.endsWith('/')) basePath += '/';
        const url = basePath + 'api/v1/CStundenbericht/action/downloadPdfZip';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ ids: ids })
        })
            .then(async (resp) => {
                if (!resp.ok) {
                    const text = await resp.text().catch(() => '');
                    throw new Error('HTTP ' + resp.status + ' ' + text);
                }
                return resp.blob();
            })
            .then((blob) => {
                Espo.Ui.notify(false, 'loading', notifyId);

                const dlUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = 'stundenberichte.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(dlUrl), 2000);
            })
            .catch((e) => {
                Espo.Ui.notify(false, 'loading', notifyId);
                Espo.Ui.error('Fehler beim Erstellen des ZIP.');
                console.error(e);
            });
    };

    return Handler;
});
