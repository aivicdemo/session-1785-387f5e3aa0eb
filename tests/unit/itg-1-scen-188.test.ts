import { validateAndSendReport } from "../../src/logic/it-1";

describe("朝会報告送信バリデーション", () => {
  // SCEN-188
  test("項目2が最小許容文字数ちょうどで送信が続行される", () => {
    const sendConfirmationEmailMock = jest.fn().mockResolvedValue(undefined);

    const input = {
      userId: "user-001",
      departmentId: "dev-dept",
      item1YesterdayAccomplishment: "昨日は顧客対応を完了しました",
      item2TodayPlan: "本日予定",
      item3CurrentChallenge: "特になし",
      sendConfirmationEmail: sendConfirmationEmailMock,
      submittedAt: new Date("2024-01-15T09:00:00Z"),
    };

    const result = validateAndSendReport(input);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(sendConfirmationEmailMock).toHaveBeenCalledTimes(1);
    expect(sendConfirmationEmailMock).toHaveBeenCalledWith({
      userId: "user-001",
      departmentId: "dev-dept",
      item1YesterdayAccomplishment: "昨日は顧客対応を完了しました",
      item2TodayPlan: "本日予定",
      item3CurrentChallenge: "特になし",
      submittedAt: new Date("2024-01-15T09:00:00Z"),
    });
  });
});