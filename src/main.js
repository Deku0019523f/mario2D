/**
 * Point d'entrée : initialise l'application et affiche une erreur lisible si le démarrage échoue
 * (WebGL indisponible, élément HTML manquant…). Toute la logique est dans src/core/App.js.
 *
 * Mode debug : ajouter `?debug` à l'URL expose `window.__mario` (jeu, entrées, rendu) pour les tests.
 */
import { createApp } from './core/App.js';
import { showBootError } from './ui/ErrorOverlay.js';

try {
    const app = createApp({ win: window, doc: document });
    app.start();
    if (new URLSearchParams(window.location.search).has('debug')) window.__mario = app;
} catch (error) {
    console.error('[Super Mario 2.5D] Échec du démarrage :', error);
    showBootError(document, error);
}
