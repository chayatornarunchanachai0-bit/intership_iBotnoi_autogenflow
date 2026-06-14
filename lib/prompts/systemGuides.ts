import { SECTION_MARKERS } from '../constants';

export const SYNTAX_GUIDE = `# Syntax ที่ใช้ในระบบ (ต้องใช้ตามนี้เท่านั้น)
- <ชื่อตัวแปร> = Retrieve Parameter ใช้บอกระบบให้เก็บคำตอบของลูกค้าไว้ในตัวแปรนั้น
- <<ชื่อตัวแปร>> = Replace Parameter ใช้แสดงค่าที่เก็บไว้ในตัวแปรนั้น (ใช้ตอนสรุปข้อมูล)
- {{ชื่อ_intent}} = Intent Parameter ใช้เรียก Bot Response ของ Intent อื่น เช่น {{AI_GET_INFO}}, {{AI_SEND_DATA_TO_SYSTEM}}`;

export const GETINFO_FINAL_STEP_GUIDE = `หลังจาก Step สุดท้ายที่เก็บข้อมูลครบถ้วนแล้ว ให้เพิ่ม Step ปิดท้ายอีก 1 Step เสมอ (เลข Step ต่อจาก Step สุดท้าย) เพื่อส่งต่อไปยัง summary prompt โดยมีรูปแบบ:

## Step <เลข Step ต่อไป>: ส่งต่อสรุปข้อมูล
เสร็จสิ้นการทำงาน ให้ไปเรียก {{AI_SUMMARY}}

(Step นี้เป็น Step ปิดท้ายภายใน ไม่ต้องมี "ถาม:" หรือ "เก็บข้อมูล:")`;

export const OUTPUT_FORMAT_GUIDE = `# รูปแบบผลลัพธ์ (สำคัญที่สุด)
ตอบกลับเป็นข้อความล้วนเท่านั้น ห้ามใส่ JSON ห้ามใส่ code fence (\`\`\`) และห้ามมีข้อความอื่นใดนอกเหนือจากรูปแบบนี้ โดยแบ่งเป็น 3 ส่วนด้วยบรรทัดคั่นตามนี้เป๊ะ ๆ (พิมพ์บรรทัดคั่นตรงตามตัวพิมพ์ใหญ่-เล็กและสัญลักษณ์ทุกตัว):

${SECTION_MARKERS.getinfo}
<เนื้อหา prompt getinfo ทั้งหมด>
${SECTION_MARKERS.summary}
<เนื้อหา prompt summary ทั้งหมด>
${SECTION_MARKERS.check_parameter}
<เนื้อหา check_parameter ทั้งหมด>
${SECTION_MARKERS.end}`;
