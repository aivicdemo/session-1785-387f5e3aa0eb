import { validateMorningReportSubmission } from "../../src/logic/it-1";

describe("朝会報告送信検証機能", () => {
  // SCEN-100
  test("昨日の実績と抱えている課題が両方空のとき送信を中止してエラーメッセージを表示する", () => {
    const submission = {
      yesterdayAccomplishment: "",
      todayPlan: "本日は機能Aの実装を進める予定です",
      currentChallenges: "",
    };

    expect(() => validateMorningReportSubmission(submission)).toThrow(
      /昨日の実績と抱えている課題の両方/
    );
  });
});