import { ArrowRight, Headphones, Keyboard, ListChecks, MonitorPlay, MousePointerClick } from 'lucide-react';
import { TRAINING, audioInfo, durations, formatClock, formatMinutes, trainingSections } from '../data/sections';
import { interactions } from '../data/interactions';
import { scenes } from '../data/scenes';
import { go, paths } from '../router';
import { FourSteps } from '../components/FourSteps';

export function IntroPage() {
  return (
    <div className="page">
      <p className="eyebrow">Eğitimin amacı ve kullanımı</p>
      <h1>Başlamadan önce</h1>

      <section className="panel">
        <h2>Bu eğitimde neler var?</h2>
        <p>
          Bu eğitim boyunca sosyal mühendislik saldırılarını, güvenli e-posta ve internet kullanımını, USB bellekleri,
          sosyal medyayı, şahsi cihazları, güvenli kimlik doğrulamayı, hassas verilerin korunmasını ve siber saldırı
          tatbikatlarını ele alacağız.
        </p>
        <p className="lead">Temel kuralımız şudur: Şüpheli bir durumla karşılaştığınızda durun, doğrulayın, koruyun ve bildirin.</p>
        <FourSteps size="md" />
      </section>

      <section className="panel">
        <h2>Nasıl kullanılır?</h2>
        <ul className="howto">
          <li><Headphones size={20} aria-hidden="true" /><div><strong>Dinleyin veya okuyun.</strong> Her bölümün sesli anlatımı vardır; metnin tamamı ekranda da yer alır. Oynatıcıdan duraklatabilir, ileri–geri sarabilir, hızı ve ses seviyesini ayarlayabilirsiniz.</div></li>
          <li><MonitorPlay size={20} aria-hidden="true" /><div><strong>Kısa sahneleri izleyin.</strong> {scenes.length} senaryoda doğru davranış adım adım gösterilir.</div></li>
          <li><MousePointerClick size={20} aria-hidden="true" /><div><strong>Etkileşimleri yanıtlayın.</strong> {interactions.length} kısa soru bölümlerin içinde yer alır; bu sorular final sınavından ayrıdır.</div></li>
          <li><ListChecks size={20} aria-hidden="true" /><div><strong>Final sınavını tamamlayın.</strong> {TRAINING.questionCount} soru; başarı için en az {Math.ceil(TRAINING.questionCount * TRAINING.passRate)} doğru (%{TRAINING.passRate * 100}) gerekir. Başarısız olursanız ilgili bölümlere dönüp sınavı tekrar çözebilirsiniz.</div></li>
          <li><Keyboard size={20} aria-hidden="true" /><div><strong>Kaldığınız yerden devam edin.</strong> İlerlemeniz hesabınıza kaydedilir; başka bir bilgisayardan da sürdürebilirsiniz. Tüm içerik klavyeyle kullanılabilir.</div></li>
        </ul>
      </section>

      <section className="panel">
        <h2>Süre</h2>
        <table className="table">
          <tbody>
            <tr><th scope="row">Sesli anlatım ({trainingSections.length} bölüm)</th><td>{formatClock(durations.narration)}</td></tr>
            <tr><th scope="row">Kısa sahneler ({scenes.length})</th><td>{formatClock(durations.scenes)}</td></tr>
            <tr><th scope="row">Etkileşimler ({interactions.length}, tahmini)</th><td>{formatClock(durations.interactions)}</td></tr>
            <tr><th scope="row">Final sınavı (tahmini)</th><td>{formatClock(durations.quiz)}</td></tr>
            <tr className="table__total"><th scope="row">Toplam</th><td>≈ {formatMinutes(durations.total)}</td></tr>
          </tbody>
        </table>
        <p className="muted">
          {durations.allMeasured
            ? `Anlatım süresi, üretilen ses dosyalarının gerçek uzunluğundan hesaplanmıştır${audioInfo.voice ? ` (ses: ${audioInfo.voice})` : ''}.`
            : 'Ses dosyası bulunmayan bölümlerde süre, metin uzunluğundan tahmin edilmiştir.'}
        </p>
      </section>

      <button className="btn btn--primary btn--lg" onClick={() => go(paths.section(1))}>
        Bölüm 1’e başla <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
