import { QUALITY_PRESETS } from '../data/config.js';

/**
 * Choisit un palier de qualité graphique ('low' | 'medium' | 'high').
 *
 *  1. Paramètre d'URL `?quality=low|medium|high` (prioritaire, pratique pour tester) ;
 *  2. sinon heuristique : mobile peu puissant -> low, mobile -> medium, ordinateur -> high.
 *
 * @param {{search?: string, userAgent?: string, deviceMemory?: number, hardwareConcurrency?: number, maxTouchPoints?: number}} env
 */
export function resolveQualityName(env = {}) {
    const forced = new URLSearchParams(env.search || '').get('quality');
    if (forced && Object.prototype.hasOwnProperty.call(QUALITY_PRESETS, forced)) return forced;

    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(env.userAgent || '') || (env.maxTouchPoints || 0) > 1;
    if (!isMobile) return 'high';

    const lowMemory = typeof env.deviceMemory === 'number' && env.deviceMemory <= 4;
    const fewCores = typeof env.hardwareConcurrency === 'number' && env.hardwareConcurrency <= 4;
    return lowMemory || fewCores ? 'low' : 'medium';
}

/** Renvoie le nom et les réglages du palier choisi. */
export function resolveQuality(env) {
    const name = resolveQualityName(env);
    return { name, ...QUALITY_PRESETS[name] };
}
