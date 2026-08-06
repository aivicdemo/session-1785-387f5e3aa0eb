import { validateAndSubmitReport } from "../../src/logic/it-1";

describe("朝会報告送信検証機能", () => {
  // SCEN-109
  test("抱えている課題が空文字列で送信を中止", () => {
    const input = {
      yesterdayAccomplishment: "昨日の実績を完了しました",
      todayPlan: "本日の予定は新規機能開発です",
      currentChallenge: "",
    };

    expect(() => validateAndSubmitReport(input)).toThrow(/抱えている課題/);
  });
});