// src/lib/resume-transformer.ts
import { type z } from "zod";
import { type resumeSchema, type Skill, type Language, type Certification } from "~/server/api/schemas/resume";

// ✅ USUNIĘTO WSZYSTKIE SANITYZACJE - font Roboto obsługuje polskie znaki natywnie
// Pozostawiono tylko podstawowe bezpieczeństwo (trim, filter pustych)

// ✅ Bezpieczne formatowanie dat
const formatDate = (dateString?: string | null, language: string = "pl"): string => {
    if (!dateString) return language === "pl" ? "Obecnie" : "Present";
    
    if (/^\d{4}-\d{2}$/.test(dateString)) {
        const [year, month] = dateString.split('-');
        const date = new Date(parseInt(year!), parseInt(month!) - 1);
        return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
    }
    
    if (/^\d{4}$/.test(dateString)) return dateString;
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
    } catch (e) {
        return dateString;
    }
};

// ✅ Tłumaczenie poziomów języków (poprawione mapowanie)
const translateLanguageLevel = (level: string, targetLanguage: string): string => {
    const levelMappings = {
        pl: {
            // Angielski → Polski
            'Native': 'Ojczysty',
            'Professional': 'Zawodowy', 
            'Basic': 'Podstawowy',
            'Intermediate': 'Średniozaawansowany',
            'Advanced': 'Zaawansowany',
            'Fluent': 'Biegły',
            // CEFR → Polski
            'A1': 'Podstawowy (A1)',
            'A2': 'Podstawowy (A2)', 
            'B1': 'Średniozaawansowany (B1)',
            'B2': 'Średniozaawansowany (B2)',
            'C1': 'Zaawansowany (C1)',
            'C2': 'Biegły (C2)',
            // Polski → Polski (bez zmian)
            'Ojczysty': 'Ojczysty',
            'Zawodowy': 'Zawodowy',
            'Podstawowy': 'Podstawowy',
            'Średniozaawansowany': 'Średniozaawansowany',
            'Zaawansowany': 'Zaawansowany',
            'Biegły': 'Biegły',
        },
        en: {
            // Polski → Angielski
            'Ojczysty': 'Native',
            'Zawodowy': 'Professional',
            'Podstawowy': 'Basic',
            'Średniozaawansowany': 'Intermediate', 
            'Zaawansowany': 'Advanced',
            'Biegły': 'Fluent',
            // Angielski → Angielski (bez zmian)
            'Native': 'Native',
            'Professional': 'Professional',
            'Basic': 'Basic',
            'Intermediate': 'Intermediate',
            'Advanced': 'Advanced',
            'Fluent': 'Fluent',
            // CEFR → Angielski
            'A1': 'Basic (A1)',
            'A2': 'Basic (A2)',
            'B1': 'Intermediate (B1)', 
            'B2': 'Intermediate (B2)',
            'C1': 'Advanced (C1)',
            'C2': 'Fluent (C2)',
        }
    };

    const targetMappings = levelMappings[targetLanguage as keyof typeof levelMappings];
    if (!targetMappings) return level;
    
    return targetMappings[level as keyof typeof targetMappings] || level;
};

const getTexts = (language: string, jobTitle?: string, companyName?: string) => {
    const isPl = language === "pl";
    return {
        experience: isPl ? "Doświadczenie Zawodowe" : "Work Experience",
        education: isPl ? "Wykształcenie" : "Education",
        skills: isPl ? "Umiejętności" : "Skills & Tools",
        languages: isPl ? "Języki" : "Languages",
        certifications: isPl ? "Certyfikaty" : "Certifications",
        interests: isPl ? "Zainteresowania" : "Interests",
        currently: isPl ? "Obecnie" : "Present",
        gdprClause: isPl
            ? `Wyrażam zgodę na przetwarzanie moich danych osobowych przez ${companyName || 'firmę'} w celu prowadzenia rekrutacji na aplikowane przeze mnie stanowisko.`
            : `I consent to the processing of my personal data by ${companyName || 'the company'} for the purpose of recruitment for the position I am applying for.`
    };
};

// ✅ GŁÓWNA FUNKCJA - usunięto wszystkie sanityzacje
export const usePreparedResumeForPdf = (
    rawData: z.infer<typeof resumeSchema>,
    jobTitle?: string,
    companyName?: string
) => {
    const docLanguage = rawData.metadata?.language || "pl";
    const texts = getTexts(docLanguage, jobTitle, companyName);

    // --- BASICS ---
    const basics = {
        name: rawData.basics.name?.trim() || '',
        title: rawData.basics.title?.trim() || '',
        summary: rawData.basics.summary?.trim() || '',
        contactLine: [
            rawData.basics.location,
            rawData.basics.email,
            rawData.basics.phone
        ].filter(Boolean).join(' • '),
        linkedinUrl: rawData.basics.linkedin,
        linkedinDisplay: rawData.basics.linkedin?.replace(/https?:\/\/(www\.)?/, ''),
    };

    // --- EXPERIENCE ---
    const experience = rawData.experience.map(exp => ({
        title: exp.title?.trim() || '',
        company: exp.company?.trim() || '',
        location: exp.location?.trim() || '',
        dateRange: `${formatDate(exp.startDate, docLanguage)} – ${formatDate(exp.endDate, docLanguage)}`,
        // ✅ Proste przetwarzanie bez sanityzacji
        descriptions: (exp.description || [])
            .map(desc => typeof desc === 'string' ? desc.trim() : String(desc).trim())
            .filter(Boolean),
        // ✅ Proste przetwarzanie highlights
        highlights: (exp.highlights || [])
            .map(h => {
                if (typeof h === 'string') return h.trim();
                if (typeof h === 'object' && h && 'description' in h) return String(h.description).trim();
                return String(h).trim();
            })
            .filter(Boolean),
    }));

    // --- EDUCATION ---
    const education = rawData.education.map(edu => ({
        degree: edu.degree?.trim() || '',
        school: edu.school?.trim() || '',
        field: edu.field?.trim() || '',
        dateRange: `${formatDate(edu.startDate, docLanguage)} – ${formatDate(edu.endDate, docLanguage)}`,
        description: edu.description?.trim() || '',
    }));
    
    // --- SKILLS ---
    // ✅ Proste spłaszczanie bez mapowań
    const skills = ((rawSkills: typeof rawData.skills): string[] => {
        if (!rawSkills) return [];
        
        if (typeof rawSkills === 'string') {
            return rawSkills.split(/[,|;]/)
                .map(s => s.trim())
                .filter(Boolean);
        }
        
        if (Array.isArray(rawSkills)) {
            return rawSkills
                .map(s => typeof s === 'string' ? s.trim() : (s as any)?.name?.trim() || '')
                .filter(Boolean);
        }
        
        return [];
    })(rawData.skills);

    // --- LANGUAGES ---
    // ✅ Tłumaczenie poziomów na język CV
    const languages = (rawData.languages || []).map(lang => {
        const translatedLevel = translateLanguageLevel(lang.fluency, docLanguage);
        return `${lang.language}: ${translatedLevel}`;
    });

    // --- CERTIFICATIONS ---
    const certifications = (rawData.certifications || []).map(cert => 
        `${cert.name} - ${cert.issuer} (${formatDate(cert.date, docLanguage)})`
    );

    // --- INTERESTS ---
    const interests = rawData.interests || [];

    return {
        texts,
        basics,
        experience,
        education,
        skills,
        languages,
        certifications,
        interests,
        gdprClause: texts.gdprClause,
    };
};