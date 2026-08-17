import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('日報収集から報告漏れ特定までの自動判定と通知', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-542
  test('should complete daily report collection, absence detection, and manager notification without human intervention when all 10 members submit reports by deadline', async () => {
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const submission_deadline = new Date('2024-01-15T08:50:00Z');
    const check_time = new Date('2024-01-15T08:55:00Z');

    const submitted_reports = [
      {
        member_id: 'ENG001',
        member_name: 'Engineer A',
        department_id: 'DEV',
        yesterday_achievement: 'Completed feature X implementation',
        today_plan: 'Start feature Y development',
        current_issues: 'None',
        submission_timestamp: new Date('2024-01-15T08:30:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG002',
        member_name: 'Engineer B',
        department_id: 'DEV',
        yesterday_achievement: 'Fixed bug Y in module Z',
        today_plan: 'Testing feature Y',
        current_issues: 'Performance bottleneck in data layer',
        submission_timestamp: new Date('2024-01-15T08:35:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG003',
        member_name: 'Engineer C',
        department_id: 'DEV',
        yesterday_achievement: 'Code review for feature X',
        today_plan: 'Merge feature Y to main',
        current_issues: 'None',
        submission_timestamp: new Date('2024-01-15T08:40:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG004',
        member_name: 'Engineer D',
        department_id: 'DEV',
        yesterday_achievement: 'Infrastructure setup',
        today_plan: 'Deploy to staging',
        current_issues: 'Awaiting security approval',
        submission_timestamp: new Date('2024-01-15T08:25:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG005',
        member_name: 'Engineer E',
        department_id: 'DEV',
        yesterday_achievement: 'Database migration completed',
        today_plan: 'Update API documentation',
        current_issues: 'None',
        submission_timestamp: new Date('2024-01-15T08:45:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG006',
        member_name: 'Engineer F',
        department_id: 'DEV',
        yesterday_achievement: 'Design system refactoring',
        today_plan: 'Implement new components',
        current_issues: 'Design review pending',
        submission_timestamp: new Date('2024-01-15T08:32:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG007',
        member_name: 'Engineer G',
        department_id: 'DEV',
        yesterday_achievement: 'Unit test coverage improved',
        today_plan: 'Integration testing',
        current_issues: 'None',
        submission_timestamp: new Date('2024-01-15T08:38:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG008',
        member_name: 'Engineer H',
        department_id: 'DEV',
        yesterday_achievement: 'Documentation update',
        today_plan: 'Training new team member',
        current_issues: 'Knowledge transfer needed',
        submission_timestamp: new Date('2024-01-15T08:42:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG009',
        member_name: 'Engineer I',
        department_id: 'DEV',
        yesterday_achievement: 'Client meeting notes compiled',
        today_plan: 'Implement client feedback',
        current_issues: 'None',
        submission_timestamp: new Date('2024-01-15T08:48:00Z'),
        is_delayed: false,
      },
      {
        member_id: 'ENG010',
        member_name: 'Engineer J',
        department_id: 'DEV',
        yesterday_achievement: 'Security audit passed',
        today_plan: 'Production deployment',
        current_issues: 'Rollback plan review pending',
        submission_timestamp: new Date('2024-01-15T08:33:00Z'),
        is_delayed: false,
      },
    ];

    const manager_email = 'dev-manager@example.com';
    const department_id = 'DEV';

    const mock_agent_client = {
      detectAbsentMembers: jest.fn().mockResolvedValue({
        all_submitted: true,
        submitted_count: 10,
        absent_members: [],
        delayed_members: [],
        total_members: 10,
      }),
      generateAbsenceNotification: jest.fn().mockResolvedValue({
        subject: '【朝会報告】日報提出状況 - 全員提出完了',
        body: `朝会報告管理システムからのお知らせです。

本日の日報提出状況をお知らせします。

【提出状況】
- 送信日時: 2024-01-15T08:55:00Z
- 提出完了: ✓ 全員提出完了
- 提出部員数: 10名
- 未提出者: 0名
- 遅延者: 0名

【報告漏れ・遅延部員一覧】
該当者なし

朝会を予定どおり開始できます。`,
      }),
      sendManagerNotification: jest.fn().mockResolvedValue({
        message_id: 'MSG20240115001',
        recipient: manager_email,
        sent_timestamp: new Date('2024-01-15T08:55:30Z'),
        status: 'sent',
      }),
      recordAuditEvent: jest.fn().mockResolvedValue({
        event_id: 'AUDIT20240115001',
        event_type: '日報自動監視実行',
        timestamp: new Date('2024-01-15T08:55:00Z'),
        execution_details: {
          check_time: check_time.toISOString(),
          meeting_start_time: meeting_start_time.toISOString(),
          department_id: department_id,
          submitted_reports_count: 10,
          absent_members_count: 0,
          delayed_members_count: 0,
          result: '全員提出、該当者なし',
          notification_sent: true,
          notification_recipient: manager_email,
        },
      }),
    };

    const input_context = {
      meeting_start_time: meeting_start_time,
      submission_deadline: submission_deadline,
      check_time: check_time,
      department_id: department_id,
      manager_email: manager_email,
      submitted_reports: submitted_reports,
      total_department_members: 10,
      ai_client: mock_agent_client,
    };

    const result = await runTx2Imp1Agent(input_context);

    expect(result.status).toBe('success');
    expect(result.workflow_completed).toBe(true);
    expect(result.human_review_required).toBe(false);

    expect(mock_agent_client.detectAbsentMembers).toHaveBeenCalledTimes(1);
    expect(mock_agent_client.detectAbsentMembers).toHaveBeenCalledWith({
      submission_deadline: submission_deadline,
      check_time: check_time,
      department_id: department_id,
      submitted_reports: submitted_reports,
      total_members: 10,
    });

    const detection_result = await mock_agent_client.detectAbsentMembers({
      submission_deadline: submission_deadline,
      check_time: check_time,
      department_id: department_id,
      submitted_reports: submitted_reports,
      total_members: 10,
    });
    expect(detection_result.all_submitted).toBe(true);
    expect(detection_result.submitted_count).toBe(10);
    expect(detection_result.absent_members).toEqual([]);
    expect(detection_result.delayed_members).toEqual([]);
    expect(detection_result.total_members).toBe(10);

    expect(mock_agent_client.generateAbsenceNotification).toHaveBeenCalledTimes(1);
    expect(mock_agent_client.generateAbsenceNotification).toHaveBeenCalledWith({
      detection_result: detection_result,
      check_time: check_time,
    });

    const notification_content = await mock_agent_client.generateAbsenceNotification({
      detection_result: detection_result,
      check_time: check_time,
    });
    expect(notification_content.subject).toContain('朝会報告');
    expect(notification_content.body).toContain('2024-01-15T08:55:00Z');
    expect(notification_content.body).toContain('全員提出完了');
    expect(notification_content.body).toContain('提出部員数: 10名');
    expect(notification_content.body).toContain('未提出者: 0名');
    expect(notification_content.body).toContain('遅延者: 0名');
    expect(notification_content.body).toContain('該当者なし');

    expect(mock_agent_client.sendManagerNotification).toHaveBeenCalledTimes(1);
    expect(mock_agent_client.sendManagerNotification).toHaveBeenCalledWith({
      recipient_email: manager_email,
      subject: notification_content.subject,
      body: notification_content.body,
      message_type: 'absence_notification',
    });

    const notification_send_result = await mock_agent_client.sendManagerNotification({
      recipient_email: manager_email,
      subject: notification_content.subject,
      body: notification_content.body,
      message_type: 'absence_notification',
    });
    expect(notification_send_result.status).toBe('sent');
    expect(notification_send_result.recipient).toBe(manager_email);

    expect(mock_agent_client.recordAuditEvent).toHaveBeenCalledTimes(1);
    expect(mock_agent_client.recordAuditEvent).toHaveBeenCalledWith({
      event_type: '日報自動監視実行',
      timestamp: check_time,
      execution_details: {
        check_time: check_time.toISOString(),
        meeting_start_time: meeting_start_time.toISOString(),
        department_id: department_id,
        submitted_reports_count: 10,
        absent_members_count: 0,
        delayed_members_count: 0,
        result: '全員提出、該当者なし',
        notification_sent: true,
        notification_recipient: manager_email,
      },
    });

    const audit_event = await mock_agent_client.recordAuditEvent({
      event_type: '日報自動監視実行',
      timestamp: check_time,
      execution_details: {
        check_time: check_time.toISOString(),
        meeting_start_time: meeting_start_time.toISOString(),
        department_id: department_id,
        submitted_reports_count: 10,
        absent_members_count: 0,
        delayed_members_count: 0,
        result: '全員提出、該当者なし',
        notification_sent: true,
        notification_recipient: manager_email,
      },
    });
    expect(audit_event.event_type).toBe('日報自動監視実行');
    expect(audit_event.execution_details.submitted_reports_count).toBe(10);
    expect(audit_event.execution_details.absent_members_count).toBe(0);
    expect(audit_event.execution_details.delayed_members_count).toBe(0);
    expect(audit_event.execution_details.result).toBe('全員提出、該当者なし');
    expect(audit_event.execution_details.notification_sent).toBe(true);

    expect(result.detection_result.all_submitted).toBe(true);
    expect(result.detection_result.submitted_count).toBe(10);
    expect(result.detection_result.absent_members.length).toBe(0);
    expect(result.detection_result.delayed_members.length).toBe(0);
    expect(result.notification_sent).toBe(true);
    expect(result.audit_event_recorded).toBe(true);
  });
});