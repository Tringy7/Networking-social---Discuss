import React from 'react';
import { useSettingsStore, ACCENT_PRESETS } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import Button from '../../components/ui/Button';
import { Check, Sun, Moon, Monitor, RotateCcw } from 'lucide-react';

function Choices<T extends string>({ label, value, options, onChange }: { label:string; value:T; options:{id:T;label:string}[];onChange:(value:T)=>void }) {
  return <div className="appearance-choices" role="group" aria-label={label}>{options.map((option) => <button type="button" key={option.id} onClick={() => onChange(option.id)} aria-pressed={value === option.id}>{option.label}{value === option.id && <Check size={14} />}</button>)}</div>;
}
export default function AppearanceSettingsPage() {
  const { settings, setTheme, setAccentColor, setDensity, setFontSize, setAnimationIntensity, updateSettings, resetDefaults } = useSettingsStore();
  const addToast = useToastStore((state) => state.addToast);
  return <div className="appearance-page">
    <div><h2>Không gian đọc của bạn.</h2><p className="text-sm text-[var(--text-secondary)]">Chọn giao diện phù hợp. Thay đổi được lưu tự động trên thiết bị này.</p></div>
    <section className="preference-row"><div><h3>Giao diện</h3><p>Sáng nhẹ, tối dịu hoặc đồng bộ với thiết bị.</p></div><div className="theme-choices" role="group" aria-label="Giao diện">
      {([{id:'light',label:'Sáng',icon:Sun},{id:'dark',label:'Tối',icon:Moon},{id:'system',label:'Theo thiết bị',icon:Monitor}] as const).map(({id,label,icon:Icon}) => <button key={id} type="button" onClick={() => setTheme(id)} aria-pressed={settings.theme === id}><Icon size={18} /><span>{label}</span>{settings.theme === id && <Check size={14} />}</button>)}
    </div></section>
    <section className="preference-row"><div><h3>Màu điểm nhấn</h3><p>Màu thương hiệu trên các dấu hiệu tương tác.</p></div><div className="accent-choices" role="group" aria-label="Màu điểm nhấn">
      {ACCENT_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => setAccentColor(preset.primary)} aria-pressed={settings.accentColor === preset.primary} aria-label={preset.name} title={preset.name}><span style={{background:preset.primary}} />{preset.name.replace(' (Mặc định)','')}{settings.accentColor === preset.primary && <Check size={14} />}</button>)}
    </div></section>
    <section className="preference-row"><div><h3>Mật độ nội dung</h3><p>Điều chỉnh khoảng cách giữa các thảo luận.</p></div><Choices label="Mật độ" value={settings.density} options={[{id:'comfortable',label:'Thoải mái'},{id:'compact',label:'Gọn gàng'}]} onChange={setDensity} /></section>
    <section className="preference-row"><div><h3>Cỡ chữ</h3><p>Chọn kích thước văn bản bạn thấy dễ đọc.</p></div><Choices label="Cỡ chữ" value={settings.fontSize} options={[{id:'small',label:'Nhỏ'},{id:'medium',label:'Vừa'},{id:'large',label:'Lớn'}]} onChange={setFontSize} /></section>
    <section className="preference-row"><div><h3>Chuyển động</h3><p>Luôn tôn trọng tùy chọn giảm chuyển động của thiết bị.</p></div><Choices label="Chuyển động" value={settings.animationIntensity} options={[{id:'full',label:'Đầy đủ'},{id:'reduced',label:'Giảm bớt'},{id:'off',label:'Tắt'}]} onChange={setAnimationIntensity} /></section>
    <section className="preference-row"><div><h3>Thanh điều hướng</h3><p>Giữ nhãn hiển thị hoặc dành thêm chỗ cho nội dung.</p></div><Choices label="Thanh điều hướng" value={settings.sidebarCollapsed ? 'collapsed' : 'expanded'} options={[{id:'expanded',label:'Đầy đủ'},{id:'collapsed',label:'Thu gọn'}]} onChange={(value) => updateSettings({sidebarHidden:false,sidebarCollapsed:value === 'collapsed'})} /></section>
    <div className="appearance-preview"><span className="text-xs text-[var(--text-muted)]">Xem trước văn bản</span><p className="editorial-title">Một câu hỏi mở ra nhiều góc nhìn.</p><p className="discussion-excerpt">Một không gian để chia sẻ điều bạn biết và khám phá những điều mới qua từng cuộc trò chuyện.</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3 py-4"><Button variant="ghost" size="sm" leftIcon={<RotateCcw size={15} />} onClick={() => { resetDefaults(); addToast('Đã khôi phục giao diện mặc định.', 'info'); }}>Khôi phục mặc định</Button><Button size="sm" onClick={() => addToast('Tùy chọn giao diện đã được lưu.', 'success')}>Lưu tùy chọn</Button></div>
  </div>;
}
