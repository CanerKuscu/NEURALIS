// LevelEngine.ts
// Infinite level and difficulty system, Duolingo/Candy Crush style progression

export type LevelData = {
  level: number;
  difficulty: number; // Difficulty coefficient (1.0-5.0)
  requiredLP: number; // Total LP required to reach this level
  tasks: Array<{
    id: string;
    title: string;
    basePoints: number;
    qualityWeight: number; // Quality coefficient
  }>;
};

export class LevelEngine {
  static getLevelData(level: number): LevelData {
    // Difficulty coefficient and required LP formulas
    const difficulty = 1 + Math.min(4, Math.log2(level)); // Increasing difficulty between 1.0-5.0
    const requiredLP = Math.floor(100 * Math.pow(level, 2)); // Quadratic growth instead of square root (example)
    // Tasks diversify and points increase at each level
    const tasks = Array.from({ length: 3 + Math.floor(level / 5) }, (_, i) => ({
      id: `task_${level}_${i}`,
      title: `Level ${level} Task ${i + 1}`,
      basePoints: 10 + level * 2 + i * 3,
      qualityWeight: 1 + (i % 3) * 0.5,
    }));
    return { level, difficulty, requiredLP, tasks };
  }

  static getNextLevel(currentLevel: number): LevelData {
    return this.getLevelData(currentLevel + 1);
  }

  static getLPForTask(
    task: { basePoints: number; qualityWeight: number },
    quality: number,
    streak: number,
  ): number {
    // LP = Z * K * S
    const Z = task.qualityWeight;
    const K = quality;
    const S = 1.0 + Math.log(Math.max(1, streak));
    return Math.round(task.basePoints * Z * K * S);
  }
}
