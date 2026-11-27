import { Maximize2, MessageCircle, Minus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChatStore } from '../../store/useChatStore';
import { ChatContent } from './MessagesPage';

export default function FloatingChat() {
  const mode = useChatStore(state => state.window);
  const connection = useChatStore(state => state.connection);
  const launch = useChatStore(state => state.launch);
  const target = useChatStore(state => state.target);
  const open = useChatStore(state => state.openWindow);
  const minimize = useChatStore(state => state.minimizeWindow);
  const close = useChatStore(state => state.closeWindow);
  const select = useChatStore(state => state.selectTarget);
  const unread = useChatStore(state => state.threads.some(thread => !thread.hidden && thread.unread > 0));

  return <section className={`chat-dock chat-dock-${mode}`} aria-label="Cửa sổ tin nhắn"
    onKeyDown={event => {
      if (event.key === 'Escape' && !event.defaultPrevented && mode === 'open') minimize();
    }}>
    <header className="chat-dock-header">
      <button type="button" className="chat-dock-title" onClick={() => mode === 'open' ? minimize() : open()}
        aria-controls="floating-chat-content" aria-expanded={mode === 'open'}>
        <MessageCircle size={18} aria-hidden="true" />
        <span>Tin nhắn</span>
        {unread && <span className="chat-notice-dot" aria-label="Có tin nhắn mới" />}
      </button>
      {mode !== 'closed' && <div className="chat-dock-actions">
        {mode === 'open' && <>
          <button type="button" className="chat-icon-button" data-tip="Thu nhỏ" aria-label="Thu nhỏ" onClick={minimize}><Minus size={18} /></button>
          <Link className="chat-icon-button" data-tip="Mở trang tin nhắn" aria-label="Mở trang tin nhắn"
            to={{ pathname: '/messages', search: new URLSearchParams(target).toString() }}><Maximize2 size={18} /></Link>
        </>}
        <button type="button" className="chat-icon-button" data-tip="Đóng chat" aria-label="Đóng chat" onClick={close}><X size={18} /></button>
      </div>}
    </header>
    {mode === 'open' && connection === 'disconnected' &&
      <p className="chat-connection" role="status">Mất kết nối trực tiếp. Đang kết nối lại…</p>}
    <div id="floating-chat-content" className="chat-dock-body" hidden={mode !== 'open'}>
      {mode !== 'closed' && <ChatContent key={launch} floating active={mode === 'open'} target={target} onNavigate={minimize}
        onSelect={next => { if (useChatStore.getState().launch === launch) select(next); }} />}
    </div>
  </section>;
}
