//src/components/LoadingTips.tsx
import React, { useEffect, useState } from "react";

const tips = [
  "Najpierw wprowadź dane kontaktowe i kliknij 'Zapisz dane kontaktowe', aby rozpocząć generowanie CV.",
  "Czy wiesz, że dobrze dopasowane CV zwiększa szansę na zaproszenie na rozmowę o 60%?",
  "Rekruterzy poświęcają średnio tylko 7 sekund na pierwsze przejrzenie CV.",
  "Ponad 75% CV jest odrzucanych przez systemy ATS zanim trafi do rekrutera.",
  "Umieszczenie słów kluczowych z oferty pracy zwiększa szanse na przejście przez systemy ATS.",
  "CV bez błędów ortograficznych ma o 61% większe szanse na zaproszenie na rozmowę.",
  "Najczęściej czytane sekcje CV to nagłówek, podsumowanie i ostatnie doświadczenie zawodowe.",
  "Badania pokazują, że CV z mierzalnymi osiągnięciami zwiększają szanse na zaproszenie o 40%.",
  "Największą popularnością cieszą się CV na 1-2 strony, niezależnie od długości doświadczenia.",
  "Niestandardowe CV jest szczególnie skuteczne w branżach kreatywnych i marketingowych.",
  "Ponad 65% rekruterów zwraca uwagę na umiejętności miękkie wymienione w CV.",
];

// Dodajemy dwa nowe tipy na początku z instrukcjami dla użytkownika
const processTips = [
  "Generowanie CV rozpocznie się po wprowadzeniu i zapisaniu danych kontaktowych.",
  "Wypełnij formularz z adresem e-mail i numerem telefonu, aby kontynuować.",
  "Twoje dane kontaktowe są wymagane, aby wygenerować kompletne CV.",
];

export function LoadingTips() {
  const [tipIndex, setTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [startTime] = useState(Date.now());
  const [allTips] = useState([...processTips, ...tips]); // Łączymy instrukcje i zwykłe porady

  useEffect(() => {
    // Pokazuj ciekawostki tylko jeśli minęły 3 sekundy
    const checkTimeoutId = setTimeout(() => {
      setShowTip(true);
    }, 3000);

    // Zmieniaj ciekawostkę co 5 sekund
    const intervalId = setInterval(() => {
      if (showTip) {
        setTipIndex((prev) => (prev + 1) % allTips.length);
      }
    }, 5000);

    return () => {
      clearTimeout(checkTimeoutId);
      clearInterval(intervalId);
    };
  }, [showTip, allTips.length]);

  if (!showTip) return null;

  return (
    <div className="mt-4 text-center animate-fade-in">
      <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-200">
        <p className="italic">{allTips[tipIndex]}</p>
      </div>
    </div>
  );
}