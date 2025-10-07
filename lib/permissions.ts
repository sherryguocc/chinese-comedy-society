// perms.ts
import { UserRole, Admin, Profile } from '@/types/database';
import { supabase } from '@/lib/supabase';

/** Extend your DB role with "super_admin" used by app logic */
export type AnyRole = UserRole | 'super_admin';

/** Centralized permissions map */
export const PERMISSIONS = {
  // Posts
  VIEW_POST: ['guest', 'member', 'admin', 'super_admin'] as AnyRole[],
  CREATE_POST: ['admin', 'super_admin'] as AnyRole[],
  EDIT_POST: ['admin', 'super_admin'] as AnyRole[],
  DELETE_POST: ['admin', 'super_admin'] as AnyRole[],
  COMMENT_POST: ['member', 'admin', 'super_admin'] as AnyRole[],

  // Events
  VIEW_EVENT: ['guest', 'member', 'admin', 'super_admin'] as AnyRole[],
  CREATE_EVENT: ['admin', 'super_admin'] as AnyRole[],
  DELETE_EVENT: ['admin', 'super_admin'] as AnyRole[],

  // Files
  DOWNLOAD_FILE: ['member', 'admin', 'super_admin'] as AnyRole[],
  UPLOAD_FILE: ['admin', 'super_admin'] as AnyRole[],
  DELETE_FILE: ['admin', 'super_admin'] as AnyRole[],

  // Users
  MANAGE_USERS: ['admin', 'super_admin'] as AnyRole[],

  // Super admin only
  MANAGE_ADMINS: ['super_admin'] as AnyRole[],
  PROMOTE_TO_ADMIN: ['super_admin'] as AnyRole[],
  SYSTEM_SETTINGS: ['super_admin'] as AnyRole[],
} as const;

type UserRoleData = {
  role: AnyRole | null;
  profile: Profile | null;
  admin: Admin | null;
};

type UserRoleCacheEntry = {
  data: UserRoleData;
  timestamp: number;
  expiry: number;
};

/** In-memory cache */
let userRoleCache: Record<string, UserRoleCacheEntry> = {};

/** 5 minutes */
const CACHE_DURATION = 5 * 60 * 1000;

/** Util keys for localStorage */
const lsKey = (userId: string) => `chinese-comedy-society-user-role-${userId}`;
const lsKeyTs = (userId: string) => `${lsKey(userId)}-timestamp`;

/** Check if a string is one of our roles */
export function isValidRole(role: string): role is AnyRole {
  return ['guest', 'member', 'admin', 'super_admin'].includes(role.toLowerCase());
}

/** Check role against a permission key */
export function hasPermission(
  userRole: AnyRole | null,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!userRole) return false;
  const normalized = userRole.toLowerCase() as AnyRole;
  return PERMISSIONS[permission].includes(normalized);
}

/** Throw if lacking permission */
export function requirePermission(
  userRole: AnyRole | null,
  permission: keyof typeof PERMISSIONS
): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`权限不足 Insufficient permissions: ${permission}`);
  }
}

/** Admin granular permission check from Admin row */
export function hasAdminPermission(
  admin: Admin | null,
  permission: keyof Admin['permissions']
): boolean {
  if (!admin) return false;
  if ((admin as any).is_super_admin) return true; // keep compatibility if present
  return admin.permissions?.[permission] === true;
}

export function isAdmin(userRole: AnyRole | null): boolean {
  return userRole === 'admin' || userRole === 'super_admin';
}

export function isSuperAdmin(userRole: AnyRole | null): boolean {
  return userRole === 'super_admin';
}

/** Clear cache (one user or all), plus localStorage */
export function clearUserRoleCache(userId?: string) {
  const clearOne = (uid: string) => {
    delete userRoleCache[uid];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(lsKey(uid));
        localStorage.removeItem(lsKeyTs(uid));
      } catch (e) {
        console.warn('[clearUserRoleCache] localStorage error:', e);
      }
    }
  };

  if (userId) {
    clearOne(userId);
    console.log('[getUserRole] Cleared cache for user:', userId);
    return;
  }

  userRoleCache = {};
  if (typeof window !== 'undefined') {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('chinese-comedy-society-user-role-')) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[clearUserRoleCache] localStorage error:', e);
    }
  }
  console.log('[getUserRole] Cleared all user role cache');
}

/**
 * Get user role/profile/admin with in-memory + localStorage cache.
 * NOTE: This function assumes client-side execution (uses supabase.auth.getSession() and fetch with window.origin).
 */
export async function getUserRole(
  userId: string,
  forceRefresh = false
): Promise<UserRoleData> {
  try {
    const now = Date.now();

    // 1) Memory cache
    const mem = userRoleCache[userId];
    if (!forceRefresh && mem && now < mem.expiry) {
      return mem.data;
    }

    // 2) localStorage fallback (browser only)
    if (!mem && typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem(lsKey(userId));
        const tsStr = localStorage.getItem(lsKeyTs(userId));
        if (str && tsStr) {
          const age = now - parseInt(tsStr, 10);
          if (age < CACHE_DURATION) {
            const parsed: UserRoleData = JSON.parse(str);
            userRoleCache[userId] = {
              data: parsed,
              timestamp: parseInt(tsStr, 10),
              expiry: parseInt(tsStr, 10) + CACHE_DURATION,
            };
            return parsed;
          } else {
            localStorage.removeItem(lsKey(userId));
            localStorage.removeItem(lsKeyTs(userId));
          }
        }
      } catch (e) {
        console.warn('[getUserRole] localStorage restore error:', e);
      }
    }

    // 3) Fetch from API (needs a valid session)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.warn('[getUserRole] No valid session found');
      return { role: null, profile: null, admin: null };
    }

    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : '';
    const apiUrl = `${baseUrl}/api/auth/user-role`;

    const resp = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[getUserRole] API failed:', resp.status, resp.statusText, text);
      return { role: null, profile: null, admin: null };
    }

    const json = await resp.json();
    // Normalize role if backend returns something unexpected
    const role: AnyRole | null = isValidRole(json.role) ? json.role : null;
    const result: UserRoleData = {
      role,
      profile: json.profile ?? null,
      admin: json.admin ?? null,
    };

    const entry: UserRoleCacheEntry = {
      data: result,
      timestamp: now,
      expiry: now + CACHE_DURATION,
    };

    userRoleCache[userId] = entry;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(lsKey(userId), JSON.stringify(result));
        localStorage.setItem(lsKeyTs(userId), String(now));
      } catch (e) {
        console.warn('[getUserRole] localStorage save error:', e);
      }
    }

    return result;
  } catch (e) {
    console.error('❌ [getUserRole] Error:', e);
    return { role: null, profile: null, admin: null };
  }
}
