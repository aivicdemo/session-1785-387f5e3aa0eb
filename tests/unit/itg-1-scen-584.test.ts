import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx4Imp1Agent } from '../../src/logic/it-1';

// Mock types for AI client and database
interface AuditLogRecord {
  audit_log_id: string;
  agent_id: string;
  event_type: string;
  action_name?: string;
  status: string;
  timestamp: string;
  execution_id: string;
  user_context: string;
  detail?: Record<string, unknown>;
  recipient_user_id?: string;
  total_actions?: number;
}

interface User {
  user_id: string;
  name: string;
  role: string;
  department_id: string;
}

interface AiClientActionResult {
  success: boolean;
  report_count?: number;
  issue_count?: number;
  priority_distribution?: {
    high_priority_count: number;
    medium_priority_count: number;
    low_priority_count: number;
  };
}

interface FakeTx4Imp1AiClient {
  sendConfirmationEmail(): Promise<AiClientActionResult>;
  autoReadReports(): Promise<AiClientActionResult>;
  aggregateProgress(): Promise<AiClientActionResult>;
  extractIssues(): Promise<AiClientActionResult>;
  judgePriority(): Promise<AiClientActionResult>;
  presentToDirector(directorUserId: string): Promise<AiClientActionResult>;
}

interface TestDatabase {
  users: User[];
  auditLogs: AuditLogRecord[];
  getAuditLogs(): AuditLogRecord[];
  clearAuditLogs(): void;
  addUser(user: User): void;
}

// Mock implementation
class MockDatabase implements TestDatabase {
  users: User[] = [];
  auditLogs: AuditLogRecord[] = [];

  getAuditLogs(): AuditLogRecord[] {
    return [...this.auditLogs];
  }

  clearAuditLogs(): void {
    this.auditLogs = [];
  }

  addUser(user: User): void {
    this.users.push(user);
  }
}

class FakeTx4Imp1AiClientImpl implements FakeTx4Imp1AiClient {
  async sendConfirmationEmail(): Promise<AiClientActionResult> {
    return { success: true };
  }

  async autoReadReports(): Promise<AiClientActionResult> {
    return { success: true, report_count: 10 };
  }

  async aggregateProgress(): Promise<AiClientActionResult> {
    return { success: true };
  }

  async extractIssues(): Promise<AiClientActionResult> {
    return { success: true, issue_count: 3 };
  }

  async judgePriority(): Promise<AiClientActionResult> {
    return {
      success: true,
      priority_distribution: {
        high_priority_count: 1,
        medium_priority_count: 1,
        low_priority_count: 1,
      },
    };
  }

  async presentToDirector(directorUserId: string): Promise<AiClientActionResult> {
    return { success: true };
  }
}

