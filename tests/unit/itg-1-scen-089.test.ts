import { validateAndSubmitReport } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("朝会報告送信検証機能", () => {
  // SCEN-089
  test("3項目すべてが入力されている場合、送信処理が実行される", async () => {
    fetchMock.resetMocks();

    const report_input = {
      yesterday_work: "顧客A社への提案資料作成",
      today_plan: "顧客B社との打ち合わせ",
      current_issues: "プロジェクトXの納期調整",
      reporter_name: "山田太郎",
      reporter_email: "yamada@example.com",
      submission_date: "2024-01-15",
      manager_email: "manager@example.com",
    };

    const expected_mail_body =
      "昨日やったこと：顧客A社への提案資料作成\n今日やること：顧客B社との打ち合わせ\n抱えている課題：プロジェクトXの納期調整";

    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });

    const result = await validateAndSubmitReport(report_input);

    expect(result.status).toBe("submitted");
    expect(fetchMock.mock.calls).toHaveLength(1);

    const call_args = fetchMock.mock.calls[0][1];
    expect(call_args.method).toBe("POST");

    const request_body = JSON.parse(call_args.body);
    expect(request_body.recipient).toBe("manager@example.com");
    expect(request_body.subject).toContain("山田太郎");
    expect(request_body.subject).toContain("2024-01-15");
    expect(request_body.body).toContain("顧客A社への提案資料作成");
    expect(request_body.body).toContain("顧客B社との打ち合わせ");
    expect(request_body.body).toContain("プロジェクトXの納期調整");
  });
});