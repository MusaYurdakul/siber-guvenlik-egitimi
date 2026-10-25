import { useEffect, useState } from 'react';
import { CircleCheck, CirclePlay, Lock, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { formatClock, trainingSections } from './training/data/sections';
import { firstIncomplete, getSyncError, overallPercent, progress, useProgress, useSyncStatus } from './training/services/progress';
import { go, paths, useRoute, type Route } from './training/router';
import { WelcomePage } from './training/pages/WelcomePage';
import { IntroPage } from './training/pages/IntroPage';
import { ModulePage } from './training/pages/ModulePage';
import { SummaryPage } from './training/pages/SummaryPage';
import { QuizPage } from './training/pages/QuizPage';
import { ResultPage } from './training/pages/ResultPage';
import { AdminPage } from './training/pages/AdminPage';
import { ChangePasswordPage, LoginPage } from './training/pages/LoginPage';
import { auth, useAuth, type SessionUser } from './training/services/auth';

/** İzin verilmeyen bir adrese gelindiğinde yönlendirilecek yer; izinliyse null. */
function guard(route: Route, p: ReturnType<typeof progress.get>, me: SessionUser): string | null {
  if (route.name === 'admin') return me.role === 'admin' ? null : paths.welcome;
  if (route.name === 'welcome' || route.name === 'password') return null;
  if (!p.user) return paths.welcome;
  const next = firstIncomplete(p);
  if (route.name === 'section') {
    if (route.id < 1 || route.id > trainingSections.length) return paths.section(next ?? 1);
    return next !== null && route.id > next ? paths.section(next) : null;
  }
  if (route.name === 'summary' || route.name === 'quiz') {
    if (next !== null) return paths.section(next);
    return route.name === 'quiz' && p.completion ? paths.result : null;
  }
  if (route.name === 'result') return p.lastAttempt ? null : next !== null ? paths.section(next) : paths.summary;
  return null;
}

function Brand() {
  return (
    <a className="brand" href={paths.welcome}>
      <ShieldCheck size={22} aria-hidden="true" />
      <span>Siber Güvenlik Farkındalık Eğitimi</span>
    </a>
  );
}

export function App() {
  const session = useAuth();
  useEffect(() => { void auth.init(); }, []);

  if (session.status === 'authed' && !session.user.mustChange) return <Training me={session.user} />;
  return (
    <div className="app">
      <header className="topbar">
        <Brand />
        {session.status === 'authed' && (
          <div className="topbar__user"><button className="btn btn--ghost" onClick={() => void auth.logout()}><LogOut size={15} aria-hidden="true" /> Çıkış</button></div>
        )}
      </header>
      <main id="main">
        {session.status === 'authed' ? <ChangePasswordPage forced /> : <LoginPage state={session} />}
      </main>
    </div>
  );
}

function Training({ me }: { me: SessionUser }) {
  const route = useRoute();
  const p = useProgress();
  const syncStatus = useSyncStatus();
  const [menuOpen, setMenuOpen] = useState(false);
  const redirect = guard(route, p, me);

  // Yönetici girişte doğrudan panele gider; eğitimi de isterse alabilir.
  useEffect(() => {
    if (me.role === 'admin' && (location.hash === '' || location.hash === paths.welcome)) go(paths.admin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (redirect) go(redirect);
  }, [redirect]);
  const routeKey = route.name === 'section' ? `section-${route.id}` : route.name;
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [routeKey]);

  // Eğitim süresi: eğitim ekranları açık ve görünürken geçen süre.
  const outsideTraining = route.name === 'welcome' || route.name === 'admin' || route.name === 'password';
  const counting = !outsideTraining && !p.completion;
  useEffect(() => {
    if (!counting) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') progress.update((d) => { d.activeSeconds += 1; });
    }, 1000);
    return () => window.clearInterval(t);
  }, [counting]);

  if (redirect) return null;
  const percent = overallPercent(p);
  const next = firstIncomplete(p);
  const inTraining = p.user && !outsideTraining;
  const currentId = route.name === 'section' ? route.id : null;

  return (
    <div className={`app ${inTraining ? 'has-sidebar' : ''}`}>
      <a className="skip-link" href="#main">İçeriğe geç</a>
      <header className="topbar">
        {inTraining && (
          <button className="icon-btn topbar__menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="sidebar" aria-label="Bölüm listesi">
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        )}
        <Brand />
        {!inTraining && (
          <div className="topbar__user">
            <span className="topbar__name">{me.name}</span>
            {me.role === 'admin' && (route.name === 'admin' ? <a href={paths.welcome}>Eğitim</a> : <a href={paths.admin}>Yönetici paneli</a>)}
            <a href={paths.password}>Şifre değiştir</a>
            <button className="btn btn--ghost" onClick={() => void auth.logout()}><LogOut size={15} aria-hidden="true" /> Çıkış</button>
          </div>
        )}
        {inTraining && (
          <div className="topbar__progress">
            <span className="topbar__label">
              Eğitim İlerlemesi: <strong>%{percent}</strong>
              {currentId && <span className="topbar__section"> · Bölüm {currentId} / {trainingSections.length}</span>}
            </span>
            <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Eğitim ilerlemesi">
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}
      </header>

      {inTraining && (
        <nav id="sidebar" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Eğitim bölümleri">
          <ol>
            {trainingSections.map((s) => {
              const done = p.completedSections.includes(s.id);
              const locked = next !== null && s.id > next;
              const label = (
                <>
                  <span className="sidebar__state">
                    {done ? <CircleCheck size={18} aria-label="Tamamlandı" /> : locked ? <Lock size={16} aria-label="Kilitli" /> : <CirclePlay size={18} aria-label="Açık" />}
                  </span>
                  <span className="sidebar__title">{s.id}. {s.title}</span>
                  <span className="sidebar__time">{formatClock(s.estimatedDuration)}</span>
                </>
              );
              return (
                <li key={s.id} className={`${done ? 'is-done' : ''} ${locked ? 'is-locked' : ''}`}>
                  {locked ? <span className="sidebar__item">{label}</span> : (
                    <a className="sidebar__item" href={paths.section(s.id)} aria-current={currentId === s.id ? 'page' : undefined}>{label}</a>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="sidebar__extra">
            {next === null ? (
              <>
                <a className="sidebar__item" href={paths.summary} aria-current={route.name === 'summary' ? 'page' : undefined}>Eğitim özeti</a>
                <a className="sidebar__item" href={p.completion ? paths.result : paths.quiz} aria-current={route.name === 'quiz' || route.name === 'result' ? 'page' : undefined}>
                  {p.completion ? 'Tamamlama ekranı' : 'Final sınavı'}
                </a>
              </>
            ) : (
              <span className="sidebar__item is-locked"><Lock size={16} aria-hidden="true" /> Final sınavı — tüm bölümlerden sonra</span>
            )}
            <button className="sidebar__item sidebar__logout" onClick={() => void auth.logout()}>
              <LogOut size={16} aria-hidden="true" /> Çıkış ({me.name})
            </button>
          </div>
        </nav>
      )}

      <main id="main" tabIndex={-1}>
        {syncStatus === 'failed' && (
          <p className="sync-warning" role="status">
            İlerlemeniz sunucuya kaydedilemedi; bağlantınızı kontrol edin. Bu bilgisayarda saklanıyor ve kendiliğinden yeniden deneniyor.
            <small>Ayrıntı: {getSyncError() || 'bilinmiyor'}</small>
          </p>
        )}
        {route.name === 'welcome' && <WelcomePage />}
        {route.name === 'intro' && <IntroPage />}
        {route.name === 'section' && <ModulePage key={route.id} section={trainingSections[route.id - 1]} />}
        {route.name === 'summary' && <SummaryPage />}
        {route.name === 'quiz' && <QuizPage />}
        {route.name === 'result' && <ResultPage />}
        {route.name === 'admin' && <AdminPage me={me} />}
        {route.name === 'password' && <ChangePasswordPage forced={false} />}
      </main>
    </div>
  );
}
