(function () {
    'use strict';

    var FLASK_URL   = 'https://klesec.pagekite.me/api/ai-chat';
    var SAVE_URL    = FLASK_URL + '/prozesshandbuch/speichern';
    var AI_CHAT_KEY = '866a34aae36bee0a730e892ee9585552b202613ce1c5f963f505eb6e164eb3ea';
    var MAX_HISTORY = 6;
    var history     = [];
    var widgetReady = false;
    var _userRole   = 'mitarbeiter';
    var _userId     = '';

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

    // ─── Styles ──────────────────────────────────────────────────
    function injectStyles() {
        var s = document.createElement('style');
        s.textContent = [
            '#kb-ai-btn{position:fixed;bottom:24px;right:24px;width:68px;height:68px;',
            'border-radius:50%;background:radial-gradient(circle at 40% 35%,#dbeafe 0%,#bfdbfe 100%);',
            'border:none;cursor:pointer;padding:0;',
            'z-index:9999;box-shadow:0 4px 16px rgba(37,99,235,.45);',
            'display:flex;align-items:center;justify-content:center;',
            'transition:transform .15s,box-shadow .15s;}',
            '#kb-ai-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(37,99,235,.55);}',
            '#kb-ai-panel{position:fixed;bottom:104px;right:24px;width:370px;',
            'max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);',
            'background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.2);',
            'z-index:9998;display:none;flex-direction:column;',
            'font-family:system-ui,-apple-system,sans-serif;font-size:15px;overflow:hidden;}',
            '#kb-ai-panel.open{display:flex;}',
            '.kb-hdr{background:#2563eb;color:#fff;padding:12px 16px;',
            'display:flex;align-items:center;justify-content:space-between;',
            'border-radius:12px 12px 0 0;flex-shrink:0;}',
            '.kb-hdr-title{font-weight:600;font-size:15px;}',
            '.kb-close{background:none;border:none;color:#fff;font-size:18px;',
            'cursor:pointer;line-height:1;padding:0 4px;}',
            '.kb-new{position:relative;background:none;border:none;color:rgba(255,255,255,.65);',
            'font-size:19px;cursor:pointer;line-height:1;padding:0 5px;transition:color .15s;}',
            '.kb-new:hover{color:#ef4444;}',
            '.kb-new::after{content:"Chat zurücksetzen";position:absolute;bottom:-26px;right:0;',
            'background:#ef4444;color:#fff;font-size:11px;white-space:nowrap;',
            'padding:2px 7px;border-radius:4px;opacity:0;pointer-events:none;',
            'transition:opacity .15s;z-index:10;}',
            '.kb-new:hover::after{opacity:1;}',
            '.kb-expand{position:relative;background:none;border:none;color:rgba(255,255,255,.65);',
            'font-size:17px;cursor:pointer;line-height:1;padding:0 5px;transition:color .15s;}',
            '.kb-expand:hover{color:#fff;}',
            '.kb-expand::after{content:"Im Vollbild öffnen";position:absolute;bottom:-26px;right:0;',
            'background:#1e293b;color:#fff;font-size:11px;white-space:nowrap;',
            'padding:2px 7px;border-radius:4px;opacity:0;pointer-events:none;',
            'transition:opacity .15s;z-index:10;}',
            '.kb-expand:hover::after{opacity:1;}',
            '.kb-msgs{flex:1;overflow-y:auto;padding:12px;',
            'display:flex;flex-direction:column;gap:8px;}',
            '.kb-msg{max-width:86%;padding:8px 12px;border-radius:10px;',
            'line-height:1.5;word-break:break-word;}',
            '.kb-msg.user{align-self:flex-end;background:#2563eb;color:#fff;',
            'border-radius:10px 10px 2px 10px;}',
            '.kb-msg.bot{align-self:flex-start;background:#f1f5f9;color:#1e293b;',
            'border-radius:10px 10px 10px 2px;}',
            '.kb-msg a{color:#2563eb;}',
            '.kb-msg.user a{color:#bfdbfe;}',
            '.kb-typing{align-self:flex-start;background:#f1f5f9;color:#64748b;',
            'padding:8px 14px;border-radius:10px;font-style:italic;font-size:13px;}',
            '.kb-foot{padding:10px 12px;border-top:1px solid #e2e8f0;',
            'display:flex;gap:8px;flex-shrink:0;}',
            '.kb-inp{flex:1;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;',
            'font-size:14px;resize:none;outline:none;font-family:inherit;line-height:1.4;}',
            '.kb-inp:focus{border-color:#2563eb;}',
            '.kb-snd{background:#2563eb;color:#fff;border:none;border-radius:8px;',
            'padding:8px 14px;cursor:pointer;font-size:14px;white-space:nowrap;}',
            '.kb-snd:hover{background:#1d4ed8;}',
            '.kb-snd:disabled{background:#94a3b8;cursor:default;}',
            '.kb-draft-save{align-self:flex-start;background:#16a34a;color:#fff;border:none;',
            'border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px;}',
            '.kb-draft-save:hover{background:#15803d;}',
            '.kb-draft-save:disabled{background:#94a3b8;cursor:default;}',
            '.kb-draft-done{align-self:flex-start;font-size:13px;color:#16a34a;padding:4px 2px;}',
        ].join('');
        document.head.appendChild(s);
    }

    // ─── DOM ─────────────────────────────────────────────────────
    function buildWidget() {
        if (widgetReady) return;
        widgetReady = true;

        // Определяем роль после логина через сессионную куку EspoCRM
        fetch('/api/v1/App/user', {credentials: 'same-origin'})
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var u = data && data.user;
                if (!u) return;
                _userId = u.id || '';
                if (u.isAdmin || u.type === 'admin') {
                    _userRole = 'admin';
                } else {
                    var roles = Object.values(u.rolesNames || {});
                    var teams = Object.values(u.teamsNames || {});
                    if (roles.indexOf('Geschäftsleitung') !== -1) {
                        _userRole = 'geschaeftsfuehrung';
                    } else if (roles.indexOf('Buchhaltung') !== -1) {
                        _userRole = 'buchhaltung';
                    } else if (teams.indexOf('IT & Entwicklung') !== -1) {
                        _userRole = 'it_entwicklung';
                    }
                }
                console.log('[KB] user_role detected:', _userRole);
            })
            .catch(function() {});

        injectStyles();

        var root = document.createElement('div');
        root.innerHTML = [
            '<button id="kb-ai-btn" title="KleSec KI-Assistent">',
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68" width="68" height="68">',
            '<defs>',
            '<radialGradient id="bgG" cx="45%" cy="38%" r="60%"><stop offset="0%" stop-color="#e0eeff"/><stop offset="100%" stop-color="#b8d4fa"/></radialGradient>',
            '<radialGradient id="skinG" cx="38%" cy="28%" r="70%"><stop offset="0%" stop-color="#fdd5a0"/><stop offset="100%" stop-color="#e8874a"/></radialGradient>',
            '<radialGradient id="cheekG" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#f5a070" stop-opacity="0.55"/><stop offset="100%" stop-color="#f5a070" stop-opacity="0"/></radialGradient>',
            '</defs>',
            /* Hintergrund */
            '<circle cx="34" cy="34" r="34" fill="url(#bgG)"/>',
            /* Schultern Overall */
            '<path d="M8 68 C9 52 20 49 28 48 L34 52 L40 48 C48 49 59 52 60 68Z" fill="#2563eb"/>',
            /* Hemd weiß */
            '<path d="M28 48 L34 52 L40 48 L40 55 L28 55Z" fill="#f0f4ff"/>',
            /* Hals */
            '<rect x="29" y="43" width="10" height="7" rx="4" fill="url(#skinG)"/>',
            /* Kopf */
            '<ellipse cx="34" cy="31" rx="15.5" ry="15" fill="url(#skinG)"/>',
            /* Ohren */
            '<ellipse cx="18.8" cy="32" rx="3" ry="4" fill="#e8874a"/>',
            '<ellipse cx="18.8" cy="32" rx="1.5" ry="2.3" fill="#fdd5a0"/>',
            '<ellipse cx="49.2" cy="32" rx="3" ry="4" fill="#e8874a"/>',
            '<ellipse cx="49.2" cy="32" rx="1.5" ry="2.3" fill="#fdd5a0"/>',
            /* Haare — lockig/strubbelig braun */
            '<path d="M19 24 Q18 13 34 12 Q50 13 49 24 Q46 17 42 16 Q38 13 34 14 Q30 13 26 16 Q22 17 19 24Z" fill="#c8a84b"/>',
            '<ellipse cx="22" cy="19" rx="4" ry="4.5" fill="#c8a84b"/>',
            '<ellipse cx="28" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/>',
            '<ellipse cx="34" cy="13.5" rx="4" ry="3.5" fill="#c8a84b"/>',
            '<ellipse cx="40" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/>',
            '<ellipse cx="46" cy="19" rx="4" ry="4.5" fill="#c8a84b"/>',
            /* Brauen */
            '<path d="M24.5 24.5 Q27.5 22.5 31 24" stroke="#a07c20" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
            '<path d="M37 24 Q40.5 22.5 43.5 24.5" stroke="#a07c20" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
            /* Augen weiß */
            '<ellipse cx="28" cy="30" rx="4.5" ry="4.2" fill="#fff"/>',
            '<ellipse cx="40" cy="30" rx="4.5" ry="4.2" fill="#fff"/>',
            /* Iris */
            '<circle cx="28.5" cy="30.5" r="2.8" fill="#2d6a4f"/>',
            '<circle cx="40.5" cy="30.5" r="2.8" fill="#2d6a4f"/>',
            /* Pupillen */
            '<circle cx="28.8" cy="30.8" r="1.5" fill="#0d1a12"/>',
            '<circle cx="41" cy="30.8" r="1.5" fill="#0d1a12"/>',
            /* Glanzpunkte */
            '<circle cx="29.8" cy="29.5" r="0.9" fill="#fff"/>',
            '<circle cx="42" cy="29.5" r="0.9" fill="#fff"/>',
            /* Brillengestell */
            '<rect x="22.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>',
            '<rect x="34.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>',
            /* Brillensteg */
            '<line x1="33.5" y1="29.5" x2="34.5" y2="29.5" stroke="#2d2d2d" stroke-width="1.5"/>',
            /* Bügel links */
            '<line x1="22.5" y1="29" x2="19" y2="30" stroke="#2d2d2d" stroke-width="1.3"/>',
            /* Bügel rechts */
            '<line x1="45.5" y1="29" x2="49" y2="30" stroke="#2d2d2d" stroke-width="1.3"/>',
            /* Nase */
            '<ellipse cx="34" cy="37" rx="3.2" ry="2.2" fill="#d0733a"/>',
            /* Bart blond */
            '<path d="M22 39 Q22 47 34 48 Q46 47 46 39 Q43 43 34 44 Q25 43 22 39Z" fill="#b8922a"/>',
            '<path d="M24 38 Q24 40 22 39 Q23 37 24 38Z" fill="#b8922a"/>',
            '<path d="M44 38 Q44 40 46 39 Q45 37 44 38Z" fill="#b8922a"/>',
            /* Bart-Highlights */
            '<path d="M26 41 Q30 44 34 44 Q38 44 42 41 Q38 43.5 34 43.5 Q30 43.5 26 41Z" fill="#d4af50" opacity="0.4"/>',
            /* Wangen */
            '<ellipse cx="22" cy="37" rx="4" ry="3" fill="url(#cheekG)"/>',
            '<ellipse cx="46" cy="37" rx="4" ry="3" fill="url(#cheekG)"/>',
            /* Mund */
            '<path d="M26 41.5 Q34 50 42 41.5" fill="#b04820"/>',
            '<path d="M27.5 42 Q34 48 40.5 42 Q34 46 27.5 42Z" fill="#fff"/>',
            '</svg>',
            '</button>',
            '<div id="kb-ai-panel">',
            '  <div class="kb-hdr">',
            '    <span class="kb-hdr-title">',
            '      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68" width="28" height="28" style="vertical-align:middle;margin-right:6px;border-radius:50%;">',
            '        <defs><radialGradient id="bgH" cx="45%" cy="38%" r="60%"><stop offset="0%" stop-color="#e0eeff"/><stop offset="100%" stop-color="#b8d4fa"/></radialGradient>',
            '        <radialGradient id="skH" cx="38%" cy="28%" r="70%"><stop offset="0%" stop-color="#fdd5a0"/><stop offset="100%" stop-color="#e8874a"/></radialGradient></defs>',
            '        <circle cx="34" cy="34" r="34" fill="url(#bgH)"/>',
            '        <path d="M8 68 C9 52 20 49 28 48 L34 52 L40 48 C48 49 59 52 60 68Z" fill="#2563eb"/>',
            '        <path d="M28 48 L34 52 L40 48 L40 55 L28 55Z" fill="#f0f4ff"/>',
            '        <rect x="29" y="43" width="10" height="7" rx="4" fill="url(#skH)"/>',
            '        <ellipse cx="34" cy="31" rx="15.5" ry="15" fill="url(#skH)"/>',
            '        <ellipse cx="18.8" cy="32" rx="3" ry="4" fill="#e8874a"/><ellipse cx="49.2" cy="32" rx="3" ry="4" fill="#e8874a"/>',
            '        <path d="M19 24 Q18 13 34 12 Q50 13 49 24 Q46 17 42 16 Q38 13 34 14 Q30 13 26 16 Q22 17 19 24Z" fill="#c8a84b"/>',
            '        <ellipse cx="22" cy="19" rx="4" ry="4.5" fill="#c8a84b"/><ellipse cx="28" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/>',
            '        <ellipse cx="34" cy="13.5" rx="4" ry="3.5" fill="#c8a84b"/><ellipse cx="40" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/><ellipse cx="46" cy="19" rx="4" ry="4.5" fill="#c8a84b"/>',
            '        <ellipse cx="28" cy="30" rx="4.5" ry="4.2" fill="#fff"/><ellipse cx="40" cy="30" rx="4.5" ry="4.2" fill="#fff"/>',
            '        <circle cx="28.5" cy="30.5" r="2.8" fill="#2d6a4f"/><circle cx="40.5" cy="30.5" r="2.8" fill="#2d6a4f"/>',
            '        <circle cx="28.8" cy="30.8" r="1.5" fill="#0d1a12"/><circle cx="41" cy="30.8" r="1.5" fill="#0d1a12"/>',
            '        <circle cx="29.8" cy="29.5" r="0.9" fill="#fff"/><circle cx="42" cy="29.5" r="0.9" fill="#fff"/>',
            '        <rect x="22.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>',
            '        <rect x="34.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>',
            '        <line x1="33.5" y1="29.5" x2="34.5" y2="29.5" stroke="#2d2d2d" stroke-width="1.5"/>',
            '        <ellipse cx="34" cy="37" rx="3.2" ry="2.2" fill="#d0733a"/>',
            '        <path d="M22 39 Q22 47 34 48 Q46 47 46 39 Q43 43 34 44 Q25 43 22 39Z" fill="#b8922a"/>',
            '        <path d="M26 41.5 Q34 50 42 41.5" fill="#b04820"/>',
            '        <path d="M27.5 42 Q34 48 40.5 42 Q34 46 27.5 42Z" fill="#fff"/>',
            '      </svg>',
            '      KleSec KI-Assistent',
            '    </span>',
            '    <span style="display:flex;gap:6px;align-items:center;">',
            '      <button class="kb-expand" id="kb-expand">⤢</button>',
            '      <button class="kb-new" id="kb-new">🗑️</button>',
            '      <button class="kb-close" id="kb-close">✕</button>',
            '    </span>',
            '  </div>',
            '  <div class="kb-msgs" id="kb-msgs"></div>',
            '  <div class="kb-foot">',
            '    <textarea class="kb-inp" id="kb-inp" rows="2"',
            '      placeholder="Ich bin ganz Ohr…"></textarea>',
            '    <button class="kb-snd" id="kb-snd">Senden</button>',
            '  </div>',
            '</div>',
        ].join('');
        document.body.appendChild(root);

        var btn   = document.getElementById('kb-ai-btn');
        var panel = document.getElementById('kb-ai-panel');
        var msgs  = document.getElementById('kb-msgs');
        var inp   = document.getElementById('kb-inp');
        var snd   = document.getElementById('kb-snd');
        var cls   = document.getElementById('kb-close');
        var newBtn = document.getElementById('kb-new');
        var expandBtn = document.getElementById('kb-expand');

        // ─── Helpers ─────────────────────────────────────────────

        function esc(t) {
            return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        function md(text) {
            return esc(text)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>')
                .replace(/\n/g,'<br>');
        }

        function addMsg(role, text) {
            var d = document.createElement('div');
            d.className = 'kb-msg ' + (role === 'user' ? 'user' : 'bot');
            d.innerHTML = md(text);
            msgs.appendChild(d);
            msgs.scrollTop = msgs.scrollHeight;
        }

        function typing(on) {
            var el = document.getElementById('kb-typing');
            if (on) {
                if (!el) {
                    var d = document.createElement('div');
                    d.className = 'kb-typing'; d.id = 'kb-typing'; d.textContent = '...';
                    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
                }
            } else {
                if (el) el.remove();
            }
        }

        function setLoading(on) {
            snd.disabled = on;
            inp.disabled = on;
            snd.textContent = on ? '...' : 'Senden';
        }

        function welcome() {
            var d = document.createElement('div');
            d.className = 'kb-msg bot';
            d.innerHTML = [
                'Willkommen! Womit kann ich Ihnen helfen?',
                '<br><br>',
                '<span style="font-size:12px;opacity:.6;">Beispielanfragen</span>',
                '<br>',
                '<em>• Offene Eingangsrechnungen anzeigen</em><br>',
                '<em>• Wie viel schuldet Coler Systems?</em><br>',
                '<em>• Top 5 Kunden nach Umsatz</em><br>',
                '<em>• Wartungen diese Woche</em><br>',
                '<em>• Aktueller Buchhaltungsstatus</em>',
            ].join('');
            msgs.appendChild(d);
            msgs.scrollTop = msgs.scrollHeight;
        }

        // Zeigt den Bestätigen-Button für einen Prozesshandbuch-Entwurf (siehe
        // routes_ai_assistant.py::ai_chat_prozesshandbuch_speichern) — schickt beim Klick
        // GENAU den Entwurf, den die KI zuvor gezeigt hat, kein erneuter KI-Aufruf.
        function addDraftButton(draft) {
            var wrap = document.createElement('div');
            wrap.className = 'kb-msg bot';
            wrap.style.padding = '0';
            wrap.style.background = 'none';

            var btn = document.createElement('button');
            btn.className = 'kb-draft-save';
            btn.textContent = '💾 Ins Prozesshandbuch speichern';

            btn.addEventListener('click', function () {
                btn.disabled = true;
                btn.textContent = '...';
                fetch(SAVE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-AI-Chat-Key': AI_CHAT_KEY },
                    body: JSON.stringify({
                        titel: draft.titel || '',
                        bereich: draft.bereich || '',
                        beschreibung: draft.beschreibung || '',
                        user_id: _userId,
                        espo_base_url: window.location.origin,
                    }),
                })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data && data.success) {
                        var done = document.createElement('span');
                        done.className = 'kb-draft-done';
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
            msgs.appendChild(wrap);
            msgs.scrollTop = msgs.scrollHeight;
        }

        // ─── API ─────────────────────────────────────────────────

        function send() {
            var text = inp.value.trim();
            if (!text) return;
            inp.value = '';

            history.push({ role: 'user', content: text });
            if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
            addMsg('user', text);
            typing(true);
            setLoading(true);

            fetch(FLASK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-AI-Chat-Key': AI_CHAT_KEY,
                },
                body: JSON.stringify({
                    messages: history,
                    espo_base_url: window.location.origin,
                    user_role: _userRole,
                    user_id: _userId,
                }),
            })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                typing(false); setLoading(false);
                var reply = (data && data.reply) ? data.reply : 'Keine Antwort.';
                history.push({ role: 'assistant', content: reply });
                if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
                addMsg('bot', reply);
                if (data && data.prozesshandbuch_draft) {
                    addDraftButton(data.prozesshandbuch_draft);
                }
            })
            .catch(function () {
                typing(false); setLoading(false);
                addMsg('bot', randomNetworkError());
            });
        }

        // ─── Events ──────────────────────────────────────────────

        btn.addEventListener('click', function () {
            var open = panel.classList.contains('open');
            if (!open) {
                panel.classList.add('open');
                if (!msgs.children.length) welcome();
                inp.focus();
            } else {
                panel.classList.remove('open');
            }
        });

        cls.addEventListener('click', function () { panel.classList.remove('open'); });
        newBtn.addEventListener('click', function () {
            history = [];
            msgs.innerHTML = '';
            welcome();
        });
        expandBtn.addEventListener('click', function () {
            // Aktuelle Historie an die Vollbild-Seite übergeben (siehe custom:views/ai-chat/index) —
            // dort wird daraus eine gespeicherte Konversation. localStorage statt URL-Parameter,
            // weil die Historie beliebig lang sein kann.
            var quelleTyp = null, quelleId = null, quelleLabel = null;
            var m = /#(\w+)\/view\/([\w-]+)/.exec(window.location.hash);
            if (m) {
                quelleTyp = m[1];
                quelleId = m[2];
                quelleLabel = m[1] + ' #' + m[2];
            }
            try {
                localStorage.setItem('kbAiSeed', JSON.stringify({
                    history: history,
                    quelleTyp: quelleTyp,
                    quelleId: quelleId,
                    quelle: quelleLabel,
                }));
            } catch (e) {}
            window.open('#custom:ai-chat-full', '_blank');
        });
        snd.addEventListener('click', send);
        inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
        });

        console.log('[KB AI-Chat] Widget bereit ✅');
    }

    // ─── Warte auf Login ─────────────────────────────────────────
    // EspoCRM zeigt nach Login das Navbar-Element. Wir pollen darauf.
    function waitForLogin() {
        var attempts = 0;
        var iv = setInterval(function () {
            attempts++;
            // navbar erscheint erst nach erfolgreichem Login
            var nav = document.querySelector('.navbar') || document.querySelector('[data-name="navbar"]');
            if (nav) {
                clearInterval(iv);
                // kurze Verzögerung damit EspoCRM fertig ist
                setTimeout(buildWidget, 800);
            }
            if (attempts > 120) clearInterval(iv); // 60 Sek. Timeout
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForLogin);
    } else {
        waitForLogin();
    }

})();