describe('日報収集から課題抽出・優先度判定までの自動実行 AIエージェント', () => {
  let testDb: TestDatabase;
  let fakeAiClient: FakeTx4Imp1AiClient;
  let directorUserId: string;
  let engineerUserIds: string[];

  beforeEach(() => {
    testDb = new MockDatabase();
    fakeAiClient = new FakeTx4Imp1AiClientImpl();
    directorUserId = 'director_001';
    engineerUserIds = Array.from({ length: 10 }, (_, i) => `engineer_${String(i + 1).padStart(3, '0')}`);

    // Initialize database with users
    testDb.addUser({
      user_id: directorUserId,
      name: '開発部長',
      role: 'director',
      department_id: 'dev_001',
    });

    engineerUserIds.forEach((userId, index) => {
      testDb.addUser({
        user_id: userId,
        name: `エンジニア${index + 1}`,
        role: 'engineer',
        department_id: 'dev_001',
      });
    });

    // Verify audit logs are empty
    expect(testDb.getAuditLogs()).toHaveLength(0);
  });

  afterEach(() => {
    testDb.clearAuditLogs();
  });

  // SCEN-584
  test('AIエージェント実行の全ライフサイクルが監査ログに記録される', async () => {
    const executionStartTime = new Date('2024-01-15T08:00:00Z');
    const agentId = 'tx_4_imp_1';
    const executionId = 'exec_20240115_080000_001';

    // Execute agent with mocked AI client
    const result = await runTx4Imp1Agent(
      {
        agentId,
        executionId,
        directorUserId,
        engineerUserIds,
      },
      {
        db: testDb,
        aiClient: fakeAiClient,
        timestamp: executionStartTime,
      }
    );

    expect(result.success).toBe(true);

    // Retrieve all audit logs
    const auditLogs = testDb.getAuditLogs();

    // Verify total count: 1 START + 6 ACTIONS + 1 COMPLETED = 8
    expect(auditLogs).toHaveLength(8);

    // Event 1: AGENT_START
    const eventStart = auditLogs[0];
    expect(eventStart.event_type).toBe('AGENT_START');
    expect(eventStart.agent_id).toBe(agentId);
    expect(eventStart.execution_id).toBe(executionId);
    expect(eventStart.user_context).toBe('SYSTEM_EXECUTION');
    expect(eventStart.status).toBe('initiated');
    expect(new Date(eventStart.timestamp).getTime()).toBeGreaterThanOrEqual(executionStartTime.getTime());

    // Event 2: ACTION_EXECUTED - send_confirmation_email
    const eventSendEmail = auditLogs[1];
    expect(eventSendEmail.event_type).toBe('ACTION_EXECUTED');
    expect(eventSendEmail.action_name).toBe('send_confirmation_email');
    expect(eventSendEmail.status).toBe('success');
    expect(eventSendEmail.agent_id).toBe(agentId);
    expect(eventSendEmail.execution_id).toBe(executionId);
    expect(eventSendEmail.user_context).toBe('SYSTEM_EXECUTION');

    // Event 3: ACTION_EXECUTED - auto_read_reports
    const eventAutoRead = auditLogs[2];
    expect(eventAutoRead.event_type).toBe('ACTION_EXECUTED');
    expect(eventAutoRead.action_name).toBe('auto_read_reports');
    expect(eventAutoRead.status).toBe('success');
    expect(eventAutoRead.detail?.report_count).toBe(10);
    expect(eventAutoRead.agent_id).toBe(agentId);
    expect(eventAutoRead.execution_id).toBe(executionId);

    // Event 4: ACTION_EXECUTED - aggregate_progress
    const eventAggregate = auditLogs[3];
    expect(eventAggregate.event_type).toBe('ACTION_EXECUTED');
    expect(eventAggregate.action_name).toBe('aggregate_progress');
    expect(eventAggregate.status).toBe('success');
    expect(eventAggregate.agent_id).toBe(agentId);
    expect(eventAggregate.execution_id).toBe(executionId);

    // Event 5: ACTION_EXECUTED - extract_issues
    const eventExtractIssues = auditLogs[4];
    expect(eventExtractIssues.event_type).toBe('ACTION_EXECUTED');
    expect(eventExtractIssues.action_name).toBe('extract_issues');
    expect(eventExtractIssues.status).toBe('success');
    expect(eventExtractIssues.detail?.issue_count).toBe(3);
    expect(eventExtractIssues.agent_id).toBe(agentId);
    expect(eventExtractIssues.execution_id).toBe(executionId);

    // Event 6: ACTION_EXECUTED - judge_priority
    const eventJudgePriority = auditLogs[5];
    expect(eventJudgePriority.event_type).toBe('ACTION_EXECUTED');
    expect(eventJudgePriority.action_name).toBe('judge_priority');
    expect(eventJudgePriority.status).toBe('success');
    expect(eventJudgePriority.detail?.high_priority_count).toBe(1);
    expect(eventJudgePriority.detail?.medium_priority_count).toBe(1);
    expect(eventJudgePriority.detail?.low_priority_count).toBe(1);
    expect(eventJudgePriority.agent_id).toBe(agentId);
    expect(eventJudgePriority.execution_id).toBe(executionId);

    // Event 7: ACTION_EXECUTED - present_to_director
    const eventPresent = auditLogs[6];
    expect(eventPresent.event_type).toBe('ACTION_EXECUTED');
    expect(eventPresent.action_name).toBe('present_to_director');
    expect(eventPresent.status).toBe('success');
    expect(eventPresent.recipient_user_id).toBe(directorUserId);
    expect(eventPresent.agent_id).toBe(agentId);
    expect(eventPresent.execution_id).toBe(executionId);

    // Event 8: AGENT_COMPLETED
    const eventCompleted = auditLogs[7];
    expect(eventCompleted.event_type).toBe('AGENT_COMPLETED');
    expect(eventCompleted.status).toBe('success');
    expect(eventCompleted.total_actions).toBe(6);
    expect(eventCompleted.agent_id).toBe(agentId);
    expect(eventCompleted.execution_id).toBe(executionId);
    expect(eventCompleted.user_context).toBe('SYSTEM_EXECUTION');

    // Verify timestamp ordering
    for (let i = 1; i < auditLogs.length; i++) {
      const prevTime = new Date(auditLogs[i - 1].timestamp).getTime();
      const currTime = new Date(auditLogs[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }

    // Verify all logs have required fields
    auditLogs.forEach((log) => {
      expect(log.audit_log_id).toBeDefined();
      expect(log.agent_id).toBe(agentId);
      expect(log.event_type).toBeDefined();
      expect(log.status).toBeDefined();
      expect(log.timestamp).toBeDefined();
      expect(log.execution_id).toBe(executionId);
      expect(log.user_context).toBe('SYSTEM_EXECUTION');
    });
  });
});