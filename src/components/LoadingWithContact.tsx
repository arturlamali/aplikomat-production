//src/components/LoadingWithContact.tsx
import React from "react";
import { LoadingTips } from "./LoadingTips";
import { ContactForm, type ContactFormData } from "./ContactForm";

interface LoadingWithContactProps {
  onContactDataSubmit: (data: ContactFormData) => void;
  defaultContactData?: Partial<ContactFormData>;
}

export function LoadingWithContact({ 
  onContactDataSubmit, 
  defaultContactData 
}: LoadingWithContactProps) {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <LoadingTips />
      </div>
      <div className="order-1 md:order-2">
        <ContactForm 
          onSubmit={onContactDataSubmit} 
          defaultValues={defaultContactData} 
        />
      </div>
    </div>
  );
}