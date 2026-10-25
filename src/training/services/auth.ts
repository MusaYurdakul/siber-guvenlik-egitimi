import { useSyncExternalStore } from 'react';
import type { ProgressState } from '../types';
import { progress, setSessionChangedHandler } from './progress';

export interface SessionUser {
  username: string;
  name: string;
  department: string;
  role: 'admin' | 'user';
  mustChange: boolean;
  createdAt?: string;
}

export type AuthState =
  | { status: 'loading' | 'offline' | 'anonymous' }
  | { status: 'setup'; allowedHere: boolean }
  | { status: 'authed'; user: SessionUser };

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string;
}

/** Sunucu API çağrısı; hata iletisi sunucudan gelir. */
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const isJson = res.headers.get('content-type')?.includes('json');
    const data = isJson ? await res.json() : null;
    return { ok: res.ok && isJson === true, status: res.status, data: res.ok ? (data as T) : null, error: res.ok ? '' : (data?.error ?? 'Sunucuya ulaşılamadı.') };
  } catch {
    return { ok: false, status: 0, data: null, error: 'Sunucuya ulaşılamadı.' };
  }
}

let state: AuthState = { status: 'loading' };
const listeners = new Set<() => void>();
function set(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

async function enter(user: SessionUser) {
  // Şifresini değiştirmesi gereken kullanıcı, değiştirene kadar eğitime alınmaz.
  if (!user.mustChange) {
    const saved = await api<{ state: ProgressState | null }>('/api/progress');
    progress.attach({ userId: user.username, userName: user.name, department: user.department }, saved.data?.state ?? null);
  }
  set({ status: 'authed', user });
}

type UserResponse = { user: SessionUser };

export const auth = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async init() {
    const me = await api<{ setupRequired: boolean; setupAllowedHere: boolean; user: SessionUser | null }>('/api/me');
    if (!me.data) return set({ status: 'offline' });
    if (me.data.user) return enter(me.data.user);
    set(me.data.setupRequired ? { status: 'setup', allowedHere: me.data.setupAllowedHere } : { status: 'anonymous' });
  },
  async login(username: string, password: string) {
    const res = await api<UserResponse>('/api/login', 'POST', { username, password });
    if (res.data) await enter(res.data.user);
    return res.error;
  },
  async setup(username: string, name: string, password: string) {
    const res = await api<UserResponse>('/api/setup', 'POST', { username, name, password });
    if (res.data) await enter(res.data.user);
    return res.error;
  },
  async changePassword(current: string, next: string) {
    const res = await api<UserResponse>('/api/password', 'POST', { current, next });
    if (res.data) await enter(res.data.user);
    return res.error;
  },
  async logout() {
    progress.detach();
    await api('/api/logout', 'POST');
    location.hash = '#/';
    set({ status: 'anonymous' });
  },
};

// Oturum, tarayıcının tüm sekmelerinde ortaktır. Başka bir sekmede farklı hesapla giriş yapılırsa
// bu sekme eski kullanıcının ekranında kalmamalı: oturum yeniden okunur ve ekran gerçek hesaba geçer.
async function resync() {
  if (state.status !== 'authed') return;
  const me = await api<{ user: SessionUser | null }>('/api/me');
  if (!me.data || state.status !== 'authed') return;
  if (me.data.user?.username === state.user.username) return;
  progress.detach(false);
  location.hash = '#/';
  await auth.init();
}
setSessionChangedHandler(() => void resync());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void resync();
});

export function useAuth(): AuthState {
  return useSyncExternalStore(auth.subscribe, auth.get);
}
