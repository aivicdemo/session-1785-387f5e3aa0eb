import { runTx2Imp1Agent } from "../../src/logic/it-1-br-1-1-1";

describe("確認メール配信・日報一覧集約機能", () => {
  // SCEN-313
  test("送信済み部員と未送信部員のリストに重複データが含まれる時、重複排除された状態で集約される", async () => {
    const submitted_employee_ids = ["E001", "E002", "E003", "E001", "E002"];
    const not_submitted_employee_ids = ["E004", "E005", "E004"];

    const aggregation_result = await runTx2Imp1Agent({
      submitted_employee_ids,
      not_submitted_employee_ids,
    });

    const expected_unique_submitted = ["E001", "E002", "E003"];
    const expected_unique_not_submitted = ["E004", "E005"];
    const expected_total_employees = 5;
    const expected_not_submitted_count = 2;

    expect(aggregation_result.unique_submitted_employee_ids).toEqual(
      expected_unique_submitted
    );
    expect(aggregation_result.unique_not_submitted_employee_ids).toEqual(
      expected_unique_not_submitted
    );
    expect(aggregation_result.total_employees_count).toBe(
      expected_total_employees
    );
    expect(aggregation_result.not_submitted_employees_count).toBe(
      expected_not_submitted_count
    );
    expect(aggregation_result.aggregation_timestamp).toBeDefined();
    expect(typeof aggregation_result.aggregation_timestamp).toBe("string");
  });
});