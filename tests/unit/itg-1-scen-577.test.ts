import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx4Imp1Agent } from '../../src/logic/it-1';

// Mock AI client
interface Tx4Imp1AiClientMock {
  sendConfirmationEmail: jest.Mock;
  autoReadEmailContent: jest.Mock;
  aggregateProgress: jest.Mock;
  extractAnomalies: jest.Mock;
  judgeTaskPriority: jest.Mock;
}

interface AnomalyDetectionResult {
  anomaly_detected: boolean;
  requires_human_review: boolean;
  anomalies?: Array<{
    task_id: string;
    severity: string;
    description: string;
    affected_members: string[];
  }>;
}

interface AgentEscalationState {
  escalation_triggered: boolean;
  escalation_reason?: string;
  pending_human_review_before_side_effect?: boolean;
  extracted_anomalies?: any[];
  awaiting_human_decision?: boolean;
}

interface HumanReviewPayload {
  pending_human_review_before_side_effect: boolean;
  extracted_anomalies: any[];
  awaiting_human_decision: boolean;
  handover_target: string;
}

interface AgentExecutionResult {
  status: string;
  handover_target?: string;
  escalation_data?: {
    anomaly_details: any[];
    reason: string;
  };
  audit_log_event?: string;
}

interface AuditLogEntry {
  timestamp: string;
  event_type: string;
  message: string;
  target?: string;
}

