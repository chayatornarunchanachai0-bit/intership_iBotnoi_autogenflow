export interface GenerateResult {
  getinfo: string;
  // null = ผู้ใช้เลือกไม่สร้างส่วนนี้ (สร้างเพิ่มภายหลังได้ผ่าน /api/generate-part)
  summary: string | null;
  check_parameter: string;
  example_answers: string | null;
}

export interface GenerateRequestBody {
  provider: string;
  apiKey: string;
  model?: string;
  botName: string;
  businessDescription?: string;
  includeSummary?: boolean; // default true
  includeExampleAnswers?: boolean; // default true
}

export type GeneratePart = 'summary' | 'example_answers';

export interface GeneratePartRequestBody {
  provider: string;
  apiKey: string;
  model?: string;
  part: GeneratePart;
  botName: string;
  businessDescription?: string;
  getinfo: string;
}
