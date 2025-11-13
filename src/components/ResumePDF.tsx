// src/components/ResumePDF.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, Link, Font } from "@react-pdf/renderer";
import { type z } from "zod";
import { type resumeSchema } from "~/server/api/schemas/resume";
import { usePreparedResumeForPdf } from '~/lib/resume-transformer';

// ✅ PROSTA REJESTRACJA FONTU (sprawdzona - działa)
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
});

// ✅ POPRAWIONE STYLE - więcej odstępów, nie nachodzą teksty
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: '20pt 30pt 60pt 30pt',
    fontSize: 9,
    color: '#333',
    fontFamily: 'Roboto',
    lineHeight: 1.4, // ✅ Zwiększone line-height
  },
  
  header: {
    marginBottom: 16, // ✅ Więcej miejsca
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4, // ✅ Więcej miejsca
    color: '#111827',
    fontFamily: 'Roboto',
    lineHeight: 1.2,
  },
  
  title: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8, // ✅ Więcej miejsca
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    lineHeight: 1.3,
  },
  
  contactInfo: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 10, // ✅ Więcej miejsca
    lineHeight: 1.4,
    fontFamily: 'Roboto',
  },
  
  linkedinLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontFamily: 'Roboto',
  },
  
  summary: {
    fontSize: 9,
    lineHeight: 1.5, // ✅ Zwiększone
    textAlign: 'justify',
    color: '#374151',
    fontFamily: 'Roboto',
    marginTop: 2,
  },
  
  section: {
    marginBottom: 14, // ✅ Więcej miejsca między sekcjami
  },
  
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10, // ✅ Więcej miejsca po tytule
    color: '#111827',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    paddingBottom: 4, // ✅ Więcej paddingu
    textTransform: 'uppercase',
    fontFamily: 'Roboto',
    lineHeight: 1.2,
  },
  
  entry: {
    marginBottom: 12, // ✅ Więcej miejsca między wpisami
  },
  
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3, // ✅ Więcej miejsca
    alignItems: 'flex-start', // ✅ Wyrównanie do góry
    minHeight: 12, // ✅ Minimalna wysokość
  },
  
  jobTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    fontFamily: 'Roboto',
    lineHeight: 1.3,
    paddingRight: 8, // ✅ Odstęp od daty
  },
  
  company: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3, // ✅ Więcej miejsca
    fontFamily: 'Roboto',
    lineHeight: 1.3,
  },
  
  date: {
    fontSize: 8,
    color: '#9ca3af',
    minWidth: '60pt', // ✅ Szerokość dla krótkich dat
    textAlign: 'right',
    fontFamily: 'Roboto',
    lineHeight: 1.2,
  },
  
  bulletPoint: {
    fontSize: 9,
    lineHeight: 1.4, // ✅ Lepsze line-height
    marginBottom: 3, // ✅ Więcej miejsca
    textAlign: 'justify',
    marginLeft: 10,
    textIndent: -6,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  
  highlightBullet: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 3,
    textAlign: 'justify',
    marginLeft: 10,
    textIndent: -6,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Roboto',
  },
  
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  
  skillItem: {
    fontSize: 8,
    backgroundColor: "#f3f4f6",
    padding: '3pt 6pt',
    borderRadius: 2,
    marginBottom: 3,
    color: '#374151',
    fontFamily: 'Roboto',
  },
  
  // ✅ WYKSZTAŁCENIE - VERTIKÁLNY LAYOUT (ATS-friendly)
  educationEntry: {
    marginBottom: 10, // ✅ Każdy wpis pod sobą
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 8,
  },
  
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  
  degreeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Roboto',
    flex: 1,
    paddingRight: 8,
    lineHeight: 1.3,
  },
  
  schoolInfo: {
    fontSize: 9,
    color: '#6b7280',
    fontFamily: 'Roboto',
    lineHeight: 1.3,
    marginBottom: 1,
  },
  
  // ✅ USUŃ NIEUŻYWANE STYLE
  
  languageItem: {
    fontSize: 8,
    backgroundColor: "#e0f2fe",
    padding: '3pt 6pt',
    borderRadius: 2,
    marginBottom: 3,
    marginRight: 6,
    color: '#0369a1',
    fontFamily: 'Roboto',
  },
  
  footer: {
    position: "absolute",
    bottom: 15,
    left: 30,
    right: 30,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "justify",
    lineHeight: 1.3,
    paddingTop: 8, // ✅ Więcej paddingu
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    fontFamily: 'Roboto',
  },
});

