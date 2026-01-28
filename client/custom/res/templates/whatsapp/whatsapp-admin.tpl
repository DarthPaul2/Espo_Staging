<div style="padding: 20px;">
    <h2 style="margin: 0 0 14px 0; color: green">WhatsApp Nachrichten von Technikern</h2>

    <!-- Filter -->
    <div class="filters">
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end;">
            <div style="min-width:220px;">
                <label for="searchTechnician" style="display:block; font-weight:600;">Techniker</label>
                <select id="searchTechnician" style="width:100%; padding:6px;">
                    <option value="alle">Alle Techniker</option>
                </select>
            </div>

            <div style="min-width:180px;">
                <label for="searchDate" style="display:block; font-weight:600;">Datum</label>
                <input type="date" id="searchDate" style="width:100%; padding:6px;">
            </div>

            <div>
                <button id="btnApplyFilter" style="padding:7px 12px; cursor:pointer;">
                    Filtern
                </button>
            </div>
        </div>
    </div>

    <hr>

    <!-- Table -->
    <div class="table-container">
        <table id="whatsappTable" style="width:100%; border-collapse:collapse;">
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Techniker</th>
                    <th>Nachricht</th>
                    <th>Medien</th>
                    <th>Aktion</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

<!-- Loader Overlay -->
<div id="loaderOverlay" hidden>
    <div style="position:fixed; inset:0; background:rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; z-index:9999;">
        <div style="background:#fff; padding:14px 16px; border-radius:8px; min-width:240px; box-shadow:0 10px 30px rgba(0,0,0,0.25);">
            <div style="font-weight:600; margin-bottom:6px;">Bitte warten…</div>
            <div id="loaderMessage" style="font-size:13px; color:#333;">Bitte warten…</div>
        </div>
    </div>
</div>

<!-- Заглушки модалок (пока пустые, чтобы JS не падал, если вы их откроете) -->
<!-- Report Modal -->
<div id="reportModal" class="wa-modal" style="display:none;">
  <div class="wa-modal-content">
    <span class="wa-close" id="btnCloseReport">&times;</span>

    <h3>Technischer Bericht bearbeiten</h3>

    <p><b>Techniker:</b> <span id="reportTechniker"></span></p>
    <p><b>Datum:</b> <span id="reportDatum"></span></p>

    <!-- Kunde auswählen -->
    <div class="wa-card">
      <label for="kundenSelect" class="wa-label">🧑‍💼 Kunde auswählen:</label>
      <select id="kundenSelect" class="wa-input">
        <option value="">Bitte wählen...</option>
      </select>
      <div class="wa-hint">
        Der ausgewählte Kunde wird mit dem technischen Bericht verknüpft.
      </div>
    </div>

    <!-- Text -->
    <textarea id="berichtEditor" class="wa-textarea"></textarea>

    <!-- Bilder -->
    <div id="berichtImages" style="margin-top: 14px;">
    <!-- сюда JS будет рендерить изображения -->
    </div>

    <!-- скрытые поля для связи аннотации с msg_id/index -->
    <input type="hidden" id="currentImageMsgId" value="">
    <input type="hidden" id="currentImageIndex" value="">


    <!-- Buttons -->
    <div style="margin-top: 16px; display:flex; gap:10px; flex-wrap:wrap;">
      <button id="btnPreviewPdf" class="wa-btn wa-btn-green">📄 PDF erzeugen (Vorschau)</button>
      <button id="btnSaveReport" class="wa-btn wa-btn-green">💾 PDF speichern</button>
      <button id="btnCancelReport" class="wa-btn wa-btn-grey">Abbrechen</button>
    </div>
  </div>
</div>

