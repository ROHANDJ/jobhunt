/**
 * resume-parser.js — Parse resume PDF and analyze with Claude AI.
 *
 * Reads resume from the path specified in profile.json → resume.filePath,
 * sends it to Claude for ATS scoring and improvement tips.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath }            from 'url';

const GEMINI_URL = key =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

async function geminiCall(prompt, maxTokens = 1500) {
  const res = await fetch(GEMINI_URL(process.env.GEMINI_API_KEY), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents:         [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..', '..');

const log  = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);

// ── PDF text extractor (simple fallback using pdf-parse) ─────────────────────
async function extractPdfText(filePath) {
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const buffer = readFileSync(filePath);
    const data   = await pdfParse(buffer);
    return data.text;
  } catch (e) {
    warn(`Could not parse PDF: ${e.message}. Using profile.json data instead.`);
    return null;
  }
}

// ── Build resume text from profile.json (when no PDF available) ──────────────
function profileToResumeText(profile) {
  const p = profile.personal;
  const e = profile.education?.ug;
  const skills = profile.skills?.technical?.map(s => s.name).join(', ') || '';

  const experienceText = (profile.experience || []).map(exp =>
    `${exp.role} at ${exp.company} (${exp.startDate} – ${exp.endDate || 'Present'})\n` +
    (exp.responsibilities || []).map(r => `  • ${r}`).join('\n')
  ).join('\n\n');

  const projectText = (profile.projects || []).map(proj =>
    `${proj.title}: ${proj.description}\n  Tech: ${proj.techStack?.join(', ')}`
  ).join('\n\n');

  return `
Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone}

Education:
${e?.degree} in ${e?.branch} from ${e?.institution} (${e?.endYear}) — CGPA: ${e?.cgpa}/${e?.cgpaScale}

Skills: ${skills}

Experience:
${experienceText}

Projects:
${projectText}

Certifications:
${(profile.certifications || []).map(c => c.name + ' — ' + c.issuer).join('\n')}
`.trim();
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function analyzeResume(profile, jobDescription = '') {
  if (!process.env.GEMINI_API_KEY) {
    warn('GEMINI_API_KEY not set. Skipping resume analysis.');
    return null;
  }

  // Try to load resume PDF
  let resumeText = null;
  const pdfPath  = profile.resume?.filePath
    ? join(ROOT, profile.resume.filePath.replace('./', ''))
    : null;

  if (pdfPath && existsSync(pdfPath)) {
    log(`Reading resume: ${pdfPath}`);
    resumeText = await extractPdfText(pdfPath);
  }

  if (!resumeText) {
    log('Building resume from profile.json…');
    resumeText = profileToResumeText(profile);
  }

  const jdSection = jobDescription
    ? `\n\nJob Description to analyze against:\n${jobDescription}`
    : '\n\nAnalyze for general software engineering / data science roles at Indian tech companies.';

  const prompt = `You are an expert ATS (Applicant Tracking System) and resume reviewer with deep knowledge of hiring at Indian tech companies.

Analyze this resume and return a JSON object with:
{
  "atsScore": <number 0-100>,
  "label": "<Excellent|Good|Fair|Needs Work>",
  "summary": "<2-sentence overall assessment>",
  "tips": [
    { "priority": "HIGH|MEDIUM|LOW", "category": "<Keywords|Format|Content|Skills|Quantification>", "text": "<actionable tip>" }
  ],
  "keywordsFound": ["<keyword>"],
  "keywordsMissing": ["<keyword>"],
  "topMatchedRoles": ["<role>"],
  "strengthAreas": ["<area>"],
  "improvementAreas": ["<area>"]
}

Return ONLY the JSON object, no markdown.

Resume:
${resumeText}
${jdSection}`;

  try {
    const text = (await geminiCall(prompt, 1500)).trim();
    const json = text.startsWith('{') ? text : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return JSON.parse(json);
  } catch (e) {
    warn(`Resume analysis error: ${e.message}`);
    return null;
  }
}