const BULLET_POINT = "•";

// ✅ FUNKCJE POMOCNICZE DLA FORMATOWANIA

// ✅ KRÓTKIE DATY (ATS-friendly)
const formatShortDate = (dateString?: string | null): string => {
  if (!dateString) return 'obecnie';
  
  // Format YYYY-MM → YYYY-MM (bez zmian)
  if (/^\d{4}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Format YYYY → YYYY
  if (/^\d{4}$/.test(dateString)) return dateString;
  
  // Inne formaty → spróbuj przekonwertować
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    return dateString;
  }
};

// ✅ Tłumaczenie poziomów języków automatyczne
const translateLanguageLevel = (level: string): string => {
  const translations: Record<string, string> = {
    'Native': 'Ojczysty',
    'Professional': 'Zawodowy', 
    'Zawodowa': 'Zawodowy',
    'Basic': 'Podstawowy',
    'Intermediate': 'Średniozaawansowany',
    'Advanced': 'Zaawansowany',
    'Fluent': 'Biegły',
    'A1': 'Podstawowy (A1)', 'A2': 'Podstawowy (A2)',
    'B1': 'Średniozaawansowany (B1)', 'B2': 'Średniozaawansowany (B2)',
    'C1': 'Zaawansowany (C1)', 'C2': 'Biegły (C2)',
  };
  
  return translations[level] || level;
};

// ✅ Tłumaczenie stopni wykształcenia
const translateDegree = (degree: string): string => {
  const translations: Record<string, string> = {
    'MA': 'Magister',
    'Master': 'Magister',
    'Engineer\'s degree': 'Inżynier',
    'Bachelor': 'Licencjat',
    'Bachelor\'s degree': 'Licencjat',
    'Technik Logistyk': 'Technik Logistyk',
  };
  
  return translations[degree] || degree;
};

