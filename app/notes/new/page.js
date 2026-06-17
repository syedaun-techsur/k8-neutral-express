// app/notes/new/page.js
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NoteForm.module.css';

export default function NewNotePage() {
  const router = useRouter();
  const titleRef = useRef(null);
  const [titleError, setTitleError] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.title.value.trim();
    if (!title) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }
    setTitleError(false);
    setApiError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: form.body.value,
          pinned: form.pinned.checked,
        }),
      });
      if (res.status === 201) {
        router.push('/');
      } else {
        const data = await res.json().catch(() => ({}));
        setApiError(data.message || 'Something went wrong. Please try again.');
        setSaving(false);
      }
    } catch {
      setApiError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <title>New note — QuickNotes</title>
      <header>
        <nav className="navbar">
          <a href="/" className="navBack">← Home</a>
          <span className="pageTitle">New note</span>
        </nav>
      </header>
      <main>
        <div className="container">
          <div className={styles.formSection}>
            {apiError && (
              <div className="errorBanner" role="alert">{apiError}</div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="title" className="formLabel">Title *</label>
                <input
                  ref={titleRef}
                  id="title"
                  name="title"
                  type="text"
                  className="formInput"
                  autoFocus
                  aria-invalid={titleError ? 'true' : 'false'}
                  aria-describedby={titleError ? 'title-error' : undefined}
                  onChange={() => { if (titleError) setTitleError(false); }}
                />
                {titleError && (
                  <p id="title-error" className="fieldError" role="alert">Title is required</p>
                )}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="body" className="formLabel">Body</label>
                <textarea id="body" name="body" className="formTextarea" />
              </div>
              <div className={styles.fieldGroup}>
                <label className="checkboxRow">
                  <input type="checkbox" id="pinned" name="pinned" />
                  Pin this note
                </label>
              </div>
              <div className={styles.submitRow}>
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
