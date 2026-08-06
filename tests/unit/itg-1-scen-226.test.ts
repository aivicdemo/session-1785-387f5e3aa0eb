import { describe, test, expect, beforeEach } from '@jest/globals';
import { formatAndDisplayReportList } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-226
  test('部長メールに含まれる日報一覧が空配列の場合、エラーが発生する', () => {
    const emptyReportList: never[] = [];

    expect(() => {
      formatAndDisplayReportList(emptyReportList);
    }).toThrow(/日報リストが空です/);
  });
});