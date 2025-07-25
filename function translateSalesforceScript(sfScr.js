function translateSalesforceScript(sfScript) {
  // 0. Clean up the REQUIRESCRIPT line
  sfScript = sfScript.replace(/REQUIRESCRIPT\(".*?"\);?\s*/g, "");

  // 1. Replace sforce.Sobject with GlideRecord
  sfScript = sfScript.replace(
    /var (\w+) = new sforce\.Sobject\("([^"]+)"\);/,
    'var gr = new GlideRecord("$2");'
  );

  // 2. Replace ID assignment with GlideRecord.get()
  sfScript = sfScript.replace(
    /(\w+)\.Id\s*=\s*"\{(\w+)\.Id\}";/,
    "gr.get(inputs.sys_id);"
  );

  // 3. Replace field assignments (excluding ID)
  sfScript = sfScript.replace(
    /(\w+)\.(\w+)\s*=\s*"([^"]+)";/g,
    (match, varName, field, value) => {
      if (field === "Id") return ""; // Skip ID assignment
      return `gr.${field} = "${value}";`;
    }
  );

  // 4. Replace update call
  sfScript = sfScript.replace(
    /var result = sforce\.connection\.update\(\[.*?\]\);/,
    "gr.update();"
  );

  // 5. Replace success condition with valid GlideRecord check
  sfScript = sfScript.replace(
    /if\s*\(\s*result\[\w+\]\.success\s*===\s*"true"\s*\)\s*\{/,
    "if (gr.isValidRecord()) {"
  );

  // 6. Replace alert + reload with gs.addInfoMessage
  sfScript = sfScript.replace(
    /alert\("(.+?)"\);\s*window\.location\.reload\(\);/,
    '    gs.addInfoMessage("$1");'
  );

  // 7. Replace error handling
  sfScript = sfScript.replace(
    /else\s*\{\s*alert\("Failed to close.*?"\s*\+\s*result\[0\]\.errors\.message\);\s*\}/s,
    'else {\n    gs.addErrorMessage("Failed to close case.");\n}'
  );

  return sfScript.trim();
}

var sfScript = `REQUIRESCRIPT("/soap/ajax/43.0/connection.js"));
var caseRecord = new sforce.Sobject("case 5 table");
caseRecord.Id = "{Case.Id}";
caseRecord.script = "Closed";
var result = sforce.connection.update([caseRecord]);
if (result[e].success === "true") {
    alert("Case closed success hurrayyyyyyyyy"); window.location.reload();
} else {
    alert("Failed to close faileeddddddddddddddd: " + result[0].errors.message);
}`;

console.log(translateSalesforceScript(sfScript));
