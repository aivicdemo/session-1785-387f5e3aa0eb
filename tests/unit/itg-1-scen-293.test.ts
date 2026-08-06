import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/types";

describe("確認メール配信機能", () => {
  let mockAiClient: jest.Mocked<Tx2Imp1AiClient>;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAiClient = {
      send: jest.fn().mockResolvedValue({ success: true }),
    } as unknown as jest.Mocked<Tx2Imp1AiClient>;

    logSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    logSpy.mockRestore();
  });

  // SCEN-293
  test("報告内容1が空文字のときメール配信処理が中断される", async () => {
    const test_users = [
      { user_id: "ENG001", user_name: "Engineer1", department_id: "DEV" },
      { user_id: "ENG002", user_name: "Engineer2", department_id: "DEV" },
      { user_id: "ENG003", user_name: "Engineer3", department_id: "DEV" },
      { user_id: "ENG004", user_name: "Engineer4", department_id: "DEV" },
      { user_id: "ENG005", user_name: "Engineer5", department_id: "DEV" },
      { user_id: "ENG006", user_name: "Engineer6", department_id: "DEV" },
      { user_id: "ENG007", user_name: "Engineer7", department_id: "DEV" },
      { user_id: "ENG008", user_name: "Engineer8", department_id: "DEV" },
      { user_id: "ENG009", user_name: "Engineer9", department_id: "DEV" },
      { user_id: "ENG010", user_name: "Engineer10", department_id: "DEV" },
    ];

    const test_report_request = {
      report_id: "RPT20240115001",
      user_id: "ENG001",
      report_content_1: "",
      report_content_2: "予定の実施",
      report_content_3: "特に課題なし",
      submitted_at: new Date("2024-01-15T08:00:00Z"),
      morning_meeting_start_time: new Date("2024-01-15T09:00:00Z"),
    };

    const test_result = await runTx2Imp1Agent(
      test_report_request,
      test_users,
      mockAiClient
    );

    expect(mockAiClient.send).toHaveBeenCalledTimes(0);
    expect(logSpy).toHaveBeenCalled();
    const errorLog = logSpy.mock.calls.find((call) =>
      String(call[0]).includes("報告内容1")
    );
    expect(errorLog).toBeDefined();
    expect(String(errorLog?.[0])).toMatch(/報告内容1/);
    expect(String(errorLog?.[0])).toMatch(/空文字/);
    expect(test_result.status).toBe("VALIDATION_ERROR");
  });
});