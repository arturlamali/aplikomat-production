// src/lib/atsOptimization.ts
import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// ===== AI-POWERED SCHEMAS =====

export const keywordAnalysisSchema = z.object({
  keywords: z.array(z.object({
    keyword: z.string(),
    importance: z.enum(['critical', 'high', 'medium', 'low']),
    category: z.enum(['technical', 'soft', 'industry', 'role', 'certification']),
    frequency: z.number(),
    synonyms: z.array(z.string()),
    reasoning: z.string()
  })),
  language: z.string(),
  industry: z.string(),
  jobLevel: z.enum(['entry', 'mid', 'senior', 'executive'])
});

export const atsScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  keywordMatch: z.number().min(0).max(100),
  titleMatch: z.number().min(0).max(100),
  experienceRelevance: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  wellMatchedKeywords: z.array(z.string()),
  improvementAreas: z.array(z.object({
    area: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    suggestion: z.string()
  }))
});

export type KeywordAnalysis = z.infer<typeof keywordAnalysisSchema>;
export type ATSScore = z.infer<typeof atsScoreSchema>;

// ===== AI MODEL CONFIGURATION =====
const getAIModel = () => google("gemini-2.0-flash-001");

// ===== AI-POWERED KEYWORD EXTRACTION =====
export const extractAdvancedKeywords = async (
  jobDescription: string, 
  jobTitle: string
): Promise<KeywordAnalysis> => {
  
  if (!jobDescription.trim() && !jobTitle.trim()) {
    return {
      keywords: [],
      language: 'en',
      industry: 'general',
      jobLevel: 'mid'
    };
  }

  try {
    const { object } = await generateObject({
      model: getAIModel(),
      schema: keywordAnalysisSchema,
      prompt: `Analyze this job posting and extract the most important keywords for ATS optimization.

JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}

Your task:
1. Detect the language (Polish, English, etc.)
2. Identify industry and job level
3. Extract 20-30 most important keywords
4. Categorize each keyword by importance and type
5. Generate relevant synonyms for each keyword
6. Provide reasoning for importance level

Importance levels:
- CRITICAL: Must-have skills, exact job title matches, core requirements
- HIGH: Important technical skills, preferred qualifications, industry terms
- MEDIUM: Nice-to-have skills, soft skills, general requirements  
- LOW: Common words, basic requirements

Categories:
- TECHNICAL: Programming languages, tools, software, platforms
- SOFT: Communication, leadership, teamwork, problem-solving
- INDUSTRY: Domain-specific terms, industry jargon
- ROLE: Job titles, responsibilities, hierarchical terms
- CERTIFICATION: Degrees, certificates, licenses

Focus on:
- Exact terms used in job description
- Technical skills and tools mentioned
- Industry-specific terminology
- Required qualifications
- Years of experience mentioned
- Educational requirements
- Soft skills explicitly mentioned

Avoid generic words like "work", "team", "company" unless specifically emphasized.`,
    });

    return object;
  } catch (error) {
    
    // Fallback - basic extraction without AI
    const words = jobDescription.toLowerCase().match(/\b[\wąćęłńóśźż]+\b/g) || [];
    const wordFreq: Record<string, number> = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([keyword, frequency]) => ({
        keyword,
        importance: frequency > 2 ? 'critical' : frequency > 1 ? 'high' : 'medium' as const,
        category: 'industry' as const,
        frequency,
        synonyms: [],
        reasoning: `Mentioned ${frequency} times in job description`
      }));

    return {
      keywords: topWords,
      language: jobDescription.includes('jest') || jobDescription.includes('się') ? 'pl' : 'en',
      industry: 'general',
      jobLevel: 'mid'
    };
  }
};

