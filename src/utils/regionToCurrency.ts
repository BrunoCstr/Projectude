const southAmerica = ["BR", "AR", "CL", "CO", "PE", "VE", "UY", "PY", "BO", "EC", "GY", "SR", "GF"];
const europe = ["PT", "ES", "FR", "DE", "IT", "NL", "BE", "FI", "SE", "NO", "DK", "PL", "IE", "GR", "CZ", "AT", "CH", "HU", "RO", "BG", "SK", "SI"];

export function getCurrencyByCountryCode(code: string): "BRL" | "EUR" | "USD" {
  if (southAmerica.includes(code)) return "BRL";
  if (europe.includes(code)) return "EUR";
  if (code === "US") return "USD";
  return "USD"; // fallback global
}
