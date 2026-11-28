import { useRef, useState } from 'react';
import { Check, ChevronDown, Lock, Search, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import type { Community } from '../../types';

interface CommunityPickerProps {
  communities: Community[];
  selected?: Community;
  onSelect: (name: string) => void;
}

export default function CommunityPicker({ communities, selected, onSelect }: CommunityPickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const term = query.trim().toLocaleLowerCase('vi-VN').replace(/^c\//, '');
  const results = communities.filter(({ name, displayName, description }) =>
    [name, displayName, description].some((value) => value?.toLocaleLowerCase('vi-VN').includes(term)));

  const openPicker = () => {
    setQuery('');
    dialog.current?.showModal();
    searchInput.current?.focus();
  };

  return <div className="post-community-field">
    <span id="post-community-label" className="post-composer-label">Cộng đồng đăng bài</span>
    <button ref={trigger} type="button" className="post-community-trigger" aria-haspopup="dialog"
      aria-labelledby="post-community-label post-community-value" onClick={openPicker}>
      {selected ? <Avatar src={selected.avatarUrl} alt={selected.displayName || selected.name} size="sm" shape="rounded" />
        : <Users size={19} aria-hidden="true" />}
      <span id="post-community-value">{selected ? `c/${selected.name}` : 'Chọn cộng đồng'}</span>
      <ChevronDown size={17} aria-hidden="true" />
    </button>
    <dialog ref={dialog} className="post-community-dialog" aria-labelledby="post-community-dialog-title"
      onClose={() => trigger.current?.focus()} onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}>
      <div className="post-community-panel">
        <header>
          <h2 id="post-community-dialog-title">Chọn cộng đồng</h2>
          <button type="button" aria-label="Đóng danh sách" onClick={() => dialog.current?.close()}><X size={19} /></button>
        </header>
        <div className="post-community-search">
          <Search size={18} aria-hidden="true" />
          <input ref={searchInput} type="search" aria-label="Tìm cộng đồng" placeholder="Tìm theo tên hoặc mô tả"
            value={query} onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }} />
        </div>
        <ul className="post-community-results">
          {results.map((community) => <li key={community.name}>
            <button type="button" aria-pressed={community.name === selected?.name} onClick={() => {
              onSelect(community.name);
              dialog.current?.close();
            }}>
              <Avatar src={community.avatarUrl} alt={community.displayName || community.name} shape="rounded" />
              <span className="post-community-details">
                <strong>{community.displayName || `c/${community.name}`}</strong>
                <span>c/{community.name} · {community.memberCount.toLocaleString('vi-VN')} thành viên
                  {community.visibility === 'PRIVATE' && <span className="post-community-private"><Lock size={12} /> Riêng tư</span>}
                </span>
                {community.description && <span className="post-community-description">{community.description}</span>}
              </span>
              {community.name === selected?.name && <Check size={18} aria-hidden="true" />}
            </button>
          </li>)}
        </ul>
        {!results.length && <div className="post-community-empty" role="status">
          {communities.length ? 'Không tìm thấy cộng đồng phù hợp.' : <>
            <p>Bạn cần tham gia một cộng đồng để đăng bài.</p>
            <Link to="/explore" onClick={() => dialog.current?.close()}>Khám phá cộng đồng</Link>
          </>}
        </div>}
      </div>
    </dialog>
  </div>;
}
