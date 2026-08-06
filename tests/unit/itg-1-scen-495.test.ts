import { validateReportFormat } from "../../src/logic/it-1-br-1-1-1";

describe("Report format validation consistency", () => {
  test("SCEN-495: Format validation results remain consistent regardless of report submission order", () => {
    // Setup: Test data for three engineers with valid format (3 required fields)
    const reportA = {
      engineer_id: "ENG001",
      engineer_name: "Engineer A",
      yesterday_accomplishment: "Completed feature X implementation and unit tests",
      today_plan: "Code review for feature Y and begin integration testing",
      current_issues: "Waiting for database schema approval from architect"
    };

    const reportB = {
      engineer_id: "ENG002",
      engineer_name: "Engineer B",
      yesterday_accomplishment: "Fixed 3 critical bugs in authentication module",
      today_plan: "Implement password reset functionality",
      current_issues: "Third-party API response time is slower than expected"
    };

    const reportC = {
      engineer_id: "ENG003",
      engineer_name: "Engineer C",
      yesterday_accomplishment: "Deployed version 2.1 to staging environment",
      today_plan: "Monitor staging logs and prepare production deployment checklist",
      current_issues: "Load testing results show 15% performance degradation under peak load"
    };

    // First validation: Submit reports in order A -> B -> C
    const reportsOrderABC = [reportA, reportB, reportC];
    const validationResultsFirstOrder = reportsOrderABC.map((report) =>
      validateReportFormat(report)
    );

    // Second validation: Submit same reports in reverse order C -> B -> A
    const reportsOrderCBA = [reportC, reportB, reportA];
    const validationResultsSecondOrder = reportsOrderCBA.map((report) =>
      validateReportFormat(report)
    );

    // Extract validation results by engineer_id for comparison (order-independent)
    const firstOrderResultMap = new Map(
      validationResultsFirstOrder.map((result, index) => [
        reportsOrderABC[index].engineer_id,
        result
      ])
    );

    const secondOrderResultMap = new Map(
      validationResultsSecondOrder.map((result, index) => [
        reportsOrderCBA[index].engineer_id,
        result
      ])
    );

    // Verify: All three engineers have "format_valid: true" in both orders
    expect(firstOrderResultMap.get("ENG001")).toEqual({
      engineer_id: "ENG001",
      format_valid: true,
      validation_timestamp: expect.any(String)
    });

    expect(firstOrderResultMap.get("ENG002")).toEqual({
      engineer_id: "ENG002",
      format_valid: true,
      validation_timestamp: expect.any(String)
    });

    expect(firstOrderResultMap.get("ENG003")).toEqual({
      engineer_id: "ENG003",
      format_valid: true,
      validation_timestamp: expect.any(String)
    });

    // Verify: Second order produces identical format_valid results for each engineer
    expect(secondOrderResultMap.get("ENG001").format_valid).toBe(
      firstOrderResultMap.get("ENG001").format_valid
    );
    expect(secondOrderResultMap.get("ENG002").format_valid).toBe(
      firstOrderResultMap.get("ENG002").format_valid
    );
    expect(secondOrderResultMap.get("ENG003").format_valid).toBe(
      firstOrderResultMap.get("ENG003").format_valid
    );

    // Verify: All validation results are "format_valid: true" regardless of order
    expect(validationResultsFirstOrder).toHaveLength(3);
    expect(validationResultsSecondOrder).toHaveLength(3);

    validationResultsFirstOrder.forEach((result) => {
      expect(result.format_valid).toBe(true);
    });

    validationResultsSecondOrder.forEach((result) => {
      expect(result.format_valid).toBe(true);
    });
  });
});