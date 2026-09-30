import { PilotModelService, decisionSchema } from './pilot-model.service';

test('structured interpretation disables storage and prices returned model versions using configured rates', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = 'test-only';
  process.env.OPENAI_MODEL = 'gpt-4.1-mini';
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 'completed',
      model: 'gpt-4.1-mini-2025-04-14',
      usage: { input_tokens: 1000, output_tokens: 100, total_tokens: 1100 },
      output: [
        {
          content: [
            {
              type: 'output_text',
              text: JSON.stringify({
                action: 'read',
                changes: [
                  { field: 'smartRelayCount', value: '1', evidence: 'relay' },
                ],
                topic: 'relay explanation',
              }),
            },
          ],
        },
      ],
    }),
  } as Response);
  try {
    const usage = jest.fn();
    const result = await new PilotModelService().json(
      'Interpret intent',
      { message: 'What is a relay?' },
      decisionSchema,
      usage,
    );
    expect(result.action).toBe('read');
    expect(result.changes).toEqual([]);
    const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(request).toMatchObject({
      store: false,
      temperature: 0,
      text: { format: { strict: true } },
    });
    expect(request.instructions).toContain('Do not write a customer reply');
    expect(usage.mock.calls[0][0].estimatedCostUsd).toBeGreaterThan(0);
    expect(usage.mock.calls[0][0].model).toBe('gpt-4.1-mini-2025-04-14');
  } finally {
    fetchMock.mockRestore();
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = oldModel;
  }
});
