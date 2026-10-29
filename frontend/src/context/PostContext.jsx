import React, { createContext, useContext, useState, useEffect } from 'react';
import { SORT_OPTIONS } from '../constants/roles';
import { postService } from '../api/postService';
import { commentService } from '../api/commentService';
import { adminService } from '../api/adminService';
import { useAuth } from './AuthContext';
import { useCommunity } from './CommunityContext';
import { useToast } from './ToastContext';
import { permissions } from '../utils/permissions';

const PostContext = createContext(null);

export function PostProvider({ children }) {
  const { currentUser } = useAuth();
  const { getUserCommunityRole } = useCommunity();
  const { success, error: toastError, info } = useToast();

  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('discuss_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [comments, setComments] = useState(() => {
    try {
      const saved = localStorage.getItem('discuss_comments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem('discuss_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userVotes, setUserVotes] = useState(() => {
    try {
      const saved = localStorage.getItem('discuss_user_votes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSort, setActiveSort] = useState(SORT_OPTIONS.HOT);
  const [selectedTag, setSelectedTag] = useState(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('discuss_posts', JSON.stringify(posts));
      localStorage.setItem('discuss_comments', JSON.stringify(comments));
      localStorage.setItem('discuss_reports', JSON.stringify(reports));
      localStorage.setItem('discuss_user_votes', JSON.stringify(userVotes));
    } catch {
      // safe fallback
    }
  }, [posts, comments, reports, userVotes]);

  /**
   * Tạo bài viết mới
   */
  const createPost = async (postData) => {
    if (!currentUser) {
      toastError('Vui lòng đăng nhập để đăng bài viết!');
      return;
    }

    const communityRole = getUserCommunityRole(postData.communityId);
    if (!permissions.canCreatePost(currentUser, communityRole)) {
      toastError('Bạn phải là thành viên của cộng đồng này mới có thể đăng bài!');
      return;
    }

    try {
      const newPost = await postService.createPost(postData, currentUser.id);
      setPosts(prev => [newPost, ...prev]);

      // Set default upvote by author
      setUserVotes(prev => ({
        ...prev,
        [currentUser.id]: {
          ...(prev[currentUser.id] || {}),
          [newPost.id]: 1,
        }
      }));

      success('Đăng bài viết thành công!');
      return newPost;
    } catch (err) {
      toastError(err.message || 'Không thể tạo bài viết');
      throw err;
    }
  };

  /**
   * Chỉnh sửa bài viết
   */
  const updatePost = async (postId, updates) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!permissions.canEditPost(currentUser, post)) {
      toastError('Bạn chỉ có thể chỉnh sửa bài viết của chính mình!');
      return;
    }

    try {
      const res = await postService.updatePost(postId, updates);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...res } : p));
      success('Cập nhật bài viết thành công!');
      return res;
    } catch (err) {
      toastError(err.message || 'Cập nhật thất bại');
      throw err;
    }
  };

  /**
   * Xóa bài viết (Tác giả, hoặc Mod/Owner/Admin)
   */
  const deletePost = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const communityRole = getUserCommunityRole(post.communityId);
    if (!permissions.canDeletePost(currentUser, post, communityRole)) {
      toastError('Bạn không có quyền xóa bài viết này!');
      return;
    }

    try {
      await postService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      // Xóa comments liên quan
      setComments(prev => prev.filter(c => c.postId !== postId));
      // Xóa reports liên quan
      setReports(prev => prev.filter(r => r.postId !== postId));
      success('Đã xóa bài viết thành công.');
      return true;
    } catch (err) {
      toastError(err.message || 'Không thể xóa bài viết');
      return false;
    }
  };

  /**
   * Ghim / Bỏ ghim bài viết (Mod, Owner, Admin)
   */
  const togglePinPost = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const communityRole = getUserCommunityRole(post.communityId);
    if (!permissions.canPinPost(currentUser, communityRole)) {
      toastError('Chỉ Điều hành viên (Mod), Chủ sở hữu (Owner) hoặc Admin mới có quyền ghim bài viết!');
      return;
    }

    try {
      const res = await postService.togglePinPost(postId, post.isPinned);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: res.isPinned } : p));
      success(res.isPinned ? 'Đã ghim bài viết lên đầu cộng đồng!' : 'Đã bỏ ghim bài viết.');
    } catch (err) {
      toastError(err.message || 'Thao tác ghim thất bại');
    }
  };

  /**
   * Báo cáo bài viết
   */
  const reportPost = async ({ postId, reason, note }) => {
    if (!currentUser) {
      toastError('Vui lòng đăng nhập để báo cáo bài viết!');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const newReport = await postService.reportPost({
        postId,
        reporterId: currentUser.id,
        communityId: post.communityId,
        reason,
        note,
      });

      setReports(prev => [newReport, ...prev]);
      success('Báo cáo của bạn đã được gửi tới Ban quản trị. Cảm ơn bạn!');
      return newReport;
    } catch (err) {
      toastError(err.message || 'Không thể gửi báo cáo');
    }
  };

  /**
   * Xử lý báo cáo bài viết (Mod, Owner, Admin)
   */
  const resolveReport = async (reportId, action, note) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      const res = await adminService.resolveReport(reportId, action, note);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, ...res } : r));

      if (action === 'DELETE_POST') {
        // Xóa bài viết bị báo cáo
        await deletePost(report.postId);
        success('Đã xóa bài viết vi phạm và xử lý báo cáo xong!');
      } else {
        success('Đã hoàn tất xử lý báo cáo.');
      }
    } catch (err) {
      toastError(err.message || 'Không thể xử lý báo cáo');
    }
  };

  /**
   * Bình chọn Upvote / Downvote
   * voteType: 1 (upvote), -1 (downvote)
   */
  const votePost = async (postId, targetVote) => {
    if (!currentUser) {
      toastError('Vui lòng đăng nhập để bình chọn bài viết!');
      return;
    }

    const userVotesForSelf = userVotes[currentUser.id] || {};
    const currentVote = userVotesForSelf[postId] || 0;

    // Toggle logic: if user clicked the same vote button, cancel vote
    const newVote = currentVote === targetVote ? 0 : targetVote;

    // Update voteScore diff
    const diff = newVote - currentVote;

    setUserVotes(prev => ({
      ...prev,
      [currentUser.id]: {
        ...(prev[currentUser.id] || {}),
        [postId]: newVote,
      }
    }));

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        let upChange = 0;
        let downChange = 0;

        if (currentVote === 1) upChange -= 1;
        if (currentVote === -1) downChange -= 1;

        if (newVote === 1) upChange += 1;
        if (newVote === -1) downChange += 1;

        return {
          ...p,
          upvotes: Math.max(0, p.upvotes + upChange),
          downvotes: Math.max(0, p.downvotes + downChange),
          voteScore: p.voteScore + diff,
        };
      }
      return p;
    }));
  };

  /**
   * Lấy vote hiện tại của user cho bài viết
   */
  const getUserVote = (postId) => {
    if (!currentUser) return 0;
    return (userVotes[currentUser.id] || {})[postId] || 0;
  };

  /**
   * Tạo bình luận mới
   */
  const addComment = async ({ postId, parentId = null, content }) => {
    if (!currentUser) {
      toastError('Vui lòng đăng nhập để gửi bình luận!');
      return;
    }

    try {
      const newComment = await commentService.createComment({
        postId,
        authorId: currentUser.id,
        parentId,
        content,
      });

      setComments(prev => [...prev, newComment]);

      // Tăng comment count của post
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      success('Bình luận đã được đăng!');
      return newComment;
    } catch (err) {
      toastError(err.message || 'Không thể đăng bình luận');
    }
  };

  /**
   * Sửa bình luận
   */
  const editComment = async (commentId, newContent) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (!permissions.canEditComment(currentUser, comment)) {
      toastError('Bạn chỉ có thể chỉnh sửa bình luận của chính mình!');
      return;
    }

    try {
      const res = await commentService.updateComment(commentId, newContent);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: res.content, updatedAt: res.updatedAt } : c));
      success('Đã cập nhật bình luận!');
    } catch (err) {
      toastError(err.message || 'Không thể cập nhật');
    }
  };

  /**
   * Xóa bình luận
   */
  const deleteComment = async (commentId, postId, communityId) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const communityRole = getUserCommunityRole(communityId);
    if (!permissions.canDeleteComment(currentUser, comment, communityRole)) {
      toastError('Bạn không có quyền xóa bình luận này!');
      return;
    }

    try {
      await commentService.deleteComment(commentId);
      // Xóa bình luận và các reply con
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) } : p));
      success('Đã xóa bình luận.');
    } catch (err) {
      toastError(err.message || 'Không thể xóa');
    }
  };

  /**
   * Lấy bình luận của 1 bài viết
   */
  const getPostComments = (postId) => {
    return comments.filter(c => c.postId === postId);
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        comments,
        reports,
        userVotes,
        searchKeyword,
        setSearchKeyword,
        activeSort,
        setActiveSort,
        selectedTag,
        setSelectedTag,
        createPost,
        updatePost,
        deletePost,
        togglePinPost,
        reportPost,
        resolveReport,
        votePost,
        getUserVote,
        addComment,
        editComment,
        deleteComment,
        getPostComments,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}

export function usePost() {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
}
