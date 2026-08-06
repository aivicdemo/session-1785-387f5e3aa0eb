import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateReportDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('報告期限判定機能 - 部長情報が undefined の場合', () => {
  let mockDepartmentHeadInfo: any;
  let mockReportSubmissionTime: Date;
  let mockMorningMeetingStartTime: Date;

  beforeEach(() => {
    mockReportSubmissionTime = new Date('2024-01-15T08:30:00Z');
    mockMorningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    mockDepartmentHeadInfo = undefined;
  });

  afterEach(() => {
    mockDepartmentHeadInfo = null;
    mockReportSubmissionTime = null;
    mockMorningMeetingStartTime = null;
  });

  // SCEN-389
  test('部長情報が undefined のとき、期限判定処理は実行されず例外が発生する', () => {
    expect(() =>
      validateReportDeadline({
        departmentHeadInfo: mockDepartmentHeadInfo,
        reportSubmissionTime: mockReportSubmissionTime,
        morningMeetingStartTime: mockMorningMeetingStartTime,
      })
    ).toThrow(/部長/);
  });
});