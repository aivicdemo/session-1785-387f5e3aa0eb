import { determineReportingStatus } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-214
  test("送信履歴の記録順序が逆順の場合でも正しく送信状況が判定される", () => {
    const submission_histories = [
      {
        submission_datetime: new Date("2024-01-15T09:30:00Z"),
        user_id: "user001",
        submission_status: "送信完了",
      },
      {
        submission_datetime: new Date("2024-01-14T09:15:00Z"),
        user_id: "user001",
        submission_status: "送信完了",
      },
      {
        submission_datetime: new Date("2024-01-13T09:45:00Z"),
        user_id: "user001",
        submission_status: "送信完了",
      },
    ];

    const reference_date = new Date("2024-01-15T00:00:00Z");
    const user_id = "user001";

    const result = determineReportingStatus(
      submission_histories,
      user_id,
      reference_date
    );

    expect(result.is_submitted).toBe(true);
    expect(result.latest_submission_datetime).toEqual(
      new Date("2024-01-15T09:30:00Z")
    );
  });
});