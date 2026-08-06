import { sendConfirmationEmailsForMissingReports } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-505
  test('部門の部員リストが null の場合、未報告者特定前に例外がスローされ、メール送信処理は呼び出されない', () => {
    const targetDepartment = {
      departmentId: 'dept-001',
      departmentName: '開発部',
      memberList: null,
      managerId: 'mgr-001',
    };

    const submittedReports = [
      {
        userId: 'user-001',
        departmentId: 'dept-001',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'タスク A 完了',
        todayPlan: 'タスク B 開始',
        challenges: 'なし',
      },
    ];

    const meetingStartTime = new Date('2024-01-15T10:00:00Z');

    expect(() =>
      sendConfirmationEmailsForMissingReports(
        targetDepartment,
        submittedReports,
        meetingStartTime,
      ),
    ).toThrow(/部員リスト/);
  });
});