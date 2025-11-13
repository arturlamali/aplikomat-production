"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BorderBeam } from "../landingPageComponents/BorderBeam";
import { Particles } from "../landingPageComponents/Particles";
import { api } from "~/trpc/react";

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveEmail = api.maintenance.saveEmail.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setEmail("");
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Proszę podać adres e-mail");
      return;
    }
    saveEmail.mutate({ email });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
      {/* Background effects */}
      <Particles className="absolute inset-0" />
      <div className="absolute inset-0 bg-linear-to-b from-gray-950/0 via-gray-950/50 to-gray-950"></div>

      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <BorderBeam />

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center gap-8 text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            <span className="block">🚧 PRZERWA TECHNICZNA 🚧</span>
            <div className="flex items-center justify-center gap-2">
              <span className="block bg-linear-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                Wow! Ale Was dużo!
              </span>
              🤯
            </div>
          </h1>

          <p className="max-w-2xl text-lg text-gray-300">
            Zainteresowanie Aplikomatem przerosło nasze najśmielsze oczekiwania!
            🤩 Aby zapewnić wszystkim stabilność, będziemy stopniowo wpuszczać
            kolejnych użytkowników. Dziękujemy za cierpliwość! 🙏
          </p>

          {/* Email subscription form - MOVED TO TOP */}
          <div className="mt-6 w-full max-w-md rounded-lg border border-gray-800 bg-gray-900/50 p-6 shadow-lg backdrop-blur-xs">
            <h3 className="mb-4 text-xl font-medium text-white">
              Chcesz wejść szybciej? 🚀
            </h3>
            <p className="mb-6 text-sm text-gray-300">
              Zostaw swój e-mail, a powiadomimy Cię priorytetowo, gdy tylko
              zwolni się dla Ciebie miejsce! Pierwsi z listy wchodzą najszybciej
              😉
            </p>

            {isSubmitted ? (
              <div className="rounded-md bg-green-900/30 p-4 text-sm text-green-400">
                <p className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Super! 👍 Odeślemy Ci powiadomienie, jak tylko będzie można
                  wejść.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Adres e-mail
                  </label>
                  <div className="relative mt-1 rounded-md shadow-xs">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-md border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Twój adres e-mail"
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-400">
                      {error === "Please enter your email address" ||
                      error === "Proszę podać adres e-mail"
                        ? "Ups! 😅 Prosimy o podanie poprawnego adresu e-mail."
                        : error}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saveEmail.isPending}
                  className="flex w-full items-center justify-center rounded-md bg-linear-to-r from-blue-500 to-violet-600 px-4 py-3 text-sm font-medium text-white hover:from-blue-600 hover:to-violet-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70"
                >
                  {saveEmail.isPending ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Zapisuję... ⏳
                    </>
                  ) : (
                    "Powiadom mnie priorytetowo!"
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Loom video */}
          <div className="mt-10 w-full max-w-3xl overflow-hidden rounded-lg shadow-2xl">
            <div className="relative pb-[62.5%]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.loom.com/embed/00151f8ff9c5402e9a59792d37e607ba?sid=0056648e-a1bb-4393-a900-c8fe9681b362"
                title="Aplikomat - jak to działa?"
                frameBorder="0"
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="mt-8 max-w-2xl">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Kilka słów od Artura o Aplikomacie 👨‍💻
            </h2>
            <p className="text-md text-gray-300">
              Na załączonym filmie pokazujemy działanie Aplikomatu i kierunki
              jego rozwoju. Obecnie skalujemy naszą infrastrukturę, aby zapewnić
              błyskawiczny czas reakcji i obsługę rosnącej liczby użytkowników,
              jednocześnie stale podnosząc jakość. 💪
            </p>
          </div>

          <div className="mt-10 flex max-w-2xl flex-col items-center rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="mb-4 text-xl font-medium text-white">
              Rozwój i inwestycje 🚀💼
            </h3>
            <p className="mb-4 text-gray-300">
              Pracujemy nad ulepszeniem Aplikomatu, żeby działał szybciej i
              sprawniej dla coraz większej liczby osób. Jednocześnie dodajemy
              nowe, praktyczne funkcje, które sprawią, że korzystanie z naszego
              narzędzia będzie jeszcze przyjemniejsze i bardziej efektywne.
            </p>
            <div className="mt-1 text-center">
              <p className="mb-4 text-gray-300">
                Szukamy inwestorów oraz partnerów B2B, którzy chcieliby zostać
                jednymi z pierwszych klientów Aplikomatu B2B. Jeśli jesteś
                zainteresowany współpracą lub inwestycją w naszą platformę,
                skontaktuj się z Arturem.
              </p>
              <a
                href="https://www.linkedin.com/in/arturlamali/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-linear-to-r from-blue-500 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-violet-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Porozmawiaj z Arturem o możliwościach inwestycyjnych
              </a>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
              <span className="text-sm text-gray-400">Prace w toku</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
