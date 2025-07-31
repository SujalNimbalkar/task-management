#!/usr/bin/env node

/**
 * Test Frontend Form Fields
 *
 * This script tests the frontend form field names to ensure they match backend expectations.
 *
 * Usage:
 * node test-form-fields.js
 */

const axios = require("axios");

async function testFormFields() {
  console.log("🧪 Testing Frontend Form Fields...\n");

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

    // Show the field structure that frontend should use
    console.log("📊 Table Fields Structure:");
    dailyForm.tableFields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.label}`);
      console.log(`      - ID: ${field.id}`);
      console.log(`      - Name: ${field.name}`);
      console.log(`      - Type: ${field.type}`);
      console.log(`      - Required: ${field.required}`);
      console.log("");
    });

    // Check if all fields have proper names
    const fieldsWithoutNames = dailyForm.tableFields.filter(
      (field) => !field.name
    );
    if (fieldsWithoutNames.length > 0) {
      console.log("⚠️  Fields missing name property:");
      fieldsWithoutNames.forEach((field) => {
        console.log(`   - ${field.label} (ID: ${field.id})`);
      });
      console.log("");
    } else {
      console.log("✅ All fields have proper name properties\n");
    }

    // Show expected field names for frontend
    console.log("📤 Expected Field Names for Frontend:");
    const expectedFieldNames = dailyForm.tableFields.map(
      (field) => field.name || field.id
    );
    expectedFieldNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    console.log("\n💡 Frontend Implementation Notes:");
    console.log(
      "   - Each input field should use field.name for the name attribute"
    );
    console.log("   - State management should use field.name as the key");
    console.log("   - onChange handlers should update the correct field.name");
    console.log("   - Form submission should send data with field.name keys");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

testFormFields();
