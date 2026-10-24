import { makeCanvasTexture } from './canvasUtils.js';

/**
 * Sprites 2D du Goomba : 0 et 1 = marche (pieds alternés), 2 = aplati.
 */
export function createGoombaTexture(step = 0, opts = {}) {
    return makeCanvasTexture((ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2 + (step === 2 ? 22 : 6));
        if (step === 2) ctx.scale(1.35, 0.42);

        const strokeFill = (color) => {
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#271206';
            ctx.stroke();
        };

        // Pieds noirs qui alternent
        const leftFootY = step === 0 ? 32 : 27;
        const rightFootY = step === 1 ? 32 : 27;
        ctx.beginPath();
        ctx.ellipse(-14, leftFootY, 12, 8, -0.2, 0, Math.PI * 2);
        strokeFill('#1e1b18');
        ctx.beginPath();
        ctx.ellipse(14, rightFootY, 12, 8, 0.2, 0, Math.PI * 2);
        strokeFill('#1e1b18');

        // Tige beige
        ctx.beginPath();
        ctx.roundRect(-16, 8, 32, 22, 10);
        strokeFill('#fde68a');

        // Chapeau de champignon brun
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.bezierCurveTo(36, -38, 46, 4, 34, 14);
        ctx.lineTo(-34, 14);
        ctx.bezierCurveTo(-46, 4, -36, -38, 0, -40);
        ctx.closePath();
        strokeFill('#9a3412');

        // Yeux froncés et pupilles
        [-11, 11].forEach((ex) => {
            ctx.beginPath();
            ctx.ellipse(ex, -6, 6.5, 10, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(ex * 0.85, -5, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
        });

        // Sourcils grognons
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(-22, -18);
        ctx.lineTo(-4, -10);
        ctx.moveTo(22, -18);
        ctx.lineTo(4, -10);
        ctx.stroke();

        // Petites dents pointues
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-14, 12); ctx.lineTo(-10, 4); ctx.lineTo(-6, 12);
        ctx.moveTo(14, 12); ctx.lineTo(10, 4); ctx.lineTo(6, 12);
        ctx.fill();

        ctx.restore();
    }, { outline: 3, ...opts });
}

/**
 * Sprites 2D du Koopa : 0 et 1 = marche, 2 = carapace rétractée (après écrasement).
 * La version d'origine réutilisait le sprite aplati du Goomba pour un Koopa écrasé :
 * la carapace (step 2) corrige ce défaut visuel.
 */
export function createKoopaTexture(step = 0, opts = {}) {
    return makeCanvasTexture((ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.save();

        const strokeFill = (color) => {
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#14281d';
            ctx.stroke();
        };

        if (step === 2) {
            // Carapace rétractée, posée au sol
            ctx.translate(w / 2, h / 2 + 24);
            ctx.beginPath();
            ctx.ellipse(-20, 14, 9, 7, 0, 0, Math.PI * 2);
            strokeFill('#ef4444');
            ctx.beginPath();
            ctx.ellipse(20, 14, 9, 7, 0, 0, Math.PI * 2);
            strokeFill('#dc2626');
            ctx.beginPath();
            ctx.ellipse(0, 4, 32, 20, 0, 0, Math.PI * 2);
            strokeFill('#16a34a');
            ctx.beginPath();
            ctx.ellipse(0, 6, 24, 13, 0, 0, Math.PI * 2);
            strokeFill('#dcfce7');
            ctx.restore();
            return;
        }

        ctx.translate(w / 2, h / 2 + 6);

        // Bottes rouges/orangées
        const offset = step === 0 ? 5 : -5;
        ctx.beginPath();
        ctx.roundRect(-18 + offset, 22, 16, 12, 5);
        strokeFill('#ef4444');
        ctx.beginPath();
        ctx.roundRect(4 - offset, 22, 16, 12, 5);
        strokeFill('#dc2626');

        // Carapace verte bombée
        ctx.beginPath();
        ctx.ellipse(-4, 4, 24, 22, -0.2, 0, Math.PI * 2);
        strokeFill('#16a34a');

        ctx.beginPath();
        ctx.ellipse(-2, 6, 18, 15, -0.2, 0, Math.PI * 2);
        strokeFill('#dcfce7');

        // Tête jaune (tournée vers la droite)
        ctx.beginPath();
        ctx.arc(18, -16, 14, 0, Math.PI * 2);
        strokeFill('#facc15');

        // Museau arrondi
        ctx.beginPath();
        ctx.ellipse(27, -13, 9, 7, 0, 0, Math.PI * 2);
        strokeFill('#fde047');

        // Œil
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(21, -20, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(23, -20, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }, { outline: 3, ...opts });
}
