import { runTx1Imp1Agent } from "../../src/logic/it-1";

// Mock types and interfaces
interface Tx1Imp1AiClient {
  validateReportContent(input: {
    yesterdayAccomplishment: string;
    todayPlan: string;
    currentIssue: string;
  }): Promise<{
    isValid: boolean;
    validationStatus: string;
  }>;
}

interface StubMailService {
  sendMail(payload: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void>;
  getHistory(): Array<{
    to: string;
    subject: string;
    body: string;
    sentAt: string;
  }>;
  resetHistory(): void;
}

interface StubReportManagementApi {
  registerReport(payload: {
    engineerId: string;
    yesterdayAccomplishment: string;
    todayPlan: string;
    currentIssue: string;
    submittedAt: string;
  }): Promise<{ reportId: string; status: string }>;
  getRegistrationHistory(): Array<{
    reportId: string;
    engineerId: string;
    status: string;
    submittedAt: string;
  }>;
  resetHistory(): void;
}

interface TransactionLog {
  eventType: string;
  engineerId: string;
  timestamp: string;
  contentHash: string;
}

interface ManagementSystemState {
  transactionLogs: TransactionLog[];
  registeredReports: Array<{
    engineerId: string;
    yesterdayAccomplishment: string;
    todayPlan: string;
    currentIssue: string;
    registeredAt: string;
  }>;
}

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-526
  test("AIエージェントが日報入力から送信・確認メール配信まで自動化で完了する", async () => {
    // Initialize stub services
    const mailServiceHistory: Array<{
      to: string;
      subject: string;
      body: string;
      sentAt: string;
    }> = [];

    const stubMailService: StubMailService = {
      sendMail: async (payload) => {
        mailServiceHistory.push({
          to: payload.to,
          subject: payload.subject,
          body: payload.body,
          sentAt: new Date("2024-01-15T09:30:00Z").toISOString(),
        });
      },
      getHistory: () => mailServiceHistory,
      resetHistory: () => {
        mailServiceHistory.length = 0;
      },
    };

    const reportRegistrationHistory: Array<{
      reportId: string;
      engineerId: string;
      status: string;
      submittedAt: string;
    }> = [];

    const managementSystemState: ManagementSystemState = {
      transactionLogs: [],
      registeredReports: [],
    };

    const stubReportApi: StubReportManagementApi = {
      registerReport: async (payload) => {
        const reportId = `RPT-${Date.now()}`;
        reportRegistrationHistory.push({
          reportId,
          engineerId: payload.engineerId,
          status: "registered",
          submittedAt: payload.submittedAt,
        });

        managementSystemState.registeredReports.push({
          engineerId: payload.engineerId,
          yesterdayAccomplishment: payload.yesterdayAccomplishment,
          todayPlan: payload.todayPlan,
          currentIssue: payload.currentIssue,
          registeredAt: payload.submittedAt,
        });

        const contentStr = `${payload.yesterdayAccomplishment}|${payload.todayPlan}|${payload.currentIssue}`;
        const contentHash = Buffer.from(contentStr).toString("base64");

        managementSystemState.transactionLogs.push({
          eventType: "日報登録成功",
          engineerId: payload.engineerId,
          timestamp: payload.submittedAt,
          contentHash,
        });

        return { reportId, status: "registered" };
      },
      getRegistrationHistory: () => reportRegistrationHistory,
      resetHistory: () => {
        reportRegistrationHistory.length = 0;
      },
    };

    const stubAiClient: Tx1Imp1AiClient = {
      validateReportContent: async (input) => {
        const hasAllFields =
          input.yesterdayAccomplishment &&
          input.yesterdayAccomplishment.trim().length > 0 &&
          input.todayPlan &&
          input.todayPlan.trim().length > 0 &&
          input.currentIssue &&
          input.currentIssue.trim().length > 0;

        return {
          isValid: hasAllFields,
          validationStatus: hasAllFields ? "完全かつ適切" : "不完全",
        };
      },
    };

    // Agent initialization
    const agentConfig = {
      aiClient: stubAiClient,
      mailService: stubMailService,
      reportApi: stubReportApi,
      managementSystemState,
      businessHourStart: new Date("2024-01-15T08:00:00Z"),
      businessHourEnd: new Date("2024-01-15T18:00:00Z"),
      submissionDeadline: new Date("2024-01-15T09:00:00Z"),
    };

    // First submission from engineer A
    const engineerAFirstInput = {
      engineerId: "ENG-001",
      engineerName: "部員A",
      yesterdayAccomplishment:
        "システムのバグ修正2件完了、レビュー5件実施",
      todayPlan: "新機能Aの開発開始、仕様書レビュー",
      currentIssue: "データベース接続のパフォーマンス問題が未解決",
      submittedAt: new Date("2024-01-15T08:45:00Z").toISOString(),
    };

    await runTx1Imp1Agent({
      config: agentConfig,
      reportSubmission: engineerAFirstInput,
    });

    // Verify first submission
    expect(reportRegistrationHistory.length).toBe(1);
    expect(reportRegistrationHistory[0].engineerId).toBe("ENG-001");
    expect(reportRegistrationHistory[0].status).toBe("registered");

    expect(mailServiceHistory.length).toBe(1);
    const firstConfirmationMail = mailServiceHistory[0];
    expect(firstConfirmationMail.to).toBe("manager@company.com");
    expect(firstConfirmationMail.subject).toContain("部員A");
    expect(firstConfirmationMail.body).toContain(
      "システムのバグ修正2件完了、レビュー5件実施"
    );
    expect(firstConfirmationMail.body).toContain("新機能Aの開発開始、仕様書レビュー");
    expect(firstConfirmationMail.body).toContain(
      "データベース接続のパフォーマンス問題が未解決"
    );

    expect(managementSystemState.transactionLogs.length).toBe(1);
    expect(managementSystemState.transactionLogs[0].eventType).toBe(
      "日報登録成功"
    );
    expect(managementSystemState.transactionLogs[0].engineerId).toBe("ENG-001");

    // Second submission from engineer A
    const engineerASecondInput = {
      engineerId: "ENG-001",
      engineerName: "部員A",
      yesterdayAccomplishment: "新機能Aの基本設計完了、テストコード20行追加",
      todayPlan: "新機能Aのモジュール実装、統合テスト準備",
      currentIssue: "チームのスケジュール調整が必要",
      submittedAt: new Date("2024-01-15T08:50:00Z").toISOString(),
    };

    await runTx1Imp1Agent({
      config: agentConfig,
      reportSubmission: engineerASecondInput,
    });

    // Verify second submission
    expect(reportRegistrationHistory.length).toBe(2);
    expect(reportRegistrationHistory[1].engineerId).toBe("ENG-001");
    expect(reportRegistrationHistory[1].reportId).not.toBe(
      reportRegistrationHistory[0].reportId
    );

    expect(mailServiceHistory.length).toBe(2);
    const secondConfirmationMail = mailServiceHistory[1];
    expect(secondConfirmationMail.to).toBe("manager@company.com");
    expect(secondConfirmationMail.subject).toContain("部員A");
    expect(secondConfirmationMail.body).toContain(
      "新機能Aの基本設計完了、テストコード20行追加"
    );
    expect(secondConfirmationMail.body).toContain(
      "新機能Aのモジュール実装、統合テスト準備"
    );
    expect(secondConfirmationMail.body).toContain(
      "チームのスケジュール調整が必要"
    );

    expect(managementSystemState.transactionLogs.length).toBe(2);
    expect(managementSystemState.transactionLogs[1].eventType).toBe(
      "日報登録成功"
    );
    expect(managementSystemState.transactionLogs[1].engineerId).toBe("ENG-001");

    // Verify submission deadline check (within deadline, no reminder)
    const submissionTimestamp = new Date("2024-01-15T08:50:00Z");
    const submissionDeadline = new Date("2024-01-15T09:00:00Z");
    expect(submissionTimestamp.getTime()).toBeLessThan(
      submissionDeadline.getTime()
    );

    // Verify no reminder mail was sent (only 2 confirmation mails, no reminder)
    const reminderMails = mailServiceHistory.filter(
      (mail) =>
        mail.subject.includes("催促") ||
        mail.body.includes("提出期限") ||
        mail.body.includes("リマインド")
    );
    expect(reminderMails.length).toBe(0);

    // Verify management system registration records
    expect(managementSystemState.registeredReports.length).toBe(2);
    expect(managementSystemState.registeredReports[0].engineerId).toBe(
      "ENG-001"
    );
    expect(managementSystemState.registeredReports[0].yesterdayAccomplishment).toBe(
      "システムのバグ修正2件完了、レビュー5件実施"
    );
    expect(managementSystemState.registeredReports[1].engineerId).toBe(
      "ENG-001"
    );
    expect(managementSystemState.registeredReports[1].yesterdayAccomplishment).toBe(
      "新機能Aの基本設計完了、テストコード20行追加"
    );

    // Verify transaction logs contain all required fields
    managementSystemState.transactionLogs.forEach((log) => {
      expect(log.eventType).toBe("日報登録成功");
      expect(log.engineerId).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(log.contentHash).toBeDefined();
      expect(log.contentHash.length).toBeGreaterThan(0);
    });

    // Verify agent completed successfully
    expect(reportRegistrationHistory.length).toBe(2);
    expect(managementSystemState.transactionLogs.length).toBe(2);
  });
});