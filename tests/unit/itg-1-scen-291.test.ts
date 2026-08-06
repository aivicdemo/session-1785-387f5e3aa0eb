import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/ai-client';
import * as mailService from '../../src/services/mail-service';
import * as logService from '../../src/services/log-service';
import * as db from '../../src/db';

jest.mock('../../src/services/mail-service');
jest.mock('../../src/services/log-service');
jest.mock('../../src/db');

describe('確認メール配信機能 - 部長メールアドレスnull時の処理', () => {
  let mockAiClient: jest.Mocked<Tx2Imp1AiClient>;
  let mockMailServiceSendConfirmationEmail: ReturnType<typeof jest.spyOn>;
  let mockLogServiceError: ReturnType<typeof jest.spyOn>;
  let mockDbInsertConfirmationHistory: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMailServiceSendConfirmationEmail = jest.spyOn(mailService, 'sendConfirmationEmail').mockResolvedValue({
      success: false,
      error: 'TypeError: 部長メールアドレスがnull',
    });

    mockLogServiceError = jest.spyOn(logService, 'logError').mockResolvedValue(undefined);

    mockDbInsertConfirmationHistory = jest.spyOn(db, 'insertConfirmationEmailHistory').mockResolvedValue(undefined);

    mockAiClient = {
      identifyUnreportedMembers: jest.fn().mockResolvedValue({
        unreportedMembers: ['部員A', '部員B', '部員C', '部員D', '部員E'],
        delayedMembers: [],
      }),
    } as unknown as jest.Mocked<Tx2Imp1AiClient>;
  });

  // SCEN-291
  test('部長のメールアドレスがnullのとき、メール配信処理が中断される', async () => {
    const division_manager_user = {
      user_id: 'manager_001',
      user_name: '開発部長',
      email: null,
      role: 'manager',
      division_id: 'dev_001',
    };

    const unsubmitted_employees = [
      { user_id: 'emp_001', user_name: '部員A', email: 'emp_a@example.com' },
      { user_id: 'emp_002', user_name: '部員B', email: 'emp_b@example.com' },
      { user_id: 'emp_003', user_name: '部員C', email: 'emp_c@example.com' },
      { user_id: 'emp_004', user_name: '部員D', email: 'emp_d@example.com' },
      { user_id: 'emp_005', user_name: '部員E', email: 'emp_e@example.com' },
    ];

    const orchestration_input = {
      manager_user: division_manager_user,
      unsubmitted_members: unsubmitted_employees,
      scheduled_meeting_time: new Date('2024-01-15T09:00:00Z'),
      current_timestamp: new Date('2024-01-15T08:55:00Z'),
      ai_client: mockAiClient,
    };

    let caught_error: Error | null = null;

    try {
      await runTx2Imp1Agent(orchestration_input);
    } catch (error) {
      caught_error = error as Error;
    }

    expect(caught_error).not.toBeNull();
    expect(caught_error?.message).toMatch(/部長メールアドレスがnull/);

    expect(mockLogServiceError).toHaveBeenCalledWith(
      expect.stringContaining('部長メールアドレスがnull: メール配信中断')
    );

    expect(mockMailServiceSendConfirmationEmail).toHaveBeenCalledTimes(0);

    expect(mockDbInsertConfirmationHistory).toHaveBeenCalledTimes(0);
  });
});