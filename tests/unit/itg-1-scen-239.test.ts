import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailToReporterAndManager } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('日報統一フォーマット整形・表示機能 - 部員数が確認可能上限数の直下で全員分が表示される', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-239
  test('should send confirmation emails to reporter and manager with unified report format when 9 employees submit reports at the limit', async () => {
    const maxDisplayableEmployeeCount = 9;
    const reportSubmissionDate = new Date('2024-01-15T09:00:00Z');
    
    const employees = Array.from({ length: maxDisplayableEmployeeCount }, (_, index) => ({
      employeeId: `EMP${String(index + 1).padStart(3, '0')}`,
      employeeName: `Employee${index + 1}`,
      departmentId: 'DEV-001',
      email: `employee${index + 1}@example.com`,
    }));

    const managerEmail = 'manager@example.com';
    const managerId = 'MGR-001';

    const reports = employees.map((emp, index) => ({
      reportId: `RPT${String(index + 1).padStart(3, '0')}`,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      submissionDate: reportSubmissionDate,
      yesterdayAccomplishment: `Completed task ${index + 1}`,
      todayPlan: `Plan for task ${index + 1}`,
      currentIssue: `Issue ${index + 1}`,
    }));

    const unifiedReportFormat = reports.map((report) => ({
      employeeName: report.employeeName,
      yesterdayAccomplishment: report.yesterdayAccomplishment,
      todayPlan: report.todayPlan,
      currentIssue: report.currentIssue,
    }));

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        employeeEmailsSent: employees.map((emp) => emp.email),
        managerEmailSent: managerEmail,
        reportCount: maxDisplayableEmployeeCount,
        formattedReports: unifiedReportFormat,
      }),
      { status: 200 }
    );

    const result = await sendConfirmationEmailToReporterAndManager({
      reports,
      employees,
      managerEmail,
      managerId,
      reportSubmissionDate,
      maxDisplayableCount: maxDisplayableEmployeeCount,
    });

    expect(result.success).toBe(true);
    expect(result.employeeEmailsSent).toHaveLength(maxDisplayableEmployeeCount);
    expect(result.managerEmailSent).toBe(managerEmail);
    expect(result.reportCount).toBe(maxDisplayableEmployeeCount);
    expect(result.formattedReports).toHaveLength(maxDisplayableEmployeeCount);
    
    result.formattedReports.forEach((formattedReport, index) => {
      expect(formattedReport.employeeName).toBe(`Employee${index + 1}`);
      expect(formattedReport.yesterdayAccomplishment).toBe(`Completed task ${index + 1}`);
      expect(formattedReport.todayPlan).toBe(`Plan for task ${index + 1}`);
      expect(formattedReport.currentIssue).toBe(`Issue ${index + 1}`);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toMatch(/confirm|email|report/i);
  });
});