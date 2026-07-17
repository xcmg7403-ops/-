// Currency helper functions for AssetManager IT Solutions
export const getCurrencySymbol = (currencyStr: string) => {
  if (!currencyStr) return '฿';
  if (currencyStr.includes('฿') || currencyStr.toUpperCase().includes('THB')) return '฿';
  if (currencyStr.includes('$') || currencyStr.toUpperCase().includes('USD')) return '$';
  if (currencyStr.includes('€') || currencyStr.toUpperCase().includes('EUR')) return '€';
  return '฿';
};

export const formatCurrency = (amount: number, currencyStr: string) => {
  const symbol = getCurrencySymbol(currencyStr);
  return `${symbol}${amount.toLocaleString()}`;
};
