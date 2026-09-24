function russianPhone(national: string): string | null {
  return national.length === 10 && !national.startsWith('0') ? `7${national}` : null;
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length === 11 && digits.startsWith('80')) return `375${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith('0')) return `375${digits.slice(1)}`;

  if (digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7'))) {
    return russianPhone(digits.slice(1));
  }
  if (digits.length === 10) return russianPhone(digits);

  if (digits.length === 12 && digits.startsWith('375')) return digits;

  return null;
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.startsWith('375') && d.length === 12) {
    return `+375 ${d.slice(3, 5)} ${d.slice(5, 8)}-${d.slice(8, 10)}-${d.slice(10)}`;
  }
  if (d.startsWith('7') && d.length === 11) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
  }
  return `+${d}`;
}

export function phoneChatTitle(phoneNumber?: string): string | null {
  const digits = phoneNumber ? normalizePhone(phoneNumber) : null;
  return digits ? formatPhone(digits) : null;
}
