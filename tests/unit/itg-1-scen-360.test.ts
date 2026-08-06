import { validateMeetingStartTime } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-360
  test("全員報告完了判定機能 - 朝会開始時刻が null のとき、エラーが発生する", () => {
    const meeting_start_time = null;

    expect(() => {
      validateMeetingStartTime(meeting_start_time);
    }).toThrow(/朝会開始時刻/);
  });
});