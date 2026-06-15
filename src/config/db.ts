/**
 * NEURALIS - Database Compatibility Layer
 *
 * A lightweight shim mapping Firestore-style API calls to Supabase.
 * This exists to support legacy code during the Firebase→Supabase migration.
 *
 * @deprecated Services should migrate to calling `supabase` directly.
 *             New code should import from './supabase' instead of using this shim.
 */

import { supabase } from './supabase';

/** @deprecated Use `supabase` directly. Firestore-compat stub. */
export const db = {} as Record<string, never>;

export const COLLECTIONS: Record<string, string> = {
    USERS: 'users',
    FRIEND_REQUESTS: 'friend_requests',
    FRIENDS: 'friends',
    SYNAPSE_LINKS: 'synapse_links',
    LINK_REQUESTS: 'link_requests',
    LEAGUE_BRACKETS: 'league_brackets',
    LEAGUE_RESULTS: 'league_results',
    STREAKS: 'streaks',
    TASKS: 'tasks',
    SCREEN_TIME: 'screen_time',
    WAKE_UP_LOGS: 'wake_up_logs',
    GUILT_NOTIFICATIONS: 'guilt_notifications',
    TUTOR_SESSIONS: 'tutor_sessions',
};

export function doc(_db: any, collectionName: string, id?: string, subcol?: string, subid?: string) {
    const collection = collectionName;
    return { collection, id, subcol, subid } as any;
}

export function collection(_db: any, collectionName: string) {
    return { collection: collectionName } as any;
}

export function where(field: string, op: string, value: any) {
    return { type: 'where', field, op, value } as any;
}

export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    return { type: 'orderBy', field, dir } as any;
}

export function limit(n: number) {
    return { type: 'limit', n } as any;
}

export function query(coll: any, ...clauses: any[]) {
    return { collection: coll.collection || coll, clauses } as any;
}

export const serverTimestamp = () => Date.now();

export const Timestamp = {
    now: () => Date.now(),
    fromDate: (d: Date) => d.getTime(),
    fromMillis: (ms: number) => ms,
};

// Auth wrapper with currentUser compatibility
const _auth = supabase.auth;
export const auth = Object.assign(_auth, {
    get currentUser() {
        // Synchronous cache: populated by onAuthStateChange
        return (auth as any)._cachedUser ?? null;
    },
});

// Keep cached user up to date
supabase.auth.onAuthStateChange((_event, session) => {
    (auth as any)._cachedUser = session?.user
        ? { uid: session.user.id, email: session.user.email, ...session.user }
        : null;
});

// Also try to populate on init
supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
        (auth as any)._cachedUser = {
            uid: data.session.user.id,
            email: data.session.user.email,
            ...data.session.user,
        };
    }
});

export async function getDoc(ref: any) {
    const collectionName = ref.collection || ref.collectionName || ref['collection'] || ref;
    const id = ref.id;
    if (!id) return { exists: () => false, data: () => null, id: null, ref: null };
    const { data } = await supabase.from(collectionName).select('*').eq('id', id).maybeSingle();
    return {
        exists: () => Boolean(data),
        data: () => data,
        id: data?.id || id,
        ref: { collection: collectionName, id },
    } as any;
}

export async function getDocs(q: any) {
    const coll = q.collection || q.collectionName;
    let builder: any = supabase.from(coll).select('*');
    (q.clauses || []).forEach((c: any) => {
        if (c.type === 'where') {
            switch (c.op) {
                case '==':
                    builder = builder.eq(c.field, c.value);
                    break;
                case '!=':
                    builder = builder.neq(c.field, c.value);
                    break;
                case '<':
                    builder = builder.lt(c.field, c.value);
                    break;
                case '<=':
                    builder = builder.lte(c.field, c.value);
                    break;
                case '>':
                    builder = builder.gt(c.field, c.value);
                    break;
                case '>=':
                    builder = builder.gte(c.field, c.value);
                    break;
                case 'in':
                    builder = builder.in(c.field, c.value);
                    break;
                case 'array-contains':
                    builder = builder.contains(c.field, [c.value]);
                    break;
                case 'array-contains-any':
                    builder = builder.overlaps(c.field, c.value);
                    break;
                default:
                    builder = builder.eq(c.field, c.value);
            }
        }
        if (c.type === 'orderBy') builder = builder.order(c.field, { ascending: c.dir === 'asc' });
        if (c.type === 'limit') builder = builder.limit(c.n);
    });
    const { data } = await builder;
    return {
        docs: (data || []).map((d: any) => ({
            id: d.id,
            ref: { collection: coll, id: d.id },
            data: () => d,
            exists: () => true,
        })),
        empty: !(data && data.length > 0),
        size: data?.length || 0,
    } as any;
}

