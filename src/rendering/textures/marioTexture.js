import { makeCanvasTexture } from './canvasUtils.js';

/**
 * Dessine une pose du héros 2D façon Paper Mario.
 * @param {'idle'|'run1'|'run2'|'run3'|'jump'} pose
 * @param {boolean} isSuper variante « Super » (couleurs légèrement différentes)
 */
export function createMarioPoseTexture(pose, isSuper = false, opts = {}) {
    return makeCanvasTexture((ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        // Décalage de foulée selon la frame
        let legAngleL = 0, legAngleR = 0, armAngleL = 0, armAngleR = 0, bodyBob = 0;
        if (pose === 'run1') { legAngleL = -0.48; legAngleR = 0.48; armAngleL = 0.55; armAngleR = -0.55; bodyBob = -3; }
        else if (pose === 'run2') { legAngleL = 0.15; legAngleR = -0.15; armAngleL = -0.2; armAngleR = 0.2; bodyBob = 1; }
        else if (pose === 'run3') { legAngleL = 0.48; legAngleR = -0.48; armAngleL = -0.55; armAngleR = 0.55; bodyBob = -3; }
        else if (pose === 'jump') { legAngleL = -0.35; legAngleR = 0.55; armAngleL = -0.6; armAngleR = -2.35; bodyBob = -5; }

        ctx.translate(0, bodyBob);

        // Couleurs selon l'état Petit ou Super
        const hatColor = isSuper ? '#dc2626' : '#ef4444';
        const shirtColor = isSuper ? '#ef4444' : '#dc2626';
        const overallsColor = isSuper ? '#1d4ed8' : '#2563eb';

        // Dessin avec contour sombre net
        const strokeAndFill = (fill) => {
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#1e1b4b';
            ctx.stroke();
        };

        // 1. Bras arrière (gauche)
        ctx.save();
        ctx.translate(-8, 6);
        ctx.rotate(armAngleL);
        ctx.beginPath();
        ctx.roundRect(-8, 0, 14, 22, 6);
        strokeAndFill(shirtColor);
        ctx.beginPath();
        ctx.arc(-1, 23, 8.5, 0, Math.PI * 2);
        strokeAndFill('#ffffff'); // gant blanc
        ctx.restore();

        // 2. Jambe arrière (gauche)
        ctx.save();
        ctx.translate(-6, 26);
        ctx.rotate(legAngleL);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 18, 5);
        strokeAndFill(overallsColor);
        ctx.beginPath();
        ctx.roundRect(-5, 14, 19, 11, 5);
        strokeAndFill('#78350f'); // chaussure brune
        ctx.restore();

        // 3. Jambe avant (droite)
        ctx.save();
        ctx.translate(7, 26);
        ctx.rotate(legAngleR);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 18, 5);
        strokeAndFill(overallsColor);
        ctx.beginPath();
        ctx.roundRect(-4, 14, 19, 11, 5);
        strokeAndFill('#92400e');
        ctx.restore();

        // 4. Torse & salopette
        ctx.beginPath();
        ctx.roundRect(-18, -2, 36, 30, 12);
        strokeAndFill(shirtColor);

        ctx.beginPath();
        ctx.roundRect(-16, 10, 32, 19, 8);
        strokeAndFill(overallsColor);

        ctx.beginPath();
        ctx.roundRect(-11, -1, 8, 16, 3);
        ctx.roundRect(4, -1, 8, 16, 3);
        strokeAndFill(overallsColor); // bretelles

        [-6, 8].forEach((bx) => {
            ctx.beginPath();
            ctx.arc(bx, 14, 4.2, 0, Math.PI * 2);
            strokeAndFill('#facc15'); // boutons dorés
        });

        // 5. Tête & visage
        ctx.beginPath();
        ctx.arc(0, -18, 20, 0, Math.PI * 2);
        strokeAndFill('#fed7aa');

        ctx.beginPath();
        ctx.arc(-14, -16, 8, 0.4, Math.PI * 1.4);
        strokeAndFill('#78350f'); // cheveux

        // Œil (regarde vers la droite par défaut)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(7, -21, 3.2, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, -23, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Grand nez rond
        ctx.beginPath();
        ctx.ellipse(16, -15, 8.5, 6.8, 0, 0, Math.PI * 2);
        strokeAndFill('#fdba74');

        // Moustache
        ctx.beginPath();
        ctx.moveTo(4, -9);
        ctx.quadraticCurveTo(13, -12, 22, -8);
        ctx.quadraticCurveTo(18, -3, 12, -5);
        ctx.quadraticCurveTo(7, -3, 3, -7);
        ctx.closePath();
        strokeAndFill('#451a03');

        // 6. Casquette avec visière et badge "M"
        ctx.beginPath();
        ctx.arc(-1, -26, 20, Math.PI, 0);
        ctx.lineTo(26, -24);
        ctx.quadraticCurveTo(28, -29, 17, -30);
        ctx.closePath();
        strokeAndFill(hatColor);

        ctx.beginPath();
        ctx.arc(6, -34, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = hatColor;
        ctx.font = '900 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', 6, -33.5);

        // 7. Bras avant (droit) + gant blanc
        ctx.save();
        ctx.translate(8, 6);
        ctx.rotate(armAngleR);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 22, 6);
        strokeAndFill(shirtColor);
        ctx.beginPath();
        ctx.arc(0, 23, 9, 0, Math.PI * 2);
        strokeAndFill('#ffffff');
        ctx.restore();

        ctx.restore();
    }, { outline: 3, ...opts });
}
