import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  classifyReportArrivalStatus,
  ReportArrivalStatusResult,
} from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-449
  test("報告到着状況の把握機能 - 到着済み・未到着・遅延が混在する場合、各ステータスの報告者が正確に分類される", () => {
    // Arrange: テスト用データ初期化
    const deadline_time = new Date("2024-01-15T09:00:00Z");

    const arrived_users = [
      { user_id: "user001", submitted_at: new Date("2024-01-15T08:30:00Z") },
      { user_id: "user002", submitted_at: new Date("2024-01-15T08:30:00Z") },
      { user_id: "user003", submitted_at: new Date("2024-01-15T08:30:00Z") },
    ];

    const not_arrived_users = [
      { user_id: "user004", submitted_at: null },
      { user_id: "user005", submitted_at: null },
      { user_id: "user006", submitted_at: null },
    ];

    const delayed_users = [
      { user_id: "user007", submitted_at: new Date("2024-01-15T09:15:00Z") },
      { user_id: "user008", submitted_at: new Date("2024-01-15T09:15:00Z") },
      { user_id: "user009", submitted_at: new Date("2024-01-15T09:15:00Z") },
    ];

    const still_not_submitted = [
      { user_id: "user010", submitted_at: null },
    ];

    const all_reports = [
      ...arrived_users,
      ...not_arrived_users,
      ...delayed_users,
      ...still_not_submitted,
    ];

    // Act: 報告到着状況を分類
    const result: ReportArrivalStatusResult = classifyReportArrivalStatus(
      all_reports,
      deadline_time
    );

    // Assert: 到着済み (deadline 前に提出)
    expect(result.arrived).toHaveLength(3);
    expect(result.arrived.map((r) => r.user_id).sort()).toEqual([
      "user001",
      "user002",
      "user003",
    ]);

    // Assert: 未到着 (deadline 時点で提出なし、遅延もなし)
    expect(result.not_arrived).toHaveLength(3);
    expect(result.not_arrived.map((r) => r.user_id).sort()).toEqual([
      "user004",
      "user005",
      "user006",
    ]);

    // Assert: 遅延 (deadline 後に提出)
    expect(result.delayed).toHaveLength(3);
    expect(result.delayed.map((r) => r.user_id).sort()).toEqual([
      "user007",
      "user008",
      "user009",
    ]);

    // Assert: 全ユーザーが重複なく分類されていることを確認
    const total_classified =
      result.arrived.length + result.not_arrived.length + result.delayed.length;
    expect(total_classified).toBe(10);

    const all_classified_ids = [
      ...result.arrived.map((r) => r.user_id),
      ...result.not_arrived.map((r) => r.user_id),
      ...result.delayed.map((r) => r.user_id),
    ].sort();
    expect(new Set(all_classified_ids).size).toBe(10);
  });
});