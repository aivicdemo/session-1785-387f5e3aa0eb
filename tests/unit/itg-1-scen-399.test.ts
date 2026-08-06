import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { isWithinReportingDeadline } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時の確認メール自動配信機能", () => {
  // SCEN-399: [edge] 報告期限判定機能 - 月末日の朝会開始時刻において期限判定が正常に機能する
  test("should return true when current time is before deadline on month-end day at morning assembly start time", () => {
    const current_time_iso = "2024-01-31T09:00:00Z";
    const deadline_time_iso = "2024-01-31T09:30:00Z";
    const current_timestamp_ms = new Date(current_time_iso).getTime();
    const deadline_timestamp_ms = new Date(deadline_time_iso).getTime();

    const user_id = "user_001";
    const report_date = "2024-01-31";
    const system_settings = {
      report_deadline_hour: 9,
      report_deadline_minute: 30,
      is_business_day: true,
    };

    const result = isWithinReportingDeadline(
      current_timestamp_ms,
      deadline_timestamp_ms,
      user_id,
      report_date,
      system_settings
    );

    expect(result).toBe(true);
  });
});