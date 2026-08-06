import { formatUnifiedReportList } from "../../src/logic/it-1";

describe("日報統一フォーマット整形・表示機能", () => {
  // SCEN-221
  test("部員0名の状態でも統一フォーマット整形処理が実行できる", () => {
    const emptyReportList: Array<{
      employeeId: string;
      employeeName: string;
      yesterday: string;
      today: string;
      issues: string;
      submittedAt: string;
    }> = [];

    const result = formatUnifiedReportList(emptyReportList);

    expect(result.status).toBe("success");
    expect(result.formattedOutput).toBeDefined();
    expect(Array.isArray(result.formattedOutput.rows)).toBe(true);
    expect(result.formattedOutput.rows.length).toBe(0);
    expect(result.formattedOutput.hasHeader).toBe(true);
    expect(result.formattedOutput.header).toEqual({
      employeeId: "従業員ID",
      employeeName: "従業員名",
      yesterday: "昨日の実績",
      today: "本日の予定",
      issues: "抱えている課題",
      submittedAt: "送信時刻",
    });
  });
});