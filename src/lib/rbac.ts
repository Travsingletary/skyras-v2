import { getSupabaseClient } from '@/backend/supabaseClient';

export type RbacPermission =
  | 'files.upload'
  | 'files.read'
  | 'files.update'
  | 'files.delete'
  | 'projects.create'
  | 'projects.read'
  | 'projects.update'
  | 'projects.delete';

/**
 * Feature flag: RBAC enforcement is OFF by default so we don't break dev flows.
 * Turn on by setting RBAC_ENFORCE=true in the server environment.
 */
export function isRbacEnforced(): boolean {
  return (process.env.RBAC_ENFORCE || '').toLowerCase() === 'true';
}

export async function requirePermission(userId: string, permission: RbacPermission): Promise<void> {
  if (!isRbacEnforced()) return;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc<boolean>('rbac_user_has_permission', {
    p_user_id: userId,
    p_permission: permission,
  });

  if (error) {
    throw new Error(`RBAC check failed: ${error.message || String(error)}`);
  }

  if (!data) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }
}











