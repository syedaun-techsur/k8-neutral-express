// app/notes/[id]/edit/EditNoteClient.js
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NoteForm.module.css';

export default function EditNoteClient({ note }) {
  const router = useRouter();
  const titleRef = useRef(null);
  const [titleError, setTitleError] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState('idle'); // 'idle' | 'confirming' | 'deleting'
  const [deleteError, setDeleteError] = useState(null);

  async function handleSave(e) {
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
      const res = await fetch('/api/notes/' + note.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body: form.body.value,
          pinned: form.pinned.checked,
        }),
      });
      if (res.status === 200) {
        router.push('/');
      } else if (res.status === 404) {
        setApiError('Note not found. It may have been deleted.');
        setSaving(false);
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

  async function handleDeleteClick() {
    if (deleteState === 'idle') {
      setDeleteState('confirming');
      setDeleteError(null);
    } else if (deleteState === 'confirming') {
      setDeleteState('deleting');
      try {
        const res = await fetch('/api/notes/' + note.id, { method: 'DELETE' });
        if (res.status === 204) {
          router.push('/');
        } else if (res.status === 404) {
          setDeleteError('Note not found. It may have already been deleted.');
          setDeleteState('idle');
        } else {
          setDeleteError('Could not delete note. Please try again.');
          setDeleteState('idle');
        }
      } catch {
        setDeleteError('Could not delete note. Please try again.');
        setDeleteState('idle');
      }
    }
  }

  function handleCancelDelete() {
    setDeleteState('idle');
    setDeleteError(null);
  }

  return (
    <div className={styles.page}>
      <header>
        <nav className="navbar">
          <a href="/" className="navBack">← Home</a>
          <span className="pageTitle">Edit note</span>
        </nav>
      </header>
      <main>
        <div className="container">
          <div className={styles.formSection}>
            {apiError && (
              <div className="errorBanner" role="alert">{apiError}</div>
            )}
            {deleteError && (
              <div className="errorBanner" role="alert">
                {deleteError}
                {deleteError.includes('already been deleted') && (
                  <> <a href="/">Back to all notes</a></>
                )}
              </div>
            )}
            <form onSubmit={handleSave} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="title" className="formLabel">Title *</label>
                <input
                  ref={titleRef}
                  id="title"
                  name="title"
                  type="text"
                  className="formInput"
                  defaultValue={note.title}
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
                <textarea
                  id="body"
                  name="body"
                  className="formTextarea"
                  defaultValue={note.body || ''}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className="checkboxRow">
                  <input
                    type="checkbox"
                    id="pinned"
                    name="pinned"
                    defaultChecked={note.pinned}
                  />
                  Pin this note
                </label>
              </div>
              <div className={styles.submitRow}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={saving || deleteState === 'deleting'}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>

            <hr className="separator" />

            <div className={styles.deleteRow}>
              <button
                type="button"
                className="btnDelete"
                onClick={handleDeleteClick}
                disabled={deleteState === 'deleting' || saving}
                aria-expanded={deleteState === 'confirming' ? 'true' : 'false'}
                aria-label={
                  deleteState === 'confirming'
                    ? 'Confirm delete — this cannot be undone'
                    : 'Delete note'
                }
              >
                {deleteState === 'idle' && 'Delete note'}
                {deleteState === 'confirming' && 'Confirm delete ?'}
                {deleteState === 'deleting' && 'Deleting…'}
              </button>
              {deleteState === 'confirming' && (
                <button
                  type="button"
                  className={styles.cancelLink}
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