// ===== AI-POWERED ATS SCORE CALCULATION =====
export const calculateATSScore = async (
  resumeData: any,
  keywordAnalysis: KeywordAnalysis
): Promise<ATSScore> => {
  
  if (!resumeData || keywordAnalysis.keywords.length === 0) {
    return {
      overallScore: 0,
      keywordMatch: 0,
      titleMatch: 0,
      experienceRelevance: 0,
      recommendations: ["Unable to analyze - insufficient data"],
      missingKeywords: [],
      wellMatchedKeywords: [],
      improvementAreas: []
    };
  }

  try {
    // Extract all text from resume
    const resumeText = extractResumeText(resumeData);
    
    const { object } = await generateObject({
      model: getAIModel(),
      schema: atsScoreSchema,
      prompt: `Analyze this resume against the job requirements and provide ATS compatibility score.

RESUME CONTENT:
${resumeText.slice(0, 3000)} // Limit for API

JOB KEYWORDS:
${keywordAnalysis.keywords.map(k => `${k.keyword} (${k.importance})`).join(', ')}

SCORING CRITERIA:
1. KEYWORD MATCH (40% weight): How many job keywords appear in resume?
   - Critical keywords missing: -10 points each
   - High importance keywords missing: -5 points each
   - Keyword density and natural integration
   
2. TITLE MATCH (30% weight): How well does resume title match job requirements?
   - Exact matches with job title/role keywords
   - Relevant industry terminology in headline
   
3. EXPERIENCE RELEVANCE (30% weight): How relevant is work experience?
   - Keywords in experience descriptions
   - Industry alignment
   - Skill demonstrations

ANALYSIS REQUIREMENTS:
- Overall score: 0-100 (weighted combination)
- Individual scores: 0-100 for each category
- List keywords found in resume vs missing
- Specific, actionable recommendations in Polish
- Focus on improvement areas with highest impact

Provide realistic, accurate scores based on actual keyword presence and relevance.`,
    });

    return object;
  } catch (error) {
    
    // Fallback scoring
    const resumeText = extractResumeText(resumeData).toLowerCase();
    const criticalKeywords = keywordAnalysis.keywords.filter(k => k.importance === 'critical');
    const allKeywords = keywordAnalysis.keywords;
    
    let matchedCount = 0;
    const matched: string[] = [];
    const missing: string[] = [];
    
    allKeywords.forEach(k => {
      if (resumeText.includes(k.keyword.toLowerCase())) {
        matchedCount++;
        matched.push(k.keyword);
      } else {
        missing.push(k.keyword);
      }
    });
    
    const keywordScore = allKeywords.length > 0 ? Math.round((matchedCount / allKeywords.length) * 100) : 0;
    const titleScore = 70; // Default neutral score
    const experienceScore = Math.min(keywordScore + 10, 100); // Slightly higher than keyword score
    
    const overallScore = Math.round(keywordScore * 0.4 + titleScore * 0.3 + experienceScore * 0.3);

    return {
      overallScore,
      keywordMatch: keywordScore,
      titleMatch: titleScore,
      experienceRelevance: experienceScore,
      recommendations: [
        overallScore < 70 ? "Dodaj więcej słów kluczowych z ogłoszenia do CV" : "Dobre dopasowanie słów kluczowych",
        missing.length > 5 ? `Dodaj te brakujące kluczowe umiejętności: ${missing.slice(0, 3).join(', ')}` : "Większość ważnych słów kluczowych jest obecna"
      ],
      missingKeywords: missing.slice(0, 10),
      wellMatchedKeywords: matched.slice(0, 10),
      improvementAreas: [{
        area: "Słowa kluczowe",
        impact: keywordScore < 60 ? "high" : "medium",
        suggestion: "Zwiększ występowanie kluczowych terminów z oferty pracy"
      }]
    };
  }
};

// ===== AI-POWERED LANGUAGE DETECTION =====
export const detectJobLanguage = async (jobDescription: string, jobTitle: string): Promise<string> => {
  const text = `${jobDescription} ${jobTitle}`.trim();
  
  if (!text) return "pl"; // Default to Polish
  
  try {
    const result = await generateText({
      model: getAIModel(),
      prompt: `Detect the primary language of this job posting. Respond with just the language code (pl, en, de, fr, etc.):

TEXT: ${text.slice(0, 500)}

Language code:`,
    });

    const detectedLang = result.text.trim().toLowerCase();
    
    // Validate result
    const validLanguages = ['pl', 'en', 'de', 'fr', 'es', 'it'];
    return validLanguages.includes(detectedLang) ? detectedLang : 'pl';
    
  } catch (error) {
    
    // Simple fallback - check for Polish words
    const polishIndicators = ['jest', 'się', 'do', 'na', 'przez', 'oraz', 'że', 'może', 'będzie'];
    const hasPolish = polishIndicators.some(word => text.toLowerCase().includes(word));
    
    return hasPolish ? 'pl' : 'en';
  }
};

