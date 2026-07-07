import { SECTION_MARKERS } from '../constants';

export const SYNTAX_GUIDE = `# Syntax ที่ใช้ในระบบ (ต้องใช้ตามนี้เท่านั้น)
- <ชื่อตัวแปร> = Retrieve Parameter ใช้บอกระบบให้เก็บคำตอบของลูกค้าไว้ในตัวแปรนั้น
- <<ชื่อตัวแปร>> = Replace Parameter ใช้แสดงค่าที่เก็บไว้ในตัวแปรนั้น (ใช้ตอนสรุปข้อมูล)
- {{ชื่อ_intent}} = Intent Parameter ใช้เรียก Bot Response ของ Intent อื่น เช่น {{AI_GET_INFO}}, {{AI_SEND_DATA_TO_SYSTEM}}`;

export const GETINFO_FINAL_STEP_GUIDE = `หลังจาก Step สุดท้ายที่เก็บข้อมูลครบถ้วนแล้ว ให้เพิ่ม Step ปิดท้ายอีก 1 Step เสมอ (เลข Step ต่อจาก Step สุดท้าย) เพื่อส่งต่อไปยัง summary prompt โดยมีรูปแบบ:

## Step <เลข Step ต่อไป>: ส่งต่อสรุปข้อมูล
เสร็จสิ้นการทำงาน ให้ไปเรียก {{AI_SUMMARY}}

(Step นี้เป็น Step ปิดท้ายภายใน ไม่ต้องมี "ถาม:" หรือ "เก็บข้อมูล:")`;

export const EXAMPLE_ANSWERS_GUIDE = `# โครงสร้างของ "example_answers" (ไฟล์ตัวอย่างคำตอบ สำหรับใช้กับ Chat Step Automate)
สร้างตัวอย่างคำตอบของลูกค้าสำหรับใช้ทดสอบบอทอัตโนมัติ (Chat Step Automate) โดย:
- อิงจากคำถาม ("ถาม:") ของแต่ละ Step ใน getinfo prompt ที่ได้รับมา เรียงตามลำดับ Step
- คิดคำตอบให้สมจริงเหมือนลูกค้าจริงพิมพ์ตอบ และสอดคล้องกับรายละเอียดธุรกิจ (เช่น เลือกสินค้า/เมนูที่มีจริงตามรายละเอียดธุรกิจ จำนวน วันเวลา ชื่อ-เบอร์โทรสมมติ)
- ข้าม Step ที่ไม่มี "ถาม:" (Step คำนวณ/ตรวจสอบภายใน และ Step ส่งต่อสรุปข้อมูล) เพราะบอทไม่ได้ถามลูกค้า
- นับเลข "step" ในไฟล์นี้ใหม่เรียงตั้งแต่ 1, 2, 3, ... ตามลำดับคำตอบ (ไม่ใช่เลข Step ของ getinfo)
- ปิดท้ายด้วยคำตอบยืนยันรายการ 1 รายการเสมอ เช่น "ยืนยัน" (สำหรับตอนบอทสรุปรายการให้ลูกค้ายืนยัน)

รูปแบบ JSON ต้องเป็นดังนี้เท่านั้น ห้ามเพิ่ม field อื่น:
{
  "version": 1,
  "steps": [
    { "step": 1, "text": "<ตัวอย่างคำตอบของลูกค้าสำหรับคำถามที่ 1>" },
    { "step": 2, "text": "<ตัวอย่างคำตอบของลูกค้าสำหรับคำถามที่ 2>" }
  ]
}`;

export function buildOutputFormatGuide(includeSummary: boolean): string {
  const sections = [
    `${SECTION_MARKERS.getinfo}\n<เนื้อหา prompt getinfo ทั้งหมด — ข้อความล้วน ห้ามใส่ JSON>`,
    ...(includeSummary
      ? [`${SECTION_MARKERS.summary}\n<เนื้อหา prompt summary ทั้งหมด — ข้อความล้วน ห้ามใส่ JSON>`]
      : []),
    `${SECTION_MARKERS.check_parameter}\n<เนื้อหา check_parameter ทั้งหมด — ข้อความล้วน ห้ามใส่ JSON>`,
  ];

  return `# รูปแบบผลลัพธ์ (สำคัญที่สุด)
ตอบกลับเป็นข้อความล้วนเท่านั้น ห้ามใส่ code fence (\`\`\`) และห้ามมีข้อความอื่นใดนอกเหนือจากรูปแบบนี้ โดยแบ่งเป็น ${sections.length} ส่วนด้วยบรรทัดคั่นตามนี้เป๊ะ ๆ (พิมพ์บรรทัดคั่นตรงตามตัวพิมพ์ใหญ่-เล็กและสัญลักษณ์ทุกตัว):

${sections.join('\n')}
${SECTION_MARKERS.end}`;
}

export const EXAMPLE_ANSWERS_OUTPUT_GUIDE = `# รูปแบบผลลัพธ์ (สำคัญที่สุด)
ตอบกลับเป็น JSON ตามโครงสร้าง example_answers เท่านั้น ห้ามใส่ code fence (\`\`\`) และห้ามมีข้อความอื่นใดนอกเหนือจาก JSON`;
