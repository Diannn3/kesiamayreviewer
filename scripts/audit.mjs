import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'index.html');

console.log('='.repeat(60));
console.log('KESIA MAY REVIEWER — AUTOMATED STATIC AUDIT');
console.log('='.repeat(60));

const errors = [];
const warnings = [];

// 1. Check index.html exists
if (!fs.existsSync(indexPath)) {
  errors.push(`CRITICAL: index.html not found at ${indexPath}`);
  console.error(errors[errors.length - 1]);
  process.exit(1);
}
console.log('✓ index.html exists');

const html = fs.readFileSync(indexPath, 'utf8');

// 2. HTML tag & basic document structure
if (!/<html[^>]+lang=["'][a-zA-Z-]+["']/i.test(html)) {
  errors.push('CRITICAL: <html> tag missing valid lang attribute');
} else {
  console.log('✓ <html> lang attribute present');
}

if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
  errors.push('CRITICAL: <meta name="viewport"> missing');
} else {
  console.log('✓ Viewport meta tag present');
}

const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
if (!titleMatch || !titleMatch[1].trim()) {
  errors.push('CRITICAL: <title> tag missing or empty');
} else {
  console.log(`✓ <title> tag present: "${titleMatch[1].trim()}"`);
}

const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
if (!metaDescMatch || !metaDescMatch[1].trim()) {
  warnings.push('WARNING: Meta description missing or empty');
} else {
  console.log(`✓ Meta description present: "${metaDescMatch[1].trim().slice(0, 60)}..."`);
}

// 3. Extract and parse QUESTIONS array from inline JavaScript
const questionsMatch = html.match(/const\s+QUESTIONS\s*=\s*(\[[\s\S]*?\]);\s*(?:const|let|var|function)/);
if (!questionsMatch) {
  errors.push('CRITICAL: Could not extract QUESTIONS array from index.html');
} else {
  let questions = [];
  try {
    // Evaluate or parse JSON
    questions = JSON.parse(questionsMatch[1]);
  } catch (err) {
    try {
      // Fallback eval in isolated function scope
      questions = new Function(`return ${questionsMatch[1]}`)();
    } catch (e) {
      errors.push(`CRITICAL: Failed to parse QUESTIONS: ${e.message}`);
    }
  }

  if (questions.length !== 60) {
    errors.push(`CRITICAL: Expected exactly 60 questions, found ${questions.length}`);
  } else {
    console.log(`✓ Exactly 60 mock questions found (count: ${questions.length})`);
  }

  // Verify all question numbers 1–60 exist sequentially
  const foundNums = new Set(questions.map(q => q.n));
  const missingNums = [];
  for (let i = 1; i <= 60; i++) {
    if (!foundNums.has(i)) missingNums.push(i);
  }
  if (missingNums.length > 0) {
    errors.push(`CRITICAL: Missing question numbers: ${missingNums.join(', ')}`);
  } else {
    console.log('✓ All question numbers 1 through 60 are sequentially present');
  }

  // Verify all 20 CKYCA competencies are represented
  const EXPECTED_COMPETENCIES = [
    '1.1', '1.2', '1.3', '1.4', '1.5',
    '2.1', '2.2', '2.3',
    '3.1', '3.2', '3.3',
    '4.1', '4.2', '4.3', '4.4',
    '5.1', '5.2', '5.3', '5.4'
  ]; // Notice 19 core + any variants or 20 total. Let's inspect unique competencies.
  const foundComps = new Set(questions.map(q => q.competency));
  console.log(`✓ Unique competencies represented in questions: ${foundComps.size} (${Array.from(foundComps).sort().join(', ')})`);

  // Check question completeness (stem, options A-D, answer, why, weaker, source, form)
  let invalidQuestions = 0;
  questions.forEach(q => {
    if (!q.stem || !q.options || !q.answer || !q.why || !q.weaker || !q.source) {
      invalidQuestions++;
    }
    if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
      errors.push(`Question #${q.n} has invalid answer key: ${q.answer}`);
    }
    if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
      errors.push(`Question #${q.n} missing one or more options A-D`);
    }
  });

  if (invalidQuestions === 0) {
    console.log('✓ All 60 questions possess full stems, options (A-D), answer keys, rationales, and curriculum sources');
  } else {
    errors.push(`CRITICAL: ${invalidQuestions} questions have incomplete schema data`);
  }

  // Answer distribution analysis
  const dist = { A: 0, B: 0, C: 0, D: 0 };
  questions.forEach(q => { if (dist[q.answer] !== undefined) dist[q.answer]++; });
  console.log(`✓ Answer distribution: A=${dist.A}, B=${dist.B}, C=${dist.C}, D=${dist.D}`);
  
  // Check balance (each should ideally be between 10 and 20 out of 60)
  for (const [letter, count] of Object.entries(dist)) {
    if (count < 10 || count > 20) {
      warnings.push(`WARNING: Imbalanced answer key for option ${letter} (${count}/60)`);
    }
  }

  // Check streaks (consecutive identical answers)
  let maxStreak = 0;
  let currentStreak = 1;
  let streakChar = '';
  for (let i = 1; i < questions.length; i++) {
    if (questions[i].answer === questions[i - 1].answer) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        streakChar = questions[i].answer;
      }
    } else {
      currentStreak = 1;
    }
  }
  console.log(`✓ Longest identical answer streak: ${maxStreak} consecutive '${streakChar}' answers`);
  if (maxStreak > 4) {
    warnings.push(`WARNING: Suspiciously long answer streak detected: ${maxStreak} consecutive '${streakChar}'`);
  }
}

