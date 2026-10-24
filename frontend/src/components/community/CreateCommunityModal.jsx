import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useCommunity } from '../../context/CommunityContext';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function CreateCommunityModal({ isOpen, onClose, onCreated }) {
  const { createCommunity } = useCommunity();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Lập trình',
    avatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  });
  const [rules, setRules] = useState([
    'Tôn trọng thành viên, không công kích cá nhân.',
    'Đăng nội dung phù hợp với chủ đề cộng đồng.',
  ]);
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules([...rules, newRule.trim()]);
    setNewRule('');
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createCommunity({
        ...formData,
        rules,
      });
      if (created) {
        if (onCreated) onCreated(created);
        onClose();
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Cộng Đồng Mới" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Tên cộng đồng <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ví dụ: Lập trình Python & AI"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Chủ đề / Phân loại
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              <option value="Lập trình">Lập trình & Kỹ thuật</option>
              <option value="Frontend">Frontend & Web</option>
              <option value="Thiết kế">Thiết kế & UI/UX</option>
              <option value="Giải trí">Giải trí & Gaming</option>
              <option value="Công nghệ">Khoa học & Công nghệ</option>
              <option value="Đời sống">Đời sống & Thảo luận chung</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ảnh đại diện (URL)
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mô tả cộng đồng <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả mục tiêu, đối tượng tham gia và định hướng hoạt động..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nội quy cộng đồng ({rules.length})
          </label>
          <div className="space-y-2 mb-2">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-700 font-medium">
                  {idx + 1}. {rule}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Thêm quy tắc mới..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRule();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddRule}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              Thêm
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Tạo cộng đồng</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
