"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Loading notes…");
  const [provider, setProvider] = useState("checking");
  const [busy, setBusy] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const [notesResponse, healthResponse] = await Promise.all([
        fetch("/api/notes", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" })
      ]);
      const notesData = await notesResponse.json();
      const healthData = await healthResponse.json();
      if (!notesResponse.ok) throw new Error(notesData.error || "Could not load notes");
      setNotes(notesData.notes || []);
      setProvider(healthData.provider || "unknown");
      setStatus(healthData.database === "connected" ? "Database connected" : "Database unavailable");
    } catch (error) {
      setStatus(error.message);
      setProvider("unknown");
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  async function addNote(event) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save note");
      setTitle("");
      setContent("");
      await loadNotes();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(id) {
    setBusy(true);
    try {
      const response = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete note");
      await loadNotes();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/">☁ CloudNote</Link>
        <span className={`provider provider-${provider}`}>Serving from: {provider.toUpperCase()}</span>
      </header>

      <section className="hero">
        <p className="eyebrow">MULTI-CLOUD DEMO APPLICATION</p>
        <h1>Your notes.<br /><span>Always available.</span></h1>
        <p className="subtitle">A simple full-stack application designed to demonstrate deployment, CI/CD and cross-cloud failover.</p>
        <div className="health"><span className="pulse" />{status}</div>
      </section>

      <section className="workspace">
        <form className="note-form" onSubmit={addNote}>
          <div className="section-heading">
            <div><p className="eyebrow">CAPTURE AN IDEA</p><h2>Create a note</h2></div>
            <span className="form-icon">＋</span>
          </div>
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Deployment checklist" maxLength={120} required />
          <label htmlFor="content">Description</label>
          <textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="Write something worth remembering…" rows={5} required />
          <button disabled={busy} type="submit">{busy ? "Please wait…" : "Save note"} <span>↗</span></button>
        </form>

        <section className="notes-panel">
          <div className="section-heading">
            <div><p className="eyebrow">YOUR WORKSPACE</p><h2>Saved notes <span className="count">{notes.length}</span></h2></div>
            <button className="refresh" onClick={loadNotes} aria-label="Refresh notes">↻</button>
          </div>
          {notes.length === 0 ? (
            <div className="empty"><div className="empty-icon">✎</div><h3>No notes yet</h3><p>Create your first note. It will be stored in PostgreSQL.</p></div>
          ) : (
            <div className="notes-list">
              {notes.map(note => (
                <article className="note-card" key={note.id}>
                  <div className="note-card-top"><h3>{note.title}</h3><button disabled={busy} onClick={() => deleteNote(note.id)} aria-label={`Delete ${note.title}`}>×</button></div>
                  <p>{note.content}</p>
                  <time>{new Date(note.created_at).toLocaleString()}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer><span>CloudNote</span><span>Next.js · Node.js · PostgreSQL · Azure · AWS</span></footer>
    </main>
  );
}
