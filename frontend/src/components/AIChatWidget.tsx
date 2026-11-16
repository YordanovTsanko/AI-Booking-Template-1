import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorFeedback } from '../api/axios';
import InlineFeedback from './InlineFeedback';
import type { ApiResponse, ChatMessage, ChatResponse, ChatSuggestion } from '../types';

const SESSION_KEY = 'aibt_chat_session';
const HISTORY_KEY = 'aibt_chat_history';
const MAX_STORED = 30;

const QUICK_PROMPTS = ['Искам час в петък следобед', 'Какви услуги предлагате?', 'Колко струва подстригване?', 'Свободно ли е утре сутринта?'];

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'Здравей! 💈 Аз съм AI асистентът на бръснарницата. Кажи ми каква услуга искаш и кога ти е удобно – например „Искам подстригване в петък следобед“.',
  suggestions: [],
};

const getSessionId = (): string | null => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

const loadHistory = (): ChatMessage[] => {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? (parsed as ChatMessage[]) : [WELCOME];
  } catch {
    return [WELCOME];
  }
};

export default function AIChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef<string | null>(getSessionId());

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text?: string) => {
    const message = String(text ?? input).trim();
    if (!message || sending) return;
    if (message.length > 500) {
      setError('Съобщението е твърде дълго – до 500 символа.');
      return;
    }

    setError('');
    setInput('');
    const history = messages
      .filter((m) => m.content !== WELCOME.content)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setSending(true);

    try {
      const res = await api.post<ApiResponse<ChatResponse>>('/ai/chat', { message, sessionId: sessionId.current, history });
      const { reply, suggestions = [] } = res.data.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || res.data.message, suggestions }]);
    } catch (err) {
      setError(getErrorFeedback(err).message);
    } finally {
      setSending(false);
    }
  };

  const pickSuggestion = (s: ChatSuggestion) => {
    const params = new URLSearchParams({ service: s.serviceId, staff: s.staffId, date: s.date, time: s.time });
    setOpen(false);
    navigate(`/booking?${params.toString()}`);
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setError('');
  };

  return (
    <>
      {open && (
        <section
          className="fixed bottom-24 right-4 z-[80] flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] animate-fade-in flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/70 sm:right-6"
          aria-label="AI асистент за резервации"
          role="dialog"
        >
          <div className="barber-stripes-animated h-1.5 w-full" aria-hidden="true" />
          <header className="flex items-center justify-between bg-gradient-to-r from-brand-700 to-accent-700 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg">💈</div>
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-wider">AI асистент</p>
                <p className="text-xs text-white/80">Помага ти да запазиш час</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={resetChat} className="rounded-lg px-2 py-1 text-xs text-white/80 hover:bg-white/15 hover:text-white" title="Нов разговор">
                Изчисти
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Затвори чата">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </header>

          <div ref={listRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-ink-900 p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-white/10 bg-ink-700 text-slate-200'
                  }`}
                >
                  {m.content}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={`${s.staffId}-${s.date}-${s.time}-${idx}`}
                          type="button"
                          onClick={() => pickSuggestion(s)}
                          className="rounded-xl border border-accent-500/40 bg-accent-500/10 px-3 py-2 text-left text-xs font-semibold text-accent-200 transition hover:border-accent-400 hover:bg-accent-500/20"
                        >
                          📅 {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-ink-700 px-4 py-3" aria-label="Зарежда...">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
                </div>
              </div>
            )}

            {messages.length <= 1 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => send(p)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:border-brand-500/50 hover:text-white">
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-ink-900 px-3 pt-3">
              <InlineFeedback type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-white/10 bg-ink-800 p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError('');
              }}
              maxLength={500}
              placeholder="Напиши съобщение..."
              className="input flex-1"
              disabled={sending}
              aria-label="Съобщение до AI асистента"
            />
            <button type="submit" className="btn-primary px-3" disabled={sending || !input.trim()} aria-label="Изпрати">
              {sending ? (
                'Зарежда...'
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3.1 2.3a.75.75 0 01.8-.1l13 7a.75.75 0 010 1.3l-13 7a.75.75 0 01-1-.9L5 10 2.9 3.1a.75.75 0 01.2-.8zM6.4 10.75l-1.6 5.1 9.6-5.1H6.4zm8-1.5L4.8 4.2l1.6 5.05h8z" />
                </svg>
              )}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 z-[80] flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-glow ring-2 ring-white/20 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-500/40 sm:right-6"
        aria-label={open ? 'Затвори AI асистента' : 'Отвори AI асистента'}
        aria-expanded={open}
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.4-4 8-9 8a9.9 9.9 0 01-4.3-.9L3 20l1.3-3.9A7.7 7.7 0 013 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
          </svg>
        )}
      </button>
    </>
  );
}
