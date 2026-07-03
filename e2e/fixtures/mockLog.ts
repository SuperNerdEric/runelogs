export const testLogId = "60742762-57c8-4676-8daa-3381dff38036";

function mockFight(
  id: string,
  name: string,
  order: number,
  options?: { fightDurationTicks?: number; groupId?: string | null },
) {
  return {
    id,
    name,
    mainEnemyName: name,
    startTime: "2026-06-15T13:12:00.000Z",
    isNpc: true,
    isBoss: true,
    isWave: false,
    fightDurationTicks: options?.fightDurationTicks ?? 207,
    officialDurationTicks: null,
    success: true,
    logVersion: "1",
    loggedInPlayer: "honorable",
    logId: testLogId,
    groupId: options?.groupId ?? null,
    order,
  };
}

export const mockLogResponse = {
  logId: testLogId,
  name: "Expert ToA (1), Alchemical Hydra (3)",
  uploaderId: "honorable",
  uploadedAt: "2026-06-15T13:10:32.000Z",
  encounters: [
    {
      type: "fightGroup" as const,
      id: "tob-1",
      name: "Theatre of Blood - 1",
      leaderboardName: "Theatre of Blood",
      officialDurationTicks: 50000,
      success: true,
      order: 0,
      fights: [
        mockFight("tob-maiden", "The Maiden of Sugadinti", 0, {
          fightDurationTicks: 9500,
          groupId: "tob-1",
        }),
        mockFight("tob-bloat", "Pestilent Bloat", 1, {
          fightDurationTicks: 6200,
          groupId: "tob-1",
        }),
        mockFight("tob-nylo", "Nylocas Vasilias", 2, {
          fightDurationTicks: 8800,
          groupId: "tob-1",
        }),
      ],
    },
    {
      type: "fight" as const,
      ...mockFight("fight-1", "Alchemical Hydra", 1),
    },
  ],
};
