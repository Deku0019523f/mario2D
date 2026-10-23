/**
 * État logique d'un niveau : tous les objets du monde sous forme de données simples
 * (aucune dépendance à Three.js). Le moteur de rendu lit ces données pour construire et
 * animer les maillages ; `version` change à chaque reconstruction du niveau.
 */
export class World {
    constructor(version = 0) {
        this.version = version;
        this.levelId = 1;
        this.levelLength = 128;

        /** Colliders solides (sol, tuyaux, blocs), dans l'ordre de création. */
        this.colliders = [];
        /** Descripteurs visuels des terrains / tuyaux. */
        this.platforms = [];
        this.pipes = [];
        /** Entités interactives. */
        this.blocks = [];
        this.coins = [];
        this.mushrooms = [];
        this.enemies = [];
        this.particles = [];

        /** Mât du drapeau d'arrivée (ou null). */
        this.flag = null;
        /** Décor d'arrière-plan (collines, nuages, relief lointain). */
        this.scenery = { hills: [], clouds: [], far: [] };

        this.nextParticleId = 1;
    }
}
