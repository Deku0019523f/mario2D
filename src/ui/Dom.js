/** Identifiants des éléments requis dans index.html. */
const REQUIRED_IDS = Object.freeze({
    canvas: 'game-canvas',
    floatingContainer: 'floating-container',
    bootError: 'boot-error',
    lives: 'hud-lives',
    powerBadge: 'hud-power-badge',
    powerIcon: 'hud-power-icon',
    powerText: 'hud-power-text',
    coins: 'hud-coins',
    level: 'hud-level',
    progressPct: 'hud-progress-pct',
    progressBar: 'hud-progress-bar',
    score: 'hud-score',
    best: 'hud-best',
    btnPause: 'btn-pause',
    btnSound: 'btn-sound',
    soundIcon: 'sound-icon',
    modalScreen: 'modal-screen',
    modalBadge: 'modal-badge',
    modalTitle: 'modal-title',
    modalSubtitle: 'modal-subtitle',
    modalStats: 'modal-stats',
    statFinalScore: 'stat-final-score',
    statFinalCoins: 'stat-final-coins',
    statFinalBest: 'stat-final-best',
    btnResume: 'btn-resume',
    btnPlay: 'btn-play',
    btnNextLevel: 'btn-next-level',
    touchControls: 'touch-controls',
    dpad: 'touch-dpad',
    btnLeft: 'btn-left',
    btnRight: 'btn-right',
    btnJump: 'btn-jump',
});

/**
 * Récupère tous les éléments du DOM d'un coup et échoue explicitement s'il en manque
 * (plutôt que de planter plus tard avec « Cannot read properties of null »).
 * @param {Document} doc
 */
export function getDom(doc) {
    const dom = {};
    const missing = [];
    for (const [key, id] of Object.entries(REQUIRED_IDS)) {
        const el = doc.getElementById(id);
        if (!el) missing.push(id);
        dom[key] = el;
    }
    if (missing.length) {
        throw new Error(`Éléments HTML manquants dans index.html : ${missing.join(', ')}`);
    }
    return dom;
}

export { REQUIRED_IDS };
