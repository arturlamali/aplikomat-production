// src/server/api/schemas/resume.ts
import { z } from "zod";

// Rozszerzona schema dla doświadczenia z większą elastycznością
export const experienceSchema = z.object({
  title: z.string().min(1, "Tytuł stanowiska jest wymagany"),
  company: z.string().min(1, "Nazwa firmy jest wymagana"),
  location: z.string().optional().nullable(),
  startDate: z.string().min(1, "Data rozpoczęcia jest wymagana"),
  endDate: z.string().optional().nullable(),
  description: z.array(z.string().min(1)).min(1, "Przynajmniej jeden opis jest wymagany"),
  highlights: z.array(z.string()).optional().default([]),
  // Nowe pola dla lepszej kategoryzacji
  employmentType: z.enum(["full-time", "part-time", "contract", "freelance", "internship"]).optional(),
  isRemote: z.boolean().optional().default(false),
  // Achievements z metrykami
  achievements: z.array(z.object({
    description: z.string(),
    metric: z.string().optional(), // np. "30%", "$50K", "2M users"
    impact: z.enum(["low", "medium", "high"]).optional()
  })).optional().default([]),
});

// Rozszerzona schema dla wykształcenia
export const educationSchema = z.object({
  school: z.string().min(1, "Nazwa uczelni jest wymagana"),
  degree: z.string().min(1, "Stopień wykształcenia jest wymagany"),
  field: z.string().min(1, "Kierunek studiów jest wymagany"),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  grade: z.string().optional(),
  activities: z.string().optional(),
  description: z.string().optional(),
  // Nowe pola
  honors: z.array(z.string()).optional().default([]),
  relevantCoursework: z.array(z.string()).optional().default([]),
  gpa: z.number().min(0).max(10).optional(),
});

// Rozszerzona schema dla umiejętności z kategoriami
export const skillSchema = z.object({
  name: z.string().min(1, "Nazwa umiejętności jest wymagana"),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  category: z.enum([
    "technical", 
    "programming", 
    "design", 
    "languages", 
    "tools", 
    "soft-skills",
    "frameworks",
    "databases",
    "cloud",
    "other"
  ]).optional().default("other"),
  yearsOfExperience: z.number().min(0).optional(),
  // Dla certyfikacji związanych z umiejętnością
  certifications: z.array(z.string()).optional().default([]),
});

// Rozszerzona schema dla języków
export const languageSchema = z.object({
  language: z.string().min(1, "Nazwa języka jest wymagana"),
  fluency: z.string().min(1, "Poziom znajomości jest wymagany"),
  // Standardowe poziomy według CEFR
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "Native"]).optional(),
  // Czy to język rodzimy
  isNative: z.boolean().optional().default(false),
});

// Rozszerzona schema dla certyfikatów
export const certificationSchema = z.object({
  name: z.string().min(1, "Nazwa certyfikatu jest wymagana"),
  issuer: z.string().min(1, "Wystawca certyfikatu jest wymagany"),
  date: z.string().min(1, "Data uzyskania jest wymagana"),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().url().optional(),
  // Czy certyfikat jest aktualny
  isActive: z.boolean().optional().default(true),
});

// Nowa schema dla projektów
export const projectSchema = z.object({
  name: z.string().min(1, "Nazwa projektu jest wymagana"),
  description: z.string().min(1, "Opis projektu jest wymagany"),
  technologies: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  url: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  role: z.string().optional(),
  teamSize: z.number().min(1).optional(),
  // Kluczowe osiągnięcia w projekcie
  achievements: z.array(z.string()).default([]),
});

