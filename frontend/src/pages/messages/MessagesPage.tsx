import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, BellOff, Check, ChevronUp, FileText, MessageCircle, MoreHorizontal, Paperclip, Pin, Plus, Search, Send, Settings, Shield, Smile, X, Archive } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { chatService, type ChatEntry, type ChatThread } from '../../services/chatService';
import { useChatStore } from '../../store/useChatStore';
import ReportModal from '../../components/post/ReportModal';
import './messages.css';

function createChatClientId(): number {
  const [high, low] = crypto.getRandomValues(new Uint32Array(2));
  return (high & 0xfffff) * 0x100000000 + low + 1;
}

const reactionIcons: Readonly<Record<string, string>> = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  WOW: '😮',
  SAD: '😢',
  CELEBRATE: '🎉',
};

const reactionOptions = Object.entries(reactionIcons);
const emojiOptions = Object.values(reactionIcons);

const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

function ChatAvatar({ name, online = false }: { name: string; online?: boolean }) {
  return <span className="chat-avatar" aria-hidden="true">
    {Array.from(name.trim())[0]?.toLocaleUpperCase() ?? '?'}
    {online && <span className="chat-online-dot" />}
  </span>;
}

function ConversationRow({ thread, selected, disabled, active, onSelect }: {
  thread: ChatThread; selected: boolean; disabled: boolean; active: boolean; onSelect: () => void;
}) {
  const element = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<ChatEntry>();
  const update = useChatStore(state => state.update);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!update.id || update.id === thread.id) setRevision(update.sequence);
  }, [update, thread.id]);

  useEffect(() => {
    const button = element.current;
    if (!button) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !active) return;
    let current = true;
    void chatService.getMessageHistory(thread.id).then(entries => {
      if (current) setPreview(entries.find(entry => entry.text !== null || entry.recalled || entry.attachments.length > 0));
    }).catch(() => {});
    return () => { current = false; };
  }, [thread.id, revision, visible, active]);

  const summary = preview?.recalled ? 'Tin nhắn đã thu hồi' : preview?.text || (preview?.attachments.length ? 'Tệp đính kèm' : '');
  return <button ref={element} type="button" className="chat-thread"
    aria-current={selected ? 'true' : undefined} disabled={disabled} onClick={onSelect}>
    <ChatAvatar name={thread.peer} online={thread.online} />
    <span className="chat-thread-text">
      <strong>{thread.peer}</strong>
      <small>{summary ? (preview?.mine ? `Bạn: ${summary}` : summary) : 'Tin nhắn riêng'}</small>
    </span>
    <span className="chat-thread-meta">
      {preview && <time dateTime={preview.createdAt} title={dateFormat.format(new Date(preview.createdAt))}>{timeFormat.format(new Date(preview.createdAt))}</time>}
      <span className="chat-thread-indicators">
        {thread.pinned && <Pin size={13} aria-label="Đã ghim" />}
        {thread.muted && <BellOff size={13} aria-label="Đã tắt thông báo" />}
        {thread.unread > 0 && <span className="chat-notice-dot" aria-label={`${thread.unread} tin chưa đọc`} />}
      </span>
    </span>
  </button>;
}

export default function MessagesPage() {
  const [params, setParams] = useSearchParams();
  return <ChatContent target={Object.fromEntries(params)} onSelect={setParams} />;
}

