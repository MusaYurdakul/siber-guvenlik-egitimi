import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Copy, Download, KeyRound, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { api, type SessionUser } from '../services/auth';
import { fetchReport, type CreatedAccount, type RecordStore } from '../services/records';
import { buildReport, toCsv } from '../services/report';
import { formatMinutes, trainingSections } from '../data/sections';

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const pct = (rate: number) => Math.round(rate * 100);
const STATUS_CHIP = { 'Başarılı': 'chip--done', 'Başarısız': 'chip--risk', 'Devam ediyor': 'chip--video', 'Başlamadı': '' } as const;

export function AdminPage({ me }: { me: SessionUser }) {
  const [store, setStore] = useState<RecordStore | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', username: '', department: '', password: '', role: 'user' });
  const [bulkText, setBulkText] = useState('');
  const [created, setCreated] = useState<CreatedAccount[]>([]);

  const load = () => { void fetchReport().then((r) => (r.data ? setStore(r.data) : setError(r.error))); };
  useEffect(load, []);
  const report = useMemo(() => (store ? buildReport(store) : null), [store]);

  const run = async (path: string, body: unknown, success: string) => {
    setError('');
    setNotice('');
    const res = await api(path, 'POST', body);
    if (res.ok) { setNotice(success); load(); } else setError(res.error);
    return res.ok;
  };
  const addUser = async (e: FormEvent) => {
    e.preventDefault();
    if (await run('/api/users', form, `${form.name} için hesap açıldı. İlk girişte kendi şifresini belirlemesi istenecek.`)) {
      setForm({ name: '', username: '', department: form.department, password: '', role: 'user' });
    }
  };
  const bulkRows = bulkText
    .split('\n')
    .map((line) => line.split(/[;\t,]/).map((cell) => cell.trim()))
    .filter(([name]) => name && name.length >= 3)
    .map(([name, department = '']) => ({ name, department }));
  const addBulk = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const res = await api<{ created: CreatedAccount[] }>('/api/users/bulk', 'POST', { users: bulkRows });
    if (!res.data) return setError(res.error);
    setCreated(res.data.created);
    setBulkText('');
    load();
  };
  // Çalışanlara verilecek adres: sunucunun ağ adresi (yönetici localhost'tan bağlıysa bile).
  const onServer = ['localhost', '127.0.0.1'].includes(location.hostname);
  const loginAddress = (onServer && store?.addresses[0]) || location.origin;
  const createdText = created.map((c) => `${c.name} — kullanıcı adı: ${c.username} — geçici şifre: ${c.password} — adres: ${loginAddress}`).join('\n');
  const downloadCreated = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [['Ad Soyad', 'Birim', 'Kullanıcı adı', 'Geçici şifre', 'Giriş adresi'], ...created.map((c) => [c.name, c.department, c.username, c.password, loginAddress])];
    const url = URL.createObjectURL(new Blob(['﻿' + lines.map((l) => l.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: 'giris-bilgileri.csv' }).click();
    URL.revokeObjectURL(url);
  };
  const resetPassword = (username: string) => {
    const password = prompt(`${username} için yeni geçici şifre (en az 8 karakter):`);
    if (password) void run('/api/users/reset', { username, password }, `${username} şifresi sıfırlandı; ilk girişte değiştirmesi istenecek.`);
  };
  const remove = (username: string) => {
    if (confirm(`${username} hesabı silinsin mi? Sınav ve tamamlanma kayıtları raporda kalır.`)) void run('/api/users/delete', { username }, `${username} hesabı silindi.`);
  };
  const download = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([toCsv(report.users)], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: 'egitim-raporu.csv' }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page admin">
      <p className="eyebrow">Yönetici paneli</p>
      <h1>Eğitim raporu ve hesaplar</h1>
      <div aria-live="polite">
        {error && <p className="form__error" role="alert">{error}</p>}
        {notice && <p className="form__ok">{notice}</p>}
      </div>

      {report && store && (
        <>
          <ul className="tiles">
            <li><strong>{report.totals.participants}</strong> katılımcı</li>
            <li><strong>{report.totals.completed}</strong> tamamlayan</li>
            <li><strong>{report.totals.attempts}</strong> sınav denemesi</li>
            <li><strong>{report.totals.attempts ? `%${report.totals.averageScore}` : '—'}</strong> ortalama puan</li>
            <li><strong>{report.totals.averageAttemptsToPass || '—'}</strong> ort. geçiş denemesi</li>
          </ul>

          <section className="panel">
            <div className="panel__head">
              <h2>Katılımcılar</h2>
              <span>
                <button className="btn btn--ghost" onClick={load}><RefreshCw size={15} aria-hidden="true" /> Yenile</button>{' '}
                <button className="btn btn--ghost" onClick={download} disabled={!report.users.length}><Download size={15} aria-hidden="true" /> CSV indir</button>
              </span>
            </div>
            <div className="table-wrap">
              <table className="table table--data">
                <thead>
                  <tr><th>Katılımcı</th><th>Birim</th><th>Durum</th><th>Bölüm</th><th>Tamamlanma</th><th>Süre</th><th>Puan</th><th>Deneme</th><th>Geçtiği deneme</th></tr>
                </thead>
                <tbody>
                  {report.users.map((u) => (
                    <tr key={u.userId}>
                      <td>{u.userName}<br /><small className="muted">{u.userId}{u.isAdmin && ' · yönetici hesabı'}{!u.hasAccount && ' · hesap silinmiş'}</small></td>
                      <td>{u.department || '—'}</td>
                      <td><span className={`chip ${STATUS_CHIP[u.status]}`}>{u.status}</span></td>
                      <td>{u.completedSections} / {trainingSections.length}</td>
                      <td>{day(u.completedAt)}</td>
                      <td>{u.trainingDurationSec ? formatMinutes(u.trainingDurationSec) : '—'}</td>
                      <td>{u.bestScore === null ? '—' : `%${u.bestScore}`}</td>
                      <td>{u.attempts}</td>
                      <td>{u.passedOnAttempt ?? '—'}</td>
                    </tr>
                  ))}
                  {!report.users.length && <tr><td colSpan={9} className="muted">Henüz çalışan hesabı yok. Aşağıdan hesap açın.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2>Toplu hesap aç</h2>
            <p className="muted">
              Her satıra bir kişi yazın veya Excel’den yapıştırın: <strong>Ad Soyad</strong> ya da <strong>Ad Soyad; Birim</strong>.
              Kullanıcı adları ve geçici şifreler otomatik üretilir.
            </p>
            <form className="form" onSubmit={addBulk}>
              <label>Katılımcı listesi
                <textarea rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={'Ayşe Yılmaz; Muhasebe\nMehmet Demir; Üretim'} />
              </label>
              <button className="btn btn--primary" type="submit" disabled={!bulkRows.length}>
                <UserPlus size={16} aria-hidden="true" /> {bulkRows.length || ''} hesap aç
              </button>
            </form>
            {created.length > 0 && (
              <div className="created">
                <p className="form__ok">
                  {created.length} hesap açıldı. Şifreler yalnızca şimdi görünür; listeyi indirip kişilere iletin. İlk girişte herkes kendi şifresini belirler.
                </p>
                <p>Giriş adresi: <strong className="mono">{loginAddress}</strong></p>
                <p>
                  <button className="btn btn--primary" onClick={downloadCreated}><Download size={15} aria-hidden="true" /> Giriş bilgilerini indir (CSV)</button>{' '}
                  <button className="btn btn--ghost" onClick={() => void navigator.clipboard?.writeText(createdText)}><Copy size={15} aria-hidden="true" /> Kopyala</button>
                </p>
                <div className="table-wrap">
                  <table className="table table--data">
                    <thead><tr><th>Ad Soyad</th><th>Birim</th><th>Kullanıcı adı</th><th>Geçici şifre</th></tr></thead>
                    <tbody>
                      {created.map((c) => (
                        <tr key={c.username}><td>{c.name}</td><td>{c.department || '—'}</td><td className="mono">{c.username}</td><td className="mono">{c.password}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Tek hesap aç</h2>
            <form className="form form--grid" onSubmit={addUser}>
              <label>Ad Soyad
                <input required minLength={3} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="off" />
              </label>
              <label>Kullanıcı adı <span className="muted">(sicil no veya e-posta)</span>
                <input required minLength={2} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
              </label>
              <label>Birim
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} autoComplete="off" />
              </label>
              <label>Geçici şifre <span className="muted">(en az 8 karakter)</span>
                <input required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" />
              </label>
              <label>Rol
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="user">Çalışan</option>
                  <option value="admin">Yönetici</option>
                </select>
              </label>
              <button className="btn btn--primary" type="submit"><UserPlus size={16} aria-hidden="true" /> Hesap aç</button>
            </form>
            <p className="muted">Geçici şifreyi çalışana güvenli bir yoldan iletin; ilk girişte kendi şifresini belirlemesi zorunludur.</p>
          </section>

          <section className="panel">
            <h2>Hesaplar</h2>
            <div className="table-wrap">
              <table className="table table--data">
                <thead><tr><th>Kullanıcı adı</th><th>Ad Soyad</th><th>Birim</th><th>Rol</th><th>Şifre</th><th>İşlem</th></tr></thead>
                <tbody>
                  {store.users.map((u) => (
                    <tr key={u.username}>
                      <td>{u.username}</td>
                      <td>{u.name}</td>
                      <td>{u.department || '—'}</td>
                      <td>{u.role === 'admin' ? 'Yönetici' : 'Çalışan'}</td>
                      <td>{u.mustChange ? 'Geçici (değiştirilmedi)' : 'Kullanıcı belirledi'}</td>
                      <td className="table__actions">
                        <button className="btn btn--ghost" onClick={() => resetPassword(u.username)} disabled={u.username === me.username}>
                          <KeyRound size={14} aria-hidden="true" /> Şifre sıfırla
                        </button>
                        <button className="btn btn--ghost" onClick={() => remove(u.username)} disabled={u.username === me.username}>
                          <Trash2 size={14} aria-hidden="true" /> Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h2>Konulara göre hata oranı</h2>
            <ul className="bars">
              {report.sections.map((s) => (
                <li key={s.id}>
                  <span className="bars__label">{s.id}. {s.title}</span>
                  <span className="bars__track" aria-hidden="true"><span style={{ width: `${pct(s.rate)}%` }} /></span>
                  <span className="bars__value">{s.asked ? `%${pct(s.rate)} (${s.wrong}/${s.asked})` : '—'}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>En çok hata yapılan sorular</h2>
            {report.questions.length ? (
              <ol className="review">
                {report.questions.map((q) => (
                  <li key={q.id}><p>{q.text}</p><p className="muted">Bölüm {q.sectionId} · {q.wrong} / {q.asked} yanlış (%{pct(q.rate)})</p></li>
                ))}
              </ol>
            ) : <p className="muted">Henüz hatalı yanıt kaydı yok.</p>}
          </section>
        </>
      )}
    </div>
  );
}
