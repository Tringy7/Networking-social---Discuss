import React, { useState } from 'react';
import CommunityHeader from '../components/community/CommunityHeader';
import FeedPage from './FeedPage';
import EditCommunityModal from '../components/community/EditCommunityModal';
import CommunityMembersModal from '../components/community/CommunityMembersModal';
import CommunityModerationModal from '../components/community/CommunityModerationModal';
import TransferOwnerModal from '../components/community/TransferOwnerModal';
import CreatePostModal from '../components/post/CreatePostModal';

export default function CommunityDetailPage({
  community,
  onOpenPostDetail,
  onOpenEditPost,
  onOpenReportPost,
  onSelectCommunity,
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showModerators, setShowModerators] = useState(false);
  const [showTransferOwner, setShowTransferOwner] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  if (!community) return null;

  return (
    <div>
      {/* Community Header with all action rules */}
      <CommunityHeader
        community={community}
        onOpenEdit={() => setShowEdit(true)}
        onOpenMembers={() => setShowMembers(true)}
        onOpenModerators={() => setShowModerators(true)}
        onOpenTransferOwner={() => setShowTransferOwner(true)}
        onOpenCreatePost={() => setShowCreatePost(true)}
      />

      {/* Community Post Feed */}
      <div className="mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Các bài thảo luận trong c/{community.slug}
        </h3>
      </div>

      <FeedPage
        communityId={community.id}
        onOpenDetail={onOpenPostDetail}
        onOpenEdit={onOpenEditPost}
        onOpenReport={onOpenReportPost}
        onSelectCommunity={onSelectCommunity}
        onOpenCreatePost={() => setShowCreatePost(true)}
      />

      {/* Modals for Community Operations */}
      <EditCommunityModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        community={community}
      />

      <CommunityMembersModal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        community={community}
      />

      <CommunityModerationModal
        isOpen={showModerators}
        onClose={() => setShowModerators(false)}
        community={community}
      />

      <TransferOwnerModal
        isOpen={showTransferOwner}
        onClose={() => setShowTransferOwner(false)}
        community={community}
      />

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        defaultCommunityId={community.id}
      />
    </div>
  );
}
