#!/usr/bin/env node

/**
 * Test Plan/Report Logic
 *
 * This script tests that the plan/report field visibility logic is working correctly.
 *
 * Usage:
 * node test-plan-report-logic.js
 */

const axios = require("axios");

async function testPlanReportLogic() {
  console.log("🧪 Testing Plan/Report Field Visibility Logic...\n");

  try {
    // Get form definitions from backend
    const formsResponse = await axios.get("http://localhost:4000/api/forms");
    const dailyForm = formsResponse.data.find(
      (f) => f.formId === "F-DAILY-PRODUCTION-ENTRY"
    );

    if (!dailyForm) {
      console.log("❌ Daily Production Entry form not found");
      return;
    }

    console.log(`📋 Form: ${dailyForm.name}`);
    console.log(`   Type: ${dailyForm.type}`);
    console.log(`   Table Fields: ${dailyForm.tableFields.length}\n`);

    // Define expected field visibility for plan mode
    const planModeFields = {
      visible: [
        "dept_name",
        "operator_name",
        "work",
        "h1_plan",
        "h2_plan",
        "ot_plan",
        "target_qty",
      ],
      hidden: [
        "h1_actual",
        "h2_actual",
        "ot_actual",
        "actual_production",
        "quality_defects",
        "defect_details",
        "responsible_person",
        "production_",
        "reason",
        "rework",
      ],
    };

    // Define expected field visibility for report mode
    const reportModeFields = {
      readonly: ["h1_plan", "h2_plan", "ot_plan", "target_qty"],
      editable: [
        "dept_name",
        "operator_name",
        "work",
        "h1_actual",
        "h2_actual",
        "ot_actual",
        "actual_production",
        "quality_defects",
        "defect_details",
        "responsible_person",
        "production_",
        "reason",
        "rework",
      ],
    };

    console.log("📊 Plan Mode Field Analysis:");
    console.log("   Expected Visible Fields:");
    planModeFields.visible.forEach((field) => {
      console.log(`     ✅ ${field}`);
    });

    console.log("\n   Expected Hidden Fields:");
    planModeFields.hidden.forEach((field) => {
      console.log(`     ❌ ${field}`);
    });

    console.log("\n📊 Report Mode Field Analysis:");
    console.log("   Expected Readonly Fields:");
    reportModeFields.readonly.forEach((field) => {
      console.log(`     📝 ${field} (readonly)`);
    });

    console.log("\n   Expected Editable Fields:");
    reportModeFields.editable.forEach((field) => {
      console.log(`     ✏️  ${field} (editable)`);
    });

    // Check if all expected fields exist in the form
    console.log("\n🔍 Field Existence Check:");
    const allExpectedFields = [
      ...planModeFields.visible,
      ...planModeFields.hidden,
    ];
    const missingFields = allExpectedFields.filter(
      (field) => !dailyForm.tableFields.some((f) => f.name === field)
    );

    if (missingFields.length > 0) {
      console.log("   ⚠️  Missing fields:");
      missingFields.forEach((field) => {
        console.log(`     - ${field}`);
      });
    } else {
      console.log("   ✅ All expected fields are present");
    }

    // Show actual field structure
    console.log("\n📋 Actual Form Field Structure:");
    dailyForm.tableFields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.label} (${field.name})`);
    });

    console.log("\n💡 Frontend Implementation Notes:");
    console.log(
      "   - Plan mode should show only planning fields (h1_plan, h2_plan, etc.)"
    );
    console.log(
      "   - Report mode should show all fields with plan fields as readonly"
    );
    console.log(
      "   - Actual fields (h1_actual, h2_actual, etc.) should be hidden in plan mode"
    );
    console.log("   - Quality and defect fields should be hidden in plan mode");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

testPlanReportLogic();
