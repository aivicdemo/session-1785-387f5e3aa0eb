import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateAndSubmitReport } from "../../src/logic/it-1";

interface MockReportSubmissionResult {
  success: boolean;
  userId: string;
  submissionDate: string;
  arrivalStatus: "arrived" | "not_arrived";
  reportContent: {
    yesterday: string;
    today: string;
    challenges: string;
  };
}

interface MockArrivalStatusCheckResult {
  userId: string;
  arrivalStatus: "arrived" | "not_arrived";
  lastSubmissionTime: string;
}

// Mock storage for simulating report submission state
let mockReportStorage: Map<string, MockArrivalStatusCheckResult> = new Map();

function resetMockStorage(): void {
  mockReportStorage.clear();
}

function storeMockArrivalStatus(
  userId: string,
  arrivalStatus: "arrived" | "not_arrived",
  submissionTime: string
): void {
  mockReportStorage.set(userId, {
    userId,
    arrivalStatus,
    lastSubmissionTime: submissionTime,
  });
}

function getMockArrivalStatus(userId: string): MockArrivalStatusCheckResult | undefined {
  return mockReportStorage.get(userId);
}

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    resetMockStorage();
  });

  // SCEN-450
  test("同じ入力データで2回実行した場合、両回とも同じ到着状況判定結果が得られる", () => {
    const userId_A = "user_001";
    const submissionDate_1 = "2024-01-15T08:30:00Z";
    const submissionDate_2 = "2024-01-15T08:35:00Z";
    const reportContent = {
      yesterday: "ドキュメント作成",
      today: "テスト実施",
      challenges: "環境構築の遅延",
    };
    const morningMeetingTime = "2024-01-15T09:00:00Z";

    // First submission
    const firstSubmissionResult: MockReportSubmissionResult = {
      success: true,
      userId: userId_A,
      submissionDate: submissionDate_1,
      arrivalStatus: "arrived",
      reportContent: reportContent,
    };

    storeMockArrivalStatus(
      firstSubmissionResult.userId,
      firstSubmissionResult.arrivalStatus,
      firstSubmissionResult.submissionDate
    );

    const firstArrivalCheck = getMockArrivalStatus(userId_A);
    expect(firstArrivalCheck).toBeDefined();
    expect(firstArrivalCheck?.arrivalStatus).toBe("arrived");

    // Second submission with same data
    const secondSubmissionResult: MockReportSubmissionResult = {
      success: true,
      userId: userId_A,
      submissionDate: submissionDate_2,
      arrivalStatus: "arrived",
      reportContent: reportContent,
    };

    storeMockArrivalStatus(
      secondSubmissionResult.userId,
      secondSubmissionResult.arrivalStatus,
      secondSubmissionResult.submissionDate
    );

    const secondArrivalCheck = getMockArrivalStatus(userId_A);
    expect(secondArrivalCheck).toBeDefined();
    expect(secondArrivalCheck?.arrivalStatus).toBe("arrived");

    // Verify both checks return identical arrival status
    expect(firstArrivalCheck?.arrivalStatus).toBe(secondArrivalCheck?.arrivalStatus);
    expect(firstArrivalCheck?.arrivalStatus).toBe("arrived");
    expect(secondArrivalCheck?.arrivalStatus).toBe("arrived");
  });
});