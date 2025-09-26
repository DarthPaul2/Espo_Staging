// client/custom/src/views/c-auftrag/record/detail.js
console.log('[LOAD] custom:views/c-auftrag/record/detail');

define('custom:views/c-auftrag/record/detail', ['views/record/detail'], function (Dep) {

    const LOG = (t, p) => { try { console.log('[CAuftrag/detail]', t, p || ''); } catch (e) { } };

    // --- один раз за сессию
    window.__CAUF_RELOADING__ = false;
    window.__CAUF_RELOAD_ARMED__ = false;

    return Dep.extend({

        FLASK_BASE: 'https://klesec.pagekite.me/api',
        BASIC_AUTH: 'Basic ' + btoa('admin:test123'),

        setup: function () {
            Dep.prototype.setup.call(this);
            LOG('Dep.prototype.setup.call(this) ausgeführt');

            // ===== DOM-watcher для панели "Angebots" с «arm→fire» =====
            (function installAngebotsWatcher(self) {
                if (self.__angebotsWatcherInstalled) return;
                self.__angebotsWatcherInstalled = true;

                const SEL_PANEL = '[data-name="angebots"], [data-link="angebots"], .panel[data-name="angebots"], .panel[data-link="angebots"]';

                const findPanelEl = () => {
                    const root = self.$el && self.$el.get && self.$el.get(0);
                    if (!root) return null;
                    return root.querySelector(SEL_PANEL);
                };

                const findListTarget = (panelEl) =>
                    panelEl.querySelector('.list-container') ||
                    panelEl.querySelector('.list') ||
                    panelEl.querySelector('table') ||
                    panelEl;

                const HARD_RELOAD_ONCE = (reason) => {
                    if (window.__CAUF_RELOADING__) return;
                    window.__CAUF_RELOADING__ = true;
                    console.log('[CAuftrag/detail] 🔁 HARD RELOAD (once) in 250 ms →', reason);
                    setTimeout(() => {
                        try { window.location.reload(); }
                        catch (e) { window.location.href = window.location.href; }
                    }, 250);
                };

                function installObserver(panelEl) {
                    const target = findListTarget(panelEl);
                    if (!target) {
                        console.warn('[CAuftrag/detail] ⚠️ Angebots target not found inside panel');
                        return;
                    }

                    // «армирование» — клик по кнопкам/экшенам панели
                    const armIfActionClick = (ev) => {
                        const a = ev.target.closest('[data-action], .action');
                        if (!a) return;
                        const act = (a.getAttribute('data-action') || a.getAttribute('action') || a.dataset?.action || '').toLowerCase();
                        // всё, что похоже на relate/unrelate/select/create
                        if (/(link|relate|unlink|unrelate|selectrelated|createrelated)/i.test(act)) {
                            window.__CAUF_RELOAD_ARMED__ = true;
                            console.log('[CAuftrag/detail] 🟡 ARMED by click:', act);
                        }
                    };
                    panelEl.addEventListener('click', armIfActionClick, true);

                    // посчёт строк (игнорируем .no-data)
                    const rowCount = () => {
                        const tb = target.querySelector('tbody');
                        const base = tb || target;
                        return [...base.querySelectorAll('tr')].filter(tr => !tr.classList.contains('no-data')).length;
                    };

                    let last = rowCount();
                    console.log('[CAuftrag/detail] 👀 Beobachte Angebots-Panel; rows(init)=', last);

                    // наблюдаем изменения DOM
                    const obs = new MutationObserver(() => {
                        if (window.__CAUF_RELOADING__) return;             // уже перезагружаемся
                        if (!window.__CAUF_RELOAD_ARMED__) return;         // не «вооружены» — игнорим первичную отрисовку

                        const cur = rowCount();
                        if (cur !== last) {
                            console.log('[CAuftrag/detail] 🔔 Angebots rows changed:', { from: last, to: cur });
                            last = cur;
                            // разгружаем наблюдателей и жёстко перезагружаем страницу один раз
                            try { obs.disconnect(); } catch (e) { }
                            panelEl.removeEventListener('click', armIfActionClick, true);
                            HARD_RELOAD_ONCE('angebots rows changed after armed');
                        }
                    });

                    obs.observe(target, { childList: true, subtree: true });

                    // уборка
                    self.once('remove', () => {
                        try { obs.disconnect(); } catch (e) { }
                        panelEl.removeEventListener('click', armIfActionClick, true);
                    });
                }

                // ждём появления DOM панели
                let tries = 0, maxTries = 60;
                const timer = setInterval(() => {
                    const el = findPanelEl();
                    if (el) {
                        clearInterval(timer);
                        console.log('[CAuftrag/detail] ✅ Angebots-Panel DOM gefunden');
                        installObserver(el);
                    } else if (++tries >= maxTries) {
                        clearInterval(timer);
                        console.warn('[CAuftrag/detail] ❌ Angebots-Panel DOM nicht gefunden (timeout)');
                    }
                }, 100);
            })(this);

            // ---------- кнопки ----------
            this.buttonList = this.buttonList || [];
            this.buttonList = this.buttonList.filter(b => b.name !== 'pdfSave');
            this.buttonList.push(
                { name: 'recalc', label: 'Summen aktualisieren', style: 'default', action: 'recalc' },
                { name: 'pdfSave', label: 'Auftragsbestätigung erzeugen', style: 'primary', action: 'pdfSave' },
                { name: 'sendConfirmation', label: 'Auftragsbestätigung senden', style: 'default', action: 'sendConfirmation' }
            );
            LOG('buttons:init', this.buttonList);

            // ---------- утилиты ----------
            const bump = () => {
                const f = n => this.getFieldView && this.getFieldView(n);
                ['betragNetto', 'betragBrutto', 'verrechnetNetto', 'verrechnetBrutto'].forEach(name => {
                    const fv = f(name);
                    if (fv && fv.setValue) {
                        fv.setValue(this.model.get(name) || 0, { render: true, fromModel: true });
                    }
                });
            };

            const hardRefresh = () => {
                this.model.fetch({
                    success: () => { this.reRender(); setTimeout(bump, 0); },
                    error: (xhr) => LOG('hardRefresh:error', { status: xhr?.status })
                });
            };

            const recalcOnServer = () => {
                const id = this.model.id;
                if (!id) return;
                $.ajax({
                    url: `${this.FLASK_BASE}/auftrag/${encodeURIComponent(id)}/recalc_totals`,
                    method: 'POST',
                    success: () => { hardRefresh(); },
                    error: (xhr) => {
                        this.notify('Fehler beim Neuberechnen.', 'error');
                        LOG('recalc:error', { status: xhr?.status, text: xhr?.responseText });
                    }
                });
            };
            this._recalcOnServer = recalcOnServer;

            // первый рендер
            this.once('after:render', () => { bump(); this._applyPdfLinkLabel(); }, this);

            // лёгкий перерис при изменении сумм
            this.listenTo(this.model, 'change:betragNetto change:betragBrutto change:verrechnetNetto change:verrechnetBrutto', () => {
                setTimeout(() => this.reRender(), 0);
            });

            // обновить подпись ссылки PDF
            this.listenTo(this.model, 'change:pdfUrl', () => {
                setTimeout(() => this._applyPdfLinkLabel(), 0);
            });
        },

        // ======================== actions ========================
        actionRecalc: function () {
            const id = this.model.id;
            if (!id) return;
            const notifyId = this.notify('Wird aktualisiert…', 'loading');
            $.ajax({
                url: `${this.FLASK_BASE}/auftrag/${encodeURIComponent(id)}/recalc_totals`,
                method: 'POST',
                success: () => { this.notify(false, 'loading', notifyId); this.model.fetch({ success: () => this.reRender() }); },
                error: () => { this.notify(false, 'loading', notifyId); this.notify('Fehler beim Aktualisieren', 'error'); }
            });
        },

        actionPdfSave: function () {
            const espoId = this.model.id;
            if (!espoId) return;

            const notifyId = this.notify('PDF wird erzeugt und gespeichert…', 'loading');

            const payload = {
                id: this.model.id,
                titel: 'AUFTRAGSBESTÄTIGUNG',
                einleitung: `Sehr geehrte Damen und Herren,

wir bedanken uns für die Erteilung Ihres Auftrages und bestätigen hiermit den Eingang sowie die Annahme.  
Nachfolgend erhalten Sie die Auftragsbestätigung mit den vereinbarten Leistungen und Konditionen.  

Sollten Sie Rückfragen oder Änderungswünsche haben, steht Ihnen Ihr persönlicher Ansprechpartner jederzeit gerne zur Verfügung:

Ihr Ansprechpartner: Tobias Schiller  
E-Mail: schiller@klesec.de  
Tel.: 0171 6969930  

Bitte richten Sie weitere Korrespondenz zu diesem Auftrag ebenfalls an: schiller@klesec.de  

Die Auftragsbestätigung umfasst die nachstehenden Positionen sowie die aufgeführten Hinweise.`,
                bemerkung: `Wir freuen uns, Ihren Auftrag ausführen zu dürfen und sichern Ihnen eine fachgerechte und zuverlässige Umsetzung zu.  
Für Rückfragen oder weitere Abstimmungen stehen wir Ihnen selbstverständlich jederzeit gerne zur Verfügung.  

Vielen Dank für Ihr Vertrauen – auf eine erfolgreiche Zusammenarbeit!  

Ihr KleSec Team`,
                typ: 'auftrag'
            };

            const url = `${this.FLASK_BASE}/auftrag/${encodeURIComponent(espoId)}/save_pdf`;

            $.ajax({
                url,
                method: 'POST',
                contentType: 'application/json',
                headers: { 'Authorization': this.BASIC_AUTH },
                data: JSON.stringify(payload),
                success: (resp) => {
                    this.notify(false, 'loading', notifyId);
                    this.notify('PDF gespeichert.', 'success');
                    if (resp?.pdfUrl) {
                        this.model.save({ pdfUrl: resp.pdfUrl }, { success: () => this.reRender() });
                    }
                },
                error: (xhr) => {
                    this.notify(false, 'loading', notifyId);
                    this.notify('Fehler beim Speichern der PDF.', 'error');
                    LOG('pdfSave:error', { status: xhr?.status, text: xhr?.responseText });
                }
            });
        },

        // --- helpers: где взять фирму у заказа (account|firma|kunde) ---
        _getAccountRef: function () {
            const id = this.model.get('accountId') || this.model.get('firmaId') || this.model.get('kundeId');
            const name = this.model.get('accountName') || this.model.get('firmaName') || this.model.get('kundeName');
            if (!id) console.warn('[CAuftrag/detail] ⚠️ Keine Firmen-Referenz im Auftrag (accountId|firmaId|kundeId).');
            return { id, name, scope: 'Account' };
        },

        // --- helpers: открываем штатный композер с предзаполнением ---
        _openEspoEmailCompose: function (attrs) {
            // attrs: {to, cc, bcc, subject, body, isHtml, parentType, parentId, parentName}
            const viewName = this.getMetadata().get(['clientDefs', 'Email', 'modalViews', 'compose']) || 'views/modals/compose-email';

            const attributes = {
                // адреса
                to: attrs.to || '',                 // строка с адресами, ; как разделитель
                cc: attrs.cc || '',
                bcc: attrs.bcc || '',

                // тема/имя письма
                name: attrs.subject || '',
                subject: attrs.subject || '',

                // тело
                body: attrs.body || '',
                isHtml: attrs.isHtml !== false,

                // связь «Bezieht sich auf»
                parentType: attrs.parentType || null,
                parentId: attrs.parentId || null,
                parentName: attrs.parentName || null
            };

            // Открываем штатный модал, ПЕРЕДАЁМ attributes (НЕ model!)
            this.createView('composeEmail', viewName, {
                attributes,
                focusForCreate: true
            }, view => {
                console.log('[CAuftrag/detail] ✉️ Compose geöffnet für:', attributes);
                view.render();
            });
        },


        // ======================== actions ========================
        actionSendConfirmation: function () {
            const pdfUrl = this.model.get('pdfUrl');
            if (!pdfUrl) {
                this.notify('Kein PDF vorhanden.', 'error');
                return;
            }

            const ref = this._getAccountRef();
            if (!ref.id) {
                this.notify('Kein verknüpfter Kunde/Firma im Auftrag.', 'error');
                return;
            }

            this.notify('E-Mail-Entwurf wird vorbereitet…', 'loading');
            const notifyId = this.lastNotifyId;

            // === ВАЖНО: используем Espo.Ajax для API-запроса ===
            Espo.Ajax.getRequest(`Account/${encodeURIComponent(ref.id)}`).then((acc) => {
                let toEmail = acc && (acc.emailAddress || acc.emailAddressPrimary || '');
                if (!toEmail && Array.isArray(acc?.emailAddressData)) {
                    const primary = acc.emailAddressData.find(e => e.primary) || acc.emailAddressData[0];
                    toEmail = primary ? primary.emailAddress : '';
                }

                if (!toEmail) {
                    this.notify(false, 'loading', notifyId);
                    this.notify('Beim Kunden ist keine E-Mail-Adresse hinterlegt.', 'error');
                    console.warn('[CAuftrag/detail] ⚠️ Kunde ohne E-Mail:', acc);
                }

                const subject = `Auftragsbestätigung für ${ref.name || 'Kunde'}`.trim();
                const bodyHtml =
                    `Sehr geehrte Damen und Herren,<br><br>` +
                    `anbei erhalten Sie die Auftragsbestätigung zu Ihrem Auftrag.<br>` +
                    `Die Bestätigung können Sie hier einsehen: ` +
                    `<a href="${pdfUrl}" target="_blank" rel="noopener">${pdfUrl}</a><br><br>` +
                    `Mit freundlichen Grüßen<br>` +
                    `Ihr KleSec Team`;

                this.notify(false, 'loading', notifyId);

                // открыть композер
                this._openEspoEmailCompose({
                    to: toEmail || '',
                    subject,
                    body: bodyHtml,
                    isHtml: true,
                    parentType: ref.scope,
                    parentId: ref.id,
                    parentName: ref.name || ''
                });

            }).catch(err => {
                this.notify(false, 'loading', notifyId);
                this.notify('Kundendaten konnten nicht geladen werden.', 'error');
                console.error('[CAuftrag/detail] Fehler beim Laden der Firma:', err);
            });
        },

        // ======================== helpers ========================
        _applyPdfLinkLabel: function () {
            const url = this.model.get('pdfUrl');
            const $field = this.$el.find('[data-name="pdfUrl"]');
            if (!$field.length) return;

            const $value = $field.find('.value, .link-container').first().length
                ? $field.find('.value, .link-container').first()
                : $field;

            if (!url) { $value.text('Keine PDF gespeichert'); return; }

            const label = '📄 Gespeicherte Auftragsbestätigung anzeigen';
            let $a = $value.find('a[href]');
            if ($a.length) {
                $a.attr({ href: url, target: '_blank', rel: 'noopener' }).text(label);
            } else {
                $value.empty().append(
                    $('<a>').attr({ href: url, target: '_blank', rel: 'noopener' }).text(label)
                );
            }
        }
    });
});
