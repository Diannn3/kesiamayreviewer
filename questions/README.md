# Daily Question Bank & Ingestion Schema

This directory is an architectural placeholder for future automated or scheduled daily CKYCA scenario-based questions.

> **Deployment Note:** The production application currently embeds the complete, authoritative **HARD-1 (60 questions)** examination directly within `index.html` to guarantee zero network latency, offline capability, and single-file integrity. No external LLM API calls or dynamic fetches are executed at runtime.

---

## Future Daily Question JSON Schema

When daily question generation is activated, daily question packs will adhere to the following schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CKYCADailyQuestionPack",
  "type": "object",
  "required": ["date", "form", "difficulty", "questions"],
  "properties": {
    "date": {
      "type": "string",
      "format": "date",
      "description": "ISO date of the question release (YYYY-MM-DD)"
    },
    "form": {
      "type": "string",
      "description": "Unique form identifier (e.g. DAILY-001, HARD-1)"
    },
    "difficulty": {
      "type": "string",
      "enum": ["standard", "intermediate", "hard", "advanced"]
    },
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["n", "competency", "answer", "stem", "options", "why", "weaker", "source", "form", "difficulty"],
        "properties": {
          "n": {
            "type": "integer",
            "minimum": 1
          },
          "competency": {
            "type": "string",
            "pattern": "^[1-5]\\.[1-4]$",
            "description": "CKYCA competency code (1.1 through 5.4)"
          },
          "answer": {
            "type": "string",
            "enum": ["A", "B", "C", "D"]
          },
          "stem": {
            "type": "string",
            "description": "Scenario prompt narrative"
          },
          "options": {
            "type": "object",
            "required": ["A", "B", "C", "D"],
            "properties": {
              "A": { "type": "string" },
              "B": { "type": "string" },
              "C": { "type": "string" },
              "D": { "type": "string" }
            }
          },
          "why": {
            "type": "string",
            "description": "Detailed explanation of why the correct option is the most defensible regulatory/KYC action"
          },
          "weaker": {
            "type": "string",
            "description": "Specific analysis detailing why alternative options are incomplete, premature, or non-defensible"
          },
          "source": {
            "type": "string",
            "description": "Curriculum reference, competency mapping, and regulatory foundation (e.g. FATF R.10)"
          },
          "form": {
            "type": "string"
          },
          "difficulty": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

---

## Competency Mapping Reference

| Code | Competency Title | Domain |
| :--- | :--- | :--- |
| **1.1** | Determine information needed for customer type & identify gaps | Domain 1: Identify & Verify |
| **1.2** | Verify identity of natural & legal persons using reliable sources | Domain 1: Identify & Verify |
| **1.3** | Establish & understand customer's business purpose & nature | Domain 1: Identify & Verify |
| **1.4** | Identify & verify beneficial owners (natural persons, ownership & control) | Domain 1: Identify & Verify |
| **1.5** | Detect triggers requiring refreshed identification & CDD updates | Domain 1: Identify & Verify |
| **2.1** | Perform sanctions & PEP screening at onboarding & ongoing | Domain 2: Screen the Customer |
| **2.2** | Conduct adverse media & negative news research using credible sources | Domain 2: Screen the Customer |
| **2.3** | Analyze & adjudicate screening alerts to resolve false positives vs true hits | Domain 2: Screen the Customer |
| **3.1** | Assess inherent risk across customer, product, geography & channel | Domain 3: Rate Customer Risk |
| **3.2** | Evaluate mitigating controls & governance frameworks | Domain 3: Rate Customer Risk |
| **3.3** | Determine final risk rating using institutional risk methodology | Domain 3: Rate Customer Risk |
| **4.1** | Determine when Enhanced Due Diligence (EDD) is mandated or warranted | Domain 4: Perform EDD |
| **4.2** | Establish & corroborate Source of Wealth (SoW) & Source of Funds (SoF) | Domain 4: Perform EDD |
| **4.3** | Execute enhanced background investigations & external corroboration | Domain 4: Perform EDD |
| **4.4** | Secure senior management approvals & governance escalations | Domain 4: Perform EDD |
| **5.1** | Document comprehensive KYC analysis, rationale & decision trail | Domain 5: Create & Maintain Profile |
| **5.2** | Establish expected transaction activity baselines for ongoing monitoring | Domain 5: Create & Maintain Profile |
| **5.3** | Schedule & execute periodic reviews based on risk tier | Domain 5: Create & Maintain Profile |
| **5.4** | Execute event-driven reviews & manage offboarding / exit protocols | Domain 5: Create & Maintain Profile |
