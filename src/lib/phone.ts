/**
 * Phone numbers, kept deliberately forgiving.
 *
 * People will type "07789 913706", "+44 7789 913706" and "07789913706" and all
 * three mean the same thing. Rather than police the format, store what they
 * typed and work out a dialling version for the links.
 */

/** Strip everything a human might add, for tel: and wa.me links. */
export function toDiallable(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * WhatsApp needs a full international number with no plus and no spaces.
 * UK mobiles typed as 07… become 447….
 */
export function toWhatsAppNumber(phone: string): string | null {
  const cleaned = toDiallable(phone);

  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("00")) return cleaned.slice(2);
  if (cleaned.startsWith("0")) return `44${cleaned.slice(1)}`;
  if (cleaned.length >= 10) return cleaned;

  return null;
}

/** Tidy up what was typed before saving: collapse repeated spaces. */
export function tidyPhone(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

/** Basic sanity check — enough digits to be a phone number at all. */
export function looksLikeAPhoneNumber(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
