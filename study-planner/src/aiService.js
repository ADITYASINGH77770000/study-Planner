// ─────────────────────────────────────────────
//  AI Service — supports Claude & Gemini
//  v3 — fixed token limits, robust JSON parser
// ─────────────────────────────────────────────

const GEMINI_MODELS = [
  "gemini-2.5-flash",      // best free tier — fast + smart
  "gemini-2.5-flash-lite", // lightest, highest quota
  "gemini-2.0-flash",      // stable fallback
  "gemini-2.0-flash-lite", // last resort fallback
];

// ── Delay helper ──
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ── Retry wrapper with exponential backoff ──
async function withRetry(fn, retries = 3, baseDelayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes("429") || err.message?.includes("503");
      const isLast = attempt === retries;
      if (is429 && !isLast) {
        const wait = baseDelayMs * attempt;
        console.warn(`[Gemini] Rate limited (429). Retrying in ${wait / 1000}s... (attempt ${attempt}/${retries})`);
        await delay(wait);
      } else {
        throw err;
      }
    }
  }
}

// ─────────────────────────────────────────────
//  Robust JSON extractor
//  Handles: truncated JSON, extra text, markdown fences
// ─────────────────────────────────────────────
export function parseJSON(text) {
  // 1. Strip markdown fences
  let clean = text.replace(/```json|```/g, "").trim();

  // 2. Try parsing as-is first
  try {
    return JSON.parse(clean);
  } catch (_) {}

  // 3. Extract the first { ... } block
  const start = clean.indexOf("{");
  let end = clean.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(clean.slice(start, end + 1));
    } catch (_) {}
  }

  // 4. JSON is truncated — attempt to auto-close it
  if (start !== -1) {
    let partial = clean.slice(start);
    // Close any open string
    const quoteCount = (partial.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) partial += '"';
    // Count unclosed brackets/braces
    let braces = 0, brackets = 0;
    for (const ch of partial) {
      if (ch === "{") braces++;
      else if (ch === "}") braces--;
      else if (ch === "[") brackets++;
      else if (ch === "]") brackets--;
    }
    // Remove trailing comma before closing
    partial = partial.replace(/,\s*$/, "");
    // Close arrays first, then objects
    partial += "]".repeat(Math.max(0, brackets));
    partial += "}".repeat(Math.max(0, braces));
    try {
      return JSON.parse(partial);
    } catch (_) {}
  }

  throw new Error("Could not parse AI response as JSON. Raw: " + clean.slice(0, 200));
}

// ─────────────────────────────────────────────
//  Claude (Anthropic)
// ─────────────────────────────────────────────
export async function callClaude(apiKey, messages, system = "") {
  const body = {
    model: "claude-opus-4-5",
    max_tokens: 8096,  // max Claude allows
    messages,
  };
  if (system) body.system = system;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Claude API error: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return data.content.map((i) => i.text || "").join("");
}

// ─────────────────────────────────────────────
//  Gemini (Google) — model fallback + retry
// ─────────────────────────────────────────────
export async function callGemini(apiKey, prompt, modelIndex = 0) {
  const model = GEMINI_MODELS[modelIndex] || GEMINI_MODELS[0];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const attempt = async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,        // lower = more consistent JSON output
          maxOutputTokens: 8192,   // max Gemini allows
          responseMimeType: "application/json", // tell Gemini to return JSON
        },
      }),
    });

    if (res.status === 429 || res.status === 503) {
      if (modelIndex + 1 < GEMINI_MODELS.length) {
        console.warn(`[Gemini] ${model} rate limited, trying ${GEMINI_MODELS[modelIndex + 1]}...`);
        return callGemini(apiKey, prompt, modelIndex + 1);
      }
      throw new Error("Gemini API error: 429/503 — All models busy. Wait 1 minute and retry.");
    }

    if (res.status === 404) {
      if (modelIndex + 1 < GEMINI_MODELS.length) {
        console.warn(`[Gemini] ${model} not found, trying ${GEMINI_MODELS[modelIndex + 1]}...`);
        return callGemini(apiKey, prompt, modelIndex + 1);
      }
      throw new Error("Gemini API error: 404 — No available models found.");
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini API error: ${res.status} — ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty response.");
    return text;
  };

  return withRetry(attempt, 3, 5000);
}

