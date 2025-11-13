// src/lib/safePdfGenerator.tsx
// ✅ NAPRAWIONY SAFE PDF GENERATOR (bez SystemFontPDF)

import React from "react";
import { pdf } from "@react-pdf/renderer";
import { ResumePDF } from "~/components/ResumePDF";
import { type z } from "zod";
import { type resumeSchema } from "~/server/api/schemas/resume";
import { toast } from "sonner";

export interface SafePdfResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  method?: string;
}

// ✅ FALLBACK 1: Retry with delay and better error detection
const attemptPdfGeneration = async (
  data: z.infer<typeof resumeSchema>,
  jobTitle?: string,
  companyName?: string,
  timeout: number = 30000
): Promise<Blob> => {
  
  const pdfPromise = pdf(
    <ResumePDF data={data} jobTitle={jobTitle} companyName={companyName} />
  ).toBlob();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('PDF generation timeout')), timeout);
  });

  try {
    const result = await Promise.race([pdfPromise, timeoutPromise]);
    return result;
  } catch (error: any) {
    
    // ✅ Enhanced error classification
    if (error.message?.includes('Unknown font format')) {
      throw new Error('FONT_ERROR: Font loading failed');
    } else if (error.message?.includes('Offset is outside the bounds')) {
      throw new Error('FONT_ERROR: Font data corruption');
    } else if (error.message?.includes('timeout')) {
      throw new Error('TIMEOUT_ERROR: Generation took too long');
    } else if (error.message?.includes('Network')) {
      throw new Error('NETWORK_ERROR: Font download failed');
    } else {
      throw new Error(`GENERAL_ERROR: ${error.message}`);
    }
  }
};

// ✅ FALLBACK 2: Simplified data (ograniczenie ilości)
const generateSimplifiedPdf = async (
  data: z.infer<typeof resumeSchema>,
  jobTitle?: string,
  companyName?: string
): Promise<Blob> => {
  
  // Create simplified version - limit quantity, not modify content
  const simplifiedData: z.infer<typeof resumeSchema> = {
    basics: {
      name: data.basics?.name || 'Professional',
      title: data.basics?.title || 'Professional',
      summary: data.basics?.summary || 'Experienced professional',
      location: data.basics?.location,
      email: data.basics?.email,
      phone: data.basics?.phone,
      linkedin: data.basics?.linkedin,
    },
    experience: (data.experience || []).slice(0, 3).map(exp => ({
      title: exp.title || 'Position',
      company: exp.company || 'Company',
      location: exp.location,
      startDate: exp.startDate || '2023-01',
      endDate: exp.endDate,
      description: Array.isArray(exp.description) ? exp.description.slice(0, 2) : ['Professional experience'],
      highlights: Array.isArray(exp.highlights) ? exp.highlights.slice(0, 1) : [],
    })),
    education: (data.education || []).slice(0, 2).map(edu => ({
      school: edu.school || 'University',
      degree: edu.degree || 'Degree',
      field: edu.field || 'Field',
      startDate: edu.startDate,
      endDate: edu.endDate,
    })),
    skills: Array.isArray(data.skills) ? data.skills.slice(0, 10) : [],
    languages: Array.isArray(data.languages) ? data.languages.slice(0, 3) : [],
    certifications: [],
    interests: Array.isArray(data.interests) ? data.interests.slice(0, 5) : [],
  };

  return attemptPdfGeneration(simplifiedData, jobTitle, companyName, 20000);
};

// ✅ FALLBACK 3: Minimal data
const generateMinimalPdf = async (
  data: z.infer<typeof resumeSchema>,
  jobTitle?: string,
  companyName?: string
): Promise<Blob> => {
  
  const minimalData: z.infer<typeof resumeSchema> = {
    basics: {
      name: data.basics?.name || 'Professional',
      title: data.basics?.title || 'Professional',
      summary: 'Experienced professional with proven track record.',
    },
    experience: [{
      title: data.experience?.[0]?.title || 'Latest Position',
      company: data.experience?.[0]?.company || 'Company',
      startDate: '2023-01',
      endDate: null,
      description: ['Professional experience in the field'],
      highlights: [],
    }],
    education: [{
      school: data.education?.[0]?.school || 'University',
      degree: data.education?.[0]?.degree || 'Degree',
      field: data.education?.[0]?.field || 'Field',
    }],
    skills: ['Professional Skills'],
    languages: [],
    certifications: [],
    interests: [],
  };

  return attemptPdfGeneration(minimalData, jobTitle, companyName, 15000);
};

