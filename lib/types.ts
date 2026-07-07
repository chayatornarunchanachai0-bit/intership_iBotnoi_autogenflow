import type { Step } from './steps';

export interface GenerateResult {
  getinfo: string;
  summary: string;
  check_parameter: string;
  example_answers: string;
}

export interface GenerateRequestBody {
  provider: string;
  apiKey: string;
  model?: string;
  botName: string;
  businessDescription?: string;
  mode: 'auto' | 'manual';
  getinfoSteps?: Step[];
  summarySteps?: Step[];
}
