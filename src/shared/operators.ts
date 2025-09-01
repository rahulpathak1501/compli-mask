import type { MaskLevel } from "./types";

function repeat(ch: string, n: number) {
  return ch.repeat(Math.max(0, n));
}

export function maskAll(s: string): string {
  return repeat("*", s.length || 1);
}

export function partialLastN(s: string, n: number): string {
  if (!s) return s;
  const visible = s.slice(-n);
  const masked = repeat("*", Math.max(0, s.length - n));
  return masked + visible;
}

export function emailMask(
  s: string,
  localPartStrategy: (lp: string) => string = () => "***",
  domainPreserve = true
) {
  if (!s.includes("@")) return maskAll(s);
  const [local, domain] = s.split("@", 2);
  const lmasked = localPartStrategy(local);
  return domainPreserve ? `${lmasked}@${domain}` : `${lmasked}@${domain}`;
}

export function phoneMask(s: string) {
  const digits = s.replace(/\D/g, "");
  const masked = partialLastN(digits, 4);
  if (/^\d+$/.test(s)) return masked;
  return s.replace(/\d(?=.*\d{4})/g, "*");
}

export function ssnMask(s: string) {
  const digits = s.replace(/\D/g, "");
  if (digits.length !== 9) return partialLastN(s, 4);
  return `***-**-${digits.slice(-4)}`;
}

export function applyMaskByLevel(level: MaskLevel, value: string) {
  switch (level) {
    case "FULL":
      return value;
    case "NONE":
      return value;
    case "MASK_ALL":
      return maskAll(value);
    case "PARTIAL_LAST4":
      return partialLastN(value, 4);
    case "PARTIAL_LAST3":
      return partialLastN(value, 3);
    default:
      return maskAll(value);
  }
}
