import { validateReportSubmissionTimestamp } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時刻遅延判定機能', () => {
  // SCEN-259
  test('報告送信タイムスタンプが空文字列のとき処理が失敗する', () => {
    const emptyTimestamp = '';

    expect(() => validateReportSubmissionTimestamp(emptyTimestamp)).toThrow(/タイムスタンプ/);
  });
});