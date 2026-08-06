import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailsToReporterAndDirector } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('日報統一フォーマット整形・表示機能 - 部長ユーザーオブジェクト検証', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-232
  test('部長ユーザーオブジェクトが欠けている場合、エラーが発生する', () => {
    const reportData = {
      reporterId: 'engineer_001',
      reporterName: 'エンジニア太郎',
      yesterdayAccomplishment: '機能Aの実装完了',
      todayPlan: '機能Bの実装開始',
      issuesToHandle: 'APIの仕様確認待ち',
      sentAt: '2024-01-15T08:00:00Z',
      directorUser: null
    };

    expect(() => {
      sendConfirmationEmailsToReporterAndDirector(reportData);
    }).toThrow(/部長/);
  });
});