import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';
import { Community } from '../../types';
import { adminService } from '../../services';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { FolderKanban, Search, Globe, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';

export const CommunityManagementPage: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const addToast = useToastStore((state) => state.addToast);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [commToToggle, setCommToToggle] = useState<Community | null>(null);

  useEffect(() => {
    adminService.listCommunities().then(setCommunities).catch((error: unknown) => {
      addToast(error instanceof Error ? error.message : 'Không thể tải danh sách cộng đồng.', 'error');
    });
  }, [addToast]);

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch =
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ownerUsername.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleCommunityStatus = async (comm: Community) => {
    const nextStatus = comm.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      await adminService.setCommunityStatus(comm.name, nextStatus);
      setCommunities((current) => current.map((item) =>
        item.id === comm.id ? { ...item, status: nextStatus } : item
      ));
      addToast(
        nextStatus === 'ACTIVE'
          ? `Đã mở khóa cộng đồng c/${comm.name}`
          : `Đã tạm khóa cộng đồng c/${comm.name}. Tên định danh vẫn được bảo lưu.`,
        nextStatus === 'ACTIVE' ? 'success' : 'warning'
      );
      setCommToToggle(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Không thể thay đổi trạng thái cộng đồng.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
          <FolderKanban className="w-6 h-6 text-[#3B82F6]" />
          <span>Quản lý cộng đồng toàn hệ thống</span>
        </h1>
        <p className="text-xs text-[#9A9DA3] mt-0.5">
          Giám sát số lượng thành viên, tình trạng tuân thủ tiêu chuẩn và đình chỉ các nhóm vi phạm
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            placeholder="Tìm theo tên cộng đồng hoặc chủ nhóm..."
            className="bg-[#191A1C]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#191A1C] border border-[#303235] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none cursor-pointer"
        >
          <option value="ALL">Mọi danh mục</option>
          <option value="Lập trình">Lập trình</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Công nghệ">Công nghệ</option>
          <option value="Thiết kế">Thiết kế</option>
        </select>
      </div>

      {/* Communities Table */}
      <div className="bg-[#191A1C] border border-[#303235] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141517] border-b border-[#303235] text-[11px] text-[#70747C] uppercase font-bold">
              <tr>
                <th className="p-4">Cộng đồng</th>
                <th className="p-4">Chuyên mục</th>
                <th className="p-4">Trưởng nhóm</th>
                <th className="p-4">Thành viên</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303235]/60">
              {filteredCommunities.map((c) => (
                <tr key={c.id} className="hover:bg-[#1E2023] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={c.avatarUrl} alt={c.displayName} size="sm" shape="rounded" />
                      <div>
                        <Link
                          to={`/c/${c.name}`}
                          className="font-bold text-[#F5F5F5] hover:text-[#FF5700] transition-colors"
                        >
                          {c.displayName}
                        </Link>
                        <div className="text-[11px] text-[#70747C] font-mono">c/{c.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-semibold text-[#FF5700] bg-[#FF5700]/10 px-2 py-0.5 rounded">
                      {c.category}
                    </span>
                  </td>
                  <td className="p-4 text-[#9A9DA3]">@{c.ownerUsername}</td>
                  <td className="p-4 font-bold text-[#F5F5F5] tabular-nums">
                    {c.memberCount.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : 'bg-[#EF4444]/15 text-[#EF4444]'
                      }`}
                    >
                      {c.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'ĐÃ ĐÌNH CHỈ'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/c/${c.name}`}>
                        <Button variant="ghost" size="sm">
                          Xem
                        </Button>
                      </Link>
                      <Button
                        variant={c.status === 'ACTIVE' ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => setCommToToggle(c)}
                      >
                        {c.status === 'ACTIVE' ? 'Đình chỉ' : 'Khôi phục'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Ban Community Dialog */}
      {commToToggle && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setCommToToggle(null)}
          onConfirm={() => handleToggleCommunityStatus(commToToggle)}
          title={commToToggle.status === 'ACTIVE' ? 'Đình chỉ hoạt động cộng đồng' : 'Khôi phục hoạt động'}
          message={`Bạn có chắc chắn muốn ${
            commToToggle.status === 'ACTIVE' ? 'đình chỉ' : 'khôi phục'
          } cộng đồng "${commToToggle.displayName}"? Tên định danh c/${commToToggle.name} vẫn được giữ nguyên để chống chiếm quyền.`}
          confirmLabel={commToToggle.status === 'ACTIVE' ? 'Xác nhận đình chỉ' : 'Khôi phục'}
          variant={commToToggle.status === 'ACTIVE' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
};

export default CommunityManagementPage;
