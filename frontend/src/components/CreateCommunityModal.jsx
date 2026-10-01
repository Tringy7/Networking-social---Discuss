import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, AlertTriangle, Crown } from 'lucide-react';

export const CreateCommunityModal = ({ isOpen, onClose }) => {
  const { createCommunity, currentUser } = useApp();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('👥');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80');
  const [rules, setRules] = useState('Tôn trọng thành viên khác\nKhông đăng nội dung spam hoặc lừa đảo\nThảo luận đúng chủ đề cộng đồng');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/^c\//, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const rulesArr = rules
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const res = createCommunity(name, slug, description, icon, banner, rulesArr);
    if (!res.success) {
      setError(res.message);
    } else {
      alert(res.message);
      setName('');
      setSlug('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Tạo Community mới
              </h2>
              <p className="text-[11px] text-slate-500">
                Sau khi tạo, bạn sẽ tự động là <strong>Quản trị viên (Owner)</strong> của cộng đồng này.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên cộng đồng hiển thị:</label>
            <input
              id="create-comm-name-input"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Ví dụ: Lập trình Python, UI/UX Design..."
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden font-semibold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Đường dẫn slug (URL identifier):
            </label>
            <div className="flex items-center">
              <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2.5 rounded-l-xl text-slate-500 font-mono text-xs">
                c/
              </span>
              <input
                id="create-comm-slug-input"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="python-dev"
                className="w-full p-2.5 border border-slate-300 rounded-r-xl focus:border-orange-500 focus:outline-hidden font-mono text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả cộng đồng:</label>
            <textarea
              id="create-comm-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục đích và chủ đề thảo luận của cộng đồng này..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Icon Emoji:</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-center text-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ảnh bìa Banner URL:</label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden truncate text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nội quy cộng đồng (Mỗi dòng 1 quy định):
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-orange-500 focus:outline-hidden text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              id="submit-create-community-btn"
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo & Trở thành OWNER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
