'use client';

import { useState } from 'react';

const INITIAL = { name: '', email: '', message: '' };

/**
 * ContactForm — Submits to POST /api/contact which saves to
 * the `contact_messages` table in Supabase.
 */
export default function ContactForm() {
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState('idle');
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim())                          next.name    = 'Name is required.';
    else if (form.name.trim().length > 120)         next.name    = 'Name must be 120 characters or fewer.';

    if (!form.email.trim())                         next.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                                                    next.email   = 'Please enter a valid email.';

    if (!form.message.trim())                       next.message = 'Message is required.';
    else if (form.message.trim().length < 10)       next.message = 'Message must be at least 10 characters.';
    else if (form.message.trim().length > 2000)      next.message = 'Message must be 2000 characters or fewer.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('loading');
    setServerError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    form.name.trim(),
          email:   form.email.trim(),
          message: form.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
          setStatus('idle');
          return;
        }
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setStatus('success');
      setForm(INITIAL);
    } catch (err) {
      setServerError(err.message || 'Failed to send message.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setServerError('');
    setErrors({});
  };

  const inputBase =
    'bg-background border rounded-xl px-4 py-3 text-text-primary w-full transition-all duration-200 outline-none placeholder:text-text-muted'
    + ' text-sm sm:text-sm';
  const inputClasses = (field) =>
    `${inputBase} ${
      errors[field]
        ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
        : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.15)]'
    }`;

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'var(--success-muted)', border: '1px solid var(--success)' }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: 'var(--success)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h3 className="font-sora font-bold text-xl text-text-primary mb-2">
          Message Sent!
        </h3>
        <p className="text-text-muted text-sm mb-6 max-w-xs">
          Thanks for reaching out. I&apos;ll get back to you within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="text-sm text-accent hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {status === 'error' && serverError && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in"
          style={{
            background: 'var(--error-muted)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
          }}
        >
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="flex-1">{serverError}</span>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 opacity-60 hover:opacity-100 transition cursor-pointer"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div>
        <label htmlFor="contact-name" className="block text-sm text-text-secondary mb-1.5 font-medium">Name</label>
        <input id="contact-name" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required autoComplete="name" disabled={status === 'loading'} className={inputClasses('name')} />
        {errors.name && (
          <p className="mt-1.5 text-xs text-error flex items-center gap-1 animate-fade-in">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm text-text-secondary mb-1.5 font-medium">Email</label>
        <input id="contact-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required autoComplete="email" disabled={status === 'loading'} className={inputClasses('email')} />
        {errors.email && (
          <p className="mt-1.5 text-xs text-error flex items-center gap-1 animate-fade-in">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm text-text-secondary mb-1.5 font-medium">Message</label>
        <textarea id="contact-message" name="message" value={form.message} onChange={handleChange} placeholder="Tell me about your project…" required rows={5} disabled={status === 'loading'} className={`${inputClasses('message')} resize-none`} style={{ minHeight: '140px', fontSize: '16px' }} />
        <div className="flex items-start justify-between mt-1.5">
          {errors.message ? (
            <p className="text-xs text-error flex items-center gap-1 animate-fade-in">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.message}
            </p>
          ) : <span />}
          <span className="text-xs ml-auto shrink-0" style={{ color: form.message.length > 1800 ? 'var(--error)' : 'var(--text-muted)' }}>
            {form.message.length}/2000
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="relative w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30 active:scale-[0.98] overflow-hidden group"
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        {status === 'loading' ? (
          <>
            <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            Sending…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Send Message
          </>
        )}
      </button>

      <p className="text-center text-xs text-text-muted">
        I typically respond within <span className="text-text-secondary font-medium">24 hours</span>.
      </p>
    </form>
  );
}
