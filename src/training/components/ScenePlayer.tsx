import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck, Bell, Bug, FileText, Hand, IdCard, KeyRound, Lock, Megaphone, MousePointer2, Pause, Phone, Play,
  RotateCcw, Search, Send, ShieldCheck, TriangleAlert, Usb, X, type LucideIcon,
} from 'lucide-react';
import type { SceneDef, SceneId, Tone } from '../types';
import { formatClock } from '../data/sections';
import { FourSteps } from './FourSteps';
import { MockEmailView } from './VisualCard';

type Badge = { Icon: LucideIcon; text: string; tone: Tone } | null;

const phishingEmail = {
  fromName: 'Genel Müdür',
  fromAddress: 'genelmudur@ornekkurum-yonetim.com',
  subject: 'ACİL – Ödemeyi hemen yapın',
  body: ['Toplantıdayım, arayamıyorum. Ödemeyi hemen yapın.'],
  linkLabel: 'Ödeme belgesini görüntüle',
  linkUrl: 'http://ornekkurum.odeme-onay.co/giris',
};

/** Her sahnenin adım bazlı rozetleri (sahnenin üzerinde beliren kısa vurgu). */
const badges: Record<SceneId, Badge[]> = {
  phishing: [
    null, null,
    { Icon: TriangleAlert, text: 'Risk işaretleri', tone: 'risk' },
    { Icon: Hand, text: 'Dur', tone: 'safe' },
    { Icon: Phone, text: 'Bildiğin numaradan doğrula', tone: 'safe' },
    { Icon: Search, text: 'Gerçek adres farklı', tone: 'safe' },
    { Icon: Megaphone, text: 'Bildirildi', tone: 'safe' },
  ],
  'wrong-email': [
    null,
    { Icon: TriangleAlert, text: 'Yanlış alıcı', tone: 'risk' },
    { Icon: TriangleAlert, text: 'Bilgi güvenliği olayı', tone: 'risk' },
    { Icon: ShieldCheck, text: 'Gizleme, koru', tone: 'safe' },
    { Icon: Megaphone, text: 'Bildirildi', tone: 'safe' },
  ],
  usb: [
    null, null,
    { Icon: TriangleAlert, text: 'Risk', tone: 'risk' },
    { Icon: X, text: 'Takma', tone: 'safe' },
    { Icon: ShieldCheck, text: 'Yalnızca izinli bellek', tone: 'safe' },
  ],
  mfa: [
    null,
    { Icon: TriangleAlert, text: 'Saldırı göstergesi olabilir', tone: 'risk' },
    { Icon: X, text: 'Reddedildi', tone: 'safe' },
    { Icon: KeyRound, text: 'Parola değiştirildi', tone: 'safe' },
    { Icon: Megaphone, text: 'Bildirildi', tone: 'safe' },
  ],
  'clean-desk': [
    null,
    { Icon: TriangleAlert, text: 'Açık ekran, ortada belgeler', tone: 'risk' },
    { Icon: Lock, text: 'Ekran kilitli', tone: 'safe' },
    { Icon: FileText, text: 'Belgeler dolapta', tone: 'safe' },
    { Icon: IdCard, text: 'Kart korunuyor', tone: 'safe' },
  ],
  suspicious: [
    null,
    { Icon: Bug, text: 'Antivirüs uyarısı', tone: 'risk' },
    { Icon: Hand, text: 'Kendi başına müdahale etme', tone: 'risk' },
    { Icon: X, text: 'Cihazı kullanma', tone: 'safe' },
    { Icon: Phone, text: 'BT birimine bildirildi', tone: 'safe' },
  ],
};

