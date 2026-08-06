import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendNotificationToManager } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('報告送信時の確認メール自動配信機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-426
  test('通知対象部長のメールアドレスが空文字列のときエラーが発生する', () => {
    const managerEmailAddress = '';
    const unreportedEmployeeList = [
      {
        employeeName: '山田太郎',
        userId: 'EMP001'
      },
      {
        employeeName: '佐藤花子',
        userId: 'EMP002'
      }
    ];

    expect(() => {
      sendNotificationToManager(managerEmailAddress, unreportedEmployeeList);
    }).toThrow(/メールアドレス/);
  });
});