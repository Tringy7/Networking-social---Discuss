import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/useToastStore';
import { User } from '../../types';
import { adminService } from '../../services';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Users, Search, Eye } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [userList, setUserList] = useState<User[]>([]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToBan, setUserToBan] = useState<User | null>(null);

  useEffect(() => {
    adminService.listUsers().then(setUserList).catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải danh sách người dùng.', 'error');
    });
  }, [addToast]);

  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleBan = async (u: User) => {
    const isCurrentlyBanned = u.status === 'BANNED' || u.status === 'SUSPENDED';
    try {
      const updatedUser = await adminService.updateUserStatus(
        u.id,
        isCurrentlyBanned ? 'ACTIVE' : 'BANNED'
      );
      setUserList((prev) => prev.map((item) => item.id === u.id ? updatedUser : item));
      setUserToBan(null);
      addToast(
        isCurrentlyBanned
          ? `Đã mở khóa tài khoản @${u.username}`
          : `Đã khóa tài khoản @${u.username} thành công!`,
        isCurrentlyBanned ? 'success' : 'warning'
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể thay đổi trạng thái tài khoản.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF5700]" />
            <span>Quản lý người dùng hệ thống</span>
          </h1>
          <p className="text-xs text-[#9A9DA3] mt-0.5">
            Xem danh sách tài khoản, phân quyền quản trị và thực hiện khóa tài khoản vi phạm
          </p>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Tìm theo username, tên hiển thị hoặc email..."
            className="bg-[#191A1C]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#191A1C] border border-[#303235] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none cursor-pointer"
          >
            <option value="ALL">Mọi vai trò</option>
            <option value="USER">Thành viên (User)</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#191A1C] border border-[#303235] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none cursor-pointer"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="SUSPENDED">Tạm đình chỉ</option>
            <option value="PENDING">Chờ xác thực</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-[#191A1C] border border-[#303235] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141517] border-b border-[#303235] text-[11px] text-[#70747C] uppercase font-bold">
              <tr>
                <th className="p-4">Người dùng</th>
                <th className="p-4">Email</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303235]/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#1E2023] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" />
                      <div>
                        <div className="font-bold text-[#F5F5F5]">{u.displayName}</div>
                        <div className="text-[11px] text-[#70747C]">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#9A9DA3]">{u.email}</td>
                  <td className="p-4">
                    <Badge role={u.role} size="sm" />
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                          : 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
                      }`}
                    >
                      {u.status === 'ACTIVE'
                        ? 'HOẠT ĐỘNG'
                        : u.status === 'PENDING'
                          ? 'CHỜ XÁC THỰC'
                          : 'ĐÃ KHÓA'}
                    </span>
                  </td>
                  <td className="p-4 text-[#9A9DA3] tabular-nums">
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(u)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Chi tiết
                      </Button>
                      <Button
                        variant={u.status === 'ACTIVE' ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => setUserToBan(u)}
                      >
                        {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          title={`Hồ sơ chi tiết: @${selectedUser.username}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#141517] border border-[#303235]">
              <Avatar src={selectedUser.avatarUrl} alt={selectedUser.displayName} size="lg" />
              <div>
                <h4 className="text-sm font-bold text-[#F5F5F5]">{selectedUser.displayName}</h4>
                <div className="text-[#70747C]">@{selectedUser.username}</div>
                <div className="mt-1 flex gap-2">
                  <Badge role={selectedUser.role} size="sm" />
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-2xl bg-[#141517] border border-[#303235]">
              <div className="flex justify-between py-1 border-b border-[#303235]/60">
                <span className="text-[#70747C]">Email:</span>
                <span className="text-[#F5F5F5] font-semibold">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#303235]/60">
                <span className="text-[#70747C]">Trạng thái:</span>
                <span className="text-[#F5F5F5] font-semibold">{selectedUser.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#70747C]">Ngày đăng ký:</span>
                <span className="text-[#F5F5F5] font-semibold">{selectedUser.createdAt}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedUser(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Ban Dialog */}
      {userToBan && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setUserToBan(null)}
          onConfirm={() => handleToggleBan(userToBan)}
          title={userToBan.status === 'ACTIVE' ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản'}
          message={`Bạn có chắc chắn muốn ${
            userToBan.status === 'ACTIVE' ? 'khóa' : 'mở khóa'
          } tài khoản @${userToBan.username}?`}
          confirmLabel={userToBan.status === 'ACTIVE' ? 'Xác nhận khóa' : 'Mở khóa'}
          variant={userToBan.status === 'ACTIVE' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
