import { describe, test, expect } from '@jest/globals';
import { validateReportArrivalStatusInput } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信機能', () => {
  // SCEN-455
  test('確認メール受信日時が空文字列のとき、入力値エラーが返される', () => {
    const input_confirmation_email_received_at = '';

    expect(() => {
      validateReportArrivalStatusInput({
        confirmation_email_received_at: input_confirmation_email_received_at,
      });
    }).toThrow(/確認メール受信日時/);
  });
});