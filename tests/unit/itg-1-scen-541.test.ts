import { runTx1Imp1Agent } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-541
  test('AIエージェント実行中にメール配信失敗時に登録済み日報をロールバック', async () => {
    const mockAiClient = {
      generateTemplate: jest.fn().mockResolvedValue({
        yesterday_achievement: '',
        today_plan: 'テスト作業',
        current_issue: '環境構築',
      }),
    };

    const mockReportSystem = {
      register: jest.fn().mockResolvedValue({ report_id: 'report_001' }),
      delete: jest.fn().mockResolvedValue({ deleted: true }),
    };

    const mockEmailService = {
      send: jest
        .fn()
        .mockRejectedValueOnce(new Error('メール配信エラー')),
      clearLog: jest.fn().mockResolvedValue(true),
    };

    const auditLog: Array<{
      action: string;
      status: string;
      report_id?: string;
      reason?: string;
    }> = [];

    const result = await runTx1Imp1Agent(
      {
        engineer_id: 'eng_001',
        department_id: 'dev_001',
        morning_meeting_start_time: new Date('2024-01-15T09:00:00Z'),
      },
      {
        aiClient: mockAiClient,
        reportSystem: mockReportSystem,
        emailService: mockEmailService,
        auditLog: auditLog,
      }
    );

    expect(result.final_state).toBe('ROLLED_BACK');
    expect(result.report_id).toBeUndefined();

    expect(mockReportSystem.register).toHaveBeenCalledTimes(1);
    expect(mockReportSystem.delete).toHaveBeenCalledWith('report_001');
    expect(mockEmailService.clearLog).toHaveBeenCalledTimes(1);

    expect(auditLog).toEqual([
      {
        action: 'report_registration',
        status: 'completed',
        report_id: 'report_001',
      },
      {
        action: 'confirmation_email_dispatch',
        status: 'failed',
        reason: 'メール配信エラー',
      },
      {
        action: 'rollback_report_registration',
        status: 'completed',
        report_id: 'report_001',
      },
      {
        action: 'rollback_email_log',
        status: 'completed',
      },
    ]);

    expect(result.escalation_reason).toMatch(/メール配信/);
  });
});