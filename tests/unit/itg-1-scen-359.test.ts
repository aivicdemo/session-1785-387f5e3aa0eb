import { validateAllReportsSubmitted } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-359
  test("全員報告完了判定機能 - 報告送信履歴データが空配列のとき、エラーが発生する", () => {
    const empty_submission_history: Array<{
      user_id: string;
      submission_date: string;
      submission_time: string;
      status: string;
    }> = [];

    expect(() => validateAllReportsSubmitted(empty_submission_history)).toThrow(
      /報告送信履歴/
    );
  });
});