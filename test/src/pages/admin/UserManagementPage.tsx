import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { User, UserRole, AccountStatus } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Users, Search, UserCheck, UserX, Shield, Eye, Calendar, Mail } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Mock users database
  const [userList, setUserList] = useState<User[]>([
    {
      id: 'usr_me_01',
      username: 'huutri_dev',
      displayName: 'Hữu Trí (Software Engineer)',
      email: 'huutria22005@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      bio: 'Fullstack developer đam mê React và Spring Boot.',
      role: 'OWNER',
      status: 'ACTIVE',
      privacy: { showDateOfBirth: true, showLocation: true, showPostsOnProfile: true },
      createdAt: '2023-09-01',
      karma: 2840,
    },
    {
      id: 'usr_02',
      username: 'minh_frontend',
      displayName: 'Minh Nguyễn (Senior Frontend)',
      email: 'minh.nguyen@frontend.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bannerUrl: '',
      bio: 'React 19 & Tailwind CSS enthusiast.',
      role: 'MODERATOR',
      status: 'ACTIVE',
      privacy: { showDateOfBirth: false, showLocation: true, showPostsOnProfile: true },
      createdAt: '2022-03-20',
      karma: 1980,
    },
    {
      id: 'usr_03',
      username: 'hoang_backend',
      displayName: 'Hoàng Lê (Cloud Architect)',
      email: 'hoang.le@cloud.io',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bannerUrl: '',
      bio: 'Spring Boot 3 & Docker architecture.',
      role: 'USER',
      status: 'ACTIVE',
      privacy: { showDateOfBirth: true, showLocation: true, showPostsOnProfile: true },
      createdAt: '2022-06-12',
      karma: 1420,
    },
    {
      id: 'usr_spam_01',
      username: 'spam_account_01',
      displayName: 'Dịch Vụ Bao Đậu Đồ Án',
      email: 'spam99@tempmail.com',
      avatarUrl: '',
      bannerUrl: '',
      bio: 'Tài khoản quảng cáo trái phép bị báo cáo.',
      role: 'USER',
      status: 'SUSPENDED',
      privacy: { showDateOfBirth: false, showLocation: false, showPostsOnProfile: false },
      createdAt: '2026-10-20',
      karma: -45,
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToBan, setUserToBan] = useState<User | null>(null);

  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleBan = (u: User) => {
    const isCurrentlyBanned = u.status === 'BANNED' || u.status === 'SUSPENDED';
    const newStatus: AccountStatus = isCurrentlyBanned ? 'ACTIVE' : 'BANNED';
    setUserList((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, status: newStatus } : item))
    );
    setUserToBan(null);
    addToast(
      isCurrentlyBanned
        ? `Đã mở khóa tài khoản @${u.username}`
        : `Đã khóa tài khoản @${u.username} thành công!`,
      isCurrentlyBanned ? 'success' : 'warning'
    );
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
            <option value="OWNER">Chủ nhóm (Owner)</option>
            <option value="MODERATOR">Kiểm duyệt (Mod)</option>
            <option value="USER">Thành viên (User)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#191A1C] border border-[#303235] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none cursor-pointer"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="SUSPENDED">Tạm đình chỉ</option>
            <option value="BANNED">Đã bị khóa</option>
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
                <th className="p-4">Karma</th>
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
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : 'bg-[#EF4444]/15 text-[#EF4444]'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-[#FF5700] tabular-nums">{u.karma}</td>
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
