import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  identifyMissingReports,
  type IdentifyMissingReportsInput,
  type IdentifyMissingReportsOutput,
} from '../../src/logic/it-1';

describe('報告到着状況の把握機能', () => {
  // SCEN-446
  test('10名中複数名から報告が未到着の場合、未到着者全員が正しく特定される', () => {
    const now = new Date('2024-01-15T09:30:00Z');
    const deadline = new Date('2024-01-15T09:00:00Z');

    const submitted_members = [
      {
        member_id: 'member1',
        name: '田中太郎',
        submitted_at: new Date('2024-01-15T08:45:00Z'),
        yesterday_accomplishment: '昨日やったこと1',
        today_plan: '今日やること1',
        issue: '課題1',
      },
      {
        member_id: 'member2',
        name: '鈴木花子',
        submitted_at: new Date('2024-01-15T08:50:00Z'),
        yesterday_accomplishment: '昨日やったこと2',
        today_plan: '今日やること2',
        issue: '課題2',
      },
      {
        member_id: 'member3',
        name: '佐藤次郎',
        submitted_at: new Date('2024-01-15T08:55:00Z'),
        yesterday_accomplishment: '昨日やったこと3',
        today_plan: '今日やること3',
        issue: '課題3',
      },
    ];

    const all_members = [
      { member_id: 'member1', name: '田中太郎' },
      { member_id: 'member2', name: '鈴木花子' },
      { member_id: 'member3', name: '佐藤次郎' },
      { member_id: 'member4', name: '伊藤四郎' },
      { member_id: 'member5', name: '山田五子' },
      { member_id: 'member6', name: '中村六郎' },
      { member_id: 'member7', name: '小林七子' },
      { member_id: 'member8', name: '渡辺八郎' },
      { member_id: 'member9', name: '加藤九子' },
      { member_id: 'member10', name: '吉田十郎' },
    ];

    const input: IdentifyMissingReportsInput = {
      current_time: now,
      deadline_time: deadline,
      submitted_reports: submitted_members,
      all_members: all_members,
    };

    const result: IdentifyMissingReportsOutput = identifyMissingReports(input);

    expect(result.submitted_count).toBe(3);
    expect(result.missing_count).toBe(7);
    expect(result.total_count).toBe(10);

    expect(result.missing_members).toHaveLength(7);
    expect(result.missing_members).toEqual([
      { member_id: 'member4', name: '伊藤四郎' },
      { member_id: 'member5', name: '山田五子' },
      { member_id: 'member6', name: '中村六郎' },
      { member_id: 'member7', name: '小林七子' },
      { member_id: 'member8', name: '渡辺八郎' },
      { member_id: 'member9', name: '加藤九子' },
      { member_id: 'member10', name: '吉田十郎' },
    ]);

    expect(result.submitted_member_ids).toEqual(['member1', 'member2', 'member3']);
    expect(result.missing_member_ids).toEqual([
      'member4',
      'member5',
      'member6',
      'member7',
      'member8',
      'member9',
      'member10',
    ]);

    expect(result.all_on_time).toBe(false);
  });
});