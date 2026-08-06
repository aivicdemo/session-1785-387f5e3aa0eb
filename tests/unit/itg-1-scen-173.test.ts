import { validateAndSendMorningReport } from "../../src/logic/it-1";

describe("朝会報告送信バリデーション", () => {
  // SCEN-173
  test("第3項目が禁止文字を含むとき送信を中断してエラーメッセージを表示する", () => {
    const input = {
      yesterdayAccomplishment: "昨日はドキュメント作成を行いました",
      todayPlan: "本日はテスト実施を予定しています",
      currentIssue: "課題：<script>alert('test')</script>",
      userId: "test-user-001",
      departmentId: "dev-dept-001",
    };

    expect(() => validateAndSendMorningReport(input)).toThrow(/禁止文字/);
  });
});