describe('tx_4_imp_1: 日報収集から課題抽出・優先度判定までの自動実行 - 異常検出時のエスカレーション', () => {
  let mockAiClient: Tx4Imp1AiClientMock;
  let capturedAuditLog: AuditLogEntry[] = [];

  beforeEach(() => {
    mockAiClient = {
      sendConfirmationEmail: jest.fn().mockResolvedValue({
        success: true,
        message_id: 'msg_20240115_001',
        timestamp: '2024-01-15T08:00:00Z',
      }),
      autoReadEmailContent: jest.fn().mockResolvedValue({
        received_reports: 10,
        timestamp: '2024-01-15T08:05:00Z',
        reports: [
          {
            user_id: 'ENG_001',
            yesterday_achievement: 'Feature A completed',
            today_plan: 'Feature B design',
            issue: 'Database performance concern',
          },
          {
            user_id: 'ENG_002',
            yesterday_achievement: 'Testing for Feature A',
            today_plan: 'Feature B testing',
            issue: 'Same database performance issue',
          },
          {
            user_id: 'ENG_003',
            yesterday_achievement: 'Documentation update',
            today_plan: 'Feature B documentation',
            issue: 'Critical security vulnerability detected',
          },
        ],
      }),
      aggregateProgress: jest.fn().mockResolvedValue({
        total_members: 10,
        reports_received: 10,
        on_time: 9,
        delayed: 1,
        aggregated_tasks: [
          { task: 'Feature A', status: 'completed', count: 7 },
          { task: 'Feature B', status: 'in_progress', count: 10 },
        ],
        identified_issues: [
          'Database performance',
          'Security vulnerability',
          'Integration test failure',
        ],
      }),
      extractAnomalies: jest.fn().mockResolvedValue({
        anomaly_detected: true,
        requires_human_review: true,
        anomalies: [
          {
            task_id: 'ISSUE_SEC_001',
            severity: 'CRITICAL',
            description: 'Critical security vulnerability detected in authentication module',
            affected_members: ['ENG_003'],
          },
          {
            task_id: 'ISSUE_DB_001',
            severity: 'HIGH',
            description: 'Database performance degradation reported by multiple members',
            affected_members: ['ENG_001', 'ENG_002'],
          },
        ],
      } as AnomalyDetectionResult),
      judgeTaskPriority: jest.fn(),
    };

    capturedAuditLog = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-577
  test('SCEN-577: 課題抽出ステップで異常検出時、副作用確定前に人へエスカレーション', async () => {
    // Setup: Test fixture with detected anomalies
    const confirmationEmailInput = {
      recipient_department_id: 'DEV_DEPT_001',
      sender_system: 'report_system',
      scheduled_time: '2024-01-15T08:00:00Z',
    };

    const reportCollectionContext = {
      collection_window_start: '2024-01-15T06:00:00Z',
      collection_window_end: '2024-01-15T08:30:00Z',
      expected_total_members: 10,
      department_id: 'DEV_DEPT_001',
    };

    // Execute: Run agent with mocked AI client
    const result = await runTx4Imp1Agent(
      mockAiClient as any,
      confirmationEmailInput,
      reportCollectionContext,
      {
        onAuditEvent: (event: AuditLogEntry) => {
          capturedAuditLog.push(event);
        },
      }
    );

    // Verify: Confirmation email step completed
    expect(mockAiClient.sendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_department_id: 'DEV_DEPT_001',
        sender_system: 'report_system',
      })
    );
    expect(mockAiClient.sendConfirmationEmail).toHaveBeenCalledTimes(1);

    // Verify: Auto-read email content step completed
    expect(mockAiClient.autoReadEmailContent).toHaveBeenCalled();
    expect(mockAiClient.autoReadEmailContent).toHaveBeenCalledTimes(1);

    // Verify: Progress aggregation step completed
    expect(mockAiClient.aggregateProgress).toHaveBeenCalled();
    expect(mockAiClient.aggregateProgress).toHaveBeenCalledTimes(1);

    // Verify: Anomaly extraction triggered and detected anomalies
    expect(mockAiClient.extractAnomalies).toHaveBeenCalled();
    expect(mockAiClient.extractAnomalies).toHaveBeenCalledTimes(1);

    // Verify: Priority judgment NOT called (no side effect before escalation confirmation)
    expect(mockAiClient.judgeTaskPriority).not.toHaveBeenCalled();

    // Verify: Agent execution result has escalation status
    expect(result.status).toBe('ESCALATED_AWAITING_HUMAN_REVIEW');
    expect(result.handover_target).toBe('部長');

    // Verify: Escalation data contains anomaly details
    expect(result.escalation_data).toBeDefined();
    expect(result.escalation_data?.reason).toBe('抽出された課題が通常と異なる場合');
    expect(result.escalation_data?.anomaly_details).toBeDefined();
    expect(Array.isArray(result.escalation_data?.anomaly_details)).toBe(true);
    expect(result.escalation_data?.anomaly_details?.length).toBe(2);

    // Verify: Anomaly details contain expected anomalies
    const anomalyDetails = result.escalation_data?.anomaly_details || [];
    const criticalAnomaly = anomalyDetails.find(
      (a: any) => a.task_id === 'ISSUE_SEC_001'
    );
    const performanceAnomaly = anomalyDetails.find(
      (a: any) => a.task_id === 'ISSUE_DB_001'
    );

    expect(criticalAnomaly).toBeDefined();
    expect(criticalAnomaly?.severity).toBe('CRITICAL');
    expect(criticalAnomaly?.description).toContain('security vulnerability');
    expect(criticalAnomaly?.affected_members).toEqual(['ENG_003']);

    expect(performanceAnomaly).toBeDefined();
    expect(performanceAnomaly?.severity).toBe('HIGH');
    expect(performanceAnomaly?.affected_members).toContain('ENG_001');
    expect(performanceAnomaly?.affected_members).toContain('ENG_002');

    // Verify: Human review payload structure
    expect(result.human_review_payload).toBeDefined();
    const humanReviewPayload = result.human_review_payload as HumanReviewPayload;
    expect(humanReviewPayload.pending_human_review_before_side_effect).toBe(true);
    expect(humanReviewPayload.extracted_anomalies).toBeDefined();
    expect(Array.isArray(humanReviewPayload.extracted_anomalies)).toBe(true);
    expect(humanReviewPayload.extracted_anomalies.length).toBe(2);
    expect(humanReviewPayload.awaiting_human_decision).toBe(true);
    expect(humanReviewPayload.handover_target).toBe('部長');

    // Verify: Internal escalation state before side effect
    expect(result.internal_state).toBeDefined();
    const escalationState = result.internal_state as AgentEscalationState;
    expect(escalationState.escalation_triggered).toBe(true);
    expect(escalationState.escalation_reason).toBe('抽出された課題が通常と異なる場合');
    expect(escalationState.pending_human_review_before_side_effect).toBe(true);
    expect(escalationState.awaiting_human_decision).toBe(true);

    // Verify: Audit log contains escalation event
    expect(capturedAuditLog.length).toBeGreaterThan(0);
    const escalationEvent = capturedAuditLog.find((entry: AuditLogEntry) =>
      entry.message.includes('[ESCALATION]')
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.message).toMatch(/Anomaly detected/);
    expect(escalationEvent?.message).toMatch(/before side effect/);
    expect(escalationEvent?.message).toMatch(/Handover to human/);
    expect(escalationEvent?.target).toBe('部長');
    expect(escalationEvent?.event_type).toBe('ESCALATION');

    // Verify: No side effect confirmation occurred
    expect(result.side_effects_applied).toBe(false);
    expect(result.priority_judgment_executed).toBe(false);

    // Verify: Timestamp consistency
    expect(result.escalation_timestamp).toBeDefined();
    const escalationTs = new Date(result.escalation_timestamp);
    expect(escalationTs.getTime()).toBeGreaterThan(0);
    expect(Number.isNaN(escalationTs.getTime())).toBe(false);

    // Verify: All previous steps completed successfully before escalation
    expect(result.completed_steps).toContain('send_confirmation_email');
    expect(result.completed_steps).toContain('auto_read_email_content');
    expect(result.completed_steps).toContain('aggregate_progress');
    expect(result.completed_steps).toContain('extract_anomalies');
    expect(result.completed_steps).not.toContain('judge_task_priority');

    // Verify: Agent did not proceed to final report generation
    expect(result.final_report_generated).toBe(false);
  });
});