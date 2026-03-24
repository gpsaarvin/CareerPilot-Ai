// ============================================================
// Resume Controller
// Handles PDF upload, text extraction, and AI skill matching
// ============================================================
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { getOrCreateUser } = require('../data/inMemoryStore');
const { getAllCachedInternships } = require('../data/liveInternshipStore');

// @desc    Upload resume PDF
// @route   POST /api/resume/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
    }

    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    const userId = req.user?._id;
    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ success: false, message: 'Please sign in with Google' });
    }

    const user = getOrCreateUser(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session not found. Please sign in again.' });
    }
    user.resume_url = req.file.path;
    user.resume_text = extractedText;

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      text_preview: extractedText.substring(0, 500) + '...',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Analyze resume with AI and match to internships
// @route   POST /api/resume/analyze
// @access  Private
const analyzeResume = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ success: false, message: 'Please sign in with Google' });
    }

    const user = getOrCreateUser(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session not found. Please sign in again.' });
    }

    if (!user.resume_text) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume first',
      });
    }

    let extractedSkills = [];
    let resumeSuggestions = [];

    // Try AI if API key is available (supports OpenRouter + OpenAI)
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        });
        const aiModel = process.env.AI_MODEL || 'gpt-3.5-turbo';

        // 1. Extract skills
        const completion = await openai.chat.completions.create({
          model: aiModel,
          messages: [
            {
              role: 'system',
              content: 'You are a resume analyzer. Extract technical skills, programming languages, frameworks, and tools from the resume text. Return ONLY a JSON array of skill strings, nothing else. Example: ["Python", "React", "SQL", "Machine Learning"]',
            },
            {
              role: 'user',
              content: `Extract skills from this resume:\n\n${user.resume_text.substring(0, 3000)}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        const response = completion.choices[0].message.content.trim();
        extractedSkills = JSON.parse(response);

        // 2. Get resume improvement suggestions from AI
        try {
          const suggestionsCompletion = await openai.chat.completions.create({
            model: aiModel,
            messages: [
              {
                role: 'system',
                content: `You are an expert career counselor and resume reviewer. Analyze the given resume and provide actionable improvement suggestions. Return a JSON array of suggestion objects with this exact format:
[{"category": "Content", "priority": "high", "title": "short title", "suggestion": "detailed actionable suggestion"},
 {"category": "Formatting", "priority": "medium", "title": "short title", "suggestion": "detailed suggestion"},
 {"category": "Skills", "priority": "high", "title": "short title", "suggestion": "detailed suggestion"}]

Categories can be: Content, Formatting, Skills, Experience, Education, Projects, Keywords, Impact, ATS Optimization.
Priority can be: high, medium, low.
Provide 6-10 specific, actionable suggestions. Focus on real improvements, not generic advice. Return ONLY the JSON array.`,
              },
              {
                role: 'user',
                content: `Analyze this resume and suggest improvements:\n\n${user.resume_text.substring(0, 3000)}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 1500,
          });

          const suggestionsResponse = suggestionsCompletion.choices[0].message.content.trim();
          resumeSuggestions = JSON.parse(suggestionsResponse);
        } catch (sugErr) {
          console.error('OpenAI Suggestions Error:', sugErr.message);
          resumeSuggestions = generateFallbackSuggestions(user.resume_text, extractedSkills);
        }
      } catch (aiError) {
        console.error('OpenAI Error:', aiError.message);
        extractedSkills = extractSkillsFallback(user.resume_text);
        resumeSuggestions = generateFallbackSuggestions(user.resume_text, extractedSkills);
      }
    } else {
      // No API key — use fallback keyword matching + smart suggestions
      extractedSkills = extractSkillsFallback(user.resume_text);
      resumeSuggestions = generateFallbackSuggestions(user.resume_text, extractedSkills);
    }

    user.skills = extractedSkills;

    const liveInternships = getAllCachedInternships();

    // Match against live internships
    const matchedInternships = liveInternships.map(intern => {
      const internSkills = intern.skills_required.map(s => s.toLowerCase());
      const userSkills = extractedSkills.map(s => s.toLowerCase());

      const matchingSkills = userSkills.filter(skill =>
        internSkills.some(is => is.includes(skill) || skill.includes(is))
      );

      const matchScore = internSkills.length > 0
        ? Math.round((matchingSkills.length / internSkills.length) * 100)
        : 0;

      return {
        internship: intern,
        matchScore,
        matchingSkills,
      };
    });

    // Sort by match score (highest first) and return top results
    matchedInternships.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = matchedInternships.filter(m => m.matchScore > 0).slice(0, 10);

    res.json({
      success: true,
      extracted_skills: extractedSkills,
      matches: topMatches,
      suggestions: resumeSuggestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fallback skill extraction using keyword matching (no AI required)
function extractSkillsFallback(text) {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'PHP', 'Ruby',
    'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS', 'LESS',
    'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'Firebase', 'Supabase', 'SQLite',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
    'Data Science', 'Data Analysis', 'Pandas', 'NumPy', 'Tableau', 'Power BI',
    'REST API', 'GraphQL', 'Microservices', 'System Design',
    'Figma', 'Adobe XD', 'UI/UX', 'Photoshop', 'Illustrator',
    'Agile', 'Scrum', 'JIRA', 'Linux', 'Shell Scripting',
    'Blockchain', 'Web3', 'Solidity', 'Ethereum',
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS',
    'Selenium', 'Jest', 'Mocha', 'Cypress', 'Testing',
    'SEO', 'Digital Marketing', 'Content Writing', 'Social Media',
    'Excel', 'Word', 'PowerPoint', 'Google Analytics',
  ];

  const textLower = text.toLowerCase();
  return commonSkills.filter(skill => textLower.includes(skill.toLowerCase()));
}

// Smart fallback resume suggestions (no AI required)
function generateFallbackSuggestions(text, extractedSkills) {
  const suggestions = [];
  const textLower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  const lines = text.split('\n').filter(l => l.trim());

  // 1. Check resume length
  if (wordCount < 150) {
    suggestions.push({
      category: 'Content',
      priority: 'high',
      title: 'Resume is too short',
      suggestion: 'Your resume has only ~' + wordCount + ' words. A strong internship resume should have 300-600 words. Add more details about your projects, coursework, and achievements with specific metrics.',
    });
  } else if (wordCount > 1000) {
    suggestions.push({
      category: 'Content',
      priority: 'medium',
      title: 'Resume may be too long',
      suggestion: 'Your resume has ~' + wordCount + ' words. For internship applications, keep it to 1 page (400-600 words). Remove less relevant experiences and focus on your strongest qualifications.',
    });
  }

  // 2. Check for key resume sections
  const sections = {
    'education': ['education', 'university', 'college', 'degree', 'b.tech', 'b.e', 'bsc', 'bachelor'],
    'experience': ['experience', 'intern', 'worked at', 'work history', 'employment'],
    'projects': ['project', 'built', 'developed', 'created', 'designed'],
    'skills': ['skill', 'technologies', 'proficient', 'languages', 'tools', 'frameworks'],
    'contact': ['email', 'phone', 'linkedin', 'github', '@'],
  };

  for (const [section, keywords] of Object.entries(sections)) {
    const found = keywords.some(kw => textLower.includes(kw));
    if (!found) {
      suggestions.push({
        category: 'Content',
        priority: section === 'contact' ? 'high' : 'medium',
        title: `Missing ${section.charAt(0).toUpperCase() + section.slice(1)} section`,
        suggestion: `Your resume doesn't seem to include a ${section} section. Add a clear "${section.charAt(0).toUpperCase() + section.slice(1)}" heading with relevant details. Recruiters look for this section first.`,
      });
    }
  }

  // 3. Check for action verbs
  const actionVerbs = ['developed', 'built', 'designed', 'implemented', 'created', 'managed', 'led', 'optimized', 'improved', 'deployed', 'analyzed', 'collaborated', 'automated', 'integrated'];
  const usedVerbs = actionVerbs.filter(v => textLower.includes(v));
  if (usedVerbs.length < 3) {
    suggestions.push({
      category: 'Impact',
      priority: 'high',
      title: 'Use stronger action verbs',
      suggestion: 'Start bullet points with powerful action verbs like "Developed", "Implemented", "Optimized", "Deployed", "Automated", "Integrated". This shows impact and ownership. Avoid passive phrases like "was responsible for" or "helped with".',
    });
  }

  // 4. Check for quantifiable achievements
  const hasNumbers = /\d+%|\d+ users|\d+x|reduced by|increased by|improved by/i.test(text);
  if (!hasNumbers) {
    suggestions.push({
      category: 'Impact',
      priority: 'high',
      title: 'Add quantifiable achievements',
      suggestion: 'Include measurable results in your bullet points. For example: "Reduced page load time by 40%", "Built an app serving 500+ users", "Improved test coverage from 30% to 85%". Numbers make your impact tangible.',
    });
  }

  // 5. Check for GitHub/portfolio links
  if (!textLower.includes('github') && !textLower.includes('portfolio') && !textLower.includes('gitlab')) {
    suggestions.push({
      category: 'Content',
      priority: 'medium',
      title: 'Add GitHub or portfolio link',
      suggestion: 'Include your GitHub profile or portfolio website URL. Recruiters for tech internships almost always check candidates\' code and projects online.',
    });
  }

  // 6. Check for LinkedIn
  if (!textLower.includes('linkedin')) {
    suggestions.push({
      category: 'Content',
      priority: 'low',
      title: 'Add LinkedIn profile',
      suggestion: 'Include your LinkedIn URL in the contact section. Many recruiters cross-reference your resume with your LinkedIn profile.',
    });
  }

  // 7. Skill gap analysis based on popular internship requirements
  const hotSkills = ['React', 'Python', 'JavaScript', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS', 'TypeScript', 'Machine Learning'];
  const missingHotSkills = hotSkills.filter(skill =>
    !extractedSkills.some(es => es.toLowerCase() === skill.toLowerCase())
  );
  if (missingHotSkills.length > 0) {
    suggestions.push({
      category: 'Skills',
      priority: 'medium',
      title: 'Consider adding in-demand skills',
      suggestion: `Top internship postings frequently require: ${missingHotSkills.slice(0, 5).join(', ')}. If you have any experience with these, make sure they appear on your resume. If not, consider learning 1-2 of them through online courses.`,
    });
  }

  // 8. ATS optimization check
  const hasSpecialFormatting = /[\u2022\u25CF\u25CB\u2023]/.test(text);
  if (!hasSpecialFormatting && lines.length < 15) {
    suggestions.push({
      category: 'ATS Optimization',
      priority: 'medium',
      title: 'Use ATS-friendly formatting',
      suggestion: 'Use a clean, single-column layout with standard section headings (Education, Experience, Skills, Projects). Avoid tables, images, or unusual formatting that ATS systems can\'t parse.',
    });
  }

  // 9. Check for objective/summary
  const hasSummary = ['objective', 'summary', 'about me', 'profile'].some(kw => textLower.includes(kw));
  if (!hasSummary) {
    suggestions.push({
      category: 'Content',
      priority: 'medium',
      title: 'Add a professional summary',
      suggestion: 'Start with a 2-3 line professional summary highlighting your key strengths, current education, and career goals. Example: "Computer Science student with experience in full-stack development, seeking a software engineering internship to apply skills in React and Node.js."',
    });
  }

  // 10. Certifications check
  if (!textLower.includes('certif') && !textLower.includes('course') && !textLower.includes('udemy') && !textLower.includes('coursera')) {
    suggestions.push({
      category: 'Education',
      priority: 'low',
      title: 'Add relevant certifications or courses',
      suggestion: 'Include any online certifications (Coursera, Udemy, freeCodeCamp, etc.) relevant to your target roles. Even free certifications show initiative and continuous learning.',
    });
  }

  return suggestions;
}

// @desc    Get AI-powered recommendations based on user skills
// @route   GET /api/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId || userId === 'demo-user') {
      return res.status(401).json({ success: false, message: 'Please sign in with Google' });
    }

    const user = getOrCreateUser(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session not found. Please sign in again.' });
    }

    if (!user.skills || user.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload and analyze your resume first, or add skills to your profile',
      });
    }

    // Find internships matching user skills
    const userSkillsRegex = user.skills.map(s => new RegExp(s, 'i'));
    const liveInternships = getAllCachedInternships();
    const recommendations = liveInternships
      .filter((intern) => (intern.skills_required || []).some((skill) => userSkillsRegex.some((re) => re.test(skill))))
      .slice(0, 20);

    // Calculate match scores
    const scored = recommendations.map(intern => {
      const internSkills = intern.skills_required.map(s => s.toLowerCase());
      const userSkills = user.skills.map(s => s.toLowerCase());
      const matches = userSkills.filter(us =>
        internSkills.some(is => is.includes(us) || us.includes(is))
      );
      return {
        ...intern,
        matchScore: Math.round((matches.length / internSkills.length) * 100),
        matchingSkills: matches,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, count: scored.length, data: scored });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadResume, analyzeResume, getRecommendations };
