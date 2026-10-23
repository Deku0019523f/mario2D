/** Textes de l'interface (français). Centralisés pour faciliter une future traduction. */

export const TEXTS = Object.freeze({
    start: {
        badge: '🍄 Édition 2.5D Paper Sprite',
        title: 'SUPER MARIO 2.5D',
        // Le sous-titre d'accueil contient du balisage <b> : il est repris tel quel depuis index.html.
        play: '🎮 Jouer le Monde 1-1',
    },
    pause: {
        badge: '⏸ Jeu en pause',
        title: 'PAUSE',
        subtitle: 'Reprenez quand vous voulez : la partie est suspendue.',
        play: '🔄 Recommencer',
    },
    gameOver: {
        badge: '💀 Partie Terminée',
        title: 'GAME OVER',
        play: '🎮 Lancer la Partie',
    },
    victory: {
        badge: (level) => `🏆 Monde 1-${level} Terminé !`,
        title: 'VICTOIRE !',
        subtitle: 'Bravo ! Vous avez atteint le château du Royaume Champignon !',
        play: '🔄 Rejouer depuis le début',
    },
    hud: {
        small: { icon: '👦', text: 'PETIT' },
        super: { icon: '🍄', text: 'SUPER MARIO' },
    },
    reasons: {
        enemy: 'Vous avez été touché par un ennemi !',
        pit: 'Vous êtes tombé dans un précipice !',
    },
    floating: {
        superMario: '🍄 SUPER MARIO ! +1000',
        mushroomBonus: '🍄 +1000 PTS !',
        hit: '💥 Touché ! Mode Petit',
        lifeLost: (lives) => `💔 -1 Vie (${lives} restantes)`,
        coin: '+100',
        blockCoin: '🪙 +200',
        brick: '💥 +50',
        stomp: '+200 STOMP!',
        blockKo: '+200 KO!',
        victory: '🚩 VICTOIRE ! +2000',
    },
    errors: {
        webgl: "Impossible d'initialiser la 3D (WebGL). Essayez un navigateur récent ou activez l'accélération matérielle.",
        generic: 'Une erreur est survenue au démarrage du jeu. Rechargez la page ; si le problème persiste, ouvrez la console du navigateur.',
    },
    sound: { on: '🔊', off: '🔇' },
});
