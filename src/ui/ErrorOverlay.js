import { TEXTS } from '../data/texts.js';

/**
 * Affiche une erreur de démarrage lisible (WebGL absent, module manquant…) au lieu d'un écran bleu vide.
 * @param {Document} doc
 * @param {unknown} error
 */
export function showBootError(doc, error) {
    const el = doc.getElementById('boot-error');
    if (!el) return;
    const message = String((error && error.message) || error || '');
    const isWebGL = /webgl/i.test(message);
    el.textContent = isWebGL ? TEXTS.errors.webgl : TEXTS.errors.generic;
    if (!isWebGL && message) {
        const detail = doc.createElement('div');
        detail.style.cssText = 'margin-top:10px;font-size:12px;opacity:.75;word-break:break-word';
        detail.textContent = message;
        el.appendChild(detail);
    }
    el.classList.remove('hidden');
}
