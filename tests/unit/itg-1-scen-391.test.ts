import { validateReportSubmissionDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の期限判定機能', () => {
  // SCEN-391
  test('報告送信日時が不正な日時形式のとき、期限判定が実行されずエラーが返される', () => {
    const invalidDateFormats = [
      '2024-13-45 25:70:00',
      'invalid-date',
      '',
      'not-a-date',
      '2024/01/15 10:00:00',
      '2024-01-15',
      '10:00:00',
      '2024-01-15T10:00:00Z',
      '   ',
      '2024-01-32 10:00:00',
    ];

    invalidDateFormats.forEach((invalidFormat) => {
      expect(() =>
        validateReportSubmissionDeadline({
          submittedAt: invalidFormat,
          deadlineAt: '2024-01-15 09:00:00',
          userId: 'user-001',
          departmentId: 'dept-001',
        })
      ).toThrow(/送信日時の形式が不正です/);
    });
  });
});