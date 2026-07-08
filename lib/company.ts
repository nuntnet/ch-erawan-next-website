/**
 * ช.เอราวัณ กรุ๊ป — Company constants
 *
 * ปีที่ก่อตั้ง: พ.ศ. 2510 (ค.ศ. 1967)
 * คำนวณปีประสบการณ์อัตโนมัติจากปีปัจจุบัน — ไม่ต้องแก้ไขทุกปี
 */

export const FOUNDED_YEAR_BE = 2510; // พ.ศ. ที่ก่อตั้ง

/**
 * จำนวนปีที่ดำเนินกิจการ (คำนวณจากปีปัจจุบัน)
 * ใช้ + 543 แปลงปี ค.ศ. → พ.ศ.
 */
export function getYearsOfExperience(): number {
  const currentYearBE = new Date().getFullYear() + 543;
  return currentYearBE - FOUNDED_YEAR_BE;
}

/**
 * ใช้ใน JSX: "59+" หรือ "59 ปี" ฯลฯ
 */
export function getYearsLabel(): string {
  return `${getYearsOfExperience()}+`;
}
