<style>
    .og-wrap { font-size: 12px; line-height: 1.4; }
    .og-top { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .og-ges { flex: 1 1 260px; display: flex; gap: 8px; align-items: stretch; }
    .og-r02 { flex: 0 0 150px; }
    .og-r02 .og-zeile { background: #eef3f8; border-radius: 6px; padding: 8px; height: 100%; border-bottom: none; }
    .og-r02 .og-code { color: #15305c; font-weight: 700; }
    .og-r02 .og-name { color: #15305c; }
    .og-r02 .og-inhaber { color: #15305c; padding-left: 0; }
    .og-r01 { flex: 1; background: #15305c; color: #fff; border-radius: 6px; padding: 10px 14px; text-align: center; }
    .og-r01-code { font-size: 11px; opacity: 0.8; }
    .og-r01-name { font-size: 15px; font-weight: 700; margin: 2px 0; }
    .og-r01-rolle { font-size: 11px; opacity: 0.9; }
    .og-stab-wrap { flex: 1 1 220px; display: flex; flex-direction: column; gap: 6px; padding-top: 10px; border-top: 2px dashed #9fb3c8; position: relative; }
    .og-stab-wrap::before { content: '↳ berichtet direkt an R-01 Geschäftsführung'; position: absolute; top: -9px; left: 0; background: #fff; padding: 0 6px; font-size: 9.5px; color: #6b8199; font-style: italic; }
    .og-stab { border-radius: 6px; padding: 6px 8px; }
    .og-stab-qualitaet { background: #fff4e0; border: 1px solid #f5a623; }
    .og-stab-recht { background: #eaf1f5; border: 1px solid #4a6f8a; }
    .og-stab-titel { font-weight: 700; margin-bottom: 4px; }
    .og-bereiche-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .og-bereich { border: 1px solid; border-radius: 6px; overflow: hidden; }
    .og-bereich-kopf { color: #fff; font-weight: 700; padding: 6px 10px; }
    .og-bereich-body { padding: 6px 8px; min-height: 20px; }
    .og-zeile { padding: 4px 0; border-bottom: 1px dashed rgba(0,0,0,0.08); }
    .og-zeile:last-child { border-bottom: none; }
    .og-zeile-kopf { display: flex; gap: 6px; align-items: baseline; }
    .og-code { font-weight: 700; flex: 0 0 38px; opacity: 0.75; }
    .og-name { flex: 1 1 auto; }
    .og-inhaber { display: block; margin-top: 1px; padding-left: 44px; font-weight: 600; opacity: 0.85; white-space: normal; word-break: break-word; }
    .og-unbesetzt { font-style: italic; opacity: 0.5; font-weight: 400; }

    .og-abschnitt-titel { text-align: center; font-weight: 700; color: #3a5a78; margin: 18px 0 8px; padding: 5px 10px; background: #eef3f8; border-radius: 14px; font-size: 11px; letter-spacing: 0.2px; }
    .og-stakeholder-grid, .og-support-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-bottom: 6px; }
    .og-stakeholder-box, .og-support-box { background: #f4f6f8; border: 1px solid #d8e0e6; border-radius: 6px; padding: 8px 10px; }
    .og-stakeholder-box-titel, .og-support-box-titel { font-weight: 700; color: #3a5a78; margin-bottom: 3px; }
    .og-stakeholder-box-sub, .og-support-box-sub { opacity: 0.75; }

    .og-phasen-grid { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-bottom: 6px; }
    .og-phase-box { color: #fff; border-radius: 6px; padding: 8px 10px; flex: 1 1 150px; min-width: 140px; }
    .og-phase-pfeil { flex: 0 0 auto; font-size: 16px; font-weight: 700; color: #9fb3c8; }
    .og-phase-nr { font-size: 10px; opacity: 0.85; }
    .og-phase-titel { font-weight: 700; margin: 2px 0; }
    .og-phase-p { font-size: 10.5px; opacity: 0.9; }
    .og-phase-sub { font-size: 10px; opacity: 0.8; margin-top: 3px; }
</style>

<div class="og-wrap">
    <div class="og-top">
        <div class="og-ges" data-name="ges-block"></div>
        <div class="og-stab-wrap" data-name="stab-block"></div>
    </div>
    <div class="og-bereiche-grid" data-name="bereiche-grid"></div>

    <div class="og-abschnitt-titel">Zusammenarbeit mit externen Partnern (in Projekten, Serviceaufträgen und übergreifenden Prozessen P-01 bis P-85)</div>
    <div class="og-stakeholder-grid">
        <div class="og-stakeholder-box">
            <div class="og-stakeholder-box-titel">Kunden</div>
            <div class="og-stakeholder-box-sub">Privatkunden | Gewerbekunden | Öffentliche Auftraggeber</div>
        </div>
        <div class="og-stakeholder-box">
            <div class="og-stakeholder-box-titel">Partner &amp; Lieferanten</div>
            <div class="og-stakeholder-box-sub">Hersteller | Großhandel | Dienstleister</div>
        </div>
        <div class="og-stakeholder-box">
            <div class="og-stakeholder-box-titel">Behörden &amp; Organisationen</div>
            <div class="og-stakeholder-box-sub">Feuerwehr | Errichter | Prüfstellen | Verbände</div>
        </div>
        <div class="og-stakeholder-box">
            <div class="og-stakeholder-box-titel">Gesellschaft &amp; Umwelt</div>
            <div class="og-stakeholder-box-sub">Nachhaltigkeit | Soziales | Region</div>
        </div>
    </div>

    <div class="og-abschnitt-titel">Prozesslandkarte (P-01 bis P-85)</div>
    <div class="og-phasen-grid">
        <div class="og-phase-box" style="background:#4a9d6e;">
            <div class="og-phase-nr">1. Kunde &amp; Markt</div>
            <div class="og-phase-p">P-01 bis P-08</div>
            <div class="og-phase-sub">Bedarf | Angebot | Auftrag</div>
        </div>
        <div class="og-phase-pfeil">→</div>
        <div class="og-phase-box" style="background:#3d8fc7;">
            <div class="og-phase-nr">2. Planung &amp; Projekt</div>
            <div class="og-phase-p">P-09 bis P-17</div>
            <div class="og-phase-sub">Planung | Umsetzung</div>
        </div>
        <div class="og-phase-pfeil">→</div>
        <div class="og-phase-box" style="background:#e08a3c;">
            <div class="og-phase-nr">3. Service &amp; Wartung</div>
            <div class="og-phase-p">P-18 bis P-27</div>
            <div class="og-phase-sub">Wartung | Störung | Notdienst</div>
        </div>
        <div class="og-phase-pfeil">→</div>
        <div class="og-phase-box" style="background:#c0504d;">
            <div class="og-phase-nr">4. Finanzen</div>
            <div class="og-phase-p">P-28 bis P-33</div>
            <div class="og-phase-sub">Rechnung | Zahlung | Controlling</div>
        </div>
        <div class="og-phase-pfeil">→</div>
        <div class="og-phase-box" style="background:#8a5fb5;">
            <div class="og-phase-nr">5. Personal &amp; Organisation</div>
            <div class="og-phase-p">P-34 bis P-50</div>
            <div class="og-phase-sub">Menschen | Ressourcen</div>
        </div>
        <div class="og-phase-pfeil">→</div>
        <div class="og-phase-box" style="background:#3d9e9e;">
            <div class="og-phase-nr">6. Führung &amp; QM</div>
            <div class="og-phase-p">P-51 bis P-78</div>
            <div class="og-phase-sub">Steuerung | Qualität</div>
        </div>
        <div class="og-phase-pfeil">→</div>
        <div class="og-phase-box" style="background:#3dbfc7;">
            <div class="og-phase-nr">7. IT &amp; KI</div>
            <div class="og-phase-p">P-79 bis P-85</div>
            <div class="og-phase-sub">Digitalisierung | Automatisierung</div>
        </div>
    </div>

    <div class="og-abschnitt-titel">Unterstützende Funktionen (stellenübergreifend)</div>
    <div class="og-support-grid">
        <div class="og-support-box">
            <div class="og-support-box-titel">Arbeitssicherheit</div>
            <div class="og-support-box-sub">Sicherer Arbeitsplatz</div>
        </div>
        <div class="og-support-box">
            <div class="og-support-box-titel">Datenschutz</div>
            <div class="og-support-box-sub">Informationssicherheit</div>
        </div>
        <div class="og-support-box">
            <div class="og-support-box-titel">Nachhaltigkeit</div>
            <div class="og-support-box-sub">Umwelt | Soziales | Governance</div>
        </div>
        <div class="og-support-box">
            <div class="og-support-box-titel">Innovation &amp; KI</div>
            <div class="og-support-box-sub">Effizienz | Zukunftssicherheit</div>
        </div>
        <div class="og-support-box">
            <div class="og-support-box-titel">Kommunikation</div>
            <div class="og-support-box-sub">Intern | Extern</div>
        </div>
        <div class="og-support-box">
            <div class="og-support-box-titel">Kontinuierliche Verbesserung</div>
            <div class="og-support-box-sub">KVP | Maßnahmen | Audits</div>
        </div>
    </div>
</div>
