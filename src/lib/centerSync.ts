import type { SupabaseClient } from '@supabase/supabase-js';

export class CenterSyncConflict extends Error {
  constructor() { super('Dữ liệu trên máy chủ đã được người khác cập nhật. Hãy xuất backup các thay đổi trên máy này trước khi tải lại trang.'); }
}

// Compare-and-swap against the server timestamp prevents stale browsers from
// overwriting another user's whole center_data document.
export const saveCenterPayload = async (client: SupabaseClient, payload: object, version: string | null): Promise<string> => {
  const table = client.from('center_data');
  const request = version
    ? table.update({ payload }).eq('id', 'primary').eq('updated_at', version)
    : table.insert({ id: 'primary', payload });
  const { data, error } = await request.select('updated_at').maybeSingle();
  if (error) {
    if (error.code === '23505') throw new CenterSyncConflict();
    throw new Error(error.message);
  }
  if (!data?.updated_at) throw new CenterSyncConflict();
  return data.updated_at;
};