// Główna schema resume z nowoczesnymi funkcjonalnościami
export const resumeSchema = z.object({
  // Podstawowe informacje z rozszerzonymi opcjami
  basics: z.object({
    name: z.string().min(1, "Imię i nazwisko jest wymagane"),
    title: z.string().min(1, "Tytuł zawodowy jest wymagany"),
    summary: z.string().min(50, "Opis musi mieć przynajmniej 50 znaków"),
    location: z.string().optional().nullable(),
    email: z.string().email("Nieprawidłowy format email").optional().nullable(),
    phone: z.string().optional().nullable(),
    linkedin: z.string().url("Nieprawidłowy URL LinkedIn").optional().nullable(),
    website: z.string().url().optional().nullable(),
    github: z.string().url().optional().nullable(),
    // Nowe pola
    profilePhoto: z.string().url().optional(), // URL do zdjęcia profilowego
    availability: z.enum(["immediately", "2-weeks", "1-month", "3-months"]).optional(),
    preferredWorkType: z.enum(["remote", "hybrid", "on-site", "flexible"]).optional(),
  }),
  
  // Doświadczenie zawodowe
  experience: z.array(experienceSchema).min(1, "Przynajmniej jedno doświadczenie jest wymagane"),
  
  // Wykształcenie
  education: z.array(educationSchema).min(1, "Przynajmniej jedno wykształcenie jest wymagane"),
  
  // Umiejętności z elastycznym formatem
  skills: z.union([
    z.array(skillSchema),
    z.array(z.string()),
    z.string()
  ]).default([]),
  
  // Języki obce
  languages: z.array(languageSchema).optional().default([]),
  
  // Certyfikaty
  certifications: z.array(certificationSchema).optional().default([]),
  
  // Projekty (nowa sekcja)
  projects: z.array(projectSchema).optional().default([]),
  
  // Zainteresowania
  interests: z.array(z.string()).optional().default([]),
  
  // Szczegóły oferty pracy (do dopasowania CV)
  jobDetails: z.object({
    jobTitle: z.string().min(1, "Tytuł stanowiska jest wymagany"),
    companyName: z.string().min(1, "Nazwa firmy jest wymagana"),
    jobDescription: z.string().optional(),
    requiredSkills: z.array(z.string()).optional().default([]),
    preferredSkills: z.array(z.string()).optional().default([]),
    location: z.string().optional(),
    salaryRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().default("PLN")
    }).optional(),
  }).optional(),
  
  // Metadane
  metadata: z.object({
    language: z.enum(["pl", "en", "de", "fr", "es"]).default("pl"),
    version: z.string().default("2025.1"),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    template: z.enum(["modern", "classic", "creative", "minimal"]).default("modern"),
    // Ustawienia prywatności
    privacy: z.object({
      showPhoto: z.boolean().default(false),
      showAddress: z.boolean().default(true),
      showPhone: z.boolean().default(true),
      showEmail: z.boolean().default(true),
    }).optional(),
    // AI generation settings
    aiGenerated: z.object({
      model: z.string().optional(),
      generatedAt: z.string().datetime().optional(),
      confidence: z.number().min(0).max(1).optional(),
    }).optional(),
  }).optional(),
});

// Export types dla TypeScript
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Resume = z.infer<typeof resumeSchema>;

// Utility schemas dla walidacji
export const basicInfoUpdateSchema = resumeSchema.pick({
  basics: true,
}).extend({
  basics: resumeSchema.shape.basics.partial()
});

export const experienceUpdateSchema = z.object({
  experiences: z.array(experienceSchema.partial())
});

export const skillsUpdateSchema = z.object({
  skills: resumeSchema.shape.skills
});

// Schema dla generowania CV z AI
export const aiGenerationRequestSchema = z.object({
  linkedinProfile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    headline: z.string().optional(),
    about: z.string().optional(),
    location: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    linkedinUrl: z.string().url().optional(),
    experiences: z.array(z.object({
      title: z.string(),
      company: z.string(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
      skills: z.array(z.string()).optional(),
    })),
    education: z.array(z.object({
      school: z.string(),
      degree: z.string(),
      field: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })),
    skills: z.array(z.string()).optional(),
    languages: z.array(z.object({
      language: z.string(),
      fluency: z.string(),
    })).optional(),
  }),
  jobDetails: z.object({
    jobTitle: z.string(),
    companyName: z.string(),
    jobDescription: z.string().optional(),
    location: z.string().optional(),
  }),
  preferences: z.object({
    language: z.enum(["pl", "en"]).default("pl"),
    template: z.enum(["modern", "classic", "creative", "minimal"]).default("modern"),
    includePhoto: z.boolean().default(false),
    maxExperiences: z.number().min(3).max(10).default(6),
    emphasizeSkills: z.array(z.string()).optional(),
  }).optional(),
  customContactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});

export type AIGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;

// Validation helpers
export const validateResume = (data: unknown): Resume => {
  return resumeSchema.parse(data);
};

export const validatePartialResume = (data: unknown) => {
  return resumeSchema.partial().parse(data);
};

// Default resume template
export const createDefaultResume = (basics: z.infer<typeof resumeSchema.shape.basics>): Resume => {
  return {
    basics,
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    interests: [],
    metadata: {
      language: "pl",
      version: "2025.1",
      template: "modern",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  };
};