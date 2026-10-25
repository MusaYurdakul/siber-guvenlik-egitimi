import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'welcome' }
  | { name: 'intro' }
  | { name: 'section'; id: number }
  | { name: 'summary' }
  | { name: 'quiz' }
  | { name: 'result' }
  | { name: 'admin' }
  | { name: 'password' };

export const paths = {
  welcome: '#/',
  intro: '#/baslangic',
  section: (id: number) => `#/bolum/${id}`,
  summary: '#/ozet',
  quiz: '#/sinav',
  result: '#/sonuc',
  admin: '#/yonetici',
  password: '#/sifre',
};

function parse(hash: string): Route {
  const section = hash.match(/^#\/bolum\/(\d+)$/);
  if (section) return { name: 'section', id: Number(section[1]) };
  const name = (Object.keys(paths) as (keyof typeof paths)[]).find((k) => paths[k] === hash);
  return name && name !== 'section' ? { name } : { name: 'welcome' };
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash || '#/');
  return parse(hash);
}

export function go(hash: string) {
  location.hash = hash;
  window.scrollTo({ top: 0 });
}
