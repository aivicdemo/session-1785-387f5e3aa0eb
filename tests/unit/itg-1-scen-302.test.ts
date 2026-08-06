import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

// Mock AI client for testing
class MockTx2Imp1AiClient implements Tx2Imp1AiClient {
  async analyzeReportStatus(): Promise<string> {
    return JSON.stringify({
      unreportedEmployees: [],
      delayedEmployees: [],
    });
  }

  async identifyMissingReports(): Promise<string> {
    return JSON.stringify({
      unreportedCount: 0,
      delayedCount: 0,
    });
  }

  async generateNotificationContent(): Promise<string> {
    return JSON.stringify({
      subject: 'Test Notification',
      body: 'Test notification body',
    });
  }
}

describe('Confirmation Email Distribution - Department ID Null Handling', () => {
  let mockEmailClient: {
    sendEmail: jest.Mock;
    resetMocks: jest.Mock;
  };
  let mockAiClient: MockTx2Imp1AiClient;
  let errorLogs: Array<{ message: string; timestamp: string }>;

  beforeEach(() => {
    jest.clearAllMocks();
    errorLogs = [];

    // Setup mock email client
    mockEmailClient = {
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
      resetMocks: jest.fn(() => {
        mockEmailClient.sendEmail.mockClear();
      }),
    };

    // Setup AI client
    mockAiClient = new MockTx2Imp1AiClient();

    // Capture error logs
    const originalError = console.error;
    jest.spyOn(console, 'error').mockImplementation((message: string) => {
      errorLogs.push({
        message,
        timestamp: new Date().toISOString(),
      });
      originalError(message);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-302
  test('should skip email distribution and log error when departmentId is null', async () => {
    const report_summary_with_null_department = {
      departmentId: null,
      employees: [
        {
          id: 'E001',
          name: '部員A',
          reportedAt: '2024-01-15T07:30:00Z',
          status: 'submitted',
        },
      ],
      timestamp: '2024-01-15T08:00:00Z',
      unreportedEmployees: [],
      delayedEmployees: [],
    };

    let result: { status?: string; reason?: string; error?: Error } | undefined;
    let thrown_error: Error | undefined;

    try {
      // Execute the confirmation email distribution step with null departmentId
      result = await runTx2Imp1Agent(
        report_summary_with_null_department,
        mockAiClient,
        mockEmailClient as any,
      );
    } catch (error) {
      thrown_error = error as Error;
    }

    // Verify email client was NOT called
    expect(mockEmailClient.sendEmail).toHaveBeenCalledTimes(0);

    // Verify error log was recorded with specific message
    const null_department_error_log = errorLogs.find((log) =>
      /部門ID.*null.*メール配信.*スキップ/.test(log.message),
    );
    expect(null_department_error_log).toBeDefined();

    // Verify function returns error status or throws
    if (result) {
      expect(result.status).toBe('SKIPPED');
      expect(result.reason).toBe('DEPARTMENT_ID_NULL');
    } else if (thrown_error) {
      expect(thrown_error).toBeInstanceOf(Error);
      expect(thrown_error.message).toMatch(/部門ID/);
    }

    // Verify subsequent steps were not executed
    // (no additional side effects beyond the error logging)
    expect(mockEmailClient.sendEmail).not.toHaveBeenCalled();
  });
});