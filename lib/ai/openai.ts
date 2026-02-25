/**
 * OpenAI Client Wrapper
 */

import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export type AITier = 'tier1' | 'tier2';

export function getTierModel(tier: AITier): string {
  return tier === 'tier1'
    ? (process.env.AI_TIER1_MODEL ?? 'gpt-4o-mini')
    : (process.env.AI_TIER2_MODEL ?? 'gpt-4o-mini');
}

const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'text-embedding-3-small': { input: 0.00002, output: 0 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = COST_PER_1K[model] ?? COST_PER_1K['gpt-4o-mini'];
  return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface AICallResult<T> {
  result: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}