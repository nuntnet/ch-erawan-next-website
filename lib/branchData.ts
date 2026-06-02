// Unified branch data for both ServiceLocator and Contact pages
export interface BranchService {
  name: string;
  icon?: string;
}

export interface BranchContact {
  department: string;
  phone: string;
  email?: string;
}

export interface Branch {
  id: string;
  brand: "Mazda" | "Deepal" | "Ford" | "Mitsubishi" | "GWM" | "Kia" | "Nissan";
  name: string;
  companyName: string;
  shortName: string;
  isHQ: boolean;
  address: string;
  phone: string;
  fax: string;
  lineId: string;
  lineUrl: string;
  hours: string;
  services: string[];
  mapUrl: string;
  mapEmbed: string;
  graphicMapUrl: string;
  lat: number;
  lng: number;
  color: string;
  directions: string[];
  contacts: BranchContact[];
}

export const branches: Branch[] = [
  {
    id: "mazda-nakhonpathom",
    brand: "Mazda",
    name: "มาสด้า ช.เอราวัณ นครปฐม",
    companyName: "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด",
    shortName: "Mazda นครปฐม",
    isHQ: true,
    address: "75/2 ม.1 ถ.เพชรเกษม ต.ธรรมศาลา อ.เมือง จ.นครปฐม 73000",
    phone: "034-305-500",
    fax: "034-305-499",
    lineId: "@mazdach.erawan",
    lineUrl: "https://lin.ee/NLeKZy6",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ใหม่ Mazda",
      "ศูนย์บริการมาตรฐาน Mazda",
      "Body & Paint (Mazda, GWM)",
      "ศูนย์ล้อและยางครบวงจร",
      "อะไหล่แท้ Mazda",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/dTCGV1ZZCsK9Ddu88",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.0584!3d13.8199!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ5JzExLjYiTiAxMDDCsDAzJzMwLjIiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245632/ch-erawan/branch-maps/branch-map-mitsubishi-nakhon-pathom.png",
    lat: 13.8131222,
    lng: 100.1167787,
    color: "bg-red-500",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนเพชรเกษม (ทางหลวงหมายเลข 4) มุ่งหน้าจังหวัดนครปฐม",
      "บริเวณ ต.ธรรมศาลา ก่อนเข้าตัวเมืองนครปฐม",
      "โชว์รูมอยู่ทางซ้ายมือ ติดถนนเพชรเกษม",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
      { department: "ฝ่ายอะไหล่", phone: "086-316-0200" },
      { department: "ฝ่ายประกันภัย", phone: "062-656-1112" },
    ],
  },
  {
    id: "mazda-salaya",
    brand: "Mazda",
    name: "มาสด้า ช.เอราวัณ ศาลายา",
    companyName: "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด",
    shortName: "Mazda ศาลายา",
    isHQ: false,
    address: "200 ม.1 ต.บางเตย อ.สามพราน จ.นครปฐม 73210",
    phone: "02-482-2000",
    fax: "02-482-1912",
    lineId: "@mazdach.erawan",
    lineUrl: "https://lin.ee/qDzqmdn",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ใหม่ Mazda",
      "ศูนย์บริการมาตรฐาน Mazda",
      "Body & Paint (Mazda, Deepal)",
      "ศูนย์ล้อและยางครบวงจร",
      "อะไหล่แท้ Mazda",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/3DaVyVz1YntX7Es5A",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.3!3d13.79!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ3JzI0LjAiTiAxMDDCsDE4JzAwLjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245635/ch-erawan/branch-maps/branch-map-kia-samphran.png",
    lat: 13.7861688,
    lng: 100.3010389,
    color: "bg-red-500",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนบรมราชชนนี มุ่งหน้าศาลายา",
      "เลี้ยวขวาเข้าถนนพุทธมณฑลสาย 5",
      "โชว์รูมอยู่ทางขวามือ ใกล้ Lotus's ศาลายา",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
      { department: "ฝ่ายอะไหล่", phone: "086-316-0200" },
    ],
  },
  {
    id: "deepal-salaya",
    brand: "Deepal",
    name: "Deepal ช.เอราวัณ ศาลายา",
    companyName: "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด",
    shortName: "Deepal ศาลายา",
    isHQ: false,
    address:
      "200 ม.1 ถ.พุทธมณฑลสาย 5 ต.บางเตย อ.สามพราน จ.นครปฐม 73210 (ติดกับ Mazda ศาลายา)",
    phone: "02-482-2000",
    fax: "-",
    lineId: "@mazdach.erawan",
    lineUrl: "https://lin.ee/vK6Z54v",
    hours: "ทุกวัน 10:00–20:00",
    services: [
      "ขายรถยนต์ EV Deepal",
      "EV Service Center",
      "Body & Paint (ใช้ร่วมกับ Mazda ศาลายา)",
      "EV Charging Station",
      "อะไหล่แท้ Deepal",
      "Deepal Finance & Insurance",
    ],
    mapUrl: "https://maps.app.goo.gl/3DaVyVz1YntX7Es5A",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.31!3d13.80!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ4JzAwLjAiTiAxMDDCsDE4JzM2LjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245633/ch-erawan/branch-maps/branch-map-gwm-nakhon-pathom.png",
    lat: 13.7861688,
    lng: 100.3010389,
    color: "bg-purple-600",
    directions: [
      "ตั้งอยู่ติดกับ มาสด้า ช.เอราวัณ ศาลายา บนถนนพุทธมณฑลสาย 5",
      "จากกรุงเทพฯ ใช้ถนนบรมราชชนนี มุ่งหน้าศาลายา",
      "เลี้ยวขวาเข้าถนนพุทธมณฑลสาย 5 โชว์รูมอยู่ทางขวามือ",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
    ],
  },
  {
    id: "ford-omnoi",
    brand: "Ford",
    name: "ฟอร์ด ช.เอราวัณ อ้อมใหญ่",
    companyName: "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด",
    shortName: "Ford อ้อมใหญ่",
    isHQ: false,
    address: "1/2 หมู่ 8 ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม 73160",
    phone: "02-431-1000",
    fax: "02-431-1565",
    lineId: "@fordch.erawan",
    lineUrl: "https://lin.ee/PhIWeTl",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ใหม่ Ford",
      "ศูนย์บริการมาตรฐาน Ford",
      "Body & Paint (Ford, Kia)",
      "อะไหล่แท้ Ford",
      "Ford Pro Fleet Service",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/u7xE6GaV2NWABz9c9",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.25!3d13.72!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQzJzEyLjAiTiAxMDDCsDE1JzAwLjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245626/ch-erawan/branch-maps/branch-map-mazda-nakhon-pathom.png",
    lat: 13.708359,
    lng: 100.285138,
    color: "bg-blue-600",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนเพชรเกษม มุ่งหน้าจังหวัดนครปฐม",
      "ผ่านกิโลเมตรที่ 22 บริเวณ ต.อ้อมใหญ่ อ.สามพราน",
      "โชว์รูมอยู่ทางซ้ายมือ ก่อนถึงสี่แยกอ้อมใหญ่",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
    ],
  },
  {
    id: "mitsubishi-nakhonpathom",
    brand: "Mitsubishi",
    name: "มิตซูบิชิ ช.เอราวัณ นครปฐม",
    companyName: "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด",
    shortName: "Mitsubishi นครปฐม",
    isHQ: false,
    address: "155 หมู่ 5 ต.ลำพยา อ.เมือง จ.นครปฐม 73000",
    phone: "034-300-333",
    fax: "034-300-390",
    lineId: "@mitsuch.erawan",
    lineUrl: "https://lin.ee/N7UjCTE",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ใหม่ Mitsubishi",
      "ศูนย์บริการมาตรฐาน Mitsubishi",
      "Body & Paint (Mitsubishi)",
      "อะไหล่แท้ Mitsubishi",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/nWnAMQXmwJnrntL97",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.07!3d13.81!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ4JzM2LjAiTiAxMDDCsDA0JzEyLjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245631/ch-erawan/branch-maps/branch-map-ford-omnoi.png",
    lat: 13.804027,
    lng: 100.015492,
    color: "bg-red-600",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนเพชรเกษม มุ่งหน้าจังหวัดนครปฐม",
      "บริเวณ ต.ลำพยา อ.เมือง จ.นครปฐม",
      "โชว์รูมอยู่ทางขวามือ ก่อนถึงวงเวียนพระปฐมเจดีย์",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
    ],
  },
  {
    id: "gwm-nakhonpathom",
    brand: "GWM",
    name: "GWM ช.เอราวัณ นครปฐม",
    companyName: "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด",
    shortName: "GWM นครปฐม",
    isHQ: false,
    address: "333 ม.1 ต.ธรรมศาลา อ.เมือง จ.นครปฐม 73000",
    phone: "034-219-000",
    fax: "-",
    lineId: "@gwmch.erawan",
    lineUrl: "https://lin.ee/xKFaZcUG",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ GWM (HAVAL, ORA, TANK)",
      "ศูนย์บริการมาตรฐาน GWM",
      "Body & Paint (ใช้ร่วมกับ Mazda นครปฐม)",
      "EV Charging Station",
      "อะไหล่แท้ GWM",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/GWNP1BWKNFu3xDss7",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.09!3d13.83!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ5JzQ4LjAiTiAxMDDCsDA1JzI0LjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245628/ch-erawan/branch-maps/branch-map-mazda-salaya.png",
    lat: 13.8114368,
    lng: 100.120443,
    color: "bg-orange-500",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนเพชรเกษม มุ่งหน้าจังหวัดนครปฐม",
      "บริเวณ ต.ธรรมศาลา ก่อนเข้าตัวเมืองนครปฐม (ใกล้กับ Mazda นครปฐม)",
      "โชว์รูมอยู่ทางขวามือ ติดถนนเพชรเกษม",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
    ],
  },
  {
    id: "kia-nakhonpathom",
    brand: "Kia",
    name: "Kia ช.เอราวัณ สามพราน",
    companyName: "บริษัท ช.เอราวัณ ออโตเซลล์ จำกัด",
    shortName: "Kia สามพราน",
    isHQ: false,
    address: "232 ต.ยายชา อ.สามพราน จ.นครปฐม 73110",
    phone: "02-431-1000",
    fax: "-",
    lineId: "@kiach.erawan",
    lineUrl: "https://lin.ee/XQiajzI",
    hours: "จ–ศ 08:00–18:00 · ส–อา 08:00–17:00",
    services: [
      "ขายรถยนต์ใหม่ Kia",
      "ศูนย์บริการมาตรฐาน Kia",
      "Body & Paint (Ford, Kia)",
      "อะไหล่แท้ Kia",
      "ประกันภัยรถยนต์",
    ],
    mapUrl: "https://maps.app.goo.gl/T8R26rBQ8Sr2BHgH6",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.5!2d100.06!3d13.82!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQ5JzEyLjAiTiAxMDDCsDAzJzM2LjAiRQ!5e0!3m2!1sth!2sth!4v1",
    graphicMapUrl:
      "https://res.cloudinary.com/n5llrdnq/image/upload/f_auto,q_auto:best/v1780245629/ch-erawan/branch-maps/branch-map-deepal-salaya.png",
    lat: 13.7241055,
    lng: 100.2543942,
    color: "bg-indigo-600",
    directions: [
      "จากกรุงเทพฯ ใช้ถนนเพชรเกษม มุ่งหน้าจังหวัดนครปฐม",
      "บริเวณ ต.อ้อมใหญ่ อ.สามพราน จ.นครปฐม",
      "โชว์รูมอยู่ทางขวามือ ก่อนถึงสี่แยกอ้อมใหญ่",
    ],
    contacts: [
      { department: "ฝ่ายขาย", phone: "094-413-3555" },
      { department: "ฝ่ายบริการ", phone: "086-316-0100" },
    ],
  },
];

// Helper functions
export function getBranchById(id: string): Branch | undefined {
  return branches.find((b) => b.id === id);
}

export function getBranchesByBrand(brand: string): Branch[] {
  return branches.filter((b) => b.brand === brand);
}

export function getAllBrands(): string[] {
  return Array.from(new Set(branches.map((b) => b.brand)));
}
