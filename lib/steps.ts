export const STEP_SECTIONS = {
  GETINFO: 'getinfo',
  SUMMARY: 'summary',
} as const;

export type StepSection = (typeof STEP_SECTIONS)[keyof typeof STEP_SECTIONS];

export interface Step {
  id: string;
  title: string;
  section: StepSection;
  enabled: boolean;
  question: string;
  variables: string;
  notes: string;
}

const DEFAULT_STEPS: Step[] = [
  {
    id: 'step-1',
    title: 'เลือกประเภทสินค้า / บริการ',
    section: STEP_SECTIONS.GETINFO,
    enabled: true,
    question: 'ลูกค้าสนใจสินค้า หรือบริการประเภทไหนคะ',
    variables: 'product_type',
    notes: '',
  },
  {
    id: 'step-2',
    title: 'เก็บรายละเอียดความต้องการ',
    section: STEP_SECTIONS.GETINFO,
    enabled: true,
    question: 'ลูกค้าต้องการรายละเอียดเพิ่มเติมแบบไหนคะ',
    variables: 'product_detail',
    notes: '',
  },
  {
    id: 'step-3',
    title: 'เก็บจำนวน / วันเวลา / เงื่อนไข',
    section: STEP_SECTIONS.GETINFO,
    enabled: true,
    question: 'กรณีสินค้า: ต้องการจำนวนเท่าไหร่คะ / กรณีบริการ: สะดวกวันและเวลาไหนคะ',
    variables: 'quantity, date, time, condition',
    notes: '',
  },
  {
    id: 'step-4',
    title: 'คำนวณข้อมูลที่เกี่ยวข้อง',
    section: STEP_SECTIONS.GETINFO,
    enabled: true,
    question: '',
    variables: 'base_price, extra_price, service_fee, total_price',
    notes: 'total_price = ราคาหลัก + ค่าเพิ่มเติม + ค่าบริการ ห้ามสร้างหรือประมาณราคาขึ้นมาเอง',
  },
  {
    id: 'step-5',
    title: 'เก็บข้อมูลลูกค้า',
    section: STEP_SECTIONS.GETINFO,
    enabled: true,
    question: 'รบกวนขอข้อมูลสำหรับติดต่อกลับด้วยนะคะ (ชื่อ และเบอร์โทรศัพท์)',
    variables: 'customer_name, customer_phone',
    notes: 'ตรวจสอบเบอร์โทร: ต้องเป็นรูปแบบถูกต้อง ไม่มีตัวอักษร และจำนวนหลักถูกต้อง',
  },
  {
    id: 'step-6',
    title: 'เก็บข้อมูลสถานที่ / สาขา',
    section: STEP_SECTIONS.GETINFO,
    enabled: true,
    question: 'ลูกค้าสะดวกรับบริการที่สาขาไหน หรือให้จัดส่งที่ไหนคะ',
    variables: 'branch, address',
    notes: '',
  },
  {
    id: 'step-7',
    title: 'สรุปข้อมูล',
    section: STEP_SECTIONS.SUMMARY,
    enabled: true,
    question: '',
    variables: '',
    notes: 'สรุปรายการทั้งหมดให้ลูกค้าตรวจสอบก่อนยืนยัน',
  },
  {
    id: 'step-8',
    title: 'ยืนยันรายการ',
    section: STEP_SECTIONS.SUMMARY,
    enabled: true,
    question: '',
    variables: '',
    notes: 'รับคำยืนยัน เช่น ยืนยัน / ถูกต้อง / ใช่ / Confirm / ตกลง',
  },
  {
    id: 'step-9',
    title: 'ส่งข้อมูลเข้าระบบ',
    section: STEP_SECTIONS.SUMMARY,
    enabled: true,
    question: '',
    variables: '',
    notes: 'เรียก {{AI_SEND_DATA_TO_SYSTEM}} พร้อมส่งข้อมูลทั้งหมดที่เก็บไว้',
  },
  {
    id: 'step-10',
    title: 'จบการสนทนา',
    section: STEP_SECTIONS.SUMMARY,
    enabled: true,
    question: '',
    variables: '',
    notes: 'กล่าวขอบคุณและปิดการสนทนา',
  },
];

export function getDefaultSteps(): Step[] {
  return DEFAULT_STEPS.map((step) => ({ ...step }));
}

let customStepCounter = 0;

export function createCustomStep(): Step {
  customStepCounter += 1;
  return {
    id: `custom-${Date.now()}-${customStepCounter}`,
    title: 'Step ใหม่',
    section: STEP_SECTIONS.GETINFO,
    enabled: true,
    question: '',
    variables: '',
    notes: '',
  };
}
