import { validateReportDeadline } from "../../src/logic/it-1";

describe("報告期限判定機能", () => {
  test("SCEN-379: 同じ入力条件で2回実行しても同じ期限判定結果が得られる", () => {
    // モック日時を固定: 2024年1月15日 09:00:00 UTC
    const mockNow = new Date("2024-01-15T09:00:00Z");
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => mockNow.getTime());

    // 朝会開始予定時刻を設定（2024年1月15日 09:30:00 UTC）
    const meetingStartTime = new Date("2024-01-15T09:30:00Z");

    // 報告員Aの入力データ
    const reportInput = {
      yesterday_achievement: "タスクA完了",
      today_plan: "タスクB開始",
      current_issues: "なし",
    };

    // 報告員AのユーザーID
    const userId = "user_001";

    // 1回目の期限判定実行
    const firstResult = validateReportDeadline({
      userId,
      reportInput,
      meetingStartTime,
      currentTime: mockNow,
    });

    // 1回目の結果を記録
    const firstStatus = firstResult.isWithinDeadline;
    const firstTimestamp = firstResult.judgmentTimestamp;

    // モック日時を変更せず同じ条件を保持したまま2回目実行
    const secondResult = validateReportDeadline({
      userId,
      reportInput,
      meetingStartTime,
      currentTime: mockNow,
    });

    // 2回目の結果を記録
    const secondStatus = secondResult.isWithinDeadline;
    const secondTimestamp = secondResult.judgmentTimestamp;

    // 期待結果: 1回目と2回目の判定結果が完全に一致
    expect(firstStatus).toBe(secondStatus);
    expect(firstTimestamp).toBe(secondTimestamp);
    expect(firstTimestamp).toBe("2024-01-15T09:00:00Z");

    // モックをリセット
    Date.now = originalDateNow;
  });
});