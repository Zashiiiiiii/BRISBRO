import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mask a phone number for privacy: "09171234567" → "09••-•••-4567"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  const first = phone.slice(0, 2);
  const last = phone.slice(-4);
  return `${first}••-•••-${last}`;
}