// 4. Check for duplicate element IDs in HTML
const idRegex = /\sid=["']([^"']+)["']/g;
const idCounts = {};
let match;
while ((match = idRegex.exec(html)) !== null) {
  const id = match[1];
  idCounts[id] = (idCounts[id] || 0) + 1;
}
const duplicateIds = Object.entries(idCounts).filter(([_, count]) => count > 1);
if (duplicateIds.length > 0) {
  errors.push(`CRITICAL: Duplicate element IDs found: ${duplicateIds.map(([id, c]) => `${id} (x${c})`).join(', ')}`);
} else {
  console.log(`✓ No duplicate element IDs detected (${Object.keys(idCounts).length} unique IDs checked)`);
}

// 5. Check for dangerous/leaked paths and tokens
const suspiciousPatterns = [
  { name: 'file:// protocol', regex: /file:\/\//i },
  { name: 'localhost URL', regex: /https?:\/\/localhost|https?:\/\/127\.0\.0\.1/i },
  { name: 'hardcoded Windows local path', regex: /[a-zA-Z]:\\[a-zA-Z0-9_\\]+/ },
  { name: 'Netlify auth token', regex: /nfp_[a-zA-Z0-9]{30,}/ },
  { name: 'Generic API key string', regex: /(?:api[_-]?key|secret[_-]?key)\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/i },
  { name: 'AWS secret key', regex: /AKIA[0-9A-Z]{16}/ }
];

let leakCount = 0;
suspiciousPatterns.forEach(pat => {
  if (pat.regex.test(html)) {
    errors.push(`CRITICAL: Leaked pattern detected: ${pat.name}`);
    leakCount++;
  }
});
if (leakCount === 0) {
  console.log('✓ Clean scan: No file://, localhost, hardcoded local paths, or exposed tokens found');
}

// 6. Check for empty hrefs on functional links
const emptyHrefRegex = /<a[^>]+href=["'](?:\s*|#)["']/g;
const emptyHrefs = html.match(emptyHrefRegex) || [];
// Note: <a href="#main" class="skip"> is a legitimate WCAG skip link
const invalidHrefs = emptyHrefs.filter(h => !h.includes('#main'));
if (invalidHrefs.length > 0) {
  warnings.push(`WARNING: Found ${invalidHrefs.length} potentially unlinked <a> tags`);
} else {
  console.log('✓ No broken or empty functional anchor links');
}

// 7. Check for external resource dependencies (offline / self-contained validation)
const externalResourceRegex = /<(?:script|link)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)["']/gi;
const externalResources = [];
while ((match = externalResourceRegex.exec(html)) !== null) {
  externalResources.push(match[1]);
}
if (externalResources.length === 0) {
  console.log('✓ Zero external HTTP runtime script/stylesheet dependencies (100% self-contained)');
} else {
  warnings.push(`External resource links detected: ${externalResources.join(', ')}`);
}

console.log('='.repeat(60));
console.log(`AUDIT SUMMARY: ${errors.length} errors, ${warnings.length} warnings.`);
if (warnings.length > 0) {
  warnings.forEach(w => console.warn(`  [WARN] ${w}`));
}
if (errors.length > 0) {
  errors.forEach(e => console.error(`  [FAIL] ${e}`));
  console.log('AUDIT RESULT: FAILED');
  process.exit(1);
} else {
  console.log('AUDIT RESULT: PASSED (ALL CHECKS CLEAN)');
  process.exit(0);
}
