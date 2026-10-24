import { makeCanvasTexture } from './canvasUtils.js';

/** Super Champignon (rouge à pois blancs). */
export function createSuperMushroomTexture(opts = {}) {
    return makeCanvasTexture((ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2 + 4);

        const strokeFill = (color) => {
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 4.5;
            ctx.strokeStyle = '#450a0a';
            ctx.stroke();
        };

        // Pied crème
        ctx.beginPath();
        ctx.roundRect(-20, 4, 40, 28, 12);
        strokeFill('#fef3c7');

        // Dôme rouge vif
        ctx.beginPath();
        ctx.arc(0, 2, 36, Math.PI, 0, false);
        ctx.quadraticCurveTo(38, 12, 26, 12);
        ctx.lineTo(-26, 12);
        ctx.quadraticCurveTo(-38, 12, -36, 2);
        ctx.closePath();
        strokeFill('#ef4444');

        // Pois blancs
        ctx.fillStyle = '#ffffff';
        [
            { x: 0, y: -18, r: 11 },
            { x: -22, y: -6, r: 8.5 },
            { x: 22, y: -6, r: 8.5 },
        ].forEach((spot) => {
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Yeux brillants sur le pied
        [-7, 7].forEach((ex) => {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(ex, 16, 2.6, 5.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex + 1, 14, 1.2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }, { outline: 3, ...opts });
}

/** Bloc "?" (actif ou utilisé / grisé). */
export function createQuestionBlockTexture(isUsed = false, opts = {}) {
    return makeCanvasTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        if (isUsed) {
            grad.addColorStop(0, '#94a3b8');
            grad.addColorStop(1, '#475569');
        } else {
            grad.addColorStop(0, '#fde047');
            grad.addColorStop(0.5, '#eab308');
            grad.addColorStop(1, '#ca8a04');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Cadre biseauté
        ctx.lineWidth = 10;
        ctx.strokeStyle = isUsed ? '#334155' : '#854d0e';
        ctx.strokeRect(5, 5, w - 10, h - 10);

        // 4 rivets aux coins
        ctx.fillStyle = isUsed ? '#1e293b' : '#713f12';
        [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]].forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 5.5, 0, Math.PI * 2);
            ctx.fill();
        });

        if (!isUsed) {
            // Point d'interrogation avec ombre portée
            ctx.font = '900 76px Fredoka, "Arial Black", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#713f12';
            ctx.fillText('?', w / 2 + 4, h / 2 + 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillText('?', w / 2, h / 2 + 2);
        }
    }, opts);
}

/** Bloc de briques. */
export function createBrickBlockTexture(opts = {}) {
    return makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, 0, w, h);

        const rows = 4;
        const rowH = h / rows;
        for (let r = 0; r < rows; r++) {
            const y = r * rowH;
            const offset = (r % 2) * (w / 4);
            for (let c = -1; c < 3; c++) {
                const x = c * (w / 2) + offset;
                ctx.fillStyle = (r + c) % 2 === 0 ? '#b45309' : '#9a3412';
                ctx.fillRect(x + 3, y + 3, w / 2 - 6, rowH - 6);
                ctx.fillStyle = 'rgba(255,255,255,0.16)';
                ctx.fillRect(x + 3, y + 3, w / 2 - 6, 4);
            }
        }
    }, opts);
}
