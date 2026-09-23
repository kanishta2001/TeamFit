"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, message } from "@/lib/api";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { Notice } from "./form-controls";

export default function TeamChat({ initialThreads }: { initialThreads: ChatThread[] }) {
  const [threads, setThreads] = useState(initialThreads);
  const [selected, setSelected] = useState<number | null>(initialThreads[0]?.projectId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selected === null) return;
    let active = true;
    async function load() {
      try {
        const value = await api<ChatMessage[]>(`chats/${selected}/messages`);
        if (!active) return;
        setMessages(value);
        setThreads(current => current.map(thread => thread.projectId === selected ? { ...thread, unreadCount: 0 } : thread));
        await api(`chats/${selected}/read`, "POST");
      } catch (reason) { if (active) setError(message(reason)); }
    }
    void load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selected]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (selected === null || !draft.trim()) return;
    setBusy(true); setError("");
    try {
      await api(`chats/${selected}/messages`, "POST", { body: draft });
      setDraft("");
      const [nextMessages, nextThreads] = await Promise.all([
        api<ChatMessage[]>(`chats/${selected}/messages`), api<ChatThread[]>("chats")
      ]);
      setMessages(nextMessages); setThreads(nextThreads.map(thread => thread.projectId === selected ? { ...thread, unreadCount: 0 } : thread));
      await api(`chats/${selected}/read`, "POST");
    } catch (reason) { setError(message(reason)); }
    finally { setBusy(false); }
  }

  const current = threads.find(thread => thread.projectId === selected);
  return <div className="chat-page">
    <Notice text={error} error />
    {threads.length === 0 ? <section className="chat-empty"><h2>No team chats yet</h2><p>Create a project or join a team to start messaging.</p></section> :
      <section className="chat-layout">
        <aside className="chat-thread-list" aria-label="Project chats">
          {threads.map(thread => <button type="button" key={thread.projectId}
            className={thread.projectId === selected ? "selected" : ""} onClick={() => setSelected(thread.projectId)}>
            <span><strong>{thread.projectTitle}</strong>{thread.unreadCount > 0 && <b>{thread.unreadCount}</b>}</span>
            <small>{thread.lastMessage ?? "No messages yet"}</small>
          </button>)}
        </aside>
        <div className="chat-conversation">
          <header><h2>{current?.projectTitle}</h2><span>{messages.length} message{messages.length === 1 ? "" : "s"}</span></header>
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 ? <p className="chat-start">Start this project conversation.</p> : messages.map(item =>
              <article key={item.id} className={item.isMine ? "mine" : ""}>
                <div><strong>{item.isMine ? "You" : item.senderName}</strong><time>{new Date(item.createdAt).toLocaleString()}</time></div>
                <p>{item.body}</p>
              </article>)}
          </div>
          <form className="chat-composer" onSubmit={send}>
            <label className="sr-only" htmlFor="team-message">Message</label>
            <textarea id="team-message" value={draft} maxLength={1000} rows={2} placeholder="Write a message to your team…"
              onChange={event => setDraft(event.target.value)} />
            <button type="submit" disabled={busy || !draft.trim()}>{busy ? "Sending…" : "Send"}</button>
          </form>
        </div>
      </section>}
  </div>;
}
