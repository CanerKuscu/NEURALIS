/**
 * EmbeddingService - Generate vector embeddings for lesson cache
 * Uses Gemini Embedding API (text-embedding-004) for semantic search
 * 
 * Embeddings enable:
 * - Fuzzy topic matching ("physics momentum" finds "Fizik" lessons)
 * - Similar lesson recommendations
 * - Smart search across categories
 */

import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const GEMINI_EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EmbeddingResult {
    values: number[];
    dimension: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class EmbeddingService {
    constructor() {
        // API key is stored server-side in Supabase Edge Function secrets.
        // All embedding calls are proxied through the edge function — no client-side key needed.
    }

    /**
     * Generate embedding for a text string via Supabase Edge Function
     * This keeps the API key server-side
     */
    async generateEmbedding(text: string): Promise<number[] | null> {
        try {
            const { data, error } = await supabase.functions.invoke('generate-embedding', {
                body: { text },
            });

            if (error) {
                console.warn('EmbeddingService: Edge function error', error.message);
                return null;
            }

            return data?.embedding || null;
        } catch (err) {
            console.warn('EmbeddingService: generateEmbedding error', err);
            return null;
        }
    }

    /**
     * Generate embedding text from lesson metadata
     * Combines category, title, theory excerpt for rich semantic representation
     */
    buildEmbeddingText(category: string, title: string, theory?: string | null): string {
        const parts = [category, title];

        if (theory) {
            // Take first 500 chars of theory for embedding context
            const cleanTheory = theory
                .replace(/##?\s*/g, '')
                .replace(/\*\*/g, '')
                .replace(/\n+/g, ' ')
                .trim()
                .slice(0, 500);
            parts.push(cleanTheory);
        }

        return parts.join(' | ');
    }

    /**
     * Generate and save embedding for a cached lesson
     */
    async embedCachedLesson(lessonCacheId: string, category: string, title: string, theory?: string | null): Promise<boolean> {
        const text = this.buildEmbeddingText(category, title, theory);
        const embedding = await this.generateEmbedding(text);

        if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
            console.warn(`EmbeddingService: Invalid embedding for "${title}" (got ${embedding?.length || 0} dims, expected ${EMBEDDING_DIMENSION})`);
            return false;
        }

        try {
            // Use service role via edge function for update
            const { error } = await supabase.functions.invoke('generate-embedding', {
                body: {
                    lessonCacheId,
                    embedding,
                },
            });

            if (error) {
                console.warn('EmbeddingService: Failed to save embedding', error.message);
                return false;
            }

            return true;
        } catch (err) {
            console.warn('EmbeddingService: embedCachedLesson error', err);
            return false;
        }
    }

    /**
     * Search for similar lessons using vector similarity
     */
    async findSimilarLessons(
        query: string,
        difficulty?: string,
        language: string = 'en',
        limit: number = 5
    ): Promise<Array<{
        id: string;
        category: string;
        title: string;
        theory: string | null;
        questions: any[];
        quality_score: number;
        similarity: number;
    }>> {
        try {
            // Generate embedding for the query
            const queryEmbedding = await this.generateEmbedding(query);
            if (!queryEmbedding) return [];

            const { data, error } = await supabase.rpc('find_similar_lessons', {
                p_embedding: queryEmbedding,
                p_difficulty: difficulty || null,
                p_language: language,
                p_limit: limit,
            });

            if (error) {
                console.warn('EmbeddingService: findSimilarLessons RPC error', error.message);
                return [];
            }

            return data || [];
        } catch (err) {
            console.warn('EmbeddingService: findSimilarLessons error', err);
            return [];
        }
    }

    /**
     * Batch embed all un-embedded lessons in cache
     * Call this periodically or after warm-up
     */
    async embedAllMissing(): Promise<{ processed: number; success: number; failed: number }> {
        const stats = { processed: 0, success: 0, failed: 0 };

        try {
            // Fetch lessons without embeddings
            const { data: lessons, error } = await supabase
                .from('lesson_cache')
                .select('id, category, title, theory')
                .is('embedding', null)
                .limit(50); // Process in batches of 50

            if (error || !lessons || lessons.length === 0) {
                return stats;
            }

            for (const lesson of lessons) {
                stats.processed++;
                const ok = await this.embedCachedLesson(
                    lesson.id,
                    lesson.category,
                    lesson.title,
                    lesson.theory
                );
                if (ok) stats.success++;
                else stats.failed++;

                // Rate limit: 100ms between calls
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (err) {
            console.warn('EmbeddingService: embedAllMissing error', err);
        }

        return stats;
    }
}

export const embeddingService = new EmbeddingService();
export default embeddingService;
