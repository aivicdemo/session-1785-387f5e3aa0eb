import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/logic/it-1';
import type { Tx3Imp1AiClient } from '../../src/logic/it-1';

// Mock DB and external dependencies
const mockDb = {
  query: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockUuidGenerator = {
  generate: jest.fn(),
};

const mockNotificationQueue = {
  push: jest.fn(),
};

const mockAiClient: Tx3Imp1AiClient = {
  determineEscalation: jest.fn(),
};

describe('朝会報告管理システム - 報告漏れ特定から催促送信までの自動実行 AIエージェント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.query.mockClear();
    mockDb.insert.mockClear();
    mockDb.update.mockClear();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.debug.mockClear();
    mockUuidGenerator.generate.mockClear();
    mockNotificationQueue.push.mockClear();
    mockAiClient.determineEscalation.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-560
  test('同一部員への複数回催促後も報告がない場合、エスカレーション判定で人へ引き継ぎ、DB記録とアラート通知を実行し、自動送信をスキップする', async () => {
    // Setup: テスト用DBに部員A（ID: member_001）の催促送信履歴を2件登録
    const member_001_id = 'member_001';
    const escalation_uuid = '550e8400-e29b-41d4-a716-446655440000';
    const orchestration_id = '660e8400-e29b-41d4-a716-446655440001';
    const current_timestamp = new Date('2024-01-15T07:00:00Z');

    const send_history_records = [
      {
        id: 'history_001',
        member_id: member_001_id,
        send_type: 'prompt',
        sent_at: new Date('2024-01-13T07:00:00Z'),
        status: 'sent',
      },
      {
        id: 'history_002',
        member_id: member_001_id,
        send_type: 'prompt',
        sent_at: new Date('2024-01-14T07:00:00Z'),
        status: 'sent',
      },
    ];

    mockDb.query.mockImplementation((sql: string) => {
      if (sql.includes('send_history') && sql.includes('member_001')) {
        return Promise.resolve(send_history_records);
      }
      if (sql.includes('朝会報告') && sql.includes('member_001')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    // Setup: 確認メール内容をモック入力
    const confirmation_email_content = {
      report_missing_members: [
        {
          member_id: member_001_id,
          member_name: '部員A',
        },
      ],
      prompt_count: 2,
      current_datetime: current_timestamp,
    };

    // Setup: AIクライアントのモック出力
    const ai_escalation_decision = {
      decision: 'escalate',
      reason: '同一部員への複数回催促後も報告がない',
      targetMemberId: member_001_id,
      escalationLevel: 'HUMAN_REVIEW',
    };

    mockAiClient.determineEscalation.mockResolvedValue(ai_escalation_decision);
    mockUuidGenerator.generate.mockReturnValue(escalation_uuid);

    const inserted_escalation_record = {
      escalation_id: escalation_uuid,
      member_id: member_001_id,
      escalation_type: 'MULTIPLE_UNANSWERED_PROMPTS',
      status: 'PENDING_HUMAN_REVIEW',
      created_at: current_timestamp,
    };

    const inserted_notification_record = {
      notification_id: 'notif_001',
      notification_type: 'escalation_alert',
      target_role: 'section_chief',
      content: `部員A（${member_001_id}）が複数回催促後も報告未提出`,
      escalation_id: escalation_uuid,
      is_read: false,
      created_at: current_timestamp,
    };

    mockDb.insert.mockImplementation((table: string, record: any) => {
      if (table === 'escalation_requests') {
        return Promise.resolve({ ...inserted_escalation_record });
      }
      if (table === 'notification_queue') {
        return Promise.resolve({ ...inserted_notification_record });
      }
      return Promise.resolve({});
    });

    const orchestration_log = {
      orchestrationId: orchestration_id,
      phase: 'escalation_triggered',
      escalation_id: escalation_uuid,
      escalatedMemberId: member_001_id,
      timestamp: current_timestamp,
      result: 'success',
    };

    mockLogger.info.mockImplementation((logMessage: string, logData: any) => {
      if (logMessage.includes('escalation_triggered')) {
        return Promise.resolve();
      }
    });

    // Execute: runTx3Imp1Agent()を実行
    const agent_result = await runTx3Imp1Agent({
      orchestrationId: orchestration_id,
      confirmationEmailContent: confirmation_email_content,
      aiClient: mockAiClient,
      db: mockDb,
      logger: mockLogger,
      uuidGenerator: mockUuidGenerator,
      notificationQueue: mockNotificationQueue,
      currentTimestamp: current_timestamp,
    });

    // Verify: AIクライアントが催促対象判定を実行したことを確認
    expect(mockAiClient.determineEscalation).toHaveBeenCalledWith({
      memberIds: [member_001_id],
      promptCount: 2,
      reportingDeadline: confirmation_email_content.current_datetime,
    });

    // Verify: escalationLevel === 'HUMAN_REVIEW' を検知してメール・チャット送信をスキップしたことを確認
    expect(agent_result.escalationLevel).toBe('HUMAN_REVIEW');
    expect(agent_result.autoMessagesSent).toBe(false);

    // Verify: エスカレーションレコードがDB escalation_requests テーブルに挿入されたことを確認
    expect(mockDb.insert).toHaveBeenCalledWith('escalation_requests', expect.objectContaining({
      member_id: member_001_id,
      escalation_type: 'MULTIPLE_UNANSWERED_PROMPTS',
      status: 'PENDING_HUMAN_REVIEW',
    }));

    // Verify: notification_queue テーブルに部長向けアラートが1件追加されたことを確認
    expect(mockDb.insert).toHaveBeenCalledWith('notification_queue', expect.objectContaining({
      notification_type: 'escalation_alert',
      target_role: 'section_chief',
      is_read: false,
    }));

    // Verify: send_history テーブルに新規レコードが追加されていないことを確認
    const send_history_insert_calls = mockDb.insert.mock.calls.filter(
      (call) => call[0] === 'send_history'
    );
    expect(send_history_insert_calls.length).toBe(0);

    // Verify: オーケストレーター実行ログに phase: 'escalation_triggered' が記録されたことを確認
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('escalation_triggered'),
      expect.objectContaining({
        orchestrationId: orchestration_id,
        phase: 'escalation_triggered',
        escalation_id: escalation_uuid,
        escalatedMemberId: member_001_id,
        result: 'success',
      })
    );

    // Verify: エージェント実行結果に正しいメタデータが含まれていることを確認
    expect(agent_result).toEqual(expect.objectContaining({
      orchestrationId: orchestration_id,
      escalationLevel: 'HUMAN_REVIEW',
      autoMessagesSent: false,
      escalationId: escalation_uuid,
      escalatedMemberIds: [member_001_id],
      status: 'escalation_pending_human_review',
    }));

    // Verify: 返却されたデータ構造が期待値と一致することを確認
    expect(agent_result.escalationLevel).toBe('HUMAN_REVIEW');
    expect(agent_result.escalationId).toBe(escalation_uuid);
    expect(agent_result.escalatedMemberIds).toContain(member_001_id);
    expect(agent_result.autoMessagesSent).toBe(false);
  });
});