function Stage({ id, step }: { id: SceneId; step: number }): ReactNode {
  switch (id) {
    case 'phishing':
      return (
        <div className={`st st-laptop ${step >= 3 ? 'is-dim' : ''}`}>
          <MockEmailView email={phishingEmail} flagged={step >= 2} />
          <MousePointer2 className={`st-cursor ${step >= 1 ? 'is-near' : ''} ${step >= 3 ? 'is-away' : ''}`} size={26} aria-hidden="true" />
        </div>
      );
    case 'wrong-email':
      return (
        <div className={`st st-laptop ${step >= 3 ? 'is-dim' : ''}`}>
          <div className="st-compose">
            <div>Kime: <span className={step >= 1 ? 'mark-risk' : undefined}>a.yilmaz@baskafirma.com</span></div>
            <div>Konu: Müşteri listesi</div>
            <div className="st-file"><FileText size={16} aria-hidden="true" /> musteri-listesi.xlsx</div>
            <div className={`st-sent ${step === 0 ? 'is-flying' : ''}`}><Send size={18} aria-hidden="true" /> Gönderildi</div>
          </div>
          {step >= 4 && (
            <div className="st-form">
              <strong>Olay bildirimi</strong>
              <span>Gönderilen veri</span><span>Alıcı</span><span>Tarih ve saat</span><span>Yapılan işlemler</span>
            </div>
          )}
        </div>
      );
    case 'usb':
      return (
        <div className="st st-usb">
          <div className={`st-laptop st-laptop--small ${step === 2 ? 'is-alert' : ''}`}>
            {step === 2 ? (
              <ul className="st-risks"><li>Zararlı yazılım bulaşması</li><li>Veri kaybı</li><li>Yetkisiz veri aktarımı</li></ul>
            ) : (
              <span className="st-screen-text">Kurum bilgisayarı</span>
            )}
          </div>
          <div className={`st-stick pos-${Math.min(step, 3)}`}><Usb size={30} aria-hidden="true" /><small>Kaynağı bilinmiyor</small></div>
        </div>
      );
    case 'mfa':
      return (
        <div className="st st-mfa">
          <div className={`phone phone--tall ${step === 1 ? 'is-alert' : ''}`}>
            {[0, 1, 2].map((n) => (
              <div key={n} className={`phone__notif st-notif n${n} ${step >= 2 ? 'is-rejected' : ''}`}>
                <small><Bell size={12} aria-hidden="true" /> Kimlik Doğrulama</small>
                <p>Oturum açma isteği</p>
                <div className="phone__actions"><span>{step >= 2 ? 'Reddedildi' : 'Reddet'}</span>{step < 2 && <span>Onayla</span>}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'clean-desk':
      return (
        <div className="st st-desk">
          <div className={`desk-item ${step === 1 ? 'is-risk' : ''} ${step >= 2 ? 'is-safe' : ''}`}>
            {step >= 2 ? <Lock size={34} aria-hidden="true" /> : <span className="desk-screen" aria-hidden="true" />}
            <small>{step >= 2 ? 'Ekran kilitli' : 'Ekran açık'}</small>
          </div>
          <div className={`desk-item ${step === 1 || step === 2 ? 'is-risk' : ''} ${step >= 3 ? 'is-safe' : ''}`}>
            <FileText size={34} aria-hidden="true" />
            <small>{step >= 3 ? 'Belgeler kapalı dolapta' : 'Belgeler masada'}</small>
          </div>
          <div className={`desk-item ${step >= 1 && step <= 3 ? 'is-risk' : ''} ${step >= 4 ? 'is-safe' : ''}`}>
            <IdCard size={34} aria-hidden="true" />
            <small>{step >= 4 ? 'Erişim kartı sizde' : 'Erişim kartı masada'}</small>
          </div>
        </div>
      );
    case 'suspicious':
      return (
        <div className={`st st-laptop st-popups ${step >= 3 ? 'is-dim' : ''}`}>
          {[0, 1, 2].map((n) => <div key={n} className={`st-popup n${n}`}>Bilinmeyen pencere</div>)}
          {step >= 1 && <div className="st-av"><Bug size={16} aria-hidden="true" /> Antivirüs: tehdit algılandı</div>}
          {step === 2 && (
            <ul className="st-risks">
              <li>Uyarıyı kapatmak</li><li>Programı kendiniz silmek</li><li>İnternetten çözüm aramak</li>
            </ul>
          )}
        </div>
      );
  }
}

interface Props {
  scene: SceneDef;
  watched: boolean;
  onPlay: () => void;
  onWatched: () => void;
}

/** 15–20 saniyelik hareketli eğitim sahnesi; adım adım oynar, altyazılıdır ve klavyeyle kontrol edilebilir. */
export function ScenePlayer({ scene, watched, onPlay, onWatched }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const timer = useRef(0);
  const total = scene.steps.reduce((n, s) => n + s.duration, 0);
  const last = scene.steps.length - 1;

  // Üst bileşen her saniye yeniden çizildiğinden geri çağrı ref'te tutulur; aksi hâlde zamanlayıcı sürekli sıfırlanırdı.
  const onWatchedRef = useRef(onWatched);
  onWatchedRef.current = onWatched;

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => {
      if (step < last) setStep(step + 1);
      else { setPlaying(false); onWatchedRef.current(); }
    }, scene.steps[step].duration * 1000);
    return () => window.clearTimeout(timer.current);
  }, [playing, step, last, scene.steps]);

  const [run, setRun] = useState(0);
  const restart = () => {
    onPlay();
    setRun((r) => r + 1);
    setStep(0);
    setStarted(true);
    setPlaying(true);
  };
  const toggle = () => {
    if (playing) return setPlaying(false);
    if (!started || step === last) return restart();
    onPlay();
    setPlaying(true);
  };
  const current = scene.steps[step];
  const badge = badges[scene.id][step];
  const finished = started && !playing && step === last;
  const elapsed = finished ? total : scene.steps.slice(0, step).reduce((n, s) => n + s.duration, 0);

  return (
    <section className="scene" aria-label={`${scene.title}. ${scene.description}`}>
      <header className="scene__head">
        <span className="chip chip--video"><Play size={12} aria-hidden="true" /> Kısa sahne · {formatClock(total)}</span>
        <h3>{scene.title}</h3>
        {watched && <span className="chip chip--done"><BadgeCheck size={13} aria-hidden="true" /> İzlendi</span>}
      </header>
      <div className={`scene__stage tone-${current.tone} ${started ? '' : 'is-idle'}`}>
        {/* `run` anahtarı, sahne baştan oynatıldığında giriş animasyonlarını yeniden başlatır. */}
        <div className="scene__anim" key={run}>
          <Stage id={scene.id} step={step} />
          {badge && <div key={step} className={`scene__badge tone-${badge.tone}`}><badge.Icon size={20} aria-hidden="true" /> {badge.text}</div>}
        </div>
        {!started && (
          <button className="scene__start" onClick={toggle}>
            <Play size={28} aria-hidden="true" /> <span>Sahneyi oynat</span>
          </button>
        )}
      </div>
      <p className="scene__caption" aria-live="polite">{current.caption}</p>
      <FourSteps size="sm" active={current.step} />
      <div className="scene__controls">
        <button className="btn btn--ghost" onClick={toggle} aria-label={playing ? 'Sahneyi duraklat' : 'Sahneyi oynat'}>
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          {playing ? 'Duraklat' : 'Oynat'}
        </button>
        <button className="btn btn--ghost" onClick={restart}>
          <RotateCcw size={16} aria-hidden="true" /> Baştan
        </button>
        <div className="scene__dots" role="group" aria-label="Sahne adımları">
          {scene.steps.map((s, i) => (
            <button
              key={s.caption}
              className={i === step ? 'is-current' : i < step ? 'is-past' : undefined}
              aria-label={`Adım ${i + 1}: ${s.caption}`}
              aria-current={i === step}
              onClick={() => { setStarted(true); setPlaying(false); setStep(i); if (i === last) onWatched(); }}
            />
          ))}
        </div>
        <span className="scene__time">{formatClock(elapsed)} / {formatClock(total)}</span>
      </div>
    </section>
  );
}
