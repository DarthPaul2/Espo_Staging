// Что это:
// Custom Detail View для CBuchungsjournal.
//
// Зачем:
// Phase 7A.2: добавляет пояснительный Hinweisblock к Buchungsjournal,
// чтобы бухгалтеру было понятно, как читать Soll/Haben и Storno.

define('custom:views/c-buchungsjournal/record/detail', ['views/record/detail'], function (Dep) {
    return Dep.extend({

        afterRender() {
            Dep.prototype.afterRender.call(this);

            const run = () => {
                this.ensureStyles_();
                this.renderBuchungsjournalHint_();
                this.decorateJournalStatus_();
            };

            run();
            window.requestAnimationFrame(run);
            setTimeout(run, 100);
        },

        // Что это:
        // Добавляет Hinweisbox над Detail-Formular.
        //
        // Зачем:
        // Объясняет бухгалтерскую Darstellung без изменения Buchungslogik.
        renderBuchungsjournalHint_() {
            if (this.$el.find('.kb-bj-hint-box').length) {
                return;
            }

            const html = `
                <div class="kb-bj-hint-box">
                    <div class="kb-bj-hint-title">
                        Buchungsjournal lesen
                    </div>
                    <div class="kb-bj-hint-text">
                        <b>Soll</b> und <b>Haben</b> werden aus den einzelnen Buchungen gebildet:
                        <span class="kb-bj-chip">debit = Soll</span>
                        <span class="kb-bj-chip">credit = Haben</span>
                        Erlöskonten und Umsatzsteuer stehen typischerweise im Haben.
                        Storno-Buchungen werden gesondert markiert, bleiben aber Bestandteil der Salden.
                    </div>
                </div>
            `;

            const $target = this.$el.find('.record').first();

            if ($target.length) {
                $target.before(html);
                return;
            }

            this.$el.prepend(html);
        },

        // Что это:
        // Показывает статус Journal как отдельный аккуратный Badge.
        //
        // Зачем:
        // В Buchhaltung важно сразу видеть, что Journal уже festgeschrieben ist,
        // но Badge не должен смешиваться с пояснительным текстом Soll/Haben.
        decorateJournalStatus_() {
            const status = this.model ? this.model.get('buchhaltungStatus') : null;

            if (status !== 'festgeschrieben') {
                return;
            }

            if (this.$el.find('.kb-bj-status-line').length) {
                return;
            }

            const html = `
                <div class="kb-bj-status-line">
                    <span class="kb-bj-status-badge">
                        FESTGESCHRIEBEN
                    </span>
                </div>
            `;

            const $hint = this.$el.find('.kb-bj-hint-box').first();

            if ($hint.length) {
                $hint.append(html);
            }
        },

        // Что это:
        // CSS для Hinweisbox и Status-Badge.
        //
        // Зачем:
        // Чтобы блок выглядел аккуратно без отдельного CSS-файла.
        ensureStyles_() {
            if (document.getElementById('kb-buchungsjournal-detail-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'kb-buchungsjournal-detail-styles';

            style.textContent = `
                .kb-bj-hint-box {
                    margin: 0 0 14px 0;
                    padding: 12px 14px;
                    border-left: 4px solid #2563eb;
                    border-radius: 8px;
                    background: #eff6ff;
                    color: #1e3a8a;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .kb-bj-hint-title {
                    font-weight: 700;
                    margin-bottom: 5px;
                    font-size: 14px;
                }

                .kb-bj-hint-text {
                    font-size: 13px;
                    line-height: 1.45;
                    white-space: normal;
                    overflow-wrap: anywhere;
                    max-width: 100%;
                }

                .kb-bj-chip {
                    display: inline-block;
                    margin: 2px 4px;
                    padding: 2px 7px;
                    border-radius: 999px;
                    background: #dbeafe;
                    color: #1d4ed8;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .kb-bj-status-line {
                    margin-top: 8px;
                }

                .kb-bj-status-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 999px;
                    background: #dcfce7;
                    color: #166534;
                    font-size: 11px;
                    font-weight: 700;
                    vertical-align: middle;
                    letter-spacing: 0.04em;
                }
            `;

            document.head.appendChild(style);
        }

    });
});