export function ChatContent({ target, onSelect, floating = false, active = true, onNavigate }: {
  target: Record<string, string>;
  onSelect: (target: Record<string, string>) => void;
  floating?: boolean;
  active?: boolean;
  onNavigate?: () => void;
}) {
  const peer = target.to?.trim() ?? '';
  const threads = useChatStore(state => state.threads);
  const refresh = useChatStore(state => state.refresh);
  const id = Number(target.id) || threads.find(item => item.peer.toLowerCase() === peer.toLowerCase())?.id || 0;
  const liveUpdate = useChatStore(state => state.update);
  const [reportId, setReportId] = useState<number>();
  const thread = threads.find(item => item.id === id);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [tab, setTab] = useState<'chat' | 'hidden'>('chat');
  const [history, setHistory] = useState<{ id: number; entries: ChatEntry[] }>({ id: 0, entries: [] });
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const fileDragDepth = useRef(0);
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  const [reply, setReply] = useState<ChatEntry>();
  const [editing, setEditing] = useState<ChatEntry>();
  const [historyReload, setHistoryReload] = useState(0);
  const retry = useRef<{ target: string; text: string; key: number; replyToId?: number; files: File[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const loadedPages = useRef({ id: 0, count: 1 });
  const readCursor = useRef({ id: 0, through: 0 });
  const historyPanel = useRef<HTMLDivElement>(null);
  const lastRendered = useRef({ id: 0, last: 0 });
  const shouldScroll = useRef(true);
  const entries = history.id === id ? history.entries : [];

  useEffect(() => {
    let active = true;
    refresh().catch(() => { if (active) setError('Không thể tải cuộc trò chuyện.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (liveUpdate.sequence && (!liveUpdate.id || liveUpdate.id === id)) setHistoryReload(value => value + 1);
  }, [id, liveUpdate]);

  useEffect(() => {
    if (!id || !active) return;
    let current = true;
    if (loadedPages.current.id !== id) loadedPages.current = { id, count: 1 };
    if (readCursor.current.id !== id) readCursor.current = { id, through: 0 };
    async function loadHistory() {
      const result: ChatEntry[] = [];
      let before: number | undefined;
      let more = true;
      const pages = loadedPages.current.count;
      for (let index = 0; index < pages && more && current; index++) {
        const page = await chatService.getMessageHistory(id, before);
        result.push(...page);
        before = page.at(-1)?.id;
        more = page.length === 30;
      }
      if (!current) return;
      setHistory({ id, entries: [...result].reverse() });
      setHasMore(more);
      const incoming = result.find(entry => !entry.mine);
      if (document.visibilityState === 'visible' && incoming && incoming.id > readCursor.current.through) {
        await chatService.markConversationAsRead(id, incoming.id);
        if (!current) return;
        readCursor.current.through = incoming.id;
        await refresh();
      }
    }
    void loadHistory().catch(() => { if (current) setError('Không thể tải lịch sử tin nhắn.'); });
    return () => { current = false; };
  }, [id, refresh, historyReload, active]);

  useEffect(() => {
    const last = history.entries.at(-1)?.id ?? 0;
    const panel = historyPanel.current;
    if (history.id !== id || !panel) return;
    const previous = lastRendered.current;
    if (previous.id !== id || (last > previous.last && shouldScroll.current)) panel.scrollTop = panel.scrollHeight;
    lastRendered.current = { id, last };
  }, [history, id]);

  useEffect(() => {
    const onVisible = () => {
      if (id && document.visibilityState === 'visible') setHistoryReload(value => value + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [id]);

  const canSend = Boolean(peer && !id || thread && !thread.blocked);
  const canAttach = canSend && id > 0 && !editing && !busy;

  function clearFileDrag() {
    fileDragDepth.current = 0;
    setDraggingFiles(false);
  }

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thể thực hiện thao tác.'); }
    finally { setBusy(false); }
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!canSend || (!text && (!files.length || !!editing)) || busy) return;
    if (editing) {
      void run(async () => {
        await chatService.editMessage(id, editing.id, text);
        setEditing(undefined);
        setDraft('');
        setHistoryReload(value => value + 1);
      });
      return;
    }
    const target = id ? String(id) : peer;
    const replyToId = reply?.id;
    const lastAttempt = retry.current;
    const unchanged = lastAttempt?.target === target && lastAttempt.text === text
      && lastAttempt.replyToId === replyToId && lastAttempt.files === files;
    const key = unchanged ? lastAttempt.key : createChatClientId();
    retry.current = { target, text, key, replyToId, files };
    void run(async () => {
      if (!id) {
        const opened = await chatService.openConversationAndSendMessage(peer, text, key);
        setTab('chat');
        onSelect({ id: String(opened.id) });
      } else {
        const entry = await chatService.sendMessage(id, text, key, replyToId, files);
        setHistory(current => ({ id, entries: [...(current.id === id ? current.entries : []).filter(item => item.id !== entry.id), entry] }));
      }
      setDraft('');
      setFiles([]);
      setReply(undefined);
      retry.current = null;
      await refresh();
    });
  }

  function addFiles(incoming: File[]) {
    if (!canAttach || incoming.length === 0) return;
    if (incoming.some(file => file.size === 0 || file.size > 10 * 1024 * 1024) || files.length + incoming.length > 4) {
      setError('Chọn tối đa 4 tệp, mỗi tệp từ 1 byte đến 10 MB.');
      return;
    }
    setError('');
    setFiles(current => [...current, ...incoming]);
  }

  const visible = threads.filter(item => item.hidden === (tab === 'hidden')
    && item.peer.toLowerCase().includes(query.trim().toLowerCase()));
  const peerName = thread?.peer || peer;
  const choosingRecipient = composing && !id && !peer;
  const displayedEntries = entries.filter(entry => entry.text !== null || entry.recalled || entry.attachments.length > 0);
  const peerStatus = thread?.blocked ? 'Đã chặn nhắn tin'
    : thread?.online ? 'Đang trực tuyến'
    : thread ? 'Tin nhắn riêng' : 'Tin nhắn mới';

  function selectThread(next: Record<string, string>) {
    clearFileDrag();
    setDraft('');
    setFiles([]);
    setReply(undefined);
    setEditing(undefined);
    setError('');
    setReportId(undefined);
    onSelect(next);
  }

  function openComposer() {
    setComposing(true);
    setRecipient('');
    selectThread({});
  }

  return <div className={floating ? "chat-page chat-page-floating" : "chat-page"}>
    {!floating && <header className="chat-heading">
      <h1>Tin nhắn</h1>
      <div className="chat-heading-actions">
        <Link className="chat-control chat-privacy" to="/settings/privacy"><Shield size={17} /> <span>Quyền riêng tư</span></Link>
        <button type="button" className="chat-primary" onClick={openComposer} disabled={busy}><Plus size={17} /> Tin nhắn mới</button>
      </div>
    </header>}
    {error && <div className="chat-error" role="alert"><span>{error}</span><button type="button" className="chat-control" onClick={() => void run(async () => { await refresh(); setHistoryReload(value => value + 1); })}>Thử lại</button></div>}
    <div className={id || peer || choosingRecipient ? 'chat-frame chat-open' : 'chat-frame'}>
      <aside className="chat-sidebar" aria-label="Cuộc trò chuyện">
        <div className="chat-sidebar-toolbar">
          <nav aria-label="Hộp thư">
            {([['chat', 'Hộp thư', MessageCircle], ['hidden', 'Hội thoại đã ẩn', Archive]] as const).map(([value, label, Icon]) =>
              <button key={value} type="button" data-tip={label} aria-label={label}
                aria-pressed={tab === value} onClick={() => { setTab(value); if (floating) { setComposing(false); selectThread({}); } }}>
                {floating ? <Icon size={17} aria-hidden="true" /> : label}
              </button>)}
            {floating && <>
              <Link className="chat-icon-button" onClick={onNavigate} to="/settings/privacy" data-tip="Cài đặt quyền riêng tư" aria-label="Cài đặt quyền riêng tư"><Settings size={17} /></Link>
              <button type="button" data-tip="Tin nhắn mới" aria-label="Tin nhắn mới" onClick={openComposer} disabled={busy}><Plus size={19} /></button>
            </>}
          </nav>
          <label className="chat-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" aria-label="Tìm cuộc trò chuyện" placeholder="Tìm theo tên người dùng" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
        </div>
        <div className="chat-thread-list">
          {loading && <><span className="sr-only" role="status">Đang tải hộp thư…</span>
            {[0, 1, 2].map(row => <div key={row} className="chat-thread chat-skeleton" aria-hidden="true">
              <span /><span><i /><i /></span>
            </div>)}</>}
          {!loading && visible.length === 0 && <p className="chat-list-state">{query.trim() ? 'Không tìm thấy cuộc trò chuyện.'
            : tab === 'hidden' ? 'Chưa có cuộc trò chuyện đã ẩn.' : 'Chưa có cuộc trò chuyện.'}</p>}
          {visible.map(item => <ConversationRow key={item.id} thread={item} selected={item.id === id}
            disabled={busy} active={active} onSelect={() => { setComposing(false); selectThread({ id: String(item.id) }); }} />)}
        </div>
      </aside>
      <section className="chat-conversation" aria-label="Nội dung tin nhắn"
        onDragEnter={event => {
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          fileDragDepth.current += 1;
          if (canAttach) setDraggingFiles(true);
        }}
        onDragOver={event => {
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = canAttach ? 'copy' : 'none';
        }}
        onDragLeave={() => {
          if (fileDragDepth.current > 1) fileDragDepth.current -= 1;
          else clearFileDrag();
        }}
        onDrop={event => {
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          clearFileDrag();
          addFiles(Array.from(event.dataTransfer.files));
        }}>
        {draggingFiles && canAttach && <div className="chat-file-drop" aria-hidden="true">
          <Paperclip size={20} />
          <span>Thả tệp để đính kèm</span>
        </div>}
        {choosingRecipient ? <div className="chat-empty">
          <div className="chat-empty-icon"><Plus size={23} /></div>
          <h2>Tin nhắn mới</h2>
          <form className="chat-recipient" onSubmit={event => {
            event.preventDefault();
            if (!recipient.trim()) return;
            selectThread({ to: recipient.trim() });
            setComposing(false);
          }}>
            <label htmlFor="chat-recipient">Tên người nhận</label>
            <input id="chat-recipient" autoFocus autoComplete="off" maxLength={100} placeholder="Nhập tên người dùng" value={recipient}
              onChange={event => setRecipient(event.target.value)} required />
            <div><button type="button" className="chat-control" onClick={() => setComposing(false)}>Hủy</button>
              <button type="submit" className="chat-primary" disabled={!recipient.trim()}>Tiếp tục</button></div>
          </form>
        </div> : !(id || peer) ? <div className="chat-empty">
          <div className="chat-empty-icon"><MessageCircle size={25} /></div>
          <h2>Chọn một cuộc trò chuyện</h2>

        </div> : <>
          <header className="chat-peer">
            <button type="button" className="chat-icon-button chat-back" aria-label="Về hộp thư" onClick={() => selectThread({})}><ArrowLeft size={20} /></button>
            <ChatAvatar name={peerName} online={thread?.online && !thread.blocked} />
            <div className="chat-peer-info">
              {peerName ? <Link onClick={onNavigate} to={`/u/${encodeURIComponent(peerName)}`}>{peerName}</Link> : <strong>Cuộc trò chuyện</strong>}
              <small>{peerStatus}</small>
            </div>
            {thread && <details className="chat-menu chat-thread-menu" key={thread.id}>
              <summary className="chat-icon-button" data-tip="Tùy chọn cuộc trò chuyện" aria-label="Tùy chọn cuộc trò chuyện"><MoreHorizontal size={21} /></summary>
              <div className="chat-menu-panel" onClick={event => {
                if ((event.target as HTMLElement).closest('button')) event.currentTarget.closest('details')?.removeAttribute('open');
              }}>
                {(['pinned', 'hidden', 'muted'] as const).map(setting =>
                  <button type="button" key={setting} disabled={busy} onClick={() => void run(async () => {
                    await chatService.updateConversationPreferences(id, { [setting]: !thread[setting] }); await refresh();
                  })}>{({ pinned: thread.pinned ? 'Bỏ ghim' : 'Ghim', hidden: thread.hidden ? 'Hiện lại' : 'Ẩn', muted: thread.muted ? 'Bật thông báo' : 'Tắt thông báo' })[setting]}</button>)}
                <button type="button" disabled={busy || (thread.blocked && !thread.blockedByMe)} onClick={() => void run(async () => {
                  await (thread.blockedByMe ? chatService.unblockUserForChat(thread.peer) : chatService.blockUserForChat(thread.peer));
                  await refresh();
                })}>{thread.blockedByMe ? 'Gỡ chặn' : 'Chặn người dùng'}</button>
              </div>
            </details>}
          </header>
          <div className="chat-history" ref={historyPanel}
            onScroll={event => {
              const panel = event.currentTarget;
              shouldScroll.current = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 80;
            }}>
            {id > 0 && history.id !== id && !error && <p role="status">Đang tải lịch sử…</p>}
            {id > 0 && entries.length > 0 && hasMore && <button type="button" className="chat-older chat-control" disabled={busy} onClick={() => void run(async () => {
              const page = await chatService.getMessageHistory(id, entries[0].id);
              loadedPages.current.count += 1;
              setHasMore(page.length === 30);
              setHistory(current => current.id !== id ? current : {
                id, entries: [...page.reverse(), ...current.entries].filter((entry, index, all) => all.findIndex(item => item.id === entry.id) === index),
              });
            })}><ChevronUp size={15} /> Tin nhắn cũ hơn</button>}
            {displayedEntries.map((entry, index) => {
              const day = dateFormat.format(new Date(entry.createdAt));
              const previous = displayedEntries[index - 1];
              const next = displayedEntries[index + 1];
              const grouped = next && next.mine === entry.mine && !entry.recalled && !next.recalled
                && new Date(next.createdAt).getTime() - new Date(entry.createdAt).getTime() < 120_000
                && dateFormat.format(new Date(next.createdAt)) === day;
              return <div key={entry.id} className={grouped ? 'chat-grouped' : undefined}>
                {(!previous || dateFormat.format(new Date(previous.createdAt)) !== day) && <div className="chat-day">{day}</div>}
                <article className={entry.mine ? 'chat-message chat-mine' : 'chat-message'}>
                {entry.replyToId && <small className="chat-reply">Trả lời · {entries.find(item => item.id === entry.replyToId)?.text ?? 'Tin nhắn trước đó'}</small>}
                {(entry.recalled || entry.text) && <p>{entry.recalled ? 'Tin nhắn đã thu hồi' : entry.text}</p>}
                {entry.attachments.length > 0 && <div className="chat-attachments">{entry.attachments.map(attachment => {
                  const url = chatService.getMessageAttachmentUrl(id, entry.id, attachment.id);
                  if (attachment.contentType.startsWith('image/')) return <img key={attachment.id} src={url} alt={attachment.filename} loading="lazy" />;
                  if (attachment.contentType.startsWith('video/')) return <video key={attachment.id} src={url} controls playsInline preload="metadata" aria-label={attachment.filename} />;
                  return <a key={attachment.id} href={url}><FileText size={18} /> {attachment.filename}</a>;
                })}</div>}
                {(!grouped || entry.read || entry.editedAt) && <div className="chat-message-meta">
                {!grouped && <time dateTime={entry.createdAt}>{timeFormat.format(new Date(entry.createdAt))}</time>}
                {entry.editedAt && !entry.recalled && <small> · Đã chỉnh sửa</small>}
                {entry.read && <small><Check size={13} /> Đã đọc</small>}</div>}
                {entry.reactions.length > 0 && <div className="chat-reactions">{entry.reactions.map((reaction, index) =>
                  <span key={index} aria-label={reaction.mine ? 'Biểu cảm của bạn' : 'Biểu cảm'}>{reactionIcons[reaction.emoji] ?? reaction.emoji}</span>)}</div>}
                {!entry.recalled && <details className="chat-message-options chat-menu">
                  <summary className="chat-icon-button" data-tip="Thao tác tin nhắn" aria-label="Thao tác tin nhắn"><MoreHorizontal size={17} /></summary><div className="chat-menu-panel">
                  {canSend && <button type="button" onClick={() => { setEditing(undefined); setReply(entry); }}>Trả lời</button>}
                  {!entry.mine && <button type="button" onClick={() => setReportId(entry.id)}>Báo cáo</button>}
                  {entry.mine && thread && <>
                    <button type="button" onClick={() => { setReply(undefined); setFiles([]); setEditing(entry); setDraft(entry.text ?? ''); }}>Sửa</button>
                    <button type="button" onClick={() => void run(async () => {
                      await chatService.recallMessageForEveryone(id, entry.id); setHistoryReload(value => value + 1);
                    })}>Thu hồi</button>
                  </>}
                  {canSend && reactionOptions.map(([code, icon]) => {
                    const selected = entry.reactions.some(item => item.mine && (item.emoji === code || item.emoji === icon));
                    return <button key={code} type="button" aria-pressed={selected}
                      aria-label={`Biểu cảm ${icon}`} onClick={() => void run(async () => {
                        if (selected) await chatService.removeMessageReaction(id, entry.id);
                        else await chatService.setMessageReaction(id, entry.id, code);
                        setHistoryReload(value => value + 1);
                      })}>{icon}</button>;
                  })}
                  <button type="button" onClick={() => void run(async () => {
                    await chatService.hideMessageForCurrentUser(id, entry.id); setHistoryReload(value => value + 1);
                  })}>Xóa phía tôi</button>
                </div></details>}
              </article></div>;
            })}
            {!id && peer && <p className="chat-history-note">Gửi lời nhắn đầu tiên để bắt đầu cuộc trò chuyện.</p>}
            {thread?.blocked && <p className="chat-history-note">Cuộc trò chuyện này hiện không thể gửi tin nhắn.</p>}
          </div>
          {(reply || editing) && canSend && <div className="chat-draft-context">
            <span>{editing ? 'Đang sửa tin nhắn' : `Trả lời · ${reply?.text}`}</span>
            <button type="button" onClick={() => { if (editing) setDraft(''); setEditing(undefined); setReply(undefined); }}>Hủy</button>
          </div>}
          {canSend && <form className="chat-composer" onSubmit={send}>
            {!!files.length && <ul className="chat-previews">{files.map((file, index) => <li key={index}>
              {previews[index] && file.type.startsWith('image/') && <img src={previews[index]} alt="" />}
              {previews[index] && file.type.startsWith('video/') && <video src={previews[index]} muted preload="metadata" />}
              <span>{file.name}</span>
              <button type="button" disabled={busy} aria-label={`Bỏ ${file.name}`} onClick={() => setFiles(current => current.filter((_, position) => position !== index))}><X size={15} /></button>
            </li>)}</ul>}
            {!!id && !editing && <label className="chat-attach chat-icon-button" data-tip="Đính kèm tệp">
              <input type="file" aria-label="Đính kèm tệp" multiple disabled={busy} onChange={event => { addFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ''; }} />
              <Paperclip size={20} aria-hidden="true" />
            </label>}
            <details className="chat-emoji chat-menu"><summary className="chat-icon-button" data-tip="Chèn emoji" aria-label="Chèn emoji"><Smile size={20} /></summary><div className="chat-menu-panel">
              {emojiOptions.map(emoji => <button key={emoji} type="button" disabled={busy} onClick={() => setDraft(current => (current + emoji).slice(0, 4000))}>{emoji}</button>)}
            </div></details>
            <textarea aria-label="Nội dung tin nhắn" placeholder="Viết tin nhắn…" value={draft} maxLength={4000} rows={1}
              disabled={busy} onChange={event => setDraft(event.target.value)} onKeyDown={event => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault(); event.currentTarget.form?.requestSubmit();
              }} />
            <button className="chat-primary chat-send" type="submit" disabled={busy || (!draft.trim() && (!files.length || !!editing))}><Send size={17} aria-hidden="true" /><span>{busy ? 'Đang gửi…' : editing ? 'Lưu' : 'Gửi'}</span></button>
          </form>}
        </>}
      </section>
    </div>
    <ReportModal isOpen={active && reportId !== undefined} onClose={() => setReportId(undefined)}
      contentType="MESSAGE" contentId={String(reportId ?? '')} />
  </div>;
}