export function ResumePDF({ data, jobTitle, companyName }: { 
  data: z.infer<typeof resumeSchema>, 
  jobTitle?: string, 
  companyName?: string 
}) {
  
  // ✅ UŻYJ FUNKCJI POMOCNICZEJ
  const preparedData = usePreparedResumeForPdf(data, jobTitle, companyName);
  const { texts, basics, experience, education, skills, languages, certifications, interests, gdprClause } = preparedData;
  
  // ✅ POPRAWNY TYTUŁ Z POZYCJĄ (najważniejsze!)
  const displayTitle = jobTitle && companyName 
    ? `${basics.title} | Aplikuję na: ${jobTitle} w ${companyName}`
    : jobTitle 
      ? `${basics.title} | Aplikuję na: ${jobTitle}`
      : basics.title;

  // ✅ PRZETWARZANIE WYKSZTAŁCENIA z krótkimi datami (ATS-friendly)
  const processedEducation = education.map(edu => {
    // Pobierz oryginalne daty z raw data
    const originalEdu = data.education.find(orig => orig.degree === edu.degree || orig.school === edu.school);
    
    const startDate = formatShortDate(originalEdu?.startDate);
    const endDate = formatShortDate(originalEdu?.endDate);
    
    // ✅ Poprawna kolejność dat (start - end)
    const dateRange = originalEdu?.endDate 
      ? `${startDate} – ${endDate}`
      : originalEdu?.startDate 
        ? `${startDate} – obecnie`
        : 'obecnie';
    
    return {
      ...edu,
      degree: translateDegree(edu.degree),
      dateRange
    };
  });

  // ✅ PRZETWARZANIE JĘZYKÓW z automatycznym tłumaczeniem
  const processedLanguages = languages.map(lang => {
    // Parsuj format "Język: Poziom"
    const [languageName, level] = lang.split(':').map(s => s.trim());
    const translatedLevel = translateLanguageLevel(level || '');
    return `${languageName}: ${translatedLevel}`;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* ✅ HEADER Z POZYCJĄ */}
        <View style={styles.header}>
          <Text style={styles.name}>{basics.name}</Text>
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.contactInfo}>
            {basics.contactLine}
            {basics.linkedinUrl && ' | '}
            {basics.linkedinUrl && (
              <Link src={basics.linkedinUrl} style={styles.linkedinLink}>
                {basics.linkedinDisplay}
              </Link>
            )}
          </Text>
          <Text style={styles.summary}>{basics.summary}</Text>
        </View>

        {/* ✅ DOŚWIADCZENIE - KOMPAKTOWE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{texts.experience}</Text>
          {experience.slice(0, 4).map((exp, index) => ( // ✅ Ogranicz do 4 najważniejszych
            <View key={index} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.jobTitle}>{exp.title}</Text>
                <Text style={styles.date}>{exp.dateRange}</Text>
              </View>
              <Text style={styles.company}>
                {exp.company}
                {exp.location ? ` ${BULLET_POINT} ${exp.location}` : ''}
              </Text>
              
              {/* ✅ Ogranicz opisy dla oszczędności miejsca */}
              {exp.descriptions.slice(0, 3).map((desc, i) => (
                <Text key={i} style={styles.bulletPoint}>
                  {BULLET_POINT} {desc}
                </Text>
              ))}

              {/* ✅ Najważniejsze osiągnięcia */}
              {exp.highlights.slice(0, 2).map((highlight, i) => (
                <Text key={`highlight-${i}`} style={styles.highlightBullet}>
                  {BULLET_POINT} {highlight}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* ✅ WYKSZTAŁCENIE - WERTYKALNY LAYOUT (ATS-friendly) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{texts.education}</Text>
          {processedEducation.map((edu, index) => (
            <View key={index} style={styles.educationEntry}>
              <View style={styles.educationHeader}>
                <Text style={styles.degreeTitle}>{edu.degree}</Text>
                <Text style={styles.date}>{edu.dateRange}</Text>
              </View>
              <Text style={styles.schoolInfo}>
                {edu.school} • {edu.field}
              </Text>
            </View>
          ))}
        </View>

        {/* ✅ UMIEJĘTNOŚCI - KOMPAKTOWE */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{texts.skills}</Text>
            <View style={styles.skillsList}>
              {skills.slice(0, 12).map((skill, index) => ( // ✅ Top 12 skills
                <Text key={index} style={styles.skillItem}>{skill}</Text>
              ))}
            </View>
          </View>
        )}

        {/* ✅ JĘZYKI - INLINE LAYOUT */}
        {processedLanguages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{texts.languages}</Text>
            <View style={styles.skillsList}>
              {processedLanguages.map((lang, index) => (
                <Text key={index} style={styles.languageItem}>{lang}</Text>
              ))}
            </View>
          </View>
        )}
        
        {/* ✅ CERTYFIKATY - jeśli są */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{texts.certifications}</Text>
            {certifications.slice(0, 3).map((cert, index) => ( // ✅ Top 3
              <Text key={index} style={styles.bulletPoint}>
                {BULLET_POINT} {cert}
              </Text>
            ))}
          </View>
        )}

        {/* ✅ ZAINTERESOWANIA - KOMPAKTOWE */}
        {interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{texts.interests}</Text>
            <View style={styles.skillsList}>
              {interests.slice(0, 8).map((interest, index) => ( // ✅ Top 8
                <Text key={index} style={styles.skillItem}>{interest}</Text>
              ))}
            </View>
          </View>
        )}

        {/* ✅ FOOTER */}
        <Text style={styles.footer}>{gdprClause}</Text>
      </Page>
    </Document>
  );
}