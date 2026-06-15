/**
 * @file StreakService unit tests
 *
 * Tests for the core streak calculation functions:
 * - calculateStreakState: determines streak urgency from deadline
 * - getTimeUntilDeadline: returns remaining ms
 * - formatTimeRemaining: formats ms to HH:MM:SS
 */

import { calculateStreakState, getTimeUntilDeadline, formatTimeRemaining } from '../../src/services/StreakService';

describe('StreakService', () => {
    // ─── calculateStreakState ──────────────────────────────────────────────
    describe('calculateStreakState', () => {
        it('should return "healthy" when more than 4 hours remain', () => {
            const deadline = Date.now() + 5 * 60 * 60 * 1000; // 5h from now
            expect(calculateStreakState(deadline)).toBe('healthy');
        });

        it('should return "warning" when 2–4 hours remain', () => {
            const deadline = Date.now() + 3 * 60 * 60 * 1000; // 3h from now
            expect(calculateStreakState(deadline)).toBe('warning');
        });

        it('should return "warning" when 30min–2h remain', () => {
            const deadline = Date.now() + 1 * 60 * 60 * 1000; // 1h from now
            expect(calculateStreakState(deadline)).toBe('warning');
        });

        it('should return "critical" when less than 30 minutes remain', () => {
            const deadline = Date.now() + 15 * 60 * 1000; // 15m from now
            expect(calculateStreakState(deadline)).toBe('critical');
        });

        it('should return "dead" when deadline has passed', () => {
            const deadline = Date.now() - 1000; // 1s ago
            expect(calculateStreakState(deadline)).toBe('dead');
        });

        it('should return "dead" for deadline exactly at now', () => {
            const deadline = Date.now();
            expect(calculateStreakState(deadline)).toBe('dead');
        });
    });

    // ─── getTimeUntilDeadline ─────────────────────────────────────────────
    describe('getTimeUntilDeadline', () => {
        it('should return positive value for future deadline', () => {
            const deadline = Date.now() + 10000;
            expect(getTimeUntilDeadline(deadline)).toBeGreaterThan(0);
        });

        it('should return 0 for past deadline', () => {
            const deadline = Date.now() - 5000;
            expect(getTimeUntilDeadline(deadline)).toBe(0);
        });
    });

    // ─── formatTimeRemaining ──────────────────────────────────────────────
    describe('formatTimeRemaining', () => {
        it('should format 0 as 00:00:00', () => {
            expect(formatTimeRemaining(0)).toBe('00:00:00');
        });

        it('should format negative values as 00:00:00', () => {
            expect(formatTimeRemaining(-1000)).toBe('00:00:00');
        });

        it('should format 1 hour correctly', () => {
            const oneHour = 60 * 60 * 1000;
            expect(formatTimeRemaining(oneHour)).toBe('01:00:00');
        });

        it('should format 23h 59m 59s correctly', () => {
            const ms = (23 * 60 * 60 + 59 * 60 + 59) * 1000;
            expect(formatTimeRemaining(ms)).toBe('23:59:59');
        });

        it('should format 5 minutes 30 seconds correctly', () => {
            const ms = (5 * 60 + 30) * 1000;
            expect(formatTimeRemaining(ms)).toBe('00:05:30');
        });
    });
});
