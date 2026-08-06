import { checkReportDeadline } from "../../src/logic/it-1-br-1-1-1";

describe("報告期限判定機能 - 部長情報が null の場合の処理", () => {
  // SCEN-388
  test("部長情報が null のとき、期限判定が実行されない", () => {
    const report_id = "RPT-20240115-001";
    const user_id = "USR-ENG-001";
    const user_name = "山田太郎";
    const department_id = "DEPT-DEV";
    const submitted_at = new Date("2024-01-15T08:30:00Z");
    const deadline_at = new Date("2024-01-15T08:00:00Z");
    const manager_id = null;
    const manager_name = null;

    expect(() =>
      checkReportDeadline({
        report_id,
        user_id,
        user_name,
        department_id,
        submitted_at,
        deadline_at,
        manager_id,
        manager_name,
      })
    ).toThrow(/部長/);
  });
});