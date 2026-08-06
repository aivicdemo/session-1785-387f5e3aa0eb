import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { generateUnsubmittedEmployeeNotification } from '../../src/logic/it-1-br-1-1-1';

describe('未提出部員通知機能', () => {
  // SCEN-441
  it('催促対象部員数が業務上の最大規模である場合、全員を網羅した未提出通知が生成される', () => {
    const employee_ids = [
      'EMP001',
      'EMP002',
      'EMP003',
      'EMP004',
      'EMP005',
      'EMP006',
      'EMP007',
      'EMP008',
      'EMP009',
      'EMP010',
    ];

    const employee_emails = [
      'engineer1@example.com',
      'engineer2@example.com',
      'engineer3@example.com',
      'engineer4@example.com',
      'engineer5@example.com',
      'engineer6@example.com',
      'engineer7@example.com',
      'engineer8@example.com',
      'engineer9@example.com',
      'engineer10@example.com',
    ];

    const submitted_employee_ids: string[] = [];

    const unsubmitted_employees = employee_ids
      .filter((emp_id) => !submitted_employee_ids.includes(emp_id))
      .map((emp_id, index) => ({
        employee_id: emp_id,
        employee_email: employee_emails[index],
        employee_name: `Engineer ${index + 1}`,
      }));

    const notification = generateUnsubmittedEmployeeNotification(
      unsubmitted_employees
    );

    expect(notification.unsubmitted_count).toBe(10);
    expect(notification.employee_list).toHaveLength(10);

    const included_ids = new Set(
      notification.employee_list.map((emp) => emp.employee_id)
    );
    expect(included_ids.size).toBe(10);

    employee_ids.forEach((emp_id) => {
      expect(included_ids.has(emp_id)).toBe(true);
    });

    const included_emails = new Set(
      notification.employee_list.map((emp) => emp.employee_email)
    );
    expect(included_emails.size).toBe(10);

    employee_emails.forEach((email) => {
      expect(included_emails.has(email)).toBe(true);
    });

    notification.employee_list.forEach((emp) => {
      expect(emp.employee_id).toBeTruthy();
      expect(emp.employee_email).toBeTruthy();
      expect(emp.employee_name).toBeTruthy();
      expect(typeof emp.employee_id).toBe('string');
      expect(typeof emp.employee_email).toBe('string');
      expect(typeof emp.employee_name).toBe('string');
    });
  });
});