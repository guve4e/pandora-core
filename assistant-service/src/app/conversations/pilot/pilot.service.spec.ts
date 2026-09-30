import { PilotService } from './pilot.service';
import { emptyPilot } from './pilot-state';
const saved = process.env.ENERGRID_PILOT_ENABLED;
beforeEach(() => {
  process.env.ENERGRID_PILOT_ENABLED = 'true';
});
afterEach(() => {
  if (saved === undefined) delete process.env.ENERGRID_PILOT_ENABLED;
  else process.env.ENERGRID_PILOT_ENABLED = saved;
});
test('duplicate turns return recorded reply without invoking a model', async () => {
  const { createHash } = require('node:crypto');
  const result = { reply: 'saved', turnRevision: 1 };
  const repo = {
    findConversationById: async () => ({
      tenant_slug: 'energrid',
      meta: {
        pilot: {
          mode: 'residential-v1',
          turnRevision: 1,
          state: emptyPilot(),
          receipts: [
            {
              id: 'id1',
              hash: createHash('sha256').update('hi').digest('hex'),
              result,
            },
          ],
        },
      },
    }),
  };
  const model = { json: jest.fn() };
  const service = new PilotService(
    {} as any,
    repo as any,
    model as any,
    {} as any,
  );
  expect(
    await service.turn('c1', {
      message: 'hi',
      turnId: 'id1',
      expectedRevision: 0,
    }),
  ).toEqual(result);
  expect(model.json).not.toHaveBeenCalled();
  await expect(
    service.turn('c1', {
      message: 'different',
      turnId: 'id1',
      expectedRevision: 0,
    }),
  ).rejects.toThrow();
  await expect(
    service.turn('c1', { message: 'hi', turnId: 'id2', expectedRevision: 0 }),
  ).rejects.toThrow();
});
test('pilot is unavailable unless explicitly enabled', async () => {
  process.env.ENERGRID_PILOT_ENABLED = 'false';
  await expect(
    new PilotService({} as any, {} as any, {} as any, {} as any).create(),
  ).rejects.toThrow();
});
test.each([true,false])('price repair is bounded and preserves state; success=%s',async(success)=>{
 const state=emptyPilot();state.facts={propertyType:'studio'};
 state.active={facts:state.facts,template:{},calculatedAt:'saved',estimate:{min:500,max:1010,currency:'EUR',lines:[],assumptions:[]}};
 const repo={findConversationById:async()=>({tenant_slug:'energrid',meta:{pilot:{mode:'residential-v1',turnRevision:1,state,receipts:[]}}}),listMessages:async()=>[]};
 const model={json:jest.fn().mockResolvedValueOnce({action:'read',topic:'point rate',changes:[]}).mockResolvedValueOnce({reply:'20 EUR',offer:'none'}).mockResolvedValueOnce({reply:success?'Изводът е {{catalog.power_point_up_to_3m}}.':'20 EUR',offer:'none'})};
 const db={systemQuery:jest.fn().mockResolvedValue({rowCount:1})};
 const fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>({template:{},catalog:[{code:'power_point_up_to_3m',base_price:20,unit:'точка'}]})} as Response);
 try{
  const result=await new PilotService(db as any,repo as any,model as any,{getTodayUsage:async()=>({totalCostUsd:0})} as any).turn('c1',{message:'Point or socket price?',turnId:'read2',expectedRevision:1});
  expect(model.json).toHaveBeenCalledTimes(3);expect(fetchMock).toHaveBeenCalledTimes(1);expect(result.state).toEqual(state);
  expect(result.reply).toContain(success?'20.00 EUR/точка':'Не успях');
 }finally{fetchMock.mockRestore();}
});
test('a nonnumeric model quantity keeps the estimate and answers instead of returning 400', async () => {
  const state = emptyPilot();
  state.facts = { propertyType: 'apartment', roomCount: 3 };
  state.active = {
    facts: state.facts,
    template: {},
    calculatedAt: 'saved',
    estimate: {
      min: 780,
      max: 1590,
      currency: 'EUR',
      lines: [],
      assumptions: [],
    },
  };
  const repo = {
    findConversationById: async () => ({
      tenant_slug: 'energrid',
      meta: {
        pilot: { mode: 'residential-v1', turnRevision: 2, state, receipts: [] },
      },
    }),
    listMessages: async () => [],
  };
  const model = {
    json: jest
      .fn()
      .mockResolvedValueOnce({
        action: 'update',
        topic: 'socket flexibility',
        changes: [
          {
            field: 'socketCount',
            value: 'as many as wanted',
            evidence: 'kolkoto kontakta iskam',
          },
        ],
      })
      .mockResolvedValueOnce({
        reply: 'Да, броят е начално допускане. Колко контакта бихте искали?',
        offer: 'none',
      }),
  };
  const db = { systemQuery: jest.fn().mockResolvedValue({ rowCount: 1 }) };
  const usage = { getTodayUsage: async () => ({ totalCostUsd: 0 }) };
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue({
      ok: true,
      json: async () => ({ template: {}, catalog: [] }),
    } as Response);
  try {
    const result = await new PilotService(
      db as any,
      repo as any,
      model as any,
      usage as any,
    ).turn('c1', {
      message: 'A moje li kolkoto kontakta iskam az?',
      turnId: 'q3',
      expectedRevision: 2,
    });
    expect(result.operation).toBe('read');
    expect(result.state).toEqual(state);
    expect(result.reply).toContain('начално допускане');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/context');
    expect(model.json.mock.calls[1][1].validationFeedback).toContain(
      'NOT applied',
    );
    expect(JSON.parse(db.systemQuery.mock.calls[0][1][1]).pilot.state).toEqual(
      state,
    );
  } finally {
    fetchMock.mockRestore();
  }
});
