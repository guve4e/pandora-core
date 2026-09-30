import { EstimatorClientService } from './estimator-client.service';
import { EstimatorOrchestratorService } from './estimator-orchestrator.service';

jest.mock('../../config', () => ({ getEnergridApiConfig: () => ({ baseUrl: 'http://127.0.0.1:3021/core' }) }));
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test('Energrid uses the v2 route and preserves customer history with a deadline', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ status: 'proposal', reply: 'План', draft: {} }) });
  await new EstimatorClientService().assistantStep({ tenantSlug: 'energrid', message: 'Novo 30 kvadrata', customerHistory: ['iskam nova instalaciq v Garisionerata'] });
  const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
  expect(url).toBe('http://127.0.0.1:3021/core/estimator/assistant-step-v2');
  expect(JSON.parse(options.body).customerHistory).toEqual(['iskam nova instalaciq v Garisionerata']);
  expect(options.signal).toBeDefined();
});

test('a circuit proposal cannot retain a stale price from a different job', async () => {
  const assistantStep = jest.fn().mockResolvedValue({ status: 'proposal', reply: 'Предложени кръгове', draft: { jobType: 'residential_installation' } });
  const result = await new EstimatorOrchestratorService({ assistantStep } as any).runStep({ tenantSlug: 'energrid', message: '30 m²', customerHistory: ['гарсониера'], profile: { estimator: { tenantKey: 'energrid' } } as any, conversationMeta: { estimator: { lastPreview: { subtotal: 999, confidence: 'high', needsInspection: true, linesCount: 1 } } } });
  expect(result.conversationMeta?.estimator?.stage).toBe('proposed');
  expect(result.conversationMeta?.estimator?.lastPreview).toBeUndefined();
  expect(assistantStep.mock.calls[0][0].customerHistory).toEqual(['гарсониера']);
});

test('range estimates remain ranges in the conversation summary', async () => {
  const result = await new EstimatorOrchestratorService({ assistantStep: async () => ({ status: 'preview', reply: 'Цена', draft: {}, rangePreview: { min: 200, max: 300, lines: [{}, {}] } }) } as any).runStep({ tenantSlug: 'energrid', message: '2 печки', profile: { estimator: {} } as any });
  expect(result.conversationMeta?.estimator?.lastPreview).toMatchObject({ min: 200, max: 300, linesCount: 2 });
  expect(result.conversationMeta?.estimator?.lastPreview?.subtotal).toBeUndefined();
});
