/**
 * Accès sécurisé au stockage local.
 * localStorage peut être absent ou lever une exception (navigation privée, stockage bloqué,
 * quota dépassé) : on retombe alors sur une mémoire volatile sans jamais interrompre le jeu.
 */
export function createStorage(backend) {
    let store = backend;
    const memory = new Map();

    function safe(fn, fallback) {
        try {
            return fn();
        } catch {
            return fallback;
        }
    }

    return {
        get(key, fallback = null) {
            if (store) {
                const value = safe(() => store.getItem(key), undefined);
                if (value !== undefined && value !== null) return value;
            }
            return memory.has(key) ? memory.get(key) : fallback;
        },
        set(key, value) {
            const str = String(value);
            memory.set(key, str);
            if (store) safe(() => store.setItem(key, str), undefined);
        },
        getNumber(key, fallback = 0) {
            const n = parseInt(this.get(key, ''), 10);
            return Number.isFinite(n) ? n : fallback;
        },
        remove(key) {
            memory.delete(key);
            if (store) safe(() => store.removeItem(key), undefined);
        },
    };
}

/** Récupère localStorage sans lever d'exception (accès interdit en iframe sandbox, etc.). */
export function getLocalStorage(win = globalThis) {
    try {
        return win.localStorage || null;
    } catch {
        return null;
    }
}
