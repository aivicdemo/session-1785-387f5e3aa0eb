import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as sendConfirmationEmailLogic from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信機能', () => {
  // SCEN-503
  test('部長のメールアドレスが null で催促メール送信ができない', () => {
    const manager_user_id = 'mgr_001';
    const manager_email = null;
    const engineer_user_id = 'eng_001';
    const engineer_email = 'engineer@example.com';
    const report_date = '2024-01-15';
    const report_content = {
      yesterday_achievement: 'Completed API implementation',
      today_plan: 'Start unit testing',
      current_issue: 'Database connection timeout'
    };

    const manager_data = {
      user_id: manager_user_id,
      email: manager_email,
      department_id: 'dept_001',
      role: 'manager'
    };

    const engineer_data = {
      user_id: engineer_user_id,
      email: engineer_email,
      department_id: 'dept_001',
      role: 'engineer'
    };

    const send_request = {
      sender_user_id: engineer_user_id,
      sender_email: engineer_email,
      report_date: report_date,
      report_content: report_content,
      manager_user_id: manager_user_id,
      manager_email: manager_email
    };

    expect(() => {
      sendConfirmationEmailLogic.sendConfirmationEmailToManagerAndEngineer(
        send_request,
        manager_data,
        engineer_data
      );
    }).toThrow(/メールアドレス/);
  });
});