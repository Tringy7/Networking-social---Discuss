import { useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { PostImage } from '../../types';
import { httpUrl, markdownImageUrl } from './postUrls';
import './postContent.css';

function CodeBlock({ children, ...props }: React.ComponentProps<'pre'>) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return <div className="post-code-block">
    <button type="button" onClick={async (event) => {
      const text = event.currentTarget.parentElement?.querySelector('code')?.textContent || '';
      try { await navigator.clipboard.writeText(text); setCopied(true); setError(false); }
      catch { setError(true); }
    }}>{error ? 'Không thể sao chép' : copied ? 'Đã sao chép' : 'Sao chép mã'}</button>
    <pre {...props}>{children}</pre>
  </div>;
}

export default function PostMarkdown({ content, images = [] }: { content: string; images?: PostImage[] }) {
  return <div className="post-markdown">
    <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
      urlTransform={(url, key) => key === 'src' ? (url.startsWith('post-image:') ? url : '') : httpUrl(url) || ''}
      components={{
        h1: ({ children }) => <h2 className="post-markdown-heading">{children}</h2>,
        a: ({ href, children }) => httpUrl(href)
          ? <a href={httpUrl(href)} target="_blank" rel="noopener noreferrer">{children}</a>
          : <span>{children as ReactNode}</span>,
        img: ({ src, alt }) => {
          const url = markdownImageUrl(typeof src === 'string' ? src : undefined, images);
          return url ? <img src={url} alt={alt || 'Ảnh trong bài viết'} loading="lazy" />
            : <span className="post-image-unavailable">[Ảnh chưa được xác minh: {alt || 'ảnh'}]</span>;
        },
        pre: CodeBlock,
      }}>{content}</ReactMarkdown>
  </div>;
}
