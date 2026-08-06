import { validateDailyReport } from "../../src/logic/it-1";

describe("朝会報告送信フォーム", () => {
  // SCEN-178
  test("項目1の文字数が最大許容値直下で送信が続行される", () => {
    fetchMock.resetMocks();

    const maxCharItem1 = 2000;
    const validTextItem1 = "a".repeat(maxCharItem1 - 1);
    const validTextItem2 = "本日の予定です";
    const validTextItem3 = "現在の課題です";

    const input = {
      yesterdayAccomplishment: validTextItem1,
      todayPlan: validTextItem2,
      currentChallenge: validTextItem3,
    };

    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });

    const result = validateDailyReport(input);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/confirm-email/);
  });
});