import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/ai-client';

const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-531
  test('[normal] 日報入力から送信・確認メール配信までの自動化 AIエージェント - 「日報入力から送信・確認メール配信までの自動化」が自律処理「管理者に確認メールを自動配信する」を契約どおり実行する', async () => {
    // Setup: 固定値の準備
    const engineer_id = 'ENG001';
    const engineer_name = 'Tanaka Taro';
    const admin_email = 'admin@example.com';
    const report_submission_timestamp = new Date('2024-01-15T08:30:00Z');
    const email_send_timestamp = new Date('2024-01-15T08:30:45Z');

    const yesterday_achievement = 'Completed API endpoint development for user authentication module. Conducted code review with team members and merged to main branch.';
    const today_plan = 'Start database migration task for v2.0 schema update. Prepare test cases for the authentication module endpoints. Participate in team standup at 10:00.';
    const current_issues = 'The Redis caching layer is showing intermittent connection timeouts during peak hours. Need to investigate and potentially upgrade connection pool configuration.';

    const expected_email_subject = `日報受信確認: ${engineer_name}`;
    const expected_email_body_contains = [
      engineer_name,
      yesterday_achievement,
      today_plan,
      current_issues
    ];

    // Setup: Fake AI client
    const fake_ai_client: Tx1Imp1AiClient = {
      validateReportContent: jest.fn(async (content) => {
        const validation_result = {
          is_valid: true,
          errors: []
        };

        if (!content.yesterday_achievement || content.yesterday_achievement.trim().length < 100) {
          validation_result.is_valid = false;
          validation_result.errors.push('昨日の実績は100文字以上である必要があります');
        }
        if (!content.today_plan || content.today_plan.trim().length < 100) {
          validation_result.is_valid = false;
          validation_result.errors.push('本日の予定は100文字以上である必要があります');
        }
        if (!content.current_issues || content.current_issues.trim().length < 100) {
          validation_result.is_valid = false;
          validation_result.errors.push('抱えている課題は100文字以上である必要があります');
        }

        if (content.yesterday_achievement && content.yesterday_achievement.length > 1000) {
          validation_result.is_valid = false;
          validation_result.errors.push('昨日の実績は1000文字以下である必要があります');
        }
        if (content.today_plan && content.today_plan.length > 1000) {
          validation_result.is_valid = false;
          validation_result.errors.push('本日の予定は1000文字以下である必要があります');
        }
        if (content.current_issues && content.current_issues.length > 1000) {
          validation_result.is_valid = false;
          validation_result.errors.push('抱えている課題は1000文字以下である必要があります');
        }

        return validation_result;
      })
    };

    // Setup: Mock fetch for report registration API
    fetchMock.mockResponseOnce(
      JSON.stringify({
        report_id: 'RPT20240115001',
        engineer_id: engineer_id,
        submission_timestamp: report_submission_timestamp.toISOString(),
        status: 'completed'
      }),
      { status: 201 }
    );

    // Setup: Mock fetch for email delivery API
    fetchMock.mockResponseOnce(
      JSON.stringify({
        message_id: 'MSG20240115001',
        recipient: admin_email,
        status: 'sent',
        timestamp: email_send_timestamp.toISOString()
      }),
      { status: 200 }
    );

    // Execute: Run the AI agent with engineer report data
    const agent_input = {
      engineer_id: engineer_id,
      engineer_name: engineer_name,
      admin_email: admin_email,
      report_content: {
        yesterday_achievement: yesterday_achievement,
        today_plan: today_plan,
        current_issues: current_issues
      },
      submission_timestamp: report_submission_timestamp
    };

    const agent_result = await runTx1Imp1Agent(agent_input, fake_ai_client);

    // Verify: AI validation was called
    expect(fake_ai_client.validateReportContent).toHaveBeenCalledWith({
      yesterday_achievement: yesterday_achievement,
      today_plan: today_plan,
      current_issues: current_issues
    });

    // Verify: Report registration API was called
    const registration_calls = fetchMock.mock.calls.filter((call: any[]) =>
      call[0].includes('/api/reports')
    );
    expect(registration_calls.length).toBe(1);
    expect(registration_calls[0][1].method).toBe('POST');
    const registration_request_body = JSON.parse(registration_calls[0][1].body);
    expect(registration_request_body.engineer_id).toBe(engineer_id);
    expect(registration_request_body.yesterday_achievement).toBe(yesterday_achievement);
    expect(registration_request_body.today_plan).toBe(today_plan);
    expect(registration_request_body.current_issues).toBe(current_issues);

    // Verify: Email delivery API was called exactly once
    const email_calls = fetchMock.mock.calls.filter((call: any[]) =>
      call[0].includes('/api/email')
    );
    expect(email_calls.length).toBe(1);
    expect(email_calls[0][1].method).toBe('POST');
    const email_request_body = JSON.parse(email_calls[0][1].body);
    expect(email_request_body.to).toBe(admin_email);
    expect(email_request_body.subject).toBe(expected_email_subject);

    // Verify: Email body contains all required content
    for (const required_content of expected_email_body_contains) {
      expect(email_request_body.body).toContain(required_content);
    }

    // Verify: Agent execution result indicates success
    expect(agent_result.success).toBe(true);
    expect(agent_result.validation_passed).toBe(true);
    expect(agent_result.report_registered).toBe(true);
    expect(agent_result.confirmation_email_sent).toBe(true);

    // Verify: All autonomous actions completed successfully
    expect(agent_result.completed_actions).toContain('validate_report_content');
    expect(agent_result.completed_actions).toContain('register_report_to_system');
    expect(agent_result.completed_actions).toContain('send_confirmation_email_to_admin');

    // Verify: Email sent within 60 seconds of submission
    const email_send_delay_seconds = (email_send_timestamp.getTime() - report_submission_timestamp.getTime()) / 1000;
    expect(email_send_delay_seconds).toBeLessThanOrEqual(60);

    // Verify: Agent logs execution completion
    expect(agent_result.execution_log).toBeDefined();
    expect(agent_result.execution_log.length).toBeGreaterThan(0);
  });
});