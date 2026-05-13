// custom:views/c-bankbewegung/record/detail
// Что это:
// Custom Detail View für CBankbewegung.
//
// Зачем:
// Добавляет fachliche Aktion "Zahlung vorbereiten".
// На первом шаге кнопка делает только Vorprüfung и ничего не создаёт.

console.log('[LOAD] custom:views/c-bankbewegung/record/detail');

define('custom:views/c-bankbewegung/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Что это:
            // Добавляем кнопку в Detail View через buttonList.
            //
            // Зачем:
            // В этой Espo-Version addMenuItem() недоступен,
            // поэтому используем стандартный рабочий механизм buttonList.
            this.buttonList = this.buttonList || [];

            this.buttonList.push({
                name: 'zahlungVorbereiten',
                label: 'Zahlung vorbereiten',
                style: 'primary',
                acl: 'edit',
                action: 'zahlungVorbereiten'
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            // Что это:
            // Обновляет видимость кнопки "Zahlung vorbereiten".
            //
            // Зачем:
            // Кнопка должна быть доступна только для Bankbewegungen,
            // которые ещё не имеют Zahlung и ещё не gebucht / ignoriert / nicht relevant.
            this.updateZahlungVorbereitenButton_();

            this.listenTo(this.model, 'sync change:zahlungId change:status change:abstimmungsstatus', () => {
                this.updateZahlungVorbereitenButton_();
            });
        },

        actionZahlungVorbereiten: function () {

            if (!this.shouldShowZahlungVorbereitenButton_()) {
                this.notify('Für diese Bankbewegung kann keine neue Zahlung vorbereitet werden.', 'warning');
                return;
            }
            const id = this.model.id;

            if (!id) {
                this.notify('Keine Bankbewegung geladen.', 'error');
                return;
            }

            this.notify('Prüfe Bankbewegung...', 'info');

            Espo.Ajax.postRequest('CBankbewegung/action/zahlungVorbereitenPruefen', {
                id: id
            }).then((result) => {
                this.showZahlungVorbereitenPruefung_(result);
            }).catch((xhr) => {
                console.error('[CBankbewegung] Zahlung vorbereiten Prüfung failed', xhr);
                this.notify('Fehler bei der Prüfung.', 'error');
            });
        },

        showZahlungVorbereitenPruefung_: function (result) {
            if (!result) {
                this.notify('Keine Antwort vom Server.', 'error');
                return;
            }

            const warnings = result.warnings || [];
            const errors = result.errors || [];
            const v = result.vorschlag || {};
            const b = result.bankbewegung || {};

            let message = '';

            message += 'Bankbewegung: ' + (b.name || '-') + '\n';
            message += 'Betrag: ' + this.formatCurrency_(v.betrag || 0) + '\n';
            message += 'Richtung: ' + this.formatRichtung_(v.richtung) + '\n';
            message += 'Zahlungsdatum: ' + (v.zahlungsdatum || '-') + '\n';

            if (v.belegTyp) {
                message += 'Beleg: ' + v.belegTyp + ' / ' + (v.belegName || v.belegId || '-') + '\n';
            } else {
                message += 'Beleg: keiner verknüpft\n';
            }

            if (warnings.length) {
                message += '\nWarnungen:\n- ' + warnings.join('\n- ') + '\n';
            }

            if (errors.length) {
                message += '\nFehler:\n- ' + errors.join('\n- ') + '\n';
                this.notify(message, 'error');
                return;
            }

            message += '\nPrüfung erfolgreich. Soll jetzt eine CZahlung im Entwurf erstellt werden?';

            if (!window.confirm(message)) {
                this.notify('Zahlungserstellung abgebrochen.', 'info');
                return;
            }

            this.createZahlungAusBankbewegung_();
        },

        createZahlungAusBankbewegung_: function () {
            const id = this.model.id;

            if (!id) {
                this.notify('Keine Bankbewegung geladen.', 'error');
                return;
            }

            this.notify('Erstelle CZahlung im Entwurf...', 'info');

            Espo.Ajax.postRequest('CBankbewegung/action/zahlungAusBankbewegungErstellen', {
                id: id
            }).then((result) => {
                if (!result || !result.success) {
                    const errors = result && result.errors ? result.errors : ['Unbekannter Fehler.'];
                    this.notify('Zahlung konnte nicht erstellt werden:\n' + errors.join('\n'), 'error');
                    return;
                }

                const zahlung = result.zahlung || {};
                const zahlungId = zahlung.id || null;
                const zahlungsnummer = zahlung.zahlungsnummer || zahlung.name || 'Zahlung';

                this.notify('CZahlung im Entwurf erstellt: ' + zahlungsnummer, 'success');

                this.model.fetch();

                if (zahlungId) {
                    window.setTimeout(() => {
                        window.location.hash = '#CZahlung/view/' + zahlungId;
                    }, 500);
                }
            }).catch((xhr) => {
                console.error('[CBankbewegung] Zahlung erstellen failed', xhr);
                this.notify('Fehler beim Erstellen der CZahlung.', 'error');
            });
        },

        // Что это:
        // Проверяет, можно ли показывать кнопку "Zahlung vorbereiten".
        //
        // Зачем:
        // Gebuchte, ignorierte oder bereits mit Zahlung verknüpfte Bankbewegungen
        // dürfen nicht erneut in eine Zahlung vorbereitet werden.
        shouldShowZahlungVorbereitenButton_: function () {
            const zahlungId = this.model.get('zahlungId');
            const status = this.model.get('status');
            const abstimmungsstatus = this.model.get('abstimmungsstatus');

            if (zahlungId) {
                return false;
            }

            if (status === 'ignoriert') {
                return false;
            }

            if (abstimmungsstatus === 'nicht_relevant') {
                return false;
            }

            if (abstimmungsstatus === 'gebucht') {
                return false;
            }

            return true;
        },

        // Что это:
        // Показывает или скрывает кнопку "Zahlung vorbereiten".
        //
        // Зачем:
        // Чтобы пользователь сразу видел, можно ли из этой Bankbewegung создавать Zahlung.
        updateZahlungVorbereitenButton_: function () {
            const shouldShow = this.shouldShowZahlungVorbereitenButton_();

            const apply = () => {
                const $button = this.$el.find('[data-action="zahlungVorbereiten"]');

                if (shouldShow) {
                    $button.show();
                    $button.closest('li').show();
                } else {
                    $button.hide();
                    $button.closest('li').hide();
                }
            };

            apply();
            window.requestAnimationFrame(apply);
            setTimeout(apply, 100);
        },

        formatRichtung_: function (value) {
            if (value === 'eingang') return 'Eingang';
            if (value === 'ausgang') return 'Ausgang';
            return value || '-';
        },

        formatCurrency_: function (value) {
            let number = Number(value || 0);

            if (Math.abs(number) < 0.005) {
                number = 0;
            }

            return number.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + ' €';
        }
    });
});