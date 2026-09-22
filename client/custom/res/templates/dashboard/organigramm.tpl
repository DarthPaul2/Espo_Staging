<style>
    .og-wrap { font-size: 12px; line-height: 1.4; }
    .og-top { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .og-ges { flex: 1 1 260px; display: flex; gap: 8px; align-items: stretch; }
    .og-r02 { flex: 0 0 150px; }
    .og-r02 .og-zeile { flex-direction: column; align-items: flex-start; background: #eef3f8; border-radius: 6px; padding: 8px; height: 100%; }
    .og-r02 .og-code { color: #15305c; font-weight: 700; }
    .og-r02 .og-name { color: #15305c; }
    .og-r02 .og-inhaber { color: #15305c; font-weight: 600; }
    .og-r01 { flex: 1; background: #15305c; color: #fff; border-radius: 6px; padding: 10px 14px; text-align: center; }
    .og-r01-code { font-size: 11px; opacity: 0.8; }
    .og-r01-name { font-size: 15px; font-weight: 700; margin: 2px 0; }
    .og-r01-rolle { font-size: 11px; opacity: 0.9; }
    .og-stab-wrap { flex: 1 1 220px; display: flex; flex-direction: column; gap: 6px; }
    .og-stab { border-radius: 6px; padding: 6px 8px; }
    .og-stab-qualitaet { background: #fff4e0; border: 1px solid #f5a623; }
    .og-stab-recht { background: #eaf1f5; border: 1px solid #4a6f8a; }
    .og-stab-titel { font-weight: 700; margin-bottom: 4px; }
    .og-bereiche-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .og-bereich { border: 1px solid; border-radius: 6px; overflow: hidden; }
    .og-bereich-kopf { color: #fff; font-weight: 700; padding: 6px 10px; }
    .og-bereich-body { padding: 6px 8px; min-height: 20px; }
    .og-zeile { display: flex; gap: 6px; padding: 3px 0; border-bottom: 1px dashed rgba(0,0,0,0.08); align-items: baseline; }
    .og-zeile:last-child { border-bottom: none; }
    .og-code { font-weight: 700; flex: 0 0 38px; opacity: 0.75; }
    .og-name { flex: 1 1 auto; }
    .og-inhaber { flex: 0 0 auto; font-weight: 600; text-align: right; opacity: 0.85; }
    .og-unbesetzt { font-style: italic; opacity: 0.5; font-weight: 400; }
</style>

<div class="og-wrap">
    <div class="og-top">
        <div class="og-ges" data-name="ges-block"></div>
        <div class="og-stab-wrap" data-name="stab-block"></div>
    </div>
    <div class="og-bereiche-grid" data-name="bereiche-grid"></div>
</div>
