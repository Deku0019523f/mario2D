import { STORAGE } from '../data/config.js';

/** Réglages utilisateur persistants (actuellement : son coupé / activé). */
export class Settings {
    constructor(storage) {
        this.storage = storage;
        this.values = { muted: false };
        try {
            const raw = storage.get(STORAGE.SETTINGS, null);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed.muted === 'boolean') this.values.muted = parsed.muted;
            }
        } catch {
            // JSON corrompu : on garde les valeurs par défaut.
        }
    }

    get muted() {
        return this.values.muted;
    }

    set muted(value) {
        this.values.muted = !!value;
        this.storage.set(STORAGE.SETTINGS, JSON.stringify(this.values));
    }
}
