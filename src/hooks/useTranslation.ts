"use client";

import { useMemo } from "react";
import {
  t as serverT,
  setTranslationDictionary,
  getTranslationDictionary,
} from "@/lib/translate";

export { setTranslationDictionary, getTranslationDictionary };

type TranslationKeys = string;

export function t(key: TranslationKeys, values?: Record<string, any>): string {
  return serverT(key, values);
}

export function useTranslation() {
  const dictionary = useMemo(() => getTranslationDictionary(), []);

  const translate = useMemo(
    () => (key: TranslationKeys, values?: Record<string, any>) => serverT(key, values),
    [dictionary]
  );

  return {
    t: translate,
    dictionary,
  };
}