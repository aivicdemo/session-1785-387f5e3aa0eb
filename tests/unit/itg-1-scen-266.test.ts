import { validateMorningMeetingTimeFormat } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時刻遅延判定機能 - 朝会開始予定時刻の形式検証', () => {
  // SCEN-266
  test('朝会開始予定時刻が不正な形式のとき形式検証エラーが発生する', () => {
    const invalid_time_formats = [
      '25:00:00',
      '2024-13-45',
      'abc',
      '',
      '24:61:00',
      '12:60:30',
      '12:30:60',
      '2024-01-32T10:00:00Z',
      null,
      undefined,
    ];

    for (const invalid_format of invalid_time_formats) {
      expect(() => validateMorningMeetingTimeFormat(invalid_format)).toThrow(
        /朝会開始予定時刻の形式が不正/
      );
    }
  });
});