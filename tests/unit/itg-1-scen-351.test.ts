import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  identifyUnreportedMembers,
} from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-351: [normal] 全員報告完了判定機能 - 10名中複数名が未報告の場合、全未報告者が催促対象として明示される
  it('should identify all 3 unreported members as promotion targets when 7 out of 10 have reported', () => {
    // Arrange: 10名の部員を登録
    const all_members = [
      { user_id: 'USR_A', user_name: 'ユーザーA', department_id: 'DEPT_001' },
      { user_id: 'USR_B', user_name: 'ユーザーB', department_id: 'DEPT_001' },
      { user_id: 'USR_C', user_name: 'ユーザーC', department_id: 'DEPT_001' },
      { user_id: 'USR_D', user_name: 'ユーザーD', department_id: 'DEPT_001' },
      { user_id: 'USR_E', user_name: 'ユーザーE', department_id: 'DEPT_001' },
      { user_id: 'USR_F', user_name: 'ユーザーF', department_id: 'DEPT_001' },
      { user_id: 'USR_G', user_name: 'ユーザーG', department_id: 'DEPT_001' },
      { user_id: 'USR_H', user_name: 'ユーザーH', department_id: 'DEPT_001' },
      { user_id: 'USR_I', user_name: 'ユーザーI', department_id: 'DEPT_001' },
      { user_id: 'USR_J', user_name: 'ユーザーJ', department_id: 'DEPT_001' },
    ];

    // 7名が報告送信済み、3名が未送信
    const reported_user_ids = [
      'USR_A',
      'USR_B',
      'USR_C',
      'USR_D',
      'USR_E',
      'USR_F',
      'USR_G',
    ];

    const report_deadline = new Date('2024-01-15T09:00:00Z');
    const current_time = new Date('2024-01-15T09:15:00Z');

    // Act: 全未報告者を特定
    const unreported_result = identifyUnreportedMembers({
      all_members,
      reported_user_ids,
      report_deadline,
      current_time,
    });

    // Assert: 未報告者が正確に3名で、催促対象として明示される
    expect(unreported_result.unreported_members).toHaveLength(3);

    const unreported_ids = unreported_result.unreported_members.map(
      (m) => m.user_id
    );
    expect(unreported_ids).toContain('USR_H');
    expect(unreported_ids).toContain('USR_I');
    expect(unreported_ids).toContain('USR_J');

    const unreported_names = unreported_result.unreported_members.map(
      (m) => m.user_name
    );
    expect(unreported_names).toContain('ユーザーH');
    expect(unreported_names).toContain('ユーザーI');
    expect(unreported_names).toContain('ユーザーJ');

    // 既に報告済みの7名は一覧に表示されないことを確認
    expect(unreported_ids).not.toContain('USR_A');
    expect(unreported_ids).not.toContain('USR_B');
    expect(unreported_ids).not.toContain('USR_C');
    expect(unreported_ids).not.toContain('USR_D');
    expect(unreported_ids).not.toContain('USR_E');
    expect(unreported_ids).not.toContain('USR_F');
    expect(unreported_ids).not.toContain('USR_G');

    // 催促対象ステータスが正確に設定される
    expect(unreported_result.unreported_members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'USR_H',
          user_name: 'ユーザーH',
          promotion_target: true,
        }),
        expect.objectContaining({
          user_id: 'USR_I',
          user_name: 'ユーザーI',
          promotion_target: true,
        }),
        expect.objectContaining({
          user_id: 'USR_J',
          user_name: 'ユーザーJ',
          promotion_target: true,
        }),
      ])
    );
  });
});