export async function setDoc(ref: any, data: any) {
    const collectionName = ref.collection || ref.collectionName || ref;
    const id = ref.id;
    if (id) {
        const row = { ...data, id };
        await supabase.from(collectionName).upsert(row as any, { onConflict: 'id' });
        return;
    }
    await supabase.from(collectionName).insert(data as any);
}

export async function addDoc(collRef: any, data: any) {
    const collectionName = collRef.collection || collRef.collectionName || collRef;
    const { data: inserted } = await supabase.from(collectionName).insert(data as any).select().maybeSingle();
    return { id: inserted?.id || null } as any;
}

export async function updateDoc(ref: any, data: any) {
    const collectionName = ref.collection || ref.collectionName || ref;
    const id = ref.id;
    if (!id) throw new Error('updateDoc requires doc with id');

    // Resolve increment markers
    const hasIncrements = Object.values(data).some(
        (v: any) => v && typeof v === 'object' && v.__type === 'increment'
    );

    if (hasIncrements) {
        // Read current values, then increment
        const { data: current } = await supabase.from(collectionName).select('*').eq('id', id).maybeSingle();
        if (!current) throw new Error('Document not found for increment');

        const resolved: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === 'object' && (value as any).__type === 'increment') {
                resolved[key] = (current[key] || 0) + (value as any).__increment;
            } else {
                resolved[key] = value;
            }
        }
        await supabase.from(collectionName).update(resolved as any).eq('id', id);
    } else {
        await supabase.from(collectionName).update(data as any).eq('id', id);
    }
}

export async function deleteDoc(ref: any) {
    const collectionName = ref.collection || ref.collectionName || ref;
    const id = ref.id;
    if (!id) throw new Error('deleteDoc requires doc with id');
    await supabase.from(collectionName).delete().eq('id', id);
}

/**
 * @deprecated Use Supabase Realtime channels instead of polling.
 * This shim polls every 10s as a fallback — Supabase Realtime is strongly preferred.
 *
 * @example Preferred approach:
 * ```ts
 * supabase.channel('my-channel')
 *   .on('postgres_changes', { event: '*', schema: 'public', table: 'my_table' }, handler)
 *   .subscribe();
 * ```
 */
export function onSnapshot(q: any, cb: (snap: any) => void) {
    const POLL_INTERVAL_MS = 10_000; // 10 seconds — use Supabase Realtime for true real-time
    let interval: ReturnType<typeof setInterval>;

    if (q && q.id && q.collection) {
        // Document subscription
        interval = setInterval(async () => {
            const res = await getDoc(q);
            cb(res);
        }, POLL_INTERVAL_MS);
    } else if (q && q.collection) {
        // Collection subscription
        interval = setInterval(async () => {
            const res = await getDocs(q);
            cb(res);
        }, POLL_INTERVAL_MS);
    } else {
        // Unknown shape — no-op to prevent wasted cycles
        interval = setInterval(() => { /* no-op */ }, POLL_INTERVAL_MS);
    }
    return () => clearInterval(interval);
}

export function writeBatch(_firestore: any) {
    const ops: any[] = [];
    return {
        set: (ref: any, data: any) => ops.push({ op: 'set', ref, data }),
        update: (ref: any, data: any) => ops.push({ op: 'update', ref, data }),
        delete: (ref: any) => ops.push({ op: 'delete', ref }),
        commit: async () => {
            for (const o of ops) {
                if (o.op === 'set') await setDoc(o.ref, o.data);
                if (o.op === 'update') await updateDoc(o.ref, o.data);
                if (o.op === 'delete') await deleteDoc(o.ref);
            }
        },
    } as any;
}

export function increment(n: number) {
    // Returns a marker object; updateDoc will resolve it via RPC or manual read-increment-write
    return { __type: 'increment', __increment: n };
}

export function getFirebaseDb() {
    return db;
}

export async function runTransaction(_db: any, fn: (transaction: any) => Promise<any>) {
    const transaction = {
        get: async (ref: any) => await getDoc(ref),
        set: async (ref: any, data: any) => await setDoc(ref, data),
        update: async (ref: any, data: any) => await updateDoc(ref, data),
    };
    return await fn(transaction);
}

export default {
    db,
    COLLECTIONS,
    doc,
    collection,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    onSnapshot,
    writeBatch,
    increment,
    auth,
};
