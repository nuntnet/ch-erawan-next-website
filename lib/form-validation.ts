/** Shared client-side form validation helpers. */

/** Strip non-digits and cap at 10 chars — for phone inputs. */
export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

/** Thai mobile/landline: 9–10 digits, numbers only. */
export function isValidPhone(value: string): boolean {
  return /^\d{9,10}$/.test(value.trim());
}

/** Basic email format: x@y.z */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const PHONE_ERROR = "กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก (ตัวเลขเท่านั้น)";
export const EMAIL_ERROR = "กรุณากรอกอีเมลให้ถูกต้อง (เช่น name@example.com)";
