import { useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound, LogIn, ShieldCheck, UserCog } from 'lucide-react';
import { TRAINING } from '../data/sections';
import { auth, type AuthState } from '../services/auth';

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className="login">
      <p className="eyebrow"><ShieldCheck size={16} aria-hidden="true" /> {TRAINING.title}</p>
      <section className="panel login__panel">
        <h1>{title}</h1>
        <p className="muted">{lead}</p>
        {children}
      </section>
    </div>
  );
}

/** Ortak form iskeleti: gönderim sırasında düğmeyi kilitler, sunucunun hata iletisini gösterir. */
function useSubmit(action: () => Promise<string>) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setError(await action());
    setBusy(false);
  };
  return { error, busy, onSubmit };
}

export function LoginPage({ state }: { state: AuthState }) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');

  const login = useSubmit(() => auth.login(username, password));
  const setup = useSubmit(async () => (password === repeat ? auth.setup(username, name, password) : 'Şifreler aynı değil.'));

  if (state.status === 'loading') return <Shell title="Yükleniyor…" lead="Oturum durumu kontrol ediliyor."><span /></Shell>;
  if (state.status === 'offline') {
    return (
      <Shell title="Sunucuya ulaşılamıyor" lead="Eğitim sunucusu çalışmıyor olabilir. Sunucunun açık olduğundan emin olup sayfayı yenileyin.">
        <button className="btn btn--primary" onClick={() => location.reload()}>Yeniden dene</button>
      </Shell>
    );
  }

  if (state.status === 'setup') {
    if (!state.allowedHere) {
      return <Shell title="Kurulum bekleniyor" lead="Eğitim henüz kurulmadı. İlk yönetici hesabı, sunucunun çalıştığı bilgisayardan oluşturulmalıdır."><span /></Shell>;
    }
    return (
      <Shell title="İlk yönetici hesabını oluşturun" lead="Bu hesapla çalışan hesaplarını açacak ve raporları göreceksiniz. Bu ekran yalnızca bir kez ve yalnızca bu bilgisayarda görünür.">
        <form className="form" onSubmit={setup.onSubmit}>
          <label>Ad Soyad
            <input required minLength={3} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label>Yönetici kullanıcı adı
            <input required minLength={2} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </label>
          <label>Şifre <span className="muted">(en az 8 karakter)</span>
            <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </label>
          <label>Şifre (tekrar)
            <input required type="password" minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" />
          </label>
          {setup.error && <p className="form__error" role="alert">{setup.error}</p>}
          <button className="btn btn--primary btn--lg" type="submit" disabled={setup.busy}><UserCog size={17} aria-hidden="true" /> Yönetici hesabını oluştur</button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell title="Giriş yapın" lead="Size verilen kullanıcı adı ve şifreyle giriş yapın.">
      <form className="form" onSubmit={login.onSubmit}>
        <label>Kullanıcı adı
          <input required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label>Şifre
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {login.error && <p className="form__error" role="alert">{login.error}</p>}
        <button className="btn btn--primary btn--lg" type="submit" disabled={login.busy}><LogIn size={17} aria-hidden="true" /> Giriş yap</button>
      </form>
    </Shell>
  );
}

/** Yöneticinin verdiği geçici şifreyle giren kullanıcı, devam etmeden önce kendi şifresini belirler. */
export function ChangePasswordPage({ forced }: { forced: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [done, setDone] = useState(false);
  const form = useSubmit(async () => {
    if (next !== repeat) return 'Yeni şifreler aynı değil.';
    const error = await auth.changePassword(current, next);
    if (!error) setDone(true);
    return error;
  });

  return (
    <Shell
      title={forced ? 'Kendi şifrenizi belirleyin' : 'Şifre değiştir'}
      lead={forced ? 'Size verilen şifre geçicidir. Eğitime başlamadan önce yalnızca sizin bileceğiniz bir şifre belirleyin.' : 'Şifreniz kişiye özeldir; kimseyle paylaşmayın.'}
    >
      {done ? (
        <p role="status"><strong>Şifreniz değiştirildi.</strong> <a href="#/">Eğitime dön</a></p>
      ) : (
        <form className="form" onSubmit={form.onSubmit}>
          <label>{forced ? 'Size verilen şifre' : 'Mevcut şifre'}
            <input required type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </label>
          <label>Yeni şifre <span className="muted">(en az 8 karakter)</span>
            <input required type="password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </label>
          <label>Yeni şifre (tekrar)
            <input required type="password" minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" />
          </label>
          {form.error && <p className="form__error" role="alert">{form.error}</p>}
          <button className="btn btn--primary btn--lg" type="submit" disabled={form.busy}><KeyRound size={17} aria-hidden="true" /> Şifreyi kaydet</button>
        </form>
      )}
    </Shell>
  );
}
