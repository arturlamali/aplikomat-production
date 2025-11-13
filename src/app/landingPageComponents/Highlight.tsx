import React from "react";

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-indigo-600/20 p-1 py-0.5 font-bold text-indigo-600">
      {children}
    </span>
  );
}
