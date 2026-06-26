"use client";

import { useEffect } from "react";
import { setTranslationDictionary } from "@/lib/translate";
// Import the default locale (vi) for client-side initialization
import vi from "@/messages/vi.json";

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Ensure client has the translation dictionary initialized
    setTranslationDictionary(vi as any);
  }, []);

  return <>{children}</>;
}