// ─────────────────────────────────────────────
//  Unified call — picks provider
// ─────────────────────────────────────────────
// ── Gemini with multipart (base64 files + text) ──
export async function callGeminiMultipart(apiKey, parts, modelIndex = 0) {
  const model = GEMINI_MODELS[modelIndex] || GEMINI_MODELS[0];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  if (!res.ok) {
    const errText = await res.text();
    if ((res.status === 429 || res.status === 503) && modelIndex + 1 < GEMINI_MODELS.length) {
      return callGeminiMultipart(apiKey, parts, modelIndex + 1);
    }
    throw new Error(`Gemini API error: ${res.status} — ${errText}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function callAI(provider, apiKey, prompt, systemPrompt = "", contentParts = null) {
  if (provider === "gemini") {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    return callGemini(apiKey, fullPrompt);
  }
  const messages = contentParts
    ? [{ role: "user", content: contentParts }]
    : [{ role: "user", content: prompt }];
  return callClaude(apiKey, messages, systemPrompt);
}

// ─────────────────────────────────────────────
//  Analyze uploaded notes
// ─────────────────────────────────────────────
export async function analyzeNotesWithAI(provider, apiKey, files) {
  const analysisPrompt = `Analyze these student notes/documents and extract key study insights.
Return ONLY a valid JSON object. No explanation. No markdown. Pure JSON only.
Use short values — keep each string under 80 characters to avoid truncation.
{
  "detectedSubjects": ["subject1", "subject2"],
  "keyTopics": ["topic1", "topic2", "topic3"],
  "weakAreas": ["weak area 1", "weak area 2"],
  "strongAreas": ["strong area 1"],
  "difficulty": "Easy",
  "estimatedCoverage": "One short sentence here.",
  "studyRecommendation": "One short sentence here.",
  "importantFormulas": ["formula 1", "formula 2"],
  "suggestedTopicsToRevise": ["topic 1", "topic 2"]
}`;

  if (provider === "claude") {
    const contentParts = [];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || "text/plain";
      if (mimeType === "application/pdf") {
        contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
      } else if (mimeType.startsWith("image/")) {
        contentParts.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } });
      } else {
        const text = atob(base64);
        contentParts.push({ type: "text", text: `File: ${file.name}\n\n${text}` });
      }
    }
    contentParts.push({ type: "text", text: analysisPrompt });
    const result = await callClaude(apiKey, [{ role: "user", content: contentParts }]);
    return parseJSON(result);

  } else {
    // Gemini supports inline base64 for PDFs and images
    const parts = [];
    for (const file of files) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        parts.push({ text: `File: ${file.name}\n${text.slice(0, 3000)}` });
      } else if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        const base64 = await fileToBase64(file);
        parts.push({ inline_data: { mime_type: file.type, data: base64 } });
        parts.push({ text: `(Above file is: ${file.name})` });
      } else {
        parts.push({ text: `[File: ${file.name} — ${(file.size / 1024).toFixed(0)}KB, unsupported type: ${file.type}]` });
      }
    }
    parts.push({ text: analysisPrompt });

    await delay(1000);
    const result = await callGeminiMultipart(apiKey, parts);
    return parseJSON(result);
  }
}

// ─────────────────────────────────────────────
//  Formula Sheet Builder
// ─────────────────────────────────────────────
export async function generateFormulaSheet(provider, apiKey, topics, subjects, rawFormulas) {
  const prompt = `You are a study assistant. Extract and expand ALL important formulas, equations, and key facts for these topics.

Subjects: ${subjects.join(", ")}
Topics: ${topics.join(", ")}
Already detected formulas: ${rawFormulas?.join("; ") || "none"}

Return ONLY valid JSON. No markdown. No explanation. Pure JSON only.
{
  "formulas": [
    {
      "name": "Formula display name",
      "formula": "The actual equation e.g. F = ma or E = mc²",
      "subject": "Subject name",
      "variables": "e.g. F=Force(N), m=mass(kg), a=acceleration(m/s²)",
      "tip": "One short tip on when/how to use this formula"
    }
  ]
}

Rules:
- Include at least 8-15 formulas covering all subjects/topics
- Keep formula strings clean and readable (use ^ for powers, sqrt() for roots)
- Group logically by subject
- Keep all strings under 100 chars`;

  const raw = await callAI(provider, apiKey, prompt, "You are a study formula expert. Return only JSON.");
  return parseJSON(raw);
}

// ─────────────────────────────────────────────
//  Learning Resources Generator
// ─────────────────────────────────────────────
export async function generateLearningResources(provider, apiKey, topics, subjects, learningStyle) {
  const styleGuide = {
    visual:   "YouTube video tutorials, animations, and visual explanations. Generate YouTube search URLs like https://www.youtube.com/results?search_query=QUERY",
    reading:  "Textbooks, articles, PDFs and written guides. Generate Google search URLs like https://www.google.com/search?q=QUERY+notes+pdf or https://www.google.com/search?q=QUERY+textbook",
    practice: "Practice problems, quizzes, worksheets and exercises. Generate URLs like https://www.google.com/search?q=QUERY+practice+problems or https://www.khanacademy.org/search?page_search_query=QUERY",
  };

  const prompt = `You are a study resource curator. Generate the best ${learningStyle} learning resources for these topics.

Learning Style: ${learningStyle.toUpperCase()} — ${styleGuide[learningStyle]}
Subjects: ${subjects.join(", ")}
Topics: ${topics.join(", ")}

Return ONLY valid JSON. No markdown. No explanation. Pure JSON only.
{
  "resources": [
    {
      "topic": "Exact topic name",
      "subject": "Subject name",
      "title": "Resource title (descriptive, not just the URL)",
      "url": "Full URL — must be a real working search URL",
      "type": "${learningStyle === "visual" ? "youtube" : learningStyle === "reading" ? "article" : "practice"}",
      "description": "One sentence on what the student will get from this resource",
      "difficulty": "Beginner / Intermediate / Advanced"
    }
  ],
  "styleAdvice": "One sentence tip on how to best use ${learningStyle} learning for these subjects"
}

Rules:
- Generate 1-2 resources per topic (cover all ${topics.length} topics)
- URLs must be real, working search links — not made-up pages
- For YouTube: use https://www.youtube.com/results?search_query= with a specific search query
- For reading: use https://www.google.com/search?q= with subject+topic+notes/textbook
- For practice: use https://www.google.com/search?q= or Khan Academy search URLs
- Replace spaces with + in URL query parameters
- Keep title and description under 80 chars`;

  const raw = await callAI(provider, apiKey, prompt, "You are a study resource expert. Return only JSON.");
  return parseJSON(raw);
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
export function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}