// ✅ MAIN SAFE PDF GENERATOR (enhanced error reporting)
export const generateSafePdf = async (
  data: z.infer<typeof resumeSchema>,
  jobTitle?: string,
  companyName?: string
): Promise<SafePdfResult> => {
    name: data.basics?.name,
    experienceCount: data.experience?.length || 0,
    language: data.metadata?.language || 'unknown'
  });

  let lastError = '';

  // ✅ ATTEMPT 1: Normal generation
  try {
    const blob = await attemptPdfGeneration(data, jobTitle, companyName);
    return { success: true, blob, method: 'normal' };
  } catch (error: any) {
    lastError = error.message;
    
    if (error.message?.includes('FONT_ERROR')) {
    } else if (error.message?.includes('TIMEOUT_ERROR')) {
    } else if (error.message?.includes('NETWORK_ERROR')) {
    }
  }

  // ✅ ATTEMPT 2: Retry after delay with longer timeout
  try {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay
    const blob = await attemptPdfGeneration(data, jobTitle, companyName, 45000); // Longer timeout
    return { success: true, blob, method: 'retry' };
  } catch (error: any) {
    lastError = error.message;
  }

  // ✅ ATTEMPT 3: Simplified data
  try {
    const blob = await generateSimplifiedPdf(data, jobTitle, companyName);
    return { success: true, blob, method: 'simplified' };
  } catch (error: any) {
    lastError = error.message;
  }

  // ✅ ATTEMPT 4: Minimal data
  try {
    const blob = await generateMinimalPdf(data, jobTitle, companyName);
    return { success: true, blob, method: 'minimal' };
  } catch (error: any) {
    lastError = error.message;
  }

  // ✅ ATTEMPT 5: Last resort - try with minimal timeout
  try {
    const blob = await attemptPdfGeneration(data, jobTitle, companyName, 10000);
    return { success: true, blob, method: 'last_resort' };
  } catch (error: any) {
    lastError = error.message;
  }

  // ✅ ALL ATTEMPTS FAILED - Enhanced error reporting
  
  let userFriendlyError = 'PDF generation failed after multiple attempts.';
  
  if (lastError.includes('FONT_ERROR')) {
    userFriendlyError = 'Problem z czcionkami PDF. Spróbuj odświeżyć stronę lub użyj innej przeglądarki (Chrome/Firefox).';
  } else if (lastError.includes('TIMEOUT_ERROR')) {
    userFriendlyError = 'Generowanie PDF trwa zbyt długo. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.';
  } else if (lastError.includes('NETWORK_ERROR')) {
    userFriendlyError = 'Błąd sieci podczas ładowania zasobów PDF. Sprawdź połączenie internetowe.';
  } else if (lastError.includes('GENERAL_ERROR')) {
    userFriendlyError = 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.';
  }
  
  return { 
    success: false, 
    error: userFriendlyError,
    method: 'failed'
  };
};

// ✅ CONVENIENCE FUNCTION for download
export const downloadSafePdf = async (
  data: z.infer<typeof resumeSchema>,
  jobTitle?: string,
  companyName?: string,
  filename?: string
): Promise<void> => {
  const result = await generateSafePdf(data, jobTitle, companyName);
  
  if (!result.success || !result.blob) {
    throw new Error(result.error || 'PDF generation failed');
  }

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const finalFilename = filename || 
    `CV_${jobTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'Document'}_${companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company'}_${timestamp}.pdf`;

  // Download
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);

  // Show success message with method used
  const methodMessages = {
    normal: 'CV zostało pobrane! 📄',
    retry: 'CV zostało pobrane po ponownej próbie! 📄',
    simplified: 'CV zostało pobrane (wersja uproszczona)! 📄',
    minimal: 'CV zostało pobrane (wersja minimalna)! 📄',
    last_resort: 'CV zostało pobrane (ostateczna próba)! 📄',
  };
  
  toast.success(methodMessages[result.method as keyof typeof methodMessages] || 'CV zostało pobrane! 📄');
};