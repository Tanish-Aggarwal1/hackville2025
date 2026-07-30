const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock('./client', () => ({ supabase: { from: fromMock } }));

import { getProfile, upsertProfile } from './profile';

function queryChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve(result),
    upsert: () => chain,
    single: () => Promise.resolve(result),
  };
  return chain;
}

test('getProfile returns the row on success', async () => {
  fromMock.mockReturnValue(queryChain({ data: { id: '1' }, error: null }));
  await expect(getProfile('1')).resolves.toEqual({ id: '1' });
});

test('getProfile throws on a Supabase error instead of swallowing it', async () => {
  fromMock.mockReturnValue(queryChain({ data: null, error: new Error('boom') }));
  await expect(getProfile('1')).rejects.toThrow('boom');
});

test('upsertProfile throws on a Supabase error instead of swallowing it', async () => {
  fromMock.mockReturnValue(queryChain({ data: null, error: new Error('boom') }));
  await expect(upsertProfile({ id: '1', display_name: 'A' } as never)).rejects.toThrow('boom');
});
