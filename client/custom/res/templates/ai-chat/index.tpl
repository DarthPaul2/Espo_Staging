<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Caveat:wght@500;600&display=swap');

.aic-wrap { position: relative; display: flex; gap: 0; height: calc(100vh - 110px); min-height: 480px; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

.aic-signature {
    position: absolute;
    font-family: 'Caveat', cursive;
    font-weight: 600;
    font-size: 18px;
    color: #7a94c2;
    white-space: nowrap;
}

.aic-sidebar {
    width: 280px;
    min-width: 240px;
    background: #f5f6fa;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}
.aic-sidebar-head {
    padding: 14px 16px;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
}
.aic-new-btn {
    width: 100%;
    background: #a9c2e8;
    color: #2c3550;
    border: none;
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
}
.aic-new-btn:hover { background: #8fb0dc; }

.aic-conv-list { flex: 1; overflow-y: auto; padding: 6px 0; }
.aic-conv-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    font-size: 14px;
    color: #333;
}
.aic-conv-item:hover { background: #eaecf5; }
.aic-conv-item.active { background: #dde3f5; border-left-color: #3d5a99; font-weight: 600; }
.aic-conv-item-text { flex: 1; min-width: 0; }
.aic-conv-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aic-conv-date { font-size: 11px; color: #888; margin-top: 2px; }
.aic-conv-empty { padding: 16px; font-size: 13px; color: #888; }
.aic-conv-delete {
    flex-shrink: 0;
    background: none;
    border: none;
    color: #8b96a8;
    font-size: 20px;
    line-height: 1;
    padding: 4px 7px;
    border-radius: 6px;
    cursor: pointer;
    transition: background .15s, color .15s;
}
.aic-conv-delete:hover { background: #fde2e2; color: #c0392b; }

.aic-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(30, 41, 59, .45);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
.aic-modal-overlay.open { display: flex; }
.aic-modal {
    background: #fff;
    border-radius: 14px;
    padding: 24px 26px;
    max-width: 340px;
    width: 90%;
    box-shadow: 0 12px 40px rgba(0,0,0,.25);
    text-align: center;
}
.aic-modal-text { font-size: 15px; color: #2c3550; margin-bottom: 20px; line-height: 1.5; }
.aic-modal-buttons { display: flex; gap: 10px; justify-content: center; }
.aic-modal-btn {
    border: none;
    border-radius: 8px;
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
}
.aic-modal-btn-yes { background: #c0392b; color: #fff; }
.aic-modal-btn-yes:hover { background: #a5301f; }
.aic-modal-btn-no { background: #eef0f4; color: #2c3550; }
.aic-modal-btn-no:hover { background: #e0e3ea; }

.aic-main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: #fff; }

.aic-main-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid #eef0f4;
    flex-shrink: 0;
}
.aic-main-head-title { font-weight: 600; font-size: 15px; color: #2c3550; }

.aic-chip {
    margin: 10px 16px 0 16px;
    display: inline-flex;
    align-self: flex-start;
    background: #eef2ff;
    color: #4338ca;
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 12px;
}

.aic-msgs-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; }

.aic-welcome {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 24px;
    text-align: center;
}
.aic-welcome-title { font-size: 38px; font-weight: 600; color: #2c3550; }
.aic-welcome-sub {
    font-family: 'Caveat', cursive;
    font-weight: 600;
    font-size: 24px;
    color: #a9c2e8;
    line-height: 1.5;
    max-width: 480px;
}

.aic-msgs { flex: 1; overflow-y: auto; padding: 16px; display: none; flex-direction: column; gap: 10px; }
.aic-msg { max-width: 70%; padding: 10px 14px; border-radius: 12px; line-height: 1.5; word-break: break-word; }
.aic-msg.user { align-self: flex-end; background: #3d5a99; color: #fff; border-radius: 12px 12px 2px 12px; }
.aic-msg.bot { align-self: flex-start; background: #f1f5f9; color: #1e293b; border-radius: 12px 12px 12px 2px; }
.aic-msg a { color: #3d5a99; }
.aic-msg.user a { color: #cdd9f0; }
.aic-typing { align-self: flex-start; background: #f1f5f9; color: #64748b; padding: 8px 14px; border-radius: 12px; font-style: italic; font-size: 13px; }

.aic-foot { padding: 12px 16px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; flex-shrink: 0; }
.aic-inp { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 15px; resize: none; outline: none; font-family: inherit; line-height: 1.4; }
.aic-inp:focus { border-color: #3d5a99; }
.aic-snd { background: #a9c2e8; color: #2c3550; border: none; border-radius: 8px; padding: 0 20px; cursor: pointer; font-size: 14px; font-family: inherit; }
.aic-snd:hover { background: #8fb0dc; }
.aic-snd:disabled { background: #94a3b8; cursor: default; }
</style>

<div class="aic-wrap">
    <div class="aic-sidebar">
        <div class="aic-sidebar-head">
            <button class="aic-new-btn" id="aic-new">+ Neue Unterhaltung</button>
        </div>
        <div class="aic-conv-list" id="aic-conv-list">
            <div class="aic-conv-empty">Lädt…</div>
        </div>
    </div>
    <div class="aic-main">
        <div class="aic-main-head">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68" width="30" height="30" style="border-radius:50%;flex-shrink:0;">
                <defs>
                    <radialGradient id="aicBg" cx="45%" cy="38%" r="60%"><stop offset="0%" stop-color="#e0eeff"/><stop offset="100%" stop-color="#b8d4fa"/></radialGradient>
                    <radialGradient id="aicSk" cx="38%" cy="28%" r="70%"><stop offset="0%" stop-color="#fdd5a0"/><stop offset="100%" stop-color="#e8874a"/></radialGradient>
                </defs>
                <circle cx="34" cy="34" r="34" fill="url(#aicBg)"/>
                <path d="M8 68 C9 52 20 49 28 48 L34 52 L40 48 C48 49 59 52 60 68Z" fill="#3d5a99"/>
                <path d="M28 48 L34 52 L40 48 L40 55 L28 55Z" fill="#f0f4ff"/>
                <rect x="29" y="43" width="10" height="7" rx="4" fill="url(#aicSk)"/>
                <ellipse cx="34" cy="31" rx="15.5" ry="15" fill="url(#aicSk)"/>
                <ellipse cx="18.8" cy="32" rx="3" ry="4" fill="#e8874a"/><ellipse cx="49.2" cy="32" rx="3" ry="4" fill="#e8874a"/>
                <path d="M19 24 Q18 13 34 12 Q50 13 49 24 Q46 17 42 16 Q38 13 34 14 Q30 13 26 16 Q22 17 19 24Z" fill="#c8a84b"/>
                <ellipse cx="22" cy="19" rx="4" ry="4.5" fill="#c8a84b"/><ellipse cx="28" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/>
                <ellipse cx="34" cy="13.5" rx="4" ry="3.5" fill="#c8a84b"/><ellipse cx="40" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/><ellipse cx="46" cy="19" rx="4" ry="4.5" fill="#c8a84b"/>
                <ellipse cx="28" cy="30" rx="4.5" ry="4.2" fill="#fff"/><ellipse cx="40" cy="30" rx="4.5" ry="4.2" fill="#fff"/>
                <circle cx="28.5" cy="30.5" r="2.8" fill="#2d6a4f"/><circle cx="40.5" cy="30.5" r="2.8" fill="#2d6a4f"/>
                <circle cx="28.8" cy="30.8" r="1.5" fill="#0d1a12"/><circle cx="41" cy="30.8" r="1.5" fill="#0d1a12"/>
                <circle cx="29.8" cy="29.5" r="0.9" fill="#fff"/><circle cx="42" cy="29.5" r="0.9" fill="#fff"/>
                <rect x="22.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>
                <rect x="34.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>
                <line x1="33.5" y1="29.5" x2="34.5" y2="29.5" stroke="#2d2d2d" stroke-width="1.5"/>
                <ellipse cx="34" cy="37" rx="3.2" ry="2.2" fill="#d0733a"/>
                <path d="M22 39 Q22 47 34 48 Q46 47 46 39 Q43 43 34 44 Q25 43 22 39Z" fill="#b8922a"/>
                <path d="M26 41.5 Q34 50 42 41.5" fill="#b04820"/>
                <path d="M27.5 42 Q34 48 40.5 42 Q34 46 27.5 42Z" fill="#fff"/>
            </svg>
            <span class="aic-main-head-title">KleSec KI-Assistent</span>
        </div>
        <div id="aic-chip-holder"></div>
        <div class="aic-msgs-wrap">
            <div class="aic-welcome" id="aic-welcome">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68" width="64" height="64" style="border-radius:50%;">
                    <circle cx="34" cy="34" r="34" fill="url(#aicBg)"/>
                    <path d="M8 68 C9 52 20 49 28 48 L34 52 L40 48 C48 49 59 52 60 68Z" fill="#3d5a99"/>
                    <path d="M28 48 L34 52 L40 48 L40 55 L28 55Z" fill="#f0f4ff"/>
                    <rect x="29" y="43" width="10" height="7" rx="4" fill="url(#aicSk)"/>
                    <ellipse cx="34" cy="31" rx="15.5" ry="15" fill="url(#aicSk)"/>
                    <ellipse cx="18.8" cy="32" rx="3" ry="4" fill="#e8874a"/><ellipse cx="49.2" cy="32" rx="3" ry="4" fill="#e8874a"/>
                    <path d="M19 24 Q18 13 34 12 Q50 13 49 24 Q46 17 42 16 Q38 13 34 14 Q30 13 26 16 Q22 17 19 24Z" fill="#c8a84b"/>
                    <ellipse cx="22" cy="19" rx="4" ry="4.5" fill="#c8a84b"/><ellipse cx="28" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/>
                    <ellipse cx="34" cy="13.5" rx="4" ry="3.5" fill="#c8a84b"/><ellipse cx="40" cy="15" rx="4.5" ry="4" fill="#dbbe6a"/><ellipse cx="46" cy="19" rx="4" ry="4.5" fill="#c8a84b"/>
                    <ellipse cx="28" cy="30" rx="4.5" ry="4.2" fill="#fff"/><ellipse cx="40" cy="30" rx="4.5" ry="4.2" fill="#fff"/>
                    <circle cx="28.5" cy="30.5" r="2.8" fill="#2d6a4f"/><circle cx="40.5" cy="30.5" r="2.8" fill="#2d6a4f"/>
                    <circle cx="28.8" cy="30.8" r="1.5" fill="#0d1a12"/><circle cx="41" cy="30.8" r="1.5" fill="#0d1a12"/>
                    <circle cx="29.8" cy="29.5" r="0.9" fill="#fff"/><circle cx="42" cy="29.5" r="0.9" fill="#fff"/>
                    <rect x="22.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>
                    <rect x="34.5" y="26" width="11" height="8.5" rx="2.8" fill="none" stroke="#2d2d2d" stroke-width="1.5"/>
                    <line x1="33.5" y1="29.5" x2="34.5" y2="29.5" stroke="#2d2d2d" stroke-width="1.5"/>
                    <ellipse cx="34" cy="37" rx="3.2" ry="2.2" fill="#d0733a"/>
                    <path d="M22 39 Q22 47 34 48 Q46 47 46 39 Q43 43 34 44 Q25 43 22 39Z" fill="#b8922a"/>
                    <path d="M26 41.5 Q34 50 42 41.5" fill="#b04820"/>
                    <path d="M27.5 42 Q34 48 40.5 42 Q34 46 27.5 42Z" fill="#fff"/>
                </svg>
                <div class="aic-welcome-title">Womit kann ich dir helfen?</div>
                <div class="aic-welcome-sub">Frag mich nach Rechnungen, Angeboten und dem ganzen anderen Kram, ich antworte dir schon.<br>Mensch, lass uns einfach über alles quatschen, was <span id="aic-mit-anchor">mit</span> unserem Espo zu tun hat.</div>
                <div class="aic-signature" id="aic-signature">Dein zauberhafter KI-Assistent</div>
            </div>
            <div class="aic-msgs" id="aic-msgs"></div>
        </div>
        <div class="aic-foot">
            <textarea class="aic-inp" id="aic-inp" rows="2" placeholder="Ich bin ganz Ohr…"></textarea>
            <button class="aic-snd" id="aic-snd">Senden</button>
        </div>
    </div>
    <div class="aic-modal-overlay" id="aic-confirm-modal">
        <div class="aic-modal">
            <div class="aic-modal-text" id="aic-confirm-text">Diese Unterhaltung wirklich löschen?</div>
            <div class="aic-modal-buttons">
                <button class="aic-modal-btn aic-modal-btn-yes" id="aic-confirm-yes">Ja</button>
                <button class="aic-modal-btn aic-modal-btn-no" id="aic-confirm-no">Abbrechen</button>
            </div>
        </div>
    </div>
</div>
