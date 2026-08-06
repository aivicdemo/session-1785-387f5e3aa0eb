import { runTx2Imp1Agent, Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";

describe("報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能", () => {
  // SCEN-305
  test("送信済み部員情報の配列がnullのとき、メール配信処理が中断される", async () => {
    const mockEmailSendCount = jest.fn().mockReturnValue(0);
    const mockErrorLog = jest.fn();
    const mockRollback = jest.fn();

    const fakeAiClient: Tx2Imp1AiClient = {
      analyzeSendStatus: jest.fn().mockResolvedValue({
        sentMembers: null,
        unssentMembers: [],
        delayedMembers: [],
      }),
      generateNotificationMessage: jest.fn().mockResolvedValue(
        "部長へのお知らせ"
      ),
    };

    const mockEmailService = {
      sendConfirmationEmail: mockEmailSendCount,
      logError: mockErrorLog,
      rollbackMemberList: mockRollback,
    };

    const reportSubmissionTime = new Date("2024-01-15T09:30:00Z");
    const meetingStartTime = new Date("2024-01-15T10:00:00Z");
    const departmentId = "dev-dept-001";
    const managerUserId = "user-mgr-001";

    let processStatus = "";
    let caughtError: Error | null = null;

    try {
      await runTx2Imp1Agent({
        aiClient: fakeAiClient,
        sentMemberInfoArray: null,
        reportSubmissionTimestamp: reportSubmissionTime,
        meetingStartTimestamp: meetingStartTime,
        departmentId: departmentId,
        managerUserId: managerUserId,
        emailService: mockEmailService,
        onProcessStatusChange: (status: string) => {
          processStatus = status;
        },
        onError: (error: Error) => {
          caughtError = error;
        },
      });
    } catch (error) {
      caughtError = error as Error;
    }

    expect(mockEmailSendCount).not.toHaveBeenCalled();
    expect(mockEmailSendCount.mock.calls.length).toBe(0);

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toMatch(/null|undefined|送信済み部員/i);

    expect(mockErrorLog).toHaveBeenCalled();
    const errorLogCall = mockErrorLog.mock.calls[0];
    expect(errorLogCall[0]).toMatch(
      /null|undefined|送信済み部員|配列/i
    );

    expect(mockRollback).toHaveBeenCalled();

    expect(processStatus).toBe("失敗（send_member_info_null）");
  });
});