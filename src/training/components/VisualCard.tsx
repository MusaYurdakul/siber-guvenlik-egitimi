import { Paperclip, Check, X } from 'lucide-react';
import type { CompareSide, MockEmail, Visual } from '../types';
import { Icon } from './Icon';

export function MockEmailView({ email, flagged }: { email: MockEmail; flagged?: boolean }) {
  return (
    <div className="mock-email">
      <div className="mock-email__head">
        <span className="mock-email__avatar" aria-hidden="true">{email.fromName[0]}</span>
        <div>
          <div className="mock-email__from">
            {email.fromName} <span className={flagged ? 'mark-risk' : undefined}>&lt;{email.fromAddress}&gt;</span>
          </div>
          <div className="mock-email__subject">{email.subject}</div>
        </div>
      </div>
      <div className="mock-email__body">
        {email.body.map((line) => <p key={line}>{line}</p>)}
        {email.linkLabel && (
          <p>
            <span className="mock-link">{email.linkLabel}</span>
            <span className={`mock-url ${flagged ? 'mark-risk' : ''}`}>{email.linkUrl}</span>
          </p>
        )}
        {email.attachment && <p className="mock-attachment"><Paperclip size={14} aria-hidden="true" /> {email.attachment}</p>}
      </div>
    </div>
  );
}

function Side({ side }: { side: CompareSide }) {
  return (
    <div className={`compare__side tone-${side.tone}`}>
      <h4>
        {side.tone === 'safe' && <Check size={16} aria-hidden="true" />}
        {side.tone === 'risk' && <X size={16} aria-hidden="true" />}
        {side.heading}
      </h4>
      <ul>
        {side.lines.map((l) => (
          <li key={l.text}>
            <span className={l.mono ? 'mono' : undefined}>{l.text}</span>
            {l.mark && <em>{l.mark}</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Metne bağlı eğitim görseli. `src` tanımlıysa üretilmiş görsel dosyası, değilse veriyle tanımlı görsel çizilir. */
export function VisualCard({ visual }: { visual: Visual }) {
  const r = visual.render;
  return (
    <figure className="visual" aria-label={visual.image_description}>
      {visual.src ? (
        <img src={visual.src} alt={visual.image_description} loading="lazy" />
      ) : (
        <div className="visual__canvas" role="img" aria-label={visual.image_description}>
          {r.kind === 'cards' && (
            <ul className="vcards">
              {r.items.map((it) => (
                <li key={it.label} className={`tone-${it.tone ?? 'info'}`}>
                  <Icon name={it.icon} />
                  <strong>{it.label}</strong>
                  {it.note && <span>{it.note}</span>}
                </li>
              ))}
            </ul>
          )}
          {r.kind === 'compare' && <div className="compare"><Side side={r.left} /><Side side={r.right} /></div>}
          {r.kind === 'email' && (
            <div className="vemail">
              <MockEmailView email={r.email} flagged />
              <ul className="flags">{r.flags.map((f) => <li key={f}><Icon name="alert" size={16} /> {f}</li>)}</ul>
            </div>
          )}
          {r.kind === 'phone' && (
            <div className="vphone">
              <div className="phone">
                <div className="phone__notif">
                  <small>{r.app}</small>
                  {r.lines.map((l) => <p key={l}>{l}</p>)}
                  <div className="phone__actions">{r.actions.map((a) => <span key={a}>{a}</span>)}</div>
                </div>
              </div>
              <p className="vphone__note">{r.note}</p>
            </div>
          )}
          {r.kind === 'flow' && (
            <>
              <ol className="vflow">
                {r.steps.map((s, i) => (
                  <li key={s.label}><span className="vflow__n">{i + 1}</span><Icon name={s.icon} /><span>{s.label}</span></li>
                ))}
              </ol>
              {r.note && <p className="vflow__note">{r.note}</p>}
            </>
          )}
        </div>
      )}
      <figcaption>{visual.title}</figcaption>
    </figure>
  );
}
