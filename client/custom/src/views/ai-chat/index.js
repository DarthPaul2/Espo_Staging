Espo.define('custom:views/ai-chat/index', ['view'], function (Dep) {

    var FLASK_BASE  = 'https://klesec.pagekite.me/api';
    var AI_CHAT_KEY = '866a34aae36bee0a730e892ee9585552b202613ce1c5f963f505eb6e164eb3ea';
    var SEED_STORAGE_KEY = 'kbAiSeed';

    // Netzwerkfehler beim Senden/Speichern — zufällig einer davon statt immer derselben
    // trockenen Meldung (Pavels Wunsch, mit Humor/Slang auf Pagekite schimpfen).
    var NETWORK_ERRORS = [
        'Wegen deinem scheiß Pagekite gab\'s grad \'nen Netzwerkfehler! Versuch\'s nochmal.',
        'Wird mal Zeit für \'ne eigene Subdomain, Alter — Netzwerkfehler, probier\'s nochmal.',
        'Pagekite spinnt schon wieder. Netzwerkfehler, einfach nochmal senden.',
        'Der Pagekite-Tunnel ist grad kurz eingeknickt — nochmal versuchen, klappt bestimmt.',
        'Keine Ahnung was da schiefging, aber wahrscheinlich mal wieder Pagekite. Einfach nochmal.',
    ];

    function randomNetworkError() {
        return NETWORK_ERRORS[Math.floor(Math.random() * NETWORK_ERRORS.length)];
    }

    // {time} = tageszeitabhängiger Gruß, {name} = Vorname — jedes Mal, wenn der Begrüßungsschirm
    // erscheint, wird zufällig einer davon gewählt (siehe renderGreeting/showWelcome). Einträge
    // mit männlicher/weiblicher Grammatik ({m}/{f}) werden anhand von salutationName aus
    // /api/v1/App/user ausgewählt (siehe isFemale) — z.B. "Mrs." bei Bianca.
    var GREETING_TEMPLATES = [
        { m: '{time}, mein lieber {name}! Was geht ab heute?', f: '{time}, meine liebe {name}! Was geht ab heute?' },
        { m: 'Was heckst du denn schon wieder aus, du kleiner Chaot?', f: 'Was heckst du denn schon wieder aus, du kleine Chaotin?' },
        '{time}, {name}! Leg los, ich bin ready.',
        'Ah, {name} ist am Start! Schieß los.',
        'Was brennt denn heute, {name}? Alles safe?',
        '{time}! Ich hab schon Kaffee intus — läuft bei mir, leg los.',
        'Da bist du ja, {name}! Na, was liegt an, alles klar bei dir?',
        'Immer wieder gerne, {name}! Was geht?',
        'Na, {name}, wieder \'ne krasse Frage im Gepäck?',
        'Los geht\'s, {name} — ich hab eh null Bock auf was anderes. 😄',
    ];

    function timeGreeting() {
        var h = new Date().getHours();
        if (h >= 5 && h < 11) return 'Guten Morgen';
        if (h >= 11 && h < 18) return 'Guten Tag';
        return 'Guten Abend';
    }

    // Kleiner Spaß, wenn in einer Sitzung viele Fragen am Stück kommen — kein echter
    // Modellaufruf, rein clientseitig, alle BREAK_JOKES_EVERY Nachrichten eingestreut.
    var BREAK_JOKES_EVERY = 12;
    var BREAK_JOKES = [
        'Puh, {n} Fragen am Stück, krass! Vielleicht mal kurz chillen — ich bin schon ganz durch. 😅',
        'Respekt, {n} Fragen ohne Punkt und Komma! Läuft bei dir heute richtig. Kaffee gefällig? ☕',
        'Bei Frage {n} könnte selbst ich als Algorithmus \'ne kleine Pause vertragen, digga. 😄',
        'Alter, {n} Fragen! Du bist heute voll am Start — alles safe bei dir, oder auch mal 5 Minuten Chill-Zeit nötig?',
    ];

    // Zusätzlicher (gröberer) Scherz alle MONEY_JOKES_EVERY Nachrichten, oben drauf zum Pausen-Scherz.
    var MONEY_JOKES_EVERY = 8;
    var MONEY_JOKES = [
        'Digga, denkst du ich hab ohne Ende Kohle? Deine {n} Fragen fressen mir gerade das ganze Claude-API-Budget weg!',
        'Ey, glaubst du ich scheiß Geld? Bei {n} Fragen brennt hier ordentlich was vom API-Budget ab!',
        'Noch mehr Fragen und ich muss Pavel echt um mehr Kohle für die Claude-API anbetteln, ganz ehrlich.',
        '{n} Fragen, Alter! Das kostet alles echtes Geld — mein API-Budget schmilzt wie Eis in der Sonne.',
    ];

    return Dep.extend({

        template: 'custom:ai-chat/index',

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            var $el = this.$el;
            var listEl = $el.find('#aic-conv-list')[0];
            var msgsEl = $el.find('#aic-msgs')[0];
            var welcomeEl = $el.find('#aic-welcome')[0];
            var welcomeTitleEl = $el.find('.aic-welcome-title')[0];
            var mitAnchorEl = $el.find('#aic-mit-anchor')[0];
            var signatureEl = $el.find('#aic-signature')[0];
            var welcomeSubEl = $el.find('.aic-welcome-sub')[0];
            var chipHolder = $el.find('#aic-chip-holder')[0];
            var inp = $el.find('#aic-inp')[0];
            var snd = $el.find('#aic-snd')[0];
            var newBtn = $el.find('#aic-new')[0];
            var confirmModal = $el.find('#aic-confirm-modal')[0];
            var confirmText = $el.find('#aic-confirm-text')[0];
            var confirmYes = $el.find('#aic-confirm-yes')[0];
            var confirmNo = $el.find('#aic-confirm-no')[0];

            var userRole = 'mitarbeiter';
            var userId = '';
            var userFirstName = 'du';
            var isFemale = false;
            var currentConversationId = null;
            var sessionMsgCount = 0; // nur für den Pausen-Scherz, pro Unterhaltung zurückgesetzt
            var pendingConfirmAction = null;

            function showConfirm(message, onYes) {
                confirmText.textContent = message;
                pendingConfirmAction = onYes;
                confirmModal.classList.add('open');
            }

            function hideConfirm() {
                confirmModal.classList.remove('open');
                pendingConfirmAction = null;
            }

            function positionSignature() {
                // Setzt die Unterschrift unter den Buchstaben "t" in "mit" — per JS statt fest
                // verdrahtetem CSS-Wert, weil der Text zentriert ist und bei jeder Fensterbreite/
                // Fontladung woanders umbricht. Auf schmalen (Handy-)Bildschirmen reicht der Platz
                // rechts vom Anker oft nicht für den ganzen Text — dann an den rechten Rand
                // klemmen, statt über den Bildschirmrand hinauszulaufen.
                if (!mitAnchorEl || !signatureEl || !welcomeSubEl || !welcomeEl) return;
                var anchorRect = mitAnchorEl.getBoundingClientRect();
                var subRect = welcomeSubEl.getBoundingClientRect();
                var containerRect = welcomeEl.getBoundingClientRect();
                var left = anchorRect.right - containerRect.left;
                var maxLeft = containerRect.width - signatureEl.offsetWidth - 24; // = Padding von .aic-welcome
                if (left > maxLeft) left = maxLeft;
                if (left < 0) left = 0;
                signatureEl.style.left = left + 'px';
                signatureEl.style.top = (subRect.bottom - containerRect.top + 6) + 'px';
            }

            function renderGreeting() {
                if (!welcomeTitleEl) return;
                var entry = GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)];
                var tpl = typeof entry === 'string' ? entry : (isFemale ? entry.f : entry.m);
                welcomeTitleEl.textContent = tpl
                    .replace('{time}', timeGreeting())
                    .replace('{name}', userFirstName);
            }

            function maybeAddBreakJoke() {
                if (sessionMsgCount === 0 || sessionMsgCount % BREAK_JOKES_EVERY !== 0) return;
                var tpl = BREAK_JOKES[Math.floor(Math.random() * BREAK_JOKES.length)];
                setTimeout(function () {
                    addMsg('bot', tpl.replace('{n}', sessionMsgCount));
                }, 500);
            }

            function maybeAddMoneyJoke() {
                if (sessionMsgCount === 0 || sessionMsgCount % MONEY_JOKES_EVERY !== 0) return;
                var tpl = MONEY_JOKES[Math.floor(Math.random() * MONEY_JOKES.length)];
                setTimeout(function () {
                    addMsg('bot', tpl.replace('{n}', sessionMsgCount));
                }, 1100);
            }

            function esc(t) {
                return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            function md(text) {
                return esc(text)
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
                    .replace(/\n/g, '<br>');
            }

            function hideWelcome() {
                welcomeEl.style.display = 'none';
                msgsEl.style.display = 'flex';
            }

            function showWelcome() {
                welcomeEl.style.display = 'flex';
                msgsEl.style.display = 'none';
                msgsEl.innerHTML = '';
                sessionMsgCount = 0;
                renderGreeting();
            }

            function addMsg(role, text) {
                hideWelcome();
                var d = document.createElement('div');
                d.className = 'aic-msg ' + (role === 'user' ? 'user' : 'bot');
                d.innerHTML = md(text);
                msgsEl.appendChild(d);
                msgsEl.scrollTop = msgsEl.scrollHeight;
            }

            // Bestätigen-Button für einen Prozesshandbuch-Entwurf (siehe
            // routes_ai_assistant.py::ai_chat_prozesshandbuch_speichern) — schickt beim Klick
            // GENAU den zuvor gezeigten Entwurf, kein erneuter KI-Aufruf.
            function addDraftButton(draft) {
                hideWelcome();
                var wrap = document.createElement('div');
                wrap.className = 'aic-msg bot';
                wrap.style.padding = '0';
                wrap.style.background = 'none';

                var btn = document.createElement('button');
                btn.className = 'aic-draft-save';
                btn.textContent = '💾 Ins Prozesshandbuch speichern';

                btn.addEventListener('click', function () {
                    btn.disabled = true;
                    btn.textContent = '...';
                    fetch(FLASK_BASE + '/ai-chat/prozesshandbuch/speichern', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-AI-Chat-Key': AI_CHAT_KEY },
                        body: JSON.stringify({
                            titel: draft.titel || '',
                            bereich: draft.bereich || '',
                            beschreibung: draft.beschreibung || '',
                            user_id: userId,
                            espo_base_url: window.location.origin,
                        }),
                    })
                        .then(function (r) { return r.json(); })
                        .then(function (data) {
                            if (data && data.success) {
                                var done = document.createElement('span');
                                done.className = 'aic-draft-done';
                                done.innerHTML = '✅ Gespeichert' + (data.espo_url
                                    ? ' — <a href="' + data.espo_url + '" target="_blank">im EspoCRM öffnen</a>' : '');
                                wrap.replaceChild(done, btn);
                            } else {
                                btn.disabled = false;
                                btn.textContent = '💾 Ins Prozesshandbuch speichern';
                                addMsg('bot', 'Fehler beim Speichern: ' + ((data && data.error) || 'unbekannt'));
                            }
                        })
                        .catch(function () {
                            btn.disabled = false;
                            btn.textContent = '💾 Ins Prozesshandbuch speichern';
                            addMsg('bot', randomNetworkError());
                        });
                });

                wrap.appendChild(btn);
                msgsEl.appendChild(wrap);
                msgsEl.scrollTop = msgsEl.scrollHeight;
            }

            function typing(on) {
                var el = $el.find('#aic-typing')[0];
                if (on) {
                    if (!el) {
                        var d = document.createElement('div');
                        d.className = 'aic-typing';
                        d.id = 'aic-typing';
                        d.textContent = '...';
                        msgsEl.appendChild(d);
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                    }
                } else if (el) {
                    el.remove();
                }
            }

            function setLoading(on) {
                snd.disabled = on;
                inp.disabled = on;
                snd.textContent = on ? '...' : 'Senden';
            }

            function renderConversationList(items) {
                if (!items.length) {
                    listEl.innerHTML = '<div class="aic-conv-empty">Noch keine Unterhaltungen.</div>';
                    return;
                }
                listEl.innerHTML = '';
                items.forEach(function (item) {
                    var row = document.createElement('div');
                    row.className = 'aic-conv-item' + (item.id === currentConversationId ? ' active' : '');
                    var dateStr = (item.lastMessageAt || '').replace('T', ' ').slice(0, 16);
                    row.innerHTML = '<div class="aic-conv-item-text">' +
                        '<div class="aic-conv-title">' + esc(item.name || '(ohne Titel)') + '</div>' +
                        '<div class="aic-conv-date">' + esc(dateStr) + '</div>' +
                        '</div>' +
                        '<button class="aic-conv-delete" title="Löschen">🗑</button>';
                    row.addEventListener('click', function () {
                        selectConversation(item.id);
                    });
                    row.querySelector('.aic-conv-delete').addEventListener('click', function (e) {
                        e.stopPropagation();
                        showConfirm(
                            '"' + (item.name || '(ohne Titel)') + '" wirklich löschen?',
                            function () { deleteConversation(item.id); }
                        );
                    });
                    listEl.appendChild(row);
                });
            }

            function deleteConversation(id) {
                var where = 'where[0][type]=equals&where[0][attribute]=conversationId&where[0][value]=' +
                    encodeURIComponent(id);
                fetch('/api/v1/CAiMessage?' + where + '&select=id&maxSize=200', { credentials: 'same-origin' })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        var rows = (data && data.list) || [];
                        return Promise.all(rows.map(function (row) {
                            return fetch('/api/v1/CAiMessage/' + row.id, {
                                method: 'DELETE', credentials: 'same-origin',
                            });
                        }));
                    })
                    .then(function () {
                        return fetch('/api/v1/CAiConversation/' + id, {
                            method: 'DELETE', credentials: 'same-origin',
                        });
                    })
                    .then(function () {
                        if (currentConversationId === id) {
                            currentConversationId = null;
                            showWelcome();
                        }
                        loadConversations();
                    });
            }

            function loadConversations() {
                return fetch('/api/v1/CAiConversation?orderBy=lastMessageAt&order=desc&maxSize=100', {
                    credentials: 'same-origin',
                })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        renderConversationList((data && data.list) || []);
                    })
                    .catch(function () {
                        listEl.innerHTML = '<div class="aic-conv-empty">Fehler beim Laden.</div>';
                    });
            }

            function selectConversation(id) {
                currentConversationId = id;
                sessionMsgCount = 0;
                loadConversations(); // rendert die Liste neu und markiert die aktive Zeile

                chipHolder.innerHTML = '';
                msgsEl.innerHTML = '';
                hideWelcome();

                var where = 'where[0][type]=equals&where[0][attribute]=conversationId&where[0][value]=' +
                    encodeURIComponent(id);
                fetch('/api/v1/CAiMessage?' + where + '&orderBy=createdAt&order=asc&maxSize=200', {
                    credentials: 'same-origin',
                })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        var rows = (data && data.list) || [];
                        msgsEl.innerHTML = '';
                        rows.forEach(function (row) { addMsg(row.role, row.content); });
                    });
            }

            function send() {
                var text = inp.value.trim();
                if (!text) return;
                inp.value = '';

                addMsg('user', text);
                typing(true);
                setLoading(true);

                var url = FLASK_BASE + '/ai-chat/conversations/' + (currentConversationId || 'new') + '/messages';
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-AI-Chat-Key': AI_CHAT_KEY },
                    body: JSON.stringify({
                        content: text,
                        espo_base_url: window.location.origin,
                        user_role: userRole,
                        user_id: userId,
                    }),
                })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        typing(false);
                        setLoading(false);
                        if (data && data.conversation_id && data.conversation_id !== currentConversationId) {
                            currentConversationId = data.conversation_id;
                            loadConversations();
                        }
                        addMsg('bot', (data && data.reply) ? data.reply : 'Keine Antwort.');
                        if (data && data.prozesshandbuch_draft) {
                            addDraftButton(data.prozesshandbuch_draft);
                        }
                        sessionMsgCount++;
                        maybeAddBreakJoke();
                        maybeAddMoneyJoke();
                    })
                    .catch(function () {
                        typing(false);
                        setLoading(false);
                        addMsg('bot', randomNetworkError());
                    });
            }

            function handleSeed() {
                var raw = localStorage.getItem(SEED_STORAGE_KEY);
                if (!raw) return;
                localStorage.removeItem(SEED_STORAGE_KEY);

                var seed;
                try {
                    seed = JSON.parse(raw);
                } catch (e) {
                    return;
                }
                if (!seed || !seed.history || !seed.history.length) return;

                msgsEl.innerHTML = '';
                seed.history.forEach(function (m) { addMsg(m.role, m.content); });
                if (seed.quelle) {
                    chipHolder.innerHTML = '<div class="aic-chip">Aus: ' + esc(seed.quelle) + '</div>';
                }

                fetch(FLASK_BASE + '/ai-chat/conversations/new/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-AI-Chat-Key': AI_CHAT_KEY },
                    body: JSON.stringify({
                        seed_history: seed.history,
                        espo_base_url: window.location.origin,
                        user_role: userRole,
                        user_id: userId,
                        quelle_typ: seed.quelleTyp,
                        quelle_id: seed.quelleId,
                    }),
                })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        if (data && data.conversation_id) {
                            currentConversationId = data.conversation_id;
                            loadConversations();
                        }
                    });
            }

            function wireEvents() {
                newBtn.addEventListener('click', function () {
                    currentConversationId = null;
                    chipHolder.innerHTML = '';
                    showWelcome();
                    loadConversations(); // entfernt die Aktiv-Markierung der vorherigen Zeile
                    inp.focus();
                });
                snd.addEventListener('click', send);
                inp.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                    }
                });
                confirmYes.addEventListener('click', function () {
                    var action = pendingConfirmAction;
                    hideConfirm();
                    if (action) action();
                });
                confirmNo.addEventListener('click', hideConfirm);
                confirmModal.addEventListener('click', function (e) {
                    if (e.target === confirmModal) hideConfirm(); // Klick auf den grauen Hintergrund
                });
            }

            positionSignature();
            window.addEventListener('resize', positionSignature);
            if (document.fonts && document.fonts.ready) {
                // Caveat lädt asynchron nach — Text kann dadurch kurz umbrechen/verschieben.
                document.fonts.ready.then(positionSignature);
            }
            this.once('remove', function () {
                window.removeEventListener('resize', positionSignature);
            });

            fetch('/api/v1/App/user', { credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    var u = data && data.user;
                    if (!u) return;
                    userId = u.id || '';
                    userFirstName = u.firstName || (u.name || '').split(' ')[0] || 'du';
                    isFemale = (u.salutationName === 'Mrs.' || u.salutationName === 'Ms.');
                    if (u.isAdmin || u.type === 'admin') {
                        userRole = 'admin';
                    } else {
                        var roles = Object.values(u.rolesNames || {});
                        var teams = Object.values(u.teamsNames || {});
                        if (roles.indexOf('Geschäftsleitung') !== -1) {
                            userRole = 'geschaeftsfuehrung';
                        } else if (roles.indexOf('Buchhaltung') !== -1) {
                            userRole = 'buchhaltung';
                        } else if (teams.indexOf('IT & Entwicklung') !== -1) {
                            userRole = 'it_entwicklung';
                        }
                    }
                })
                .catch(function () {})
                .then(function () {
                    renderGreeting();
                    loadConversations();
                    handleSeed();
                    wireEvents();
                });
        },

    });
});
