const RUN_CYCLE = ['run1', 'run2', 'run3', 'run2'];

/**
 * Choisit la pose du sprite selon l'état du héros.
 * En l'air : saut ; au sol en mouvement : cycle de course ; sinon : repos.
 */
export function choosePose(player) {
    if (!player.onGround) return 'jump';
    if (Math.abs(player.vx) > 0.35) return RUN_CYCLE[Math.floor(player.animTimer) % RUN_CYCLE.length];
    return 'idle';
}

/** Pose utilisée pendant la marche automatique vers le château (animation de victoire). */
export function winWalkPose(animTimer) {
    return Math.floor(animTimer) % 2 === 0 ? 'run1' : 'run3';
}
