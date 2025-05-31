export function parseInvestment(value: string | number): number {
  if (typeof value === 'number') return value;

  const clean = value.replace(/[^0-9.,]/g, '');

  // Caso contenha vírgula e ponto (ex: 1.900,00 ou 1,900.00)
  if (clean.includes(',') && clean.includes('.')) {
    if (clean.indexOf(',') > clean.indexOf('.')) {
      // 1.900,00 -> remove ponto (milhar) e troca vírgula (decimal)
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    } else {
      // 1,900.00 -> remove vírgula (milhar), ponto já é decimal
      return parseFloat(clean.replace(/,/g, ''));
    }
  }

  // Só vírgula -> assume que é decimal brasileiro
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'));
  }

  // Só número ou número com ponto decimal
  return parseFloat(clean);
}
