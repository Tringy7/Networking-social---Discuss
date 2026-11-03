import React, { useEffect, useState } from 'react';
import { authService } from '../../services';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function ChangePasswordDialog({ email, onClose }: { email?: string; onClose: () => void }) {
  const [step, setStep] = useState<'confirm' | 'verify' | 'password' | 'success'>('confirm');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!resendAt) return;
    const update = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  const sendCode = async () => {
    await authService.requestChangePasswordOtp();
    setCode('');
    setResendAt(Date.now() + 60000);
    setNotice('Mã OTP đã được gửi đến email tài khoản. Vui lòng kiểm tra cả thư mục spam.');
    setStep('verify');
  };

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void run(async () => {
      if (step === 'confirm') return sendCode();
      if (step === 'verify') {
        if (!/^\d{6}$/.test(code)) throw new Error('Vui lòng nhập đủ 6 chữ số OTP.');
        await authService.verifyChangePasswordOtp(code);
        setCode('');
        setStep('password');
      } else if (step === 'password') {
        if (password.length < 8) throw new Error('Mật khẩu mới phải có tối thiểu 8 ký tự.');
        if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp.');
        await authService.changePassword({ password, confirmPassword });
        setPassword('');
        setConfirmPassword('');
        setStep('success');
      }
    });
  };

  const titles = { confirm: 'Xác nhận đổi mật khẩu', verify: 'Xác minh mã OTP', password: 'Tạo mật khẩu mới', success: 'Đổi mật khẩu thành công' };
  return (
    <Modal isOpen onClose={() => { if (!busy) onClose(); }} closeDisabled={busy} title={titles[step]} maxWidth="md">
      <div className="space-y-4 text-left">
        {error && <p role="alert" className="rounded-lg bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">{error}</p>}
        {notice && <p role="status" className="text-sm text-[var(--text-secondary)]">{notice}</p>}
        {step === 'success' ? (
          <>
            <p role="status" className="text-sm text-[var(--text-secondary)]">Mật khẩu mới đã được cập nhật. Bạn có thể sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.</p>
            <Button className="w-full" onClick={onClose}>Hoàn tất</Button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {step === 'confirm' && <p className="text-sm leading-6 text-[var(--text-secondary)]">Gửi mã OTP đến email liên kết{email ? <> <strong className="break-all text-[var(--text-primary)]">{email}</strong></> : ' của bạn'} để xác nhận đổi mật khẩu?</p>}
            {step === 'verify' && (
              <>
                <p className="text-sm text-[var(--text-secondary)]">Nhập mã 6 chữ số đã gửi tới <span className="break-all">{email || 'email tài khoản của bạn'}</span>.</p>
                <Input label="Mã xác thực OTP" value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required disabled={busy} autoFocus />
                <Button type="button" variant="ghost" disabled={busy || seconds > 0} onClick={() => void run(sendCode)}>{seconds > 0 ? `Gửi lại mã sau ${seconds}s` : 'Gửi lại mã OTP'}</Button>
              </>
            )}
            {step === 'password' && (
              <>
                <Input label="Mật khẩu mới" type="password" autoComplete="new-password" helperText="Tối thiểu 8 ký tự và khác mật khẩu hiện tại." minLength={8} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} required disabled={busy} autoFocus />
                <Input label="Xác nhận mật khẩu mới" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }} required disabled={busy} />
              </>
            )}
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Hủy</Button>
              <Button type="submit" isLoading={busy}>{step === 'confirm' ? 'Xác nhận gửi OTP' : step === 'verify' ? 'Xác minh OTP' : 'Lưu mật khẩu mới'}</Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
