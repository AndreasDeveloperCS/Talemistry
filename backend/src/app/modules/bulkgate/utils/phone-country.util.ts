const COUNTRY_BY_CALLING_CODE: Record<string, string> = {
  '380': 'UA',
  '48': 'PL',
  '49': 'DE',
  '420': 'CZ',
  '421': 'SK',
  // extend when needed
};

export function getCountryFromPhone(phone: string): string {
  if (!phone.startsWith('+')) {
    return 'UA'; 
  }

  const digits = phone.slice(1);

  const possibleCodes = Object.keys(COUNTRY_BY_CALLING_CODE)
    .sort((a, b) => b.length - a.length);

  for (const code of possibleCodes) {
    if (digits.startsWith(code)) {
      return COUNTRY_BY_CALLING_CODE[code];
    }
  }

  return 'UA'; 
}