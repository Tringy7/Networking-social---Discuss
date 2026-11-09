import React from 'react';
import { Link } from 'react-router-dom';
import { usePostStore } from '../../store/usePostStore';
import PostCard from '../../components/post/PostCard';
import Button from '../../components/ui/Button';
import { Bookmark, Compass } from 'lucide-react';

export const SavedPostsPage: React.FC = () => {
  const { posts } = usePostStore();
  const savedPosts = posts.filter((p) => p.isSaved);

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2.5">
          <Bookmark className="w-6 h-6 text-[#FF5700] fill-[#FF5700]" />
          <span>Bài viết đã lưu</span>
        </h1>
        <p className="text-xs text-[#9A9DA3] mt-0.5">
          Danh sách các chủ đề và tài liệu bạn đã đánh dấu để xem lại sau
        </p>
      </div>

      <div className="space-y-4">
        {savedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {savedPosts.length === 0 && (
          <div className="py-20 text-center bg-[#191A1C] border border-[#303235] rounded-3xl p-8 space-y-4">
            <Bookmark className="w-12 h-12 text-[#70747C] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#F5F5F5]">Chưa có bài viết nào được lưu</h3>
            <p className="text-xs text-[#9A9DA3] max-w-sm mx-auto">
              Khi lướt bảng tin hoặc các cộng đồng, hãy bấm vào biểu tượng đánh dấu để lưu bài viết hữu ích vào đây.
            </p>
            <Link to="/explore">
              <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                Khám phá cộng đồng ngay
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPostsPage;