// ===== AI-ENHANCED PROMPT OPTIMIZATION =====
export const enhancePromptWithATS = async (
  originalPrompt: string,
  keywordAnalysis: KeywordAnalysis
): Promise<string> => {
  
  if (keywordAnalysis.keywords.length === 0) {
    return originalPrompt;
  }

  try {
    const criticalKeywords = keywordAnalysis.keywords
      .filter(k => k.importance === 'critical')
      .map(k => k.keyword);
      
    const highKeywords = keywordAnalysis.keywords
      .filter(k => k.importance === 'high')
      .map(k => k.keyword);

    const atsEnhancement = await generateText({
      model: getAIModel(),
      prompt: `Enhance this CV generation prompt with ATS optimization instructions.

ORIGINAL PROMPT: ${originalPrompt}

CRITICAL KEYWORDS: ${criticalKeywords.join(', ')}
HIGH PRIORITY KEYWORDS: ${highKeywords.join(', ')}
DETECTED LANGUAGE: ${keywordAnalysis.language}
INDUSTRY: ${keywordAnalysis.industry}
JOB LEVEL: ${keywordAnalysis.jobLevel}

Add specific ATS optimization instructions that:
1. Require exact usage of critical keywords
2. Specify keyword placement strategy
3. Include natural integration requirements
4. Add density guidelines (2-3 mentions per critical keyword)
5. Specify synonym usage where appropriate
6. Maintain original prompt's intent and quality

Return the enhanced prompt:`,
    });

    return `${originalPrompt}

🎯 ATS OPTIMIZATION REQUIREMENTS:
${atsEnhancement.text}`;

  } catch (error) {
    
    // Fallback enhancement
    const criticalKeywords = keywordAnalysis.keywords
      .filter(k => k.importance === 'critical')
      .map(k => k.keyword)
      .slice(0, 8);

    return `${originalPrompt}

🎯 ATS OPTIMIZATION: Must naturally integrate these keywords: ${criticalKeywords.join(', ')}
- Use exact terminology from job posting
- Repeat critical keywords 2-3 times across different sections
- Place keywords in first paragraph of each section when possible`;
  }
};

// ===== UTILITY FUNCTIONS =====

// Extract text from resume data structure
const extractResumeText = (resumeData: any): string => {
  const parts: string[] = [];
  
  try {
    // Basics
    if (resumeData.basics) {
      parts.push(resumeData.basics.title || '');
      parts.push(resumeData.basics.summary || '');
    }
    
    // Experience
    if (Array.isArray(resumeData.experience)) {
      resumeData.experience.forEach((exp: any) => {
        parts.push(exp.title || '');
        parts.push(exp.company || '');
        if (Array.isArray(exp.description)) {
          parts.push(...exp.description);
        }
        if (Array.isArray(exp.highlights)) {
          parts.push(...exp.highlights);
        }
      });
    }
    
    // Skills
    if (resumeData.skills) {
      if (Array.isArray(resumeData.skills)) {
        resumeData.skills.forEach((skill: any) => {
          if (typeof skill === 'string') {
            parts.push(skill);
          } else if (skill?.name) {
            parts.push(skill.name);
          }
        });
      }
      
      // Enhanced skills format
      if (resumeData.skills.coreCompetencies) {
        parts.push(...resumeData.skills.coreCompetencies);
      }
      if (resumeData.skills.technicalSkills) {
        parts.push(...resumeData.skills.technicalSkills);
      }
      if (resumeData.skills.additionalSkills) {
        parts.push(...resumeData.skills.additionalSkills);
      }
    }
    
    // Education
    if (Array.isArray(resumeData.education)) {
      resumeData.education.forEach((edu: any) => {
        parts.push(edu.degree || '');
        parts.push(edu.field || '');
        parts.push(edu.school || '');
      });
    }
  } catch (error) {
  }

  return parts.filter(Boolean).join(' ');
};

// ===== VALIDATION FUNCTIONS =====

export const validateKeywordAnalysis = (analysis: any): analysis is KeywordAnalysis => {
  try {
    keywordAnalysisSchema.parse(analysis);
    return true;
  } catch {
    return false;
  }
};

export const validateATSScore = (score: any): score is ATSScore => {
  try {
    atsScoreSchema.parse(score);
    return true;
  } catch {
    return false;
  }
};