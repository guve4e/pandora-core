import { TenantConversationsService } from './tenant-conversations.service';
import { TenantConversationsController } from './tenant-conversations.controller';

test('list reads tenant-scoped conversations including pilot records without requiring a lead', async () => {
  const row = { id: 'conversation', channel: 'pilot', lead_id: null };
  const pool = { query: jest.fn().mockResolvedValue({ rows: [row] }) };
  const result = await new TenantConversationsService(pool as any).list(
    'tenant-a',
  );
  expect(result).toEqual([row]);
  expect(pool.query.mock.calls[0][1]).toEqual(['tenant-a']);
  expect(pool.query.mock.calls[0][0]).toContain('WHERE t.id=$1');
});
test('foreign or missing conversations return 404 without reading their messages', async () => {
  const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
  await expect(
    new TenantConversationsService(pool as any).messages(
      'tenant-a',
      'foreign-id',
    ),
  ).rejects.toMatchObject({ status: 404 });
  expect(pool.query).toHaveBeenCalledTimes(1);
  expect(pool.query.mock.calls[0][1]).toEqual(['tenant-a', 'foreign-id']);
});
test('message reads remain scoped and missing identity fails closed', async () => {
  const pool = {
    query: jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: 'own' }] })
      .mockResolvedValueOnce({
        rows: [{ role: 'user', message_text: 'hello' }],
      }),
  };
  const service = new TenantConversationsService(pool as any);
  expect(await service.messages('tenant-a', 'own')).toHaveLength(1);
  expect(pool.query.mock.calls[1][1]).toEqual(['tenant-a', 'own']);
  expect(pool.query.mock.calls[1][0]).toContain('WHERE t.id=$1 AND c.id=$2');
  await expect(service.list('')).rejects.toMatchObject({ status: 401 });
  expect(pool.query).toHaveBeenCalledTimes(2);
});
test('controller uses authenticated tenant rather than caller-supplied query scope', () => {
  const service = { list: jest.fn(), messages: jest.fn() };
  const controller = new TenantConversationsController(service as any);
  controller.list({
    user: { tenant_id: 'authenticated' },
    query: { tenantId: 'other' },
  });
  expect(service.list).toHaveBeenCalledWith('authenticated');
});

describe('permanent conversation deletion', () => {
  function setup(owned: any[], leads: any[] = []) {
    const client = {
      query: jest.fn(async (sql: string) => ({
        rows: sql.includes('FOR UPDATE')
          ? owned
          : sql.startsWith('SELECT 1')
            ? leads
            : [],
      })),
      release: jest.fn(),
    };
    const pool = { connect: jest.fn().mockResolvedValue(client) };
    return {
      client,
      pool,
      service: new TenantConversationsService(pool as any),
    };
  }
  test('locks only the authenticated tenant record and commits deletion', async () => {
    const { client, service } = setup([{ id: 'own', lead_id: null }]);
    await service.remove('tenant-a', 'own');
    expect(client.query.mock.calls[1]).toEqual([
      expect.stringContaining('WHERE t.id=$1 AND c.id=$2 FOR UPDATE'),
      ['tenant-a', 'own'],
    ]);
    expect(client.query).toHaveBeenCalledWith(
      'DELETE FROM assistant.conversations WHERE id=$1',
      ['own'],
    );
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
  test('foreign conversation returns 404 without deleting anything', async () => {
    const { client, service } = setup([]);
    await expect(service.remove('tenant-a', 'foreign')).rejects.toMatchObject({
      status: 404,
    });
    expect(
      client.query.mock.calls.some(([sql]) => sql.startsWith('DELETE')),
    ).toBe(false);
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
  test.each([
    [{ id: 'own', lead_id: 'lead' }, []],
    [{ id: 'own', lead_id: null }, [{ exists: 1 }]],
  ])('protects linked leads in either direction', async (row, leads) => {
    const { client, service } = setup([row], leads as any[]);
    await expect(service.remove('tenant-a', 'own')).rejects.toMatchObject({
      status: 409,
    });
    expect(
      client.query.mock.calls.some(([sql]) => sql.startsWith('DELETE')),
    ).toBe(false);
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });
  test('missing authentication does not acquire a connection', async () => {
    const { pool, service } = setup([]);
    await expect(service.remove('', 'own')).rejects.toMatchObject({
      status: 401,
    });
    expect(pool.connect).not.toHaveBeenCalled();
  });
  test('controller ignores supplied tenant scope for deletion', () => {
    const service = { remove: jest.fn() };
    new TenantConversationsController(service as any).remove(
      { user: { tenant_id: 'authenticated' }, body: { tenantId: 'other' } },
      'own',
    );
    expect(service.remove).toHaveBeenCalledWith('authenticated', 'own');
  });
});
