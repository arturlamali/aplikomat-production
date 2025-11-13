// src/components/ATSScoreCard.tsx - ZOPTYMALIZOWANA WERSJA 2025
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Target, 
  TrendingUp, 
  Brain,
  Eye,
  Award,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ATSScore {
  overallScore: number;
  keywordMatch: number;
  titleMatch: number;
  experienceRelevance: number;
  recommendations: string[];
  missingKeywords: string[];
  wellMatchedKeywords: string[];
}

interface ATSScoreCardProps {
  score: ATSScore;
  jobTitle: string;
  companyName: string;
  className?: string;
}

export const ATSScoreCard: React.FC<ATSScoreCardProps> = ({ 
  score, 
  jobTitle, 
  companyName, 
  className = "" 
}) => {
  const [showAllMatchedKeywords, setShowAllMatchedKeywords] = useState(false);
  const [showAllMissingKeywords, setShowAllMissingKeywords] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // ✅ ZAOKRĄGLANIE WSZYSTKICH WYNIKÓW
  const overallScore = Math.round(score.overallScore);
  const keywordMatch = Math.round(score.keywordMatch);
  const titleMatch = Math.round(score.titleMatch);
  const experienceRelevance = Math.round(score.experienceRelevance);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 65) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 65) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 65) return "secondary";
    return "destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Doskonałe dopasowanie";
    if (score >= 65) return "Dobre dopasowanie";
    if (score >= 50) return "Średnie dopasowanie";
    return "Wymaga poprawy";
  };

  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-semibold">Wynik kompatybilności ATS</span>
          </div>
          <Badge variant={getScoreBadgeVariant(overallScore)} className="text-sm">
            {getScoreLabel(overallScore)}
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Dopasowanie do: <span className="font-medium">{jobTitle}</span> w <span className="font-medium">{companyName}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* ✅ GŁÓWNY WYNIK Z ZAOKRĄGLENIEM */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getScoreIcon(overallScore)}
            <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-xl text-gray-500">/100</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ogólna kompatybilność z systemami ATS
          </p>
        </div>

        {/* ✅ SZCZEGÓŁOWY PODZIAŁ WYNIKÓW Z ZAOKRĄGLENIEM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Słowa kluczowe</span>
            </div>
            <div className="text-xl font-semibold">{keywordMatch}%</div>
            <Progress value={keywordMatch} className="h-2 mt-1" />
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Dopasowanie tytułu</span>
            </div>
            <div className="text-xl font-semibold">{titleMatch}%</div>
            <Progress value={titleMatch} className="h-2 mt-1" />
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Doświadczenie</span>
            </div>
            <div className="text-xl font-semibold">{experienceRelevance}%</div>
            <Progress value={experienceRelevance} className="h-2 mt-1" />
          </div>
        </div>

        {/* ✅ DOPASOWANE SŁOWA KLUCZOWE Z ROZWIJANIEM */}
        {score.wellMatchedKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Dobrze dopasowane słowa kluczowe ({score.wellMatchedKeywords.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(showAllMatchedKeywords ? score.wellMatchedKeywords : score.wellMatchedKeywords.slice(0, 8))
                .map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                  {keyword}
                </Badge>
              ))}
              {score.wellMatchedKeywords.length > 8 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllMatchedKeywords(!showAllMatchedKeywords)}
                  className="h-6 text-xs text-gray-600 hover:text-gray-800 px-2"
                >
                  {showAllMatchedKeywords ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Ukryj
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      +{score.wellMatchedKeywords.length - 8} więcej
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ✅ BRAKUJĄCE SŁOWA KLUCZOWE Z ROZWIJANIEM */}
        {score.missingKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Brakujące ważne słowa kluczowe ({score.missingKeywords.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(showAllMissingKeywords ? score.missingKeywords : score.missingKeywords.slice(0, 6))
                .map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200">
                  {keyword}
                </Badge>
              ))}
              {score.missingKeywords.length > 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllMissingKeywords(!showAllMissingKeywords)}
                  className="h-6 text-xs text-gray-600 hover:text-gray-800 px-2"
                >
                  {showAllMissingKeywords ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Ukryj
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      +{score.missingKeywords.length - 6} więcej
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ✅ REKOMENDACJE Z ROZWIJANIEM */}
        {score.recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Rekomendacje AI ({score.recommendations.length})
              </span>
              {score.recommendations.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                  className="h-6 text-xs text-blue-600 hover:text-blue-700 px-2 ml-auto"
                >
                  {showAllRecommendations ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Ukryj wszystkie
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Pokaż wszystkie
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllRecommendations ? score.recommendations : score.recommendations.slice(0, 3))
                .map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ INFORMACJA STOPKA */}
        <div className="flex items-center gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
          <Eye className="h-4 w-4 text-gray-500" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Wynik na podstawie dopasowania słów kluczowych, trafności tytułu i zgodności doświadczenia
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// ✅ KOMPAKTOWA WERSJA Z ZAOKRĄGLENIEM
export const ATSScoreCompact: React.FC<{ score: ATSScore; className?: string }> = ({ 
  score, 
  className = "" 
}) => {
  // ✅ ZAOKRĄGLANIE WSZYSTKICH WYNIKÓW
  const overallScore = Math.round(score.overallScore);
  const keywordMatch = Math.round(score.keywordMatch);
  const titleMatch = Math.round(score.titleMatch);
  const experienceRelevance = Math.round(score.experienceRelevance);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 65) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border ${className}`}>
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Wynik ATS:</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </div>
          <div className="text-xs text-gray-500">Ogólny</div>
        </div>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        
        <div className="flex gap-3 text-xs">
          <div>
            <span className="text-gray-600">Słowa:</span>
            <span className="ml-1 font-medium">{keywordMatch}%</span>
          </div>
          <div>
            <span className="text-gray-600">Tytuł:</span>
            <span className="ml-1 font-medium">{titleMatch}%</span>
          </div>
          <div>
            <span className="text-gray-600">Doświadczenie:</span>
            <span className="ml-1 font-medium">{experienceRelevance}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ SZYBKIE WSKAZÓWKI COMPONENT
export const ATSQuickTips: React.FC = () => (
  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-sm">
        <Lightbulb className="h-4 w-4 text-purple-600" />
        Szybkie wskazówki optymalizacji ATS
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
          <p>Używaj dokładnych słów kluczowych z opisu stanowiska</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
          <p>Dodawaj skróty i pełne nazwy (SEO, Search Engine Optimization)</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
          <p>Umieszczaj ważne słowa kluczowe w pierwszej trzeciej sekcji</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
          <p>Dąż do wyniku 75%+ dla najlepszych rezultatów</p>
        </div>
      </div>
    </CardContent>
  </Card>
);