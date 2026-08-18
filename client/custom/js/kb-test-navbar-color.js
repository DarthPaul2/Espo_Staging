(function () {
    // 🎨 Navbar-Farbe für die Testumgebung — greift nur auf dem Staging-Domain,
    // damit dieselbe Datei nach dem Deploy auf Prod ohne Effekt bleibt.
    if (window.location.hostname !== 'espocrmstaging.pagekite.me') return;

    var style = document.createElement('style');
    style.id = 'kb-test-navbar-color';
    style.textContent =
        ':root { --navbar-bg: #f48fb1 !important; --navbar-inverse-bg: #f48fb1 !important; }' +
        '.navbar.navbar-inverse { background-color: #f48fb1 !important; }';
    document.head.appendChild(style);
})();