<style>
/* ===== WhatsApp Admin – Modal (local) ===== */
.wa-modal{
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
  padding: 10px;
}
.wa-modal-content{
  background: #fff;
  margin: 1% auto;
  padding: 18px;
  border-radius: 12px;
  max-width: 920px;
  max-height: 92vh;
  overflow: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  position: relative;
}
.wa-close{
  position: absolute;
  top: 10px; right: 14px;
  font-size: 26px;
  font-weight: 700;
  color: #888;
  cursor: pointer;
}
.wa-close:hover{ color:#000; }

.wa-card{
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 10px;
  margin: 10px 0 14px 0;
  background: #f6fff6;
}
.wa-label{ font-weight: 700; display:block; margin-bottom:6px; }
.wa-input{
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
}
.wa-hint{ margin-top:6px; font-size: 12px; color:#666; }

.wa-textarea{
  width: 100%;
  height: 300px;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
  resize: vertical;
}

.wa-btn{
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
}
.wa-btn-green{ background:#16b900; color:#fff; }
.wa-btn-green:hover{ background:#095000; }
.wa-btn-grey{ background:#adadad; color:#fff; }
.wa-btn-grey:hover{ background:#505050; }
/* ===== /Modal ===== */
</style>



<!-- Annotation Modal -->
<div id="annotationModal" class="wa-modal" style="display:none;">
  <div class="wa-modal-content" style="max-width:1100px;">
    <span class="wa-close" id="btnCloseAnnotation">&times;</span>

    <h3>Bild annotieren</h3>

    <!-- Toolbar -->
    <div id="annotationToolbar" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; padding-bottom:10px; position:sticky; top:0; background:#fff; z-index:2;">
      <button class="tool-btn big-arrow black-arrow" data-tool="select" title="Auswahl (Objekte verschieben)">⛶</button>
      <button class="tool-btn" data-tool="pen" title="Freihandzeichnung">✏️</button>
      <button class="tool-btn red-arrow big-arrow" data-tool="arrow" title="Pfeil zeichnen">↘</button>
      <button class="tool-btn" data-tool="eraser" title="Objekt löschen">🧹</button>
      <button id="undoBtn" class="tool-btn red-arrow big-arrow" title="Letzte Aktion rückgängig machen">⮐</button>
      <button id="deleteSelectedBtn" class="tool-btn" title="Ausgewähltes Objekt löschen">❌</button>

      <span style="font-size: 14px; color:#1373f0; margin-top:4px;">Farbe &amp; Strichstärke:</span>
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="color" id="toolColor" value="#ff0000" title="Farbe auswählen"
               style="width:24px; height:24px; padding:0; border:none; cursor:pointer;">
        <input type="number" id="toolSize" min="1" max="10" value="4" title="Strichstärke"
               style="width:56px; height:24px; font-size:12px; padding:2px;">
      </div>
    </div>

    <div id="annotationEditorArea" style="display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap;">
      <canvas id="annotationCanvas" style="border:1px solid #ccc; flex-shrink:0;"></canvas>

      <div style="flex:1; min-width:280px;">
        <label for="annotationComment"><b>Kommentar zum Bild:</b></label>
        <textarea id="annotationComment" maxlength="1000" rows="14"
          style="width:100%; padding:8px; border:1px solid #ccc; border-radius:10px; resize:vertical;"></textarea>
        <div style="font-size:12px; color:#666; margin-top:4px;">Max. 1000 Zeichen</div>

        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
          <button id="btnSaveAnnotated" class="wa-btn wa-btn-green">💾 Speichern</button>
          <button id="btnCancelAnnotation" class="wa-btn wa-btn-grey">Abbrechen</button>
        </div>
      </div>
    </div>

  </div>
</div>




<style>
/* ===== WhatsApp Admin – Green Theme ===== */
:root{
  --klesec-green: #bcffb3;
  --klesec-green-dark: #095000;
  --border: #d9d9d9;
  --bg-soft: #f6fff6;
}

/* Фильтр */
.filters{
  margin-top: 18px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-soft);
}

.filters label{
  font-weight: 600;
  margin-right: 6px;
}

.filters select{
  width: auto;
  min-width: 180px;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
}

.filters input[type="date"]{
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #fff;
  color: #333;
  width: auto;
  min-width: 160px;
  max-width: 200px;
}

/* Кнопки (только внутри WhatsApp страницы) */
#btnApplyFilter{
  background: var(--klesec-green);
  color: #fff;
  padding: 7px 14px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: .15s;
}
#btnApplyFilter:hover{
  background: var(--klesec-green-dark);
}

#whatsappTable button{
  background: #fe6171;
  color: #fff;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: .15s;
}
#whatsappTable button:hover{
  background: #8c4048;
}

/* Контейнер таблицы */
.table-container{
  width: 100%;
  max-height: calc(100vh - 260px);
  overflow: auto;
  margin-top: 14px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
}


/* Таблица */
#whatsappTable{
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

#whatsappTable thead th{
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--klesec-green) !important;
  color: #fff;
  padding: 10px 8px;
  text-align: left;
  border-bottom: 2px solid rgba(255,255,255,.35);
}

#whatsappTable td{
  padding: 8px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

#whatsappTable tbody tr:hover{
  background: #f3fff3;
}

/* Медиа-превью */
#whatsappTable img{
  border: 1px solid rgba(0,0,0,.10);
}

/* Loader — подтянем визуал */
#loaderOverlay{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
#loaderOverlay[hidden]{ display: none; }

.loader-box{
  background: rgba(255,255,255,.95);
  padding: 18px 20px;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,.20);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 240px;
}

.spinner{
  width: 44px;
  height: 44px;
  border: 4px solid #d3d3d3;
  border-top-color: var(--klesec-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loader-text{
  font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #222;
  text-align: center;
}

.tool-btn{
  font-size: 12px !important;
  padding: 0 !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 6px !important;
  line-height: 1 !important;
  background-color: #dcedfd !important;
  color: #222 !important;
  border: 1px solid rgba(0,0,0,.08) !important;
  cursor: pointer;
}
.tool-btn:hover{ background-color: #d0d0d0 !important; }
.tool-btn.active{
  background-color: #0275d8 !important;
  color: #fff !important;
  border-color: #0275d8 !important;
}
.tool-btn.red-arrow{ color: #d10000 !important; font-weight: 900; }
.tool-btn.black-arrow{ color: #000 !important; font-weight: 900; }
.tool-btn.big-arrow{ font-size: 18px !important; }

/* ===== /Green Theme ===== */
</style>
