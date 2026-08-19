// An order is identified by its code and nothing else: the buyer never signs
// in, so the code is what they quote when the producer writes back.
const ORDER_CODE = /^SUS-[0-9A-F]{6}$/;

export function isOrderCode(value: string): boolean {
  return ORDER_CODE.test(value);
}

// Codes are read off a screen and typed into an email, so they are matched
// case-insensitively and without the surrounding whitespace a copy-paste picks
// up.
export function normalizeOrderCode(value: string): string {
  return value.trim().toUpperCase();
}
