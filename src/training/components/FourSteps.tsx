import { BadgeCheck, Hand, Megaphone, ShieldCheck } from 'lucide-react';
import type { FourStep } from '../types';

export const FOUR_STEPS: { id: FourStep; label: string; hint: string; Icon: typeof Hand }[] = [
  { id: 'dur', label: 'Durun', hint: 'Şüpheli işlemi devam ettirmeyin.', Icon: Hand },
  { id: 'dogrula', label: 'Doğrulayın', hint: 'Talebin doğruluğunu kontrol edin.', Icon: BadgeCheck },
  { id: 'koru', label: 'Koruyun', hint: 'Delil niteliğindeki mesaj ve kayıtları koruyun.', Icon: ShieldCheck },
  { id: 'bildir', label: 'Bildirin', hint: 'Olayı vakit kaybetmeden belirlenen birime iletin.', Icon: Megaphone },
];

/** Eğitimin ana teması: Durun → Doğrulayın → Koruyun → Bildirin. */
export function FourSteps({ active, size = 'md' }: { active?: FourStep; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <ol className={`four-steps four-steps--${size}`} aria-label="Dört adım: Durun, doğrulayın, koruyun, bildirin">
      {FOUR_STEPS.map(({ id, label, hint, Icon }) => (
        <li key={id} className={active === id ? 'is-active' : undefined} aria-current={active === id ? 'step' : undefined}>
          <span className="four-steps__icon"><Icon size={size === 'lg' ? 34 : size === 'sm' ? 16 : 22} aria-hidden="true" /></span>
          <span className="four-steps__label">{label}</span>
          {size !== 'sm' && <span className="four-steps__hint">{hint}</span>}
        </li>
      ))}
    </ol>
  );
}
