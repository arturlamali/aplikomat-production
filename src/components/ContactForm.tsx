//src/components/ContactForm.tsx
import React, { useState, useEffect } from "react";

export interface ContactFormData {
  email: string;
  phone: string;
  location: string;
}

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  defaultValues?: Partial<ContactFormData>;
  isSubmitting?: boolean; // Nowy prop wskazujący, czy trwa generowanie CV
}

export function ContactForm({ onSubmit, defaultValues, isSubmitting = false }: ContactFormProps) {
  const [email, setEmail] = useState(defaultValues?.email || "");
  const [phone, setPhone] = useState(defaultValues?.phone || "");
  const [location, setLocation] = useState(defaultValues?.location || "");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    // Reset błędów przy zmianie wartości
    if (email) setErrors(prev => ({ ...prev, email: undefined }));
    if (phone) setErrors(prev => ({ ...prev, phone: undefined }));
  }, [email, phone]);

  // Aktualizuj stan po zmianie defaultValues
  useEffect(() => {
    if (defaultValues?.email) setEmail(defaultValues.email);
    if (defaultValues?.phone) setPhone(defaultValues.phone);
    if (defaultValues?.location) setLocation(defaultValues.location);
  }, [defaultValues]);

  const validateForm = (): boolean => {
    const newErrors: {email?: string; phone?: string} = {};
    let isValid = true;

    if (!email || !email.trim()) {
      newErrors.email = "Email jest wymagany";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Podaj poprawny adres email";
      isValid = false;
    }

    if (!phone || !phone.trim()) {
      newErrors.phone = "Numer telefonu jest wymagany";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const trimmedData = {
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim()
      };

      onSubmit(trimmedData);
      setSubmitted(true);
    }
  };

  // Ustal tekst przycisku w zależności od stanu
  const getButtonText = () => {
    if (isSubmitting) return "Generowanie CV...";
    if (submitted) return "Dane zapisane ✓";
    return "Zapisz dane kontaktowe";
  };

  return (
    <div className="w-full">
      <h3 className="mb-3 text-lg font-semibold text-white">
        Dane kontaktowe do CV
      </h3>
      <p className="mb-4 text-sm text-gray-300">
        Podaj swoje dane kontaktowe, które zostaną umieszczone w Twoim CV.
        {!submitted && !isSubmitting && (
          <span className="mt-1 block text-xs text-indigo-300">
            Po zapisaniu danych rozpocznie się generowanie Twojego CV.
          </span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Adres e-mail <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-2xl border ${
              errors.email ? 'border-red-500/50' : 'border-white/10'
            } bg-black/20 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-xs transition-all focus:outline-hidden focus:ring-2 ${
              errors.email ? 'focus:ring-red-500/50' : 'focus:ring-[#9c40ff]/50'
            }`}
            placeholder="jan.kowalski@example.com"
            disabled={submitted || isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Numer telefonu <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full rounded-2xl border ${
              errors.phone ? 'border-red-500/50' : 'border-white/10'
            } bg-black/20 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-xs transition-all focus:outline-hidden focus:ring-2 ${
              errors.phone ? 'focus:ring-red-500/50' : 'focus:ring-[#9c40ff]/50'
            }`}
            placeholder="123 456 789"
            disabled={submitted || isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Miasto
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-xs transition-all focus:outline-hidden focus:ring-2 focus:ring-[#9c40ff]/50"
            placeholder="Warszawa"
            disabled={submitted || isSubmitting}
          />
        </div>

        <button
          type="submit"
          className="relative w-full rounded-lg px-4 py-3 font-medium bg-linear-to-r from-[#9c40ff] to-[#ffaa40] text-white hover:from-[#ffaa40] hover:to-[#9c40ff] transition-colors disabled:opacity-50 flex items-center justify-center"
          disabled={submitted || isSubmitting}
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {getButtonText()}
        </button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-black/20 px-2 text-xs text-gray-400 backdrop-blur-xs">lub</span>
          </div>
        </div>
        
        <button
          type="button"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-medium text-gray-400 backdrop-blur-xs transition-all hover:bg-white/10 hover:text-white cursor-not-allowed"
          disabled={true}
          title="Funkcja dostępna wkrótce"
        >
          Zarejestruj się
        </button>
      </form>
    </div>
  );
}