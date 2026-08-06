import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('報告送信時の確認メール自動配信機能', () => {
  // SCEN-470: [edge] 報告到着状況把握機能 - 10名中9名から報告が到着した場合、1名の報告漏れを特定できる
  test('SCEN-470: 10名中9名から報告が到着した場合、1名の報告漏れを特定できる', async () => {
    // テストダブル: fakeAiClientまたはmock fetchを使用
    const fetchMock = require('jest-fetch-mock');
    fetchMock.resetMocks();

    // テスト対象モジュール import
    const { identifyReportingStatus } = await import(
      '../../src/logic/it-1-br-1-1-1'
    );

    // 前提条件: 部員10名のアカウント登録と報告送信状況の準備
    const members = [
      { memberId: 'member01', memberName: 'Engineer 01', departmentId: 'dev' },
      { memberId: 'member02', memberName: 'Engineer 02', departmentId: 'dev' },
      { memberId: 'member03', memberName: 'Engineer 03', departmentId: 'dev' },
      { memberId: 'member04', memberName: 'Engineer 04', departmentId: 'dev' },
      { memberId: 'member05', memberName: 'Engineer 05', departmentId: 'dev' },
      { memberId: 'member06', memberName: 'Engineer 06', departmentId: 'dev' },
      { memberId: 'member07', memberName: 'Engineer 07', departmentId: 'dev' },
      { memberId: 'member08', memberName: 'Engineer 08', departmentId: 'dev' },
      { memberId: 'member09', memberName: 'Engineer 09', departmentId: 'dev' },
      {
        memberId: 'member10',
        memberName: 'Engineer 10',
        departmentId: 'dev',
      },
    ];

    // member01～member09の報告が到着済み、member10は未送信
    const reportedMembers = [
      {
        memberId: 'member01',
        reportContent: {
          yesterday: 'Completed feature A',
          today: 'Work on feature B',
          issue: 'No issues',
        },
        submittedAt: new Date('2024-01-15T08:00:00Z'),
      },
      {
        memberId: 'member02',
        reportContent: {
          yesterday: 'Fixed bug X',
          today: 'Test feature C',
          issue: 'Performance concern',
        },
        submittedAt: new Date('2024-01-15T08:05:00Z'),
      },
      {
        memberId: 'member03',
        reportContent: {
          yesterday: 'Code review',
          today: 'Refactor module D',
          issue: 'No issues',
        },
        submittedAt: new Date('2024-01-15T08:10:00Z'),
      },
      {
        memberId: 'member04',
        reportContent: {
          yesterday: 'Deploy to staging',
          today: 'Monitor systems',
          issue: 'No issues',
        },
        submittedAt: new Date('2024-01-15T08:15:00Z'),
      },
      {
        memberId: 'member05',
        reportContent: {
          yesterday: 'Documentation update',
          today: 'Write API spec',
          issue: 'Need clarification',
        },
        submittedAt: new Date('2024-01-15T08:20:00Z'),
      },
      {
        memberId: 'member06',
        reportContent: {
          yesterday: 'Database optimization',
          today: 'Query tuning',
          issue: 'No issues',
        },
        submittedAt: new Date('2024-01-15T08:25:00Z'),
      },
      {
        memberId: 'member07',
        reportContent: {
          yesterday: 'Security audit',
          today: 'Patch vulnerabilities',
          issue: 'No issues',
        },
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        memberId: 'member08',
        reportContent: {
          yesterday: 'Integration testing',
          today: 'Automation scripts',
          issue: 'No issues',
        },
        submittedAt: new Date('2024-01-15T08:35:00Z'),
      },
      {
        memberId: 'member09',
        reportContent: {
          yesterday: 'Training session',
          today: 'Mentor junior dev',
          issue: 'No issues',
        },
        submittedAt: new Date('2024-01-15T08:40:00Z'),
      },
    ];

    // API レスポンスのモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        allMembers: members,
        reportedMembers: reportedMembers,
        unreportedMembers: [
          { memberId: 'member10', memberName: 'Engineer 10', departmentId: 'dev' },
        ],
      }),
      { status: 200 }
    );

    // テスト実行: 報告到着状況把握機能を呼び出す
    const result = await identifyReportingStatus({
      departmentId: 'dev',
      allMembers: members,
      reportedMembers: reportedMembers,
      checkTimestamp: new Date('2024-01-15T09:00:00Z'),
    });

    // 期待結果: 到着状況が正しく把握されている
    // 1. 到着報告数が9名
    expect(result.reportedCount).toBe(9);

    // 2. 全体数が10名
    expect(result.totalCount).toBe(10);

    // 3. 報告率が90%
    expect(result.reportingPercentage).toBe(90);

    // 4. 未送信者として member10 が特定されている
    expect(result.unreportedMembers).toHaveLength(1);
    expect(result.unreportedMembers[0].memberId).toBe('member10');
    expect(result.unreportedMembers[0].memberName).toBe('Engineer 10');

    // 5. 到着状況表示用の集計データが正確
    expect(result.statusSummary).toBe('到着状況：9名/10名');

    // 6. 報告済みメンバーのステータスが正しく区別されている
    expect(result.reportedMembers).toHaveLength(9);
    result.reportedMembers.forEach((member: any) => {
      expect(member.status).toBe('報告済み');
      expect(member.submittedAt).toBeDefined();
    });

    // 7. 未報告メンバーの情報が正確
    result.unreportedMembers.forEach((member: any) => {
      expect(member.status).toBe('未報告');
      expect(member.submittedAt).toBeUndefined();
    });

    // API呼び出しが正しく行われたことを確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});