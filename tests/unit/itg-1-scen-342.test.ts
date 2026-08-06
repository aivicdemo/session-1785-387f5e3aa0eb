import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  assignPriorityToRemindersWithDuplicates,
  type RemindTargetMember,
  type RemindTargetMemberWithPriority,
} from "../../src/logic/it-1-br-1-1-1";

describe("催促対象部員優先順位付与機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-342
  it("催促対象部員リストに重複データが含まれる場合、同一ユーザーが複数回出現しない", () => {
    const remindTargetMembers: RemindTargetMember[] = [
      {
        userId: "U001",
        userName: "Engineer A",
        departmentId: "D001",
        reportStatus: "not_submitted",
      },
      {
        userId: "U002",
        userName: "Engineer B",
        departmentId: "D001",
        reportStatus: "delayed",
      },
      {
        userId: "U003",
        userName: "Engineer C",
        departmentId: "D002",
        reportStatus: "not_submitted",
      },
      {
        userId: "U001",
        userName: "Engineer A",
        departmentId: "D001",
        reportStatus: "not_submitted",
      },
      {
        userId: "U003",
        userName: "Engineer C",
        departmentId: "D002",
        reportStatus: "not_submitted",
      },
    ];

    const result: RemindTargetMemberWithPriority[] =
      assignPriorityToRemindersWithDuplicates(remindTargetMembers);

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      userId: "U001",
      userName: "Engineer A",
      departmentId: "D001",
      reportStatus: "not_submitted",
      priority: 1,
    });

    expect(result[1]).toEqual({
      userId: "U002",
      userName: "Engineer B",
      departmentId: "D001",
      reportStatus: "delayed",
      priority: 2,
    });

    expect(result[2]).toEqual({
      userId: "U003",
      userName: "Engineer C",
      departmentId: "D002",
      reportStatus: "not_submitted",
      priority: 3,
    });

    const userIds = result.map((member) => member.userId);
    const uniqueUserIds = new Set(userIds);
    expect(uniqueUserIds.size).toBe(3);
    expect(userIds).toEqual(["U001", "U002", "U003"]);

    const priorities = result.map((member) => member.priority);
    expect(priorities).toEqual([1, 2, 3]);
  });
});