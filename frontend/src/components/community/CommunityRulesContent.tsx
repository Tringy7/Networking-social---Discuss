import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDefaultCommunityRules } from './useDefaultCommunityRules';
import './communityRules.css';

export default function CommunityRulesContent({ markdown }: { markdown?: string | null }) {
  const defaults = useDefaultCommunityRules(!markdown?.trim());
  const content = markdown?.trim() ? markdown : defaults.markdown;
  if (!content) return <p className="rules-status" role="status">
    {defaults.error ? <>Không thể tải nội quy. <button type="button" onClick={defaults.retry}>Thử lại</button></> : 'Đang tải nội quy…'}
  </p>;
  return <div className="community-markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml
      components={{ a: ({ children, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer">{children}</a> }}>
      {content}
    </ReactMarkdown>
  </div>;
}
