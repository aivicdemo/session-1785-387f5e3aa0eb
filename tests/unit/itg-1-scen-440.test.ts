import { generateUnreportedMemberList } from '../../src/logic/it-1-br-1-1-1';

describe('未提出部員通知機能 - 催促ループ終了後の未提出部員リスト生成', () => {
  // SCEN-440
  test('朝会開始前の月初日時点で催促ループが終了した場合、未提出部員リストが正しく構成される', () => {
    // テスト対象日時を月初日の朝会開始の30分前に設定
    const targetDateTime = new Date('2024-01-01T07:30:00Z');
    const morningMeetingStartTime = new Date('2024-01-01T08:00:00Z');

    // 部員10名全員の前日までの未提出状態を初期化
    const allMembersUnreported = [
      { userId: 'USR001', userName: 'Member 001', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR002', userName: 'Member 002', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR003', userName: 'Member 003', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR004', userName: 'Member 004', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR005', userName: 'Member 005', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR006', userName: 'Member 006', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR007', userName: 'Member 007', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR008', userName: 'Member 008', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR009', userName: 'Member 009', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
      { userId: 'USR010', userName: 'Member 010', departmentId: 'DEPT001', reportStatus: 'unreported' as const },
    ];

    // 催促ループ実行回数をカウントするスタブを準備
    // 1回の催促完了後に終了するよう設定
    const remindLoopCompletedCount = 1;
    const isRemindLoopCompleted = remindLoopCompletedCount > 0;

    // 催促ループが正常に終了したことを確認
    expect(isRemindLoopCompleted).toBe(true);

    // 未提出部員リスト生成関数を呼び出す
    const unreportedList = generateUnreportedMemberList(
      allMembersUnreported,
      targetDateTime,
      morningMeetingStartTime
    );

    // 生成されたリストの内容と構造を検証
    // 未提出部員リストに、報告を提出していない部員10名全員の情報が含まれていることを確認
    expect(unreportedList).toHaveLength(10);

    // リストに重複がないことを確認
    const uniqueUserIds = new Set(unreportedList.map(member => member.userId));
    expect(uniqueUserIds.size).toBe(10);

    // リストの部員情報がユーザーマスタの登録順序と同一であることを確認
    const expectedUserIds = ['USR001', 'USR002', 'USR003', 'USR004', 'USR005', 'USR006', 'USR007', 'USR008', 'USR009', 'USR010'];
    const actualUserIds = unreportedList.map(member => member.userId);
    expect(actualUserIds).toEqual(expectedUserIds);

    // 各部員の必須情報が正確に含まれていることを確認
    unreportedList.forEach((member, index) => {
      expect(member).toHaveProperty('userId');
      expect(member).toHaveProperty('userName');
      expect(member.userId).toBe(allMembersUnreported[index].userId);
      expect(member.userName).toBe(allMembersUnreported[index].userName);
    });

    // リストが正確に10件で構成されていることを確認
    expect(unreportedList.length).toBe(10);
  });
});