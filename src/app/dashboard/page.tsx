// src/app/dashboard/page.tsx - ENHANCED DASHBOARD 2025
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "~/components/AuthProvider/AuthProvider";
import PrivatePage from "~/components/AuthProvider/PrivatePage/PrivatePage";
import { ConnectedLinkedinAccount } from "~/components/ConnectedLinkedinAccount";
import { api, type RouterOutputs } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  CloudUpload, 
  RefreshCw, 
  CheckCircle, 
  Brain,
  Target,
  TrendingUp,
  Award,
  BarChart3,
  Zap,
  Star,
  TrendingDown,
  Users,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  Calendar,
  Globe,
  ChevronRight,
  Briefcase,
  LinkedinIcon,
  Search,
  BookOpen,
  Activity,
  Clock,
  Filter,
  SortDesc
} from "lucide-react";
import { toast } from "sonner";

type GeneratedCV = RouterOutputs["jobs"]["getAllGeneratedCVs"][number];

// ✅ CLEAN STATS CARDS - Natural Design
const DashboardStatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: { value: string; isPositive: boolean };
  onClick?: () => void;
}> = ({ title, value, subtitle, icon: Icon, color, bgColor, trend, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className={`group cursor-pointer ${onClick ? 'hover:shadow-sm' : ''}`}
      onClick={onClick}
    >
      <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-md ${bgColor}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                {trend && (
                  <div className={`flex items-center text-xs px-2 py-1 rounded-md ${
                    trend.isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {trend.isPositive ? '↗' : '↘'} {trend.value}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ✅ CLEAN QUICK ACTIONS
const QuickActionsSection: React.FC = () => {
  const quickActions = [
    {
      title: "Oferty pracy",
      description: "Znajdź oferty z RocketJobs.pl i JustJoin.it",
      icon: Search,
      href: "/dashboard/jobs",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      title: "Generuj CV z linku",
      description: "Masz już ofertę? Wklej link i stwórz dopasowane CV",
      icon: Sparkles,
      href: "/dashboard/cv-from-link",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      title: "Przeglądaj CV",
      description: "Zobacz wszystkie wygenerowane CV",
      icon: FileText,
      href: "/dashboard/cv",
      color: "text-green-600", 
      bgColor: "bg-green-100 dark:bg-green-900/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="group hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {action.description}
                  </p>
                  <Button 
                    asChild 
                    size="sm"
                    variant="outline"
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <a href={action.href}>
                      Przejdź <ArrowRight className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// ✅ CLEAN RECENT CV PREVIEW
const RecentCVSection: React.FC<{ cvs: GeneratedCV[] }> = ({ cvs }) => {
  const recentCVs = cvs.slice(0, 3); // Show only 3 most recent

  if (recentCVs.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-8 w-8 text-gray-400" />
            <Brain className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Brak CV do wyświetlenia</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
            Rozpocznij tworzenie CV dopasowanych do ofert pracy.
          </p>
          <Button asChild variant="outline">
            <a href="/dashboard/cv-from-link">
              <Sparkles className="h-4 w-4 mr-2" />
              Stwórz pierwsze CV
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {recentCVs.map((cv, index) => {
        const atsScore = cv.data?.atsAnalysis?.score?.overallScore || 0;
        const scoreColor = atsScore >= 80 ? "text-green-600" : atsScore >= 65 ? "text-yellow-600" : "text-red-600";
        const scoreBg = atsScore >= 80 ? "bg-green-100 dark:bg-green-900/30" : atsScore >= 65 ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-red-100 dark:bg-red-900/30";

        return (
          <motion.div
            key={cv.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {cv.jobTitle}
                      </h4>
                      {atsScore > 0 && (
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${scoreBg} ${scoreColor}`}>
                          ATS: {Math.round(atsScore)}%
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{cv.companyName}</span>
                      <span>•</span>
                      <span>{new Date(cv.createdAt).toLocaleDateString("pl-PL")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/cv#${cv.id}`}>
                        <Eye className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      
      {cvs.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button variant="outline" asChild className="w-full mt-2">
            <a href="/dashboard/cv">
              Zobacz wszystkie CV ({cvs.length}) <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

// ✅ CLEAN ATS INSIGHTS
const ATSInsightsSection: React.FC<{ cvs: GeneratedCV[] }> = ({ cvs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const insights = [
    "Używaj dokładnych słów kluczowych z opisu stanowiska",
    "Umieszczaj ważne słowa kluczowe w pierwszej trzeciej CV",
    "Dodawaj skróty i pełne nazwy (np. SEO, Search Engine Optimization)",
    "Dąż do wyniku 75%+ dla najlepszych rezultatów",
    "Dostosuj tytuł zawodowy do nazwy stanowiska w ofercie",
    "Używaj aktywnych czasowników w opisie doświadczenia"
  ];

  const averageScore = cvs.length > 0 ? 
    cvs.reduce((sum, cv) => sum + (cv.data?.atsAnalysis?.score?.overallScore || 0), 0) / cvs.length : 0;

  return (
    <Card className="border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-purple-200 dark:bg-purple-800">
              <Brain className="h-5 w-5 text-purple-700 dark:text-purple-300" />
            </div>
            <div>
              <CardTitle className="text-lg text-purple-800 dark:text-purple-200">
                Wskazówki ATS
              </CardTitle>
              {averageScore > 0 && (
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  Twój średni wynik: <strong>{Math.round(averageScore)}%</strong>
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800"
          >
            {isExpanded ? 'Ukryj' : 'Pokaż wszystkie'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {insights.slice(0, isExpanded ? insights.length : 4).map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
              <p className="text-sm text-purple-700 dark:text-purple-300">{tip}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ✅ CLEAN LINKEDIN HELPER WITH BUTTON
const LinkedInHelperSection: React.FC = () => {
  const [showHelper, setShowHelper] = useState(false);

  return (
    <Card className="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-200 dark:bg-blue-800">
              <LinkedinIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Potrzebujesz linku do LinkedIn?
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Pomożemy Ci znaleźć link do Twojego profilu
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowHelper(!showHelper)}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            {showHelper ? 'Ukryj' : 'Pokaż jak'}
          </Button>
        </div>
        
        <AnimatePresence>
          {showHelper && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700"
            >
              <div className="space-y-3">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-2">Jak znaleźć link do swojego profilu LinkedIn:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Przejdź do LinkedIn.com</li>
                    <li>Zaloguj się na swoje konto</li>
                    <li>Kliknij na swoje zdjęcie profilowe</li>
                    <li>Skopiuj URL z paska adresu przeglądarki</li>
                  </ol>
                </div>
                
                <a
                  href="https://linkedin.com/in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-blue-300 dark:border-blue-700 bg-[#0077b5]/20 px-3 py-2 text-sm text-blue-800 dark:text-blue-200 transition-colors hover:bg-[#0077b5]/30"
                >
                  <LinkedinIcon size={16} />
                  Pobierz link do swojego profilu
                </a>
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  Kliknij, aby przejść do swojego profilu LinkedIn i skopiować adres URL
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const { user } = useUser();
  const [contextualGreeting, setContextualGreeting] = useState<{
    greeting: string;
    subtitle: string;
    emoji: string;
  }>({ greeting: 'Witaj', subtitle: 'Zarządzaj swoimi CV i zwiększaj szanse na wymarzoną pracę', emoji: '👋' });
  
  const {
    data: generatedCVs = [],
    isLoading: isLoadingCVs,
    refetch: refetchCVs,
  } = api.jobs.getAllGeneratedCVs.useQuery();

  const { data: profileData } = api.linkedinScraper.getLinkedinProfileByCurrentUser.useQuery();

  // Intelligent contextual greeting based on time, location, and user activity
  useEffect(() => {
    const updateContextualGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const isWeekend = day === 0 || day === 6;
      const isMonday = day === 1;
      const isFriday = day === 5;
      
      // User activity context
      const hasRecentCV = generatedCVs.some(cv => {
        const cvDate = new Date(cv.createdAt);
        const daysSinceCreation = (now.getTime() - cvDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 1;
      });
      
      const totalCVs = generatedCVs.length;
      const hasProfile = !!profileData?.profileData;
      
      let greeting, subtitle, emoji;
      
      // Time-based greetings with Polish context
      if (hour >= 5 && hour < 12) {
        if (isMonday && hasRecentCV) {
          greeting = "Produktywny poniedziałek";
          subtitle = "Widzę, że już dziś pracujesz nad swoją karierą! 💪";
          emoji = "🚀";
        } else if (isMonday) {
          greeting = "Dobry początek tygodnia";
          subtitle = "Idealny moment na nowe wyzwania zawodowe";
          emoji = "☀️";
        } else {
          greeting = "Dzień dobry";
          subtitle = hour < 8 ? "Wcześnie dziś zaczynasz - świetnie!" : "Miłego dnia pełnego możliwości";
          emoji = "🌅";
        }
      } else if (hour >= 12 && hour < 17) {
        if (hasRecentCV) {
          greeting = "Dobre popołudnie";
          subtitle = "Widzę postępy w Twoich aplikacjach - tak trzymaj!";
          emoji = "📈";
        } else {
          greeting = "Dobre popołudnie";
          subtitle = isFriday ? "Jeszcze jeden sprint przed weekendem!" : "Idealny moment na kolejne CV";
          emoji = "☀️";
        }
      } else if (hour >= 17 && hour < 22) {
        if (isWeekend) {
          greeting = "Dobry wieczór";
          subtitle = "Weekend to świetny czas na planowanie kariery";
          emoji = "🌆";
        } else if (isFriday) {
          greeting = "Piątkowy wieczór";
          subtitle = "Zakończ tydzień mocnym akcentem - nowym CV!";
          emoji = "🎉";
        } else {
          greeting = "Dobry wieczór";
          subtitle = "Po pracy czas na pracę nad karierą";
          emoji = "🌇";
        }
      } else {
        greeting = "Dobrej nocy";
        subtitle = "Jutro będzie nowy dzień pełen możliwości";
        emoji = "🌙";
      }
      
      // Activity-based adjustments
      if (!hasProfile) {
        subtitle = "Zacznij od połączenia profilu LinkedIn";
      } else if (totalCVs === 0) {
        subtitle = "Czas na pierwsze CV dopasowane do oferty!";
      } else if (totalCVs >= 10) {
        subtitle = `Już ${totalCVs} CV! Jesteś na dobrej drodze`;
        emoji = "🏆";
      }
      
      setContextualGreeting({ greeting, subtitle, emoji });
    };

    updateContextualGreeting();
    
    // Update greeting every 30 minutes
    const interval = setInterval(updateContextualGreeting, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generatedCVs, profileData]);

  // Extract user name properly (like in app-sidebar)
  const getUserDisplayName = () => {
    const name = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Użytkowniku';
    
    // If it's a full name, just take the first name
    if (name.includes(' ')) {
      return name.split(' ')[0];
    }
    
    return name;
  };

  // Calculate stats
  const totalCVs = generatedCVs.length;
  const averageScore = totalCVs > 0 ? 
    generatedCVs.reduce((sum, cv) => sum + (cv.data?.atsAnalysis?.score?.overallScore || 0), 0) / totalCVs : 0;
  const excellentCVs = generatedCVs.filter(cv => (cv.data?.atsAnalysis?.score?.overallScore || 0) >= 80).length;
  const thisWeekCVs = generatedCVs.filter(cv => {
    const cvDate = new Date(cv.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return cvDate > weekAgo;
  }).length;

  return (
    <PrivatePage>
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -z-10" />

        <div className="relative z-10 container mx-auto py-8 px-4 space-y-8">
          {/* ✅ INTELLIGENT HERO HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {contextualGreeting.greeting}, {getUserDisplayName()}! {contextualGreeting.emoji}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {contextualGreeting.subtitle}
            </p>
          </motion.div>

          {/* ✅ STATS OVERVIEW */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <DashboardStatsCard
              title="Łącznie CV"
              value={totalCVs}
              subtitle="wygenerowanych CV"
              icon={FileText}
              color="text-blue-600"
              bgColor="bg-blue-50 dark:bg-blue-900/20"
              trend={thisWeekCVs > 0 ? { value: `+${thisWeekCVs} w tym tygodniu`, isPositive: true } : undefined}
              onClick={() => window.location.href = '/dashboard/cv'}
            />
            <DashboardStatsCard
              title="Średni wynik ATS"
              value={`${Math.round(averageScore)}%`}
              subtitle="przejście przez systemy ATS"
              icon={BarChart3}
              color="text-green-600"
              bgColor="bg-green-50 dark:bg-green-900/20"
            />
            <DashboardStatsCard
              title="Doskonałe CV"
              value={excellentCVs}
              subtitle="z wynikiem 80%+"
              icon={Star}
              color="text-purple-600"
              bgColor="bg-purple-50 dark:bg-purple-900/20"
            />
            <DashboardStatsCard
              title="Aktywność"
              value={thisWeekCVs}
              subtitle="w tym tygodniu"
              icon={Activity}
              color="text-orange-600"
              bgColor="bg-orange-50 dark:bg-orange-900/20"
            />
          </motion.div>

          {/* ✅ LINKEDIN ACCOUNT STATUS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ConnectedLinkedinAccount />
          </motion.div>

          {/* ✅ QUICK ACTIONS */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Szybkie akcje
              </h2>
            </div>
            <QuickActionsSection />
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ✅ RECENT CV SECTION */}
            <motion.section
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Ostatnie CV
                  </h2>
                </div>
                {totalCVs > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <a href="/dashboard/cv">
                      Zobacz wszystkie
                    </a>
                  </Button>
                )}
              </div>
              {isLoadingCVs ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-16 bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
              ) : (
                <RecentCVSection cvs={generatedCVs} />
              )}
            </motion.section>

            {/* ✅ SIDEBAR CONTENT */}
            <motion.aside
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* ATS Insights */}
              <ATSInsightsSection cvs={generatedCVs} />
              
              {/* LinkedIn Helper */}
              {!profileData?.profileData && (
                <LinkedInHelperSection />
              )}
              
              {/* Additional Quick Tip */}
              <Card className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-green-200 dark:bg-green-800">
                      <BookOpen className="h-5 w-5 text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                        Wskazówka dnia
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Dostosowuj CV do każdej oferty pracy osobno. Aplikomat automatycznie analizuje wymagania i optymalizuje Twoje CV.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.aside>
          </div>
        </div>
      </div>
    </PrivatePage>
  );
}