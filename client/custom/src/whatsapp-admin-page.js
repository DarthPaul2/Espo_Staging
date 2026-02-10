Espo.define('custom:whatsapp-admin-page', [], function () {

    function $(id) { return document.getElementById(id); }

    const BASE_URL = 'https://klesec.pagekite.me';

    let _loaderCount = 0;

    let _currentReportMsgId = null;
    let _currentReportMeta = null;

    // ===== Annotieren (fabric.js) =====
    let _fabricCanvas = null;
    let _undoStack = [];
    let _annotationCtx = null; // {image_id, image_index, image_url}

    function showLoader(message) {
        _loaderCount++;
        const o = $('loaderOverlay');
        const m = $('loaderMessage');
        if (!o) return;
        if (message && m) m.textContent = message;
        o.hidden = false;
    }

    function hideLoader() {
        _loaderCount = Math.max(0, _loaderCount - 1);
        if (_loaderCount === 0) {
            const o = $('loaderOverlay');
            if (o) o.hidden = true;
        }
    }

    async function fetchJson(url, options) {
        const res = await fetch(url, options || {});
        const txt = await res.text();
        let data;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
        if (!res.ok) {
            const msg = (data && data.error) ? data.error : (res.status + ' ' + res.statusText);
            throw new Error(msg);
        }
        return data;
    }

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function absUrl(u) {
        if (!u) return '';
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
        if (u.startsWith('/')) return BASE_URL + u;
        return BASE_URL + '/' + u;
    }

    // ---------- PDF CELL ----------
    function buildPdfCell(msg) {
        if (!msg || !msg.bericht_in_db || !msg.pdf_url) return '-';
        const href = String(msg.pdf_url).startsWith('http') ? msg.pdf_url : (BASE_URL + String(msg.pdf_url));
        return '<a href="' + escapeHtml(href) + '" target="_blank" class="button-link-green">Bericht (PDF)</a>';
    }

    // ---------- MEDIA CELL ----------
    function buildMediaCell(msg) {
        const urls = Array.isArray(msg.media_urls) ? msg.media_urls : [];
        const types = Array.isArray(msg.media_types) ? msg.media_types : [];

        if (!urls.length) return '-';

        const parts = urls.map(function (url, i) {
            const type = types[i] || 'image';
            const resolved = absUrl(url);
            const safeUrl = escapeHtml(resolved);

            if (type === 'image') {
                return (
                    '<a href="' + safeUrl + '" target="_blank" style="display:inline-block;width:90px;height:90px;margin:3px;">' +
                    '<img src="' + safeUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />' +
                    '</a>'
                );
            }
            if (type === 'video') {
                return (
                    '<div style="display:inline-block;width:140px;height:90px;margin:3px;">' +
                    '<video controls style="width:100%;height:100%;object-fit:cover;border-radius:6px;">' +
                    '<source src="' + safeUrl + '" type="video/mp4">' +
                    '</video>' +
                    '</div>'
                );
            }
            return (
                '<audio controls preload="none" style="height:32px; min-width:220px;">' +
                '<source src="' + safeUrl + '">' +
                '</audio>'
            );
        });

        return '<div style="display:flex;flex-wrap:wrap;gap:6px; align-items:center;">' + parts.join('') + '</div>';
    }

    // ---------- TABLE RENDER ----------
    function renderRows(rows) {
        const tbody = document.querySelector('#whatsappTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        rows.forEach(function (msg) {
            const tr = document.createElement('tr');

            const date = msg.timestamp ? new Date(msg.timestamp).toLocaleString('de-DE') : '-';
            const technikerName = msg.techniker_name || 'Unbekannt';
            const text = msg.message_text || '-';

            const groupKey = msg.whatsapp_group_key || '';
            const msgId = msg.id;

            const einzelUrl = msg.pdf_url ? absUrl(msg.pdf_url) : '';
            const sammelUrl = msg.sammel_pdf_url ? absUrl(msg.sammel_pdf_url) : '';
            const sammelLabel = msg.sammel_label || 'Sammelbericht (PDF)';

            const pdfCellHtml = (function () {
                const parts = [];

                if (einzelUrl) {
                    parts.push(
                        '<a href="' + escapeHtml(einzelUrl) + '" target="_blank" style="font-weight:700; color:#0275d8; text-decoration:none;">Bericht (PDF)</a>'
                    );
                } else {
                    parts.push('<span style="color:#888;">-</span>');
                }

                if (sammelUrl) {
                    parts.push(
                        '<a href="' + escapeHtml(sammelUrl) + '" target="_blank" style="font-weight:800; color:#16b900; text-decoration:none;">' +
                        escapeHtml(sammelLabel) +
                        '</a>'
                    );
                }

                return '<div style="display:flex; flex-direction:column; gap:6px;">' + parts.join('') + '</div>';
            })();

            tr.innerHTML =
                '<td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">' +
                '<input type="checkbox" class="rowChk" data-key="' + escapeHtml(groupKey) + '" data-id="' + escapeHtml(String(msgId)) + '">' +
                '</td>' +
                '<td style="padding:8px; border-bottom:1px solid #eee; white-space:nowrap;">' + escapeHtml(date) + '</td>' +
                '<td style="padding:8px; border-bottom:1px solid #eee; white-space:nowrap;">' + escapeHtml(technikerName) + '</td>' +
                '<td style="padding:8px; border-bottom:1px solid #eee; word-break:break-word; white-space:pre-wrap;">' + escapeHtml(text) + '</td>' +
                '<td style="padding:8px; border-bottom:1px solid #eee;">' + buildMediaCell(msg) + '</td>' +
                '<td style="padding:8px; border-bottom:1px solid #eee; white-space:nowrap;">' + pdfCellHtml + '</td>' +
                '<td style="padding:8px; border-bottom:1px solid #eee; white-space:nowrap;">' +
                '<div style="display:flex; flex-direction:column; gap:8px; align-items:flex-start;">' +
                '<button data-action="delete" data-key="' + escapeHtml(groupKey) + '" style="padding:6px 10px; cursor:pointer;">🗑️ Löschen</button>' +
                '<button data-action="ki-report" data-id="' + escapeHtml(String(msgId)) + '" style="padding:6px 10px; cursor:pointer; background:#0275d8; color:#fff; border:none; border-radius:8px; font-weight:700;">KI Bericht</button>' +
                '</div>' +
                '</td>';


            tbody.appendChild(tr);
        });
    }

    // ---------- LOAD TECHNICIANS ----------
    function fillTechniciansFromRows(rows) {
        const sel = $('searchTechnician');
        if (!sel) return;

        const currentVal = sel.value || 'alle';

        const map = {};
        rows.forEach(function (r) {
            if (r && r.techniker_id) {
                map[String(r.techniker_id)] = r.techniker_name || ('Techniker #' + r.techniker_id);
            }
        });

        sel.innerHTML = '<option value="alle">Alle Techniker</option>';
        Object.keys(map).sort().forEach(function (id) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = map[id];
            sel.appendChild(opt);
        });

        if (currentVal && currentVal !== 'alle') sel.value = currentVal;
    }

    // ---------- LOAD WHATSAPP ----------
    async function loadWhatsappMessages() {
        const techSel = $('searchTechnician');
        const dateInp = $('searchDate');

        const params = new URLSearchParams();
        const technikerId = techSel ? techSel.value : 'alle';
        const datum = dateInp ? dateInp.value : '';

        if (technikerId && technikerId !== 'alle') params.append('techniker_id', technikerId);
        if (datum) params.append('datum', datum);

        const url = BASE_URL + '/api/whatsapp' + (params.toString() ? ('?' + params.toString()) : '');

        showLoader('Nachrichten werden geladen…');
        try {
            const data = await fetchJson(url);
            const rows = Array.isArray(data) ? data : [];
            fillTechniciansFromRows(rows);
            renderRows(rows);
        } finally {
            hideLoader();
        }
    }

    // ---------- CLIENTS INTO SELECT ----------
    async function loadClientsIntoSelect() {
        const sel = $('kundenSelect');
        if (!sel) return;
        if (sel.dataset && sel.dataset.loaded === '1') return;

        showLoader('Kundenliste wird geladen…');
        try {
            const list = await fetchJson(BASE_URL + '/api/whatsapp/clients');

            sel.innerHTML = '<option value="">Bitte wählen...</option>';

            (Array.isArray(list) ? list : [])
                .filter(x => x && x.id != null && x.name)
                .forEach(function (c) {
                    const opt = document.createElement('option');
                    opt.value = String(c.id);
                    opt.textContent = c.name;
                    sel.appendChild(opt);
                });

            if (sel.dataset) sel.dataset.loaded = '1';
        } finally {
            hideLoader();
        }
    }

    function openReportModal() {
        const m = $('reportModal');
        if (!m) return;
        m.style.display = 'block';
        loadClientsIntoSelect().catch(function (e) { console.error(e); });
    }

    function closeReportModal() {
        const m = $('reportModal');
        if (!m) return;
        m.style.display = 'none';
    }

    // ---------- SAMMELBERICHT MODAL ----------
    function openSammelModal() {
        const m = $('sammelModal');
        if (m) m.style.display = 'block';
    }
    function closeSammelModal() {
        const m = $('sammelModal');
        if (m) m.style.display = 'none';
    }

    async function loadClientsIntoSammelSelect() {
        const sel = $('sammelKundenSelect');
        if (!sel) return;
        if (sel.dataset && sel.dataset.loaded === '1') return;

        showLoader('Kundenliste wird geladen…');
        try {
            const list = await fetchJson(BASE_URL + '/api/whatsapp/clients');

            sel.innerHTML = '<option value="">Bitte wählen...</option>';

            (Array.isArray(list) ? list : [])
                .filter(x => x && x.id != null && x.name)
                .forEach(function (c) {
                    const opt = document.createElement('option');
                    opt.value = String(c.id);
                    opt.textContent = c.name;
                    sel.appendChild(opt);
                });

            if (sel.dataset) sel.dataset.loaded = '1';
        } finally {
            hideLoader();
        }
    }

    function bindSammelModalUiOnce() {
        const x = $('btnCloseSammel');
        if (x) x.addEventListener('click', closeSammelModal);

        const c = $('btnCancelSammel');
        if (c) c.addEventListener('click', closeSammelModal);

        const ok = $('btnConfirmSammel');
        if (ok) {
            ok.addEventListener('click', function () {
                // подтверждение запускаем внутри createSammelberichtFlow через флаг
                // здесь ничего не делаем — обработчик будет в createSammelberichtFlow
            });
        }
    }

    // ---------- KI REPORT ----------
    async function openKiReportForMessage(msgId) {
        _currentReportMsgId = msgId;
        _currentReportMeta = null;

        showLoader('KI Bericht wird erstellt…');
        try {
            const data = await fetchJson(BASE_URL + '/api/whatsapp/' + msgId + '/bericht_text');

            _currentReportMeta = {
                techniker: data.techniker || 'Unbekannt',
                datum: data.datum || '',
                bilder: Array.isArray(data.bilder) ? data.bilder : []
            };

            if ($('reportTechniker')) $('reportTechniker').textContent = _currentReportMeta.techniker;
            if ($('reportDatum')) $('reportDatum').textContent = _currentReportMeta.datum;

            const editor = $('berichtEditor');
            if (editor) editor.value = data.bericht_text || '';

            renderReportImages(_currentReportMeta.bilder);
            openReportModal();
        } finally {
            hideLoader();
        }
    }

    function renderReportImages(bilder) {
        const wrap = $('berichtImages');
        if (!wrap) return;
        wrap.innerHTML = '';

        if (!bilder || !bilder.length) {
            wrap.innerHTML = '<div style="color:#666; font-size:13px;">Keine Bilder.</div>';
            return;
        }

        const grid = document.createElement('div');
        grid.style.display = 'flex';
        grid.style.flexWrap = 'wrap';
        grid.style.gap = '10px';

        bilder.forEach(function (b) {
            const url = absUrl(b.url);
            const card = document.createElement('div');
            card.style.width = '190px';
            card.style.border = '1px solid #ddd';
            card.style.borderRadius = '10px';
            card.style.padding = '8px';
            card.style.background = '#fff';

            const msgId = b.msg_id;
            const idx = b.index;

            card.innerHTML =
                '<a href="' + escapeHtml(url) + '" target="_blank">' +
                '<img src="' + escapeHtml(url) + '" style="width:100%; height:130px; object-fit:cover; border-radius:8px;" />' +
                '</a>' +
                '<div style="margin-top:6px; font-size:12px; color:#333;">' +
                (b.comment ? ('<i>Kommentar:</i> ' + escapeHtml(b.comment)) : '<span style="color:#777;">(kein Kommentar)</span>') +
                '</div>' +
                '<div style="margin-top:8px; display:flex; gap:8px;">' +
                '<button data-action="annotate" data-msg-id="' + escapeHtml(String(msgId)) + '" data-index="' + escapeHtml(String(idx)) + '" data-url="' + escapeHtml(url) + '"' +
                ' style="padding:6px 10px; border:none; border-radius:999px; cursor:pointer; background:#16b900; color:#fff; font-weight:800; font-size:12px;">' +
                '✍️ Annotieren</button>' +
                '</div>';

            grid.appendChild(card);
        });

        wrap.appendChild(grid);
    }

    // ---------- PDF HELPERS ----------
    async function fetchAsDataUrl(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Media download failed: ' + res.status);
        const blob = await res.blob();
        return await new Promise(function (resolve, reject) {
            const r = new FileReader();
            r.onload = function () { resolve(String(r.result)); };
            r.onerror = reject;
            r.readAsDataURL(blob);
        });
    }

    async function buildBase64ImagesForReport() {
        const bilder = (_currentReportMeta && Array.isArray(_currentReportMeta.bilder)) ? _currentReportMeta.bilder : [];
        if (!bilder.length) return [];

        const out = [];
        for (let i = 0; i < bilder.length; i++) {
            const b = bilder[i];
            if (!b || !b.url) continue;

            try {
                const dataUrl = await fetchAsDataUrl(absUrl(b.url));
                out.push({ base64: dataUrl, kommentar: b.comment || '' });
            } catch (e) {
                console.warn('Bild konnte nicht als base64 geladen werden:', b.url, e);
            }
        }
        return out;
    }

    // ---------- PREVIEW / SAVE ----------
    async function previewPdf() {
        if (!_currentReportMsgId) return;

        const editor = $('berichtEditor');
        const kundenSel = $('kundenSelect');

        const berichtText = editor ? editor.value : '';
        const kundenId = kundenSel ? kundenSel.value : '';

        const payload = {
            bericht_text: berichtText,
            bilder: await buildBase64ImagesForReport(),
            techniker: _currentReportMeta ? _currentReportMeta.techniker : 'Unbekannt',
            datum: (_currentReportMeta && _currentReportMeta.datum) ? _currentReportMeta.datum.split(' ')[0] : '',
            kunden_id: kundenId || null
        };

        showLoader('PDF Vorschau wird erzeugt…');
        try {
            const res = await fetch(BASE_URL + '/api/whatsapp/' + _currentReportMsgId + '/report_custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || (res.status + ' ' + res.statusText));
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } finally {
            hideLoader();
        }
    }

    async function savePdf() {
        if (!_currentReportMsgId) return;

        const editor = $('berichtEditor');
        const kundenSel = $('kundenSelect');

        const berichtText = editor ? editor.value : '';
        const kundenId = kundenSel ? kundenSel.value : '';

        if (!kundenId) {
            alert('Bitte zuerst einen Kunden auswählen.');
            return;
        }

        const payload = {
            kunden_id: kundenId,
            bericht_text: berichtText,
            bilder: await buildBase64ImagesForReport()
        };

        showLoader('PDF wird gespeichert…');
        try {
            const data = await fetchJson(BASE_URL + '/api/whatsapp/' + _currentReportMsgId + '/save_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            alert('Gespeichert: ' + (data.pdf_url || 'OK'));
            closeReportModal();
            await loadWhatsappMessages();
        } finally {
            hideLoader();
        }
    }

    async function createSammelberichtFlow() {
        const keys = getSelectedGroupKeys();
        if (keys.length < 2) {
            alert('Bitte mindestens 2 Zeilen auswählen (Checkbox).');
            return;
        }

        // 1) Открываем модалку + грузим клиентов
        openSammelModal();
        await loadClientsIntoSammelSelect();

        // 2) Пробуем предложить клиента автоматически
        try {
            const resp = await fetchJson(BASE_URL + '/api/whatsapp/sammelbericht/suggest_client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_keys: keys })
            });

            const sel = $('sammelKundenSelect');
            const hint = $('sammelKundenHint');

            if (resp && Array.isArray(resp.suggestions) && resp.suggestions.length) {
                const best = resp.suggestions[0];
                if (sel) sel.value = String(best.id);
                if (hint) hint.textContent = 'Vorschlag erkannt: ' + best.name;
            } else {
                if (hint) hint.textContent = 'Kein sicherer Vorschlag gefunden – bitte Kunde auswählen.';
            }
        } catch (e) {
            console.warn('suggest_client failed:', e);
        }

        // 3) Ждём подтверждения в модалке (одноразово)
        const okBtn = $('btnConfirmSammel');
        if (!okBtn) return;

        const handler = async function () {
            okBtn.removeEventListener('click', handler);

            const kundenId = $('sammelKundenSelect') ? ($('sammelKundenSelect').value || '') : '';
            const objektName = $('sammelObjektInput') ? ($('sammelObjektInput').value || '').trim() : '';

            if (!kundenId) {
                alert('Bitte Kunde auswählen.');
                okBtn.addEventListener('click', handler);
                return;
            }

            closeSammelModal();

            // 4) check conflicts
            showLoader('Prüfe bestehende Sammelberichte…');
            let check;
            try {
                check = await fetchJson(BASE_URL + '/api/whatsapp/sammelbericht/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_keys: keys })
                });
            } finally {
                hideLoader();
            }

            let replaceFlag = false;
            if (check && check.conflicts && check.conflicts > 0) {
                replaceFlag = confirm('Sammelbericht existiert bereits. Möchten Sie ihn ersetzen?');
                if (!replaceFlag) return;
            }

            // 5) save
            showLoader(replaceFlag ? 'Sammelbericht wird ersetzt…' : 'Sammelbericht wird erstellt…');
            try {
                const saved = await fetchJson(BASE_URL + '/api/whatsapp/sammelbericht/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        group_keys: keys,
                        kunden_id: kundenId,
                        objekt_name: objektName,
                        replace: replaceFlag
                    })
                });

                alert('Gespeichert: ' + (saved.sammel_pdf_url || 'OK'));
                await loadWhatsappMessages();
            } finally {
                hideLoader();
            }
        };

        okBtn.addEventListener('click', handler);
    }



    // ===== Annotieren =====
    function openAnnotationModal() {
        const m = $('annotationModal');
        if (m) m.style.display = 'block';
    }

    function closeAnnotationModal() {
        const m = $('annotationModal');
        if (m) m.style.display = 'none';
        _annotationCtx = null;
        _undoStack = [];
        if (_fabricCanvas) {
            _fabricCanvas.dispose();
            _fabricCanvas = null;
        }
    }

    function setActiveToolButton(tool) {
        const tb = document.querySelectorAll('#annotationToolbar .tool-btn');
        tb.forEach(function (b) {
            if (b.dataset && b.dataset.tool) {
                b.classList.toggle('active', b.dataset.tool === tool);
            }
        });
    }

    function ensureFabricLoaded() {
        return new Promise(function (resolve, reject) {
            if (window.fabric && window.fabric.Canvas) return resolve();

            const s = document.createElement('script');
            s.src = '/client/custom/lib/fabric.min.js'; // CSP-safe
            s.onload = function () { resolve(); };
            s.onerror = function () { reject(new Error('fabric.js konnte nicht geladen werden (self)')); };
            document.head.appendChild(s);
        });
    }

    async function openAnnotateEditor(msgId, imageIndex, imageUrl) {
        await ensureFabricLoaded();

        _annotationCtx = {
            image_id: Number(msgId),
            image_index: Number(imageIndex),
            image_url: String(imageUrl || '')
        };

        const commentField = $('annotationComment');
        if (commentField) commentField.value = '';

        openAnnotationModal();

        const canvasEl = $('annotationCanvas');
        if (!canvasEl) throw new Error('annotationCanvas nicht gefunden');

        _fabricCanvas = new fabric.Canvas('annotationCanvas', {
            selection: true,
            preserveObjectStacking: true
        });

        _undoStack = [];
        pushUndoSnapshot(); // базовый снимок

        _fabricCanvas.on('object:added', pushUndoSnapshot);
        _fabricCanvas.on('object:modified', pushUndoSnapshot);
        _fabricCanvas.on('object:removed', pushUndoSnapshot);

        showLoader('Bild wird geladen…');
        try {
            await new Promise(function (resolve, reject) {
                fabric.Image.fromURL(_annotationCtx.image_url, function (img) {
                    try {
                        const maxW = 760;
                        const maxH = 560;

                        const w = img.width || 800;
                        const h = img.height || 600;

                        const scale = Math.min(maxW / w, maxH / h, 1);

                        const cw = Math.round(w * scale);
                        const ch = Math.round(h * scale);

                        _fabricCanvas.setWidth(cw);
                        _fabricCanvas.setHeight(ch);

                        img.set({
                            left: 0,
                            top: 0,
                            selectable: false,
                            evented: false,
                            scaleX: scale,
                            scaleY: scale
                        });

                        _fabricCanvas.setBackgroundImage(img, _fabricCanvas.renderAll.bind(_fabricCanvas));
                        resolve();
                    } catch (e) { reject(e); }
                }, { crossOrigin: 'anonymous' });
            });
        } finally {
            hideLoader();
        }

        activateTool('select');
    }

    function pushUndoSnapshot() {
        if (!_fabricCanvas) return;
        const json = _fabricCanvas.toJSON();
        _undoStack.push(json);
        if (_undoStack.length > 30) _undoStack.shift();
    }

    function undoLast() {
        if (!_fabricCanvas) return;
        if (_undoStack.length < 2) return;
        _undoStack.pop();
        const prev = _undoStack[_undoStack.length - 1];
        _fabricCanvas.loadFromJSON(prev, function () {
            _fabricCanvas.renderAll();
        });
    }

    function deleteSelected() {
        if (!_fabricCanvas) return;
        const obj = _fabricCanvas.getActiveObject();
        if (obj) _fabricCanvas.remove(obj);
    }

    function _eraserHandler(opt) {
        if (!_fabricCanvas) return;
        const t = opt.target;
        if (t && t.evented !== false && t.selectable !== false) {
            _fabricCanvas.remove(t);
        }
    }

    function activateTool(tool) {
        if (!_fabricCanvas) return;

        setActiveToolButton(tool);

        _fabricCanvas.isDrawingMode = false;
        _fabricCanvas.selection = true;
        _fabricCanvas.defaultCursor = 'default';

        // снять eraser
        _fabricCanvas.off('mouse:down', _eraserHandler);

        const color = ($('toolColor') && $('toolColor').value) ? $('toolColor').value : '#ff0000';
        const size = ($('toolSize') && $('toolSize').value) ? Number($('toolSize').value) : 4;

        if (tool === 'select') return;

        if (tool === 'pen') {
            _fabricCanvas.isDrawingMode = true;
            _fabricCanvas.freeDrawingBrush.color = color;
            _fabricCanvas.freeDrawingBrush.width = size;
            return;
        }

        if (tool === 'eraser') {
            _fabricCanvas.defaultCursor = 'not-allowed';
            _fabricCanvas.on('mouse:down', _eraserHandler);
            return;
        }

        if (tool === 'arrow') {
            _fabricCanvas.defaultCursor = 'crosshair';
            enableArrowDrawing(color, size);
            return;
        }
    }

    function enableArrowDrawing(color, size) {
        if (!_fabricCanvas) return;

        let isDown = false;
        let line, head1, head2;
        let startX, startY;

        function clearTemp() {
            if (line) _fabricCanvas.remove(line);
            if (head1) _fabricCanvas.remove(head1);
            if (head2) _fabricCanvas.remove(head2);
            line = head1 = head2 = null;
        }

        _fabricCanvas.off('mouse:down', _arrowDown);
        _fabricCanvas.off('mouse:move', _arrowMove);
        _fabricCanvas.off('mouse:up', _arrowUp);

        function _arrowDown(o) {
            isDown = true;
            const p = _fabricCanvas.getPointer(o.e);
            startX = p.x; startY = p.y;

            clearTemp();

            line = new fabric.Line([startX, startY, startX, startY], {
                stroke: color, strokeWidth: size, selectable: false, evented: false
            });
            _fabricCanvas.add(line);
        }

        function _arrowMove(o) {
            if (!isDown || !line) return;
            const p = _fabricCanvas.getPointer(o.e);
            line.set({ x2: p.x, y2: p.y });

            if (head1) _fabricCanvas.remove(head1);
            if (head2) _fabricCanvas.remove(head2);

            const angle = Math.atan2(p.y - startY, p.x - startX);
            const len = 14 + size * 1.2;
            const a1 = angle + Math.PI * 0.85;
            const a2 = angle - Math.PI * 0.85;

            head1 = new fabric.Line([p.x, p.y, p.x + len * Math.cos(a1), p.y + len * Math.sin(a1)], {
                stroke: color, strokeWidth: size, selectable: false, evented: false
            });
            head2 = new fabric.Line([p.x, p.y, p.x + len * Math.cos(a2), p.y + len * Math.sin(a2)], {
                stroke: color, strokeWidth: size, selectable: false, evented: false
            });

            _fabricCanvas.add(head1);
            _fabricCanvas.add(head2);
            _fabricCanvas.renderAll();
        }

        function _arrowUp() {
            if (!isDown) return;
            isDown = false;

            if (line && head1 && head2) {
                const g = new fabric.Group([line, head1, head2], { selectable: true });
                _fabricCanvas.remove(line);
                _fabricCanvas.remove(head1);
                _fabricCanvas.remove(head2);
                _fabricCanvas.add(g);
                _fabricCanvas.setActiveObject(g);
                _fabricCanvas.renderAll();
            }
        }

        _fabricCanvas.on('mouse:down', _arrowDown);
        _fabricCanvas.on('mouse:move', _arrowMove);
        _fabricCanvas.on('mouse:up', _arrowUp);
    }

    async function saveAnnotatedImage() {
        if (!_annotationCtx || !_fabricCanvas) return;

        const comment = ($('annotationComment') && $('annotationComment').value) ? $('annotationComment').value.trim() : '';
        const dataUrl = _fabricCanvas.toDataURL({ format: 'jpeg', quality: 0.9 });

        showLoader('Speichern…');
        try {
            await fetchJson(BASE_URL + '/api/whatsapp/save_annotated_image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_id: _annotationCtx.image_id,
                    image_index: _annotationCtx.image_index,
                    image_base64: dataUrl,
                    kommentar: comment
                })
            });

            closeAnnotationModal();

            if (_currentReportMsgId) {
                await openKiReportForMessage(_currentReportMsgId);
            }
        } finally {
            hideLoader();
        }
    }

    function getSelectedGroupKeys() {
        const boxes = document.querySelectorAll('#whatsappTable tbody .rowChk:checked');
        const keys = [];
        boxes.forEach(function (b) {
            const k = b.dataset ? (b.dataset.key || '') : '';
            if (k) keys.push(k);
        });
        return keys;
    }

    function setAllRowCheckboxes(checked) {
        const boxes = document.querySelectorAll('#whatsappTable tbody .rowChk');
        boxes.forEach(function (b) { b.checked = !!checked; });
    }



    // ---------- BIND UI ----------
    function bindUi() {
        ensureTableHeader();
        bindSammelModalUiOnce();

        const btnApply = $('btnApplyFilter');
        if (btnApply) btnApply.addEventListener('click', function () {
            loadWhatsappMessages().catch(function (e) { console.error(e); alert('Fehler: ' + e.message); });
        });

        const chkAll = $('chkAllRows');
        if (chkAll) {
            chkAll.addEventListener('change', function () {
                setAllRowCheckboxes(chkAll.checked);
            });
        }

        const btnSammel = $('btnCreateSammelbericht');
        if (btnSammel) {
            btnSammel.addEventListener('click', function () {
                createSammelberichtFlow().catch(function (e) {
                    console.error(e);
                    alert('Fehler: ' + e.message);
                });
            });
        }

        const btnClose = $('btnCloseReport');
        if (btnClose) btnClose.addEventListener('click', closeReportModal);

        const btnCancel = $('btnCancelReport');
        if (btnCancel) btnCancel.addEventListener('click', closeReportModal);

        const btnPreview = $('btnPreviewPdf');
        if (btnPreview) btnPreview.addEventListener('click', function () {
            previewPdf().catch(function (e) { console.error(e); alert('Fehler: ' + e.message); });
        });

        const btnSave = $('btnSaveReport');
        if (btnSave) btnSave.addEventListener('click', function () {
            savePdf().catch(function (e) { console.error(e); alert('Fehler: ' + e.message); });
        });

        const berichtImages = $('berichtImages');
        if (berichtImages) {
            berichtImages.addEventListener('click', function (e) {
                const btn = e.target && e.target.closest ? e.target.closest('button[data-action]') : null;
                if (!btn || !btn.dataset) return;

                if (btn.dataset.action === 'annotate') {
                    const mid = btn.dataset.msgId;
                    const idx = btn.dataset.index;
                    const url = btn.dataset.url;
                    console.log('ANNOTATE CLICK', { mid, idx, url });

                    openAnnotateEditor(mid, idx, url).catch(function (err) {
                        console.error(err);
                        alert('Fehler: ' + err.message);
                    });
                }
            });
        }

        const btnCloseAnn = $('btnCloseAnnotation');
        if (btnCloseAnn) btnCloseAnn.addEventListener('click', closeAnnotationModal);

        const btnCancelAnn = $('btnCancelAnnotation');
        if (btnCancelAnn) btnCancelAnn.addEventListener('click', closeAnnotationModal);

        const btnSaveAnn = $('btnSaveAnnotated');
        if (btnSaveAnn) btnSaveAnn.addEventListener('click', function () {
            saveAnnotatedImage().catch(function (e) { console.error(e); alert('Fehler: ' + e.message); });
        });

        const toolbar = document.getElementById('annotationToolbar');
        if (toolbar) {
            toolbar.addEventListener('click', function (ev) {
                const t = ev.target;
                if (!t || !t.dataset || !t.dataset.tool) return;
                activateTool(t.dataset.tool);
            });
        }

        const undoBtn = $('undoBtn');
        if (undoBtn) undoBtn.addEventListener('click', undoLast);

        const delSelBtn = $('deleteSelectedBtn');
        if (delSelBtn) delSelBtn.addEventListener('click', deleteSelected);

        const table = $('whatsappTable');
        if (table) {
            table.addEventListener('click', function (e) {
                const t = e.target;
                if (!t || !t.dataset) return;

                if (t.dataset.action === 'delete') {
                    const key = t.dataset.key || '';
                    if (!key) return;
                    if (!confirm('Gruppe wirklich löschen?')) return;

                    showLoader('Gruppe wird gelöscht…');
                    fetchJson(BASE_URL + '/api/whatsapp/delete_group', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ whatsapp_group_key: key })
                    })
                        .then(function () { return loadWhatsappMessages(); })
                        .catch(function (err) { console.error(err); alert('Fehler: ' + err.message); })
                        .finally(function () { hideLoader(); });
                }

                if (t.dataset.action === 'ki-report') {
                    const id = t.dataset.id;
                    if (!id) return;
                    openKiReportForMessage(id).catch(function (err) {
                        console.error(err);
                        alert('Fehler: ' + err.message);
                    });
                }
            });
        }

        loadWhatsappMessages().catch(function (e) {
            console.error(e);
            alert('Fehler: ' + e.message);
        });
    }

    function ensureTableHeader() {
        const table = document.getElementById('whatsappTable');
        if (!table) return;

        let thead = table.querySelector('thead');
        if (!thead) {
            thead = document.createElement('thead');
            table.insertBefore(thead, table.firstChild);
        }

        // если th уже есть — ничего не делаем
        if (thead.querySelector('th')) return;

        thead.innerHTML =
            '<tr>' +
            '<th>Datum</th>' +
            '<th>Techniker</th>' +
            '<th>Nachricht</th>' +
            '<th>Medien</th>' +
            '<th>PDF Bericht</th>' +
            '<th>Aktion</th>' +
            '</tr>';
    }

    function updateSammelButtonState() {
        const checked = document.querySelectorAll('.rowChk:checked').length;
        const btn = document.getElementById('btnCreateSammelbericht');
        const hint = document.getElementById('sammelHint');
        if (!btn) return;

        btn.disabled = checked < 2;
        if (hint) {
            hint.textContent = checked < 2
                ? 'Mehrere Einträge auswählen, um einen Sammelbericht zu erstellen.'
                : `Ausgewählt: ${checked} – Sammelbericht kann erstellt werden.`;
        }
    }

    // реагируем на клики по чекбоксам (включая динамически созданные строки)
    document.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('rowChk')) {
            updateSammelButtonState();
        }
    });

    // "Alle auswählen"
    const chkAll = document.getElementById('chkAllRows');
    if (chkAll) {
        chkAll.addEventListener('change', () => {
            document.querySelectorAll('.rowChk').forEach(chk => chk.checked = chkAll.checked);
            updateSammelButtonState();
        });
    }

    // ===== ВОТ ЭТО ДОЛЖНО БЫТЬ В САМОМ КОНЦЕ =====
    return {
        init: function () {
            setTimeout(bindUi, 0);
            console.log('WHATSAPP ADMIN PAGE: init OK');
        }
    };

});
