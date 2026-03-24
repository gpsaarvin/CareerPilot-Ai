const { OpenAI } = require('openai');

function safeJsonParseObject(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  const stripped = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(stripped);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

async function getCompanyResumeSuggestions(req, res) {
  try {
    const { company, role, description } = req.body || {};

    if (!company || !role || !description) {
      return res.status(400).json({
        success: false,
        message: 'company, role, and description are required',
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'OpenRouter API key is missing' });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
    });

    const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.25,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: 'You are a resume strategist. Output only valid JSON with keys: summary, requiredSkills, atsKeywords, suggestedProjects. summary must be 3-4 lines. requiredSkills, atsKeywords, suggestedProjects must each be arrays of concise strings.',
        },
        {
          role: 'user',
          content: `Company: ${company}\nRole: ${role}\nJob Description: ${description}\n\nGenerate practical company-specific resume tips and ATS guidance.`,
        },
      ],
    });

    const raw = completion?.choices?.[0]?.message?.content || '{}';
    const parsed = safeJsonParseObject(raw);

    if (!parsed) {
      return res.status(502).json({ success: false, message: 'AI returned unparsable response' });
    }

    return res.json({
      success: true,
      data: {
        summary: parsed.summary || '',
        requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
        atsKeywords: Array.isArray(parsed.atsKeywords) ? parsed.atsKeywords : [],
        suggestedProjects: Array.isArray(parsed.suggestedProjects) ? parsed.suggestedProjects : [],
        modelUsed: completion?.model || model,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getCompanyResumeSuggestions,
};
