// hooks/useUserCurrency.ts
"use client";

import { useEffect, useState } from "react";
import { getCurrencyByCountryCode } from "@/utils/regionToCurrency";

export function useUserCurrency(defaultCurrency: "USD" | "EUR" | "BRL" = "USD") {
  const [currency, setCurrency] = useState<"USD" | "EUR" | "BRL">(defaultCurrency);

  useEffect(() => {
    async function detectCurrency() {
      try {
        const res = await fetch("https://ipapi.co/json");
        const data = await res.json();
        const countryCode = data?.country?.toUpperCase();

        if (countryCode) {
          const resolved = getCurrencyByCountryCode(countryCode);
          setCurrency(resolved);
        }
      } catch (error) {
        console.error("Erro ao detectar país:", error);
        setCurrency(defaultCurrency); // fallback
      }
    }

    detectCurrency();
  }, [defaultCurrency]);

  return currency;
}
