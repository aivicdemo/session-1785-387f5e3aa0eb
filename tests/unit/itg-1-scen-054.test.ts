import { validateSessionAndGetInputForm } from "../../src/logic/it-1";

describe("ユーザー認証・セッション管理 - 有効なセッションがある場合の画面遷移", () => {
  // SCEN-054
  test("有効なセッションが存在する場合、認証情報の入力画面をスキップして日報入力画面へ直接遷移する", () => {
    const valid_session_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWEtMDAxIiwiaWF0IjoxNjM2NjAwMDAwLCJleHAiOjE2MzY2ODY0MDB9.test_signature";
    const user_id = "user-a-001";
    const session_created_at = new Date("2024-01-15T09:00:00Z");
    const session_expires_at = new Date("2024-01-15T17:00:00Z");

    const input_params = {
      session_token: valid_session_token,
      current_time: new Date("2024-01-15T10:30:00Z"),
    };

    const result = validateSessionAndGetInputForm(input_params);

    expect(result.is_authenticated).toBe(true);
    expect(result.user_id).toBe(user_id);
    expect(result.should_show_login_screen).toBe(false);
    expect(result.screen_type).toBe("report_input_form");
    expect(result.form_fields).toEqual([
      {
        field_name: "yesterday_accomplishment",
        label: "昨日やったこと",
        type: "textarea",
        is_required: true,
      },
      {
        field_name: "today_plan",
        label: "今日やること",
        type: "textarea",
        is_required: true,
      },
      {
        field_name: "current_issues",
        label: "抱えている課題",
        type: "textarea",
        is_required: true,
      },
    ]);
    expect(result.session_token).toBe(valid_session_token);
    expect(result.session_is_valid).toBe(true);
  });
});