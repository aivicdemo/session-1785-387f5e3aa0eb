import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

describe("報告送信時の確認メール配信機能", () => {
  // SCEN-290
  test("部長のメールアドレスが空文字のとき、メール配信処理が中断される", async () => {
    const mockAiClient: jest.Mocked<Tx2Imp1AiClient> = {
      confirmAllReportStatus: jest.fn().mockResolvedValue({
        unreportedMembers: [
          {
            userId: "eng-002",
            userName: "田中太郎",
          },
          {
            userId: "eng-005",
            userName: "鈴木次郎",
          },
        ],
        delayedMembers: [],
      }),
      judgeUnreportedAndDelayed: jest.fn().mockResolvedValue({
        unreported: [
          {
            userId: "eng-002",
            userName: "田中太郎",
          },
          {
            userId: "eng-005",
            userName: "鈴木次郎",
          },
        ],
        delayed: [],
      }),
    };

    const configWithEmptyManagerEmail = {
      managerEmail: "",
      scheduledTime: "09:00",
      morningMeetingStartTime: "09:30",
    };

    const result = await runTx2Imp1Agent(
      mockAiClient,
      configWithEmptyManagerEmail
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("INVALID_MANAGER_EMAIL");
    expect(result.errorMessage).toMatch(/部長.*メール.*空/);
    expect(mockAiClient.confirmAllReportStatus).toHaveBeenCalled();
    expect(mockAiClient.judgeUnreportedAndDelayed).toHaveBeenCalled();
  });
});