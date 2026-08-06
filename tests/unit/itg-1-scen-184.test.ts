import { validateAndSubmitReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-184: [edge] 朝会報告送信バリデーション - 項目3の文字数が最大許容値直下で送信が続行される
  test("項目3が最大許容文字数-1のとき送信が続行され確認メールが送信される", () => {
    const mockEmailSender = jest.fn().mockResolvedValue({
      success: true,
      messageId: "msg-001",
    });

    const maxCharacters = 500;
    const testItem3 = "a".repeat(maxCharacters - 1);

    const reportData = {
      userId: "user-001",
      departmentId: "dept-001",
      submittedAt: new Date("2024-01-15T08:30:00Z"),
      item1_yesterday: "昨日完了したタスク：バグ修正",
      item2_today: "本日の予定：ドキュメント作成",
      item3_issue: testItem3,
      emailSender: mockEmailSender,
    };

    const result = validateAndSubmitReport(reportData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.submitted).toBe(true);
    expect(mockEmailSender).toHaveBeenCalledTimes(1);
    expect(mockEmailSender).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-001",
        departmentId: "dept-001",
        subject: "朝会報告確認メール",
      })
    );
    expect(result.formState).toBe("completed");
  });
});