import { prioritizeChallengeTargets } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-319
  test("催促対象部員の優先順位付け機能 - 未送信部員と遅延部員が混在する場合、未送信部員が遅延部員より前に並べられる", () => {
    const unreportedMemberA = {
      userId: "user-001",
      name: "未送信部員A",
      reportStatus: "unreported" as const,
      submittedAt: null,
      deadlineAt: new Date("2024-01-15T09:00:00Z"),
      isDelayed: false,
    };

    const unreportedMemberB = {
      userId: "user-002",
      name: "未送信部員B",
      reportStatus: "unreported" as const,
      submittedAt: null,
      deadlineAt: new Date("2024-01-15T09:00:00Z"),
      isDelayed: false,
    };

    const delayedMemberC = {
      userId: "user-003",
      name: "遅延部員C",
      reportStatus: "reported" as const,
      submittedAt: new Date("2024-01-15T09:30:00Z"),
      deadlineAt: new Date("2024-01-15T09:00:00Z"),
      isDelayed: true,
    };

    const delayedMemberD = {
      userId: "user-004",
      name: "遅延部員D",
      reportStatus: "reported" as const,
      submittedAt: new Date("2024-01-15T09:45:00Z"),
      deadlineAt: new Date("2024-01-15T09:00:00Z"),
      isDelayed: true,
    };

    const targetMembers = [
      delayedMemberD,
      unreportedMemberA,
      delayedMemberC,
      unreportedMemberB,
    ];

    const result = prioritizeChallengeTargets(targetMembers);

    expect(result.length).toBe(4);
    expect(result[0].userId).toBe("user-001");
    expect(result[0].name).toBe("未送信部員A");
    expect(result[0].reportStatus).toBe("unreported");

    expect(result[1].userId).toBe("user-002");
    expect(result[1].name).toBe("未送信部員B");
    expect(result[1].reportStatus).toBe("unreported");

    expect(result[2].userId).toBe("user-003");
    expect(result[2].name).toBe("遅延部員C");
    expect(result[2].reportStatus).toBe("reported");
    expect(result[2].isDelayed).toBe(true);

    expect(result[3].userId).toBe("user-004");
    expect(result[3].name).toBe("遅延部員D");
    expect(result[3].reportStatus).toBe("reported");
    expect(result[3].isDelayed).toBe(true);
  });
});