import { 
  User, 
  Community, 
  Post, 
  Comment, 
  NotificationItem, 
  Conversation, 
  Report,
  CommunityMember
} from '../types';

export const CURRENT_MOCK_USER: User = {
  id: 'usr_me_01',
  username: 'huutri_dev',
  displayName: 'Hữu Trí (Software Engineer)',
  email: 'huutria22005@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  bio: 'Fullstack developer đam mê React, TypeScript & Spring Boot. Đang nghiên cứu hệ thống phân tán và UI/UX tương tác cao.',
  location: 'TP. Hồ Chí Minh, Việt Nam',
  dateOfBirth: '2005-02-14',
  gender: 'Nam',
  privacy: {
    showDateOfBirth: true,
    showLocation: true,
    showPostsOnProfile: true,
  },
  role: 'OWNER',
  status: 'ACTIVE',
  createdAt: '2023-09-01T08:00:00Z',
  karma: 2840,
};

export const MOCK_COMMUNITIES: Community[] = [
  {
    id: 'comm_01',
    name: 'lap-trinh-viet-nam',
    displayName: 'Lập trình Việt Nam',
    description: 'Cộng đồng lập trình viên lớn nhất Việt Nam. Nơi trao đổi thuật toán, kinh nghiệm phỏng vấn, kiến trúc phần mềm và định hướng nghề nghiệp.',
    avatarUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    category: 'Lập trình',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 124500,
    currentUserRole: 'OWNER',
    ownerId: 'usr_me_01',
    ownerUsername: 'huutri_dev',
    createdAt: '2022-01-15T00:00:00Z',
    rules: [
      { id: 'r1', title: 'Tôn trọng thành viên', description: 'Giao tiếp văn minh, không công kích cá nhân hay sử dụng từ ngữ xúc phạm.' },
      { id: 'r2', title: 'Nội dung chất lượng & có tâm', description: 'Khi hỏi bài cần cung cấp mã nguồn tối thiểu, thông báo lỗi cụ thể và các bước đã thử.' },
      { id: 'r3', title: 'Không spam quảng cáo khóa học', description: 'Các bài viết quảng bá thương mại chưa được kiểm duyệt sẽ bị xóa ngay lập tức.' }
    ]
  },
  {
    id: 'comm_02',
    name: 'frontend-mastery',
    displayName: 'Frontend Master & React',
    description: 'Chuyên sâu về React 19, Next.js, Vue, Tailwind CSS, TypeScript, Web Performance và tư duy Component Architecture hiện đại.',
    avatarUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    category: 'Frontend',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 88200,
    currentUserRole: 'MODERATOR',
    ownerId: 'usr_02',
    ownerUsername: 'minh_frontend',
    createdAt: '2022-05-10T00:00:00Z',
    rules: [
      { id: 'r1', title: 'Ghi rõ thư viện / phiên bản', description: 'Luôn đính kèm phiên bản React, Vite hoặc Tailwind đang sử dụng khi đặt câu hỏi.' },
      { id: 'r2', title: 'Ưu tiên chia sẻ demo CodeSandbox', description: 'Khuyến khích dẫn link demo trực tiếp để cộng đồng tiện hỗ trợ sửa lỗi.' }
    ]
  },
  {
    id: 'comm_03',
    name: 'backend-spring-hub',
    displayName: 'Backend & Spring Boot Hub',
    description: 'Thảo luận Spring Boot 3+, Microservices, Docker, Kafka, PostgreSQL, Redis, Clean Architecture và tối ưu hóa hiệu năng hệ thống.',
    avatarUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&auto=format&fit=crop&q=80',
    category: 'Backend',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 65300,
    currentUserRole: 'MEMBER',
    ownerId: 'usr_03',
    ownerUsername: 'hoang_backend',
    createdAt: '2022-08-20T00:00:00Z',
    rules: [
      { id: 'r1', title: 'Không chia sẻ thông tin nhạy cảm', description: 'Tuyệt đối không đăng tải connection string database thực tế hoặc API keys bí mật.' }
    ]
  },
  {
    id: 'comm_04',
    name: 'cong-nghe-ai',
    displayName: 'Trí tuệ nhân tạo & AI Việt',
    description: 'Cập nhật tin tức mô hình AI, LLM, Computer Vision, Gemini API, OpenAI, Machine Learning và các ứng dụng AI vào thực tế sản xuất.',
    avatarUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
    category: 'Công nghệ',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 142000,
    currentUserRole: 'MEMBER',
    ownerId: 'usr_04',
    ownerUsername: 'tien_ai',
    createdAt: '2023-01-05T00:00:00Z',
    rules: [
      { id: 'r1', title: 'Ghi nguồn tác giả hoặc bài báo', description: 'Mọi bài phân tích mô hình AI cần trích dẫn paper arxiv hoặc link chính thức.' }
    ]
  },
  {
    id: 'comm_05',
    name: 'ui-ux-vietnam',
    displayName: 'UI/UX Design Vietnam',
    description: 'Diễn đàn thiết kế giao diện, trải nghiệm người dùng, Design System, Figma workflow, Wireframing và Case Study chất lượng cao.',
    avatarUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    category: 'Thiết kế',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 53400,
    currentUserRole: 'MEMBER',
    ownerId: 'usr_05',
    ownerUsername: 'linh_designer',
    createdAt: '2022-11-12T00:00:00Z',
    rules: [
      { id: 'r1', title: 'Góp ý mang tính xây dựng', description: 'Feedback thiết kế văn minh, phân tích lý do UI/UX cụ thể.' }
    ]
  },
  {
    id: 'comm_06',
    name: 'game-dev-indie',
    displayName: 'Indie Game Dev VN',
    description: 'Nơi quy tụ các lập trình viên làm game độc lập bằng Unity, Unreal Engine, Godot. Chia sẻ shader, mechanics và devlogs hấp dẫn.',
    avatarUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    category: 'Games',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 39100,
    currentUserRole: 'NONE',
    ownerId: 'usr_06',
    ownerUsername: 'khoa_gamedev',
    createdAt: '2023-03-18T00:00:00Z',
    rules: []
  },
  {
    id: 'comm_07',
    name: 'giao-duc-dai-hoc',
    displayName: 'Sinh viên & Đồ án Đại học',
    description: 'Kinh nghiệm bảo vệ đồ án tốt nghiệp cử nhân CNTT, chọn đề tài khóa luận, review môn học và săn học bổng cao học.',
    avatarUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80',
    category: 'Giáo dục',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 76800,
    currentUserRole: 'MEMBER',
    ownerId: 'usr_07',
    ownerUsername: 'thay_tuan_edu',
    createdAt: '2022-09-01T00:00:00Z',
    rules: [
      { id: 'r1', title: 'Tuyệt đối không thuê làm đồ án', description: 'Cấm các bài đăng nhận làm thuê đồ án hoặc mua bán tài liệu có bản quyền.' }
    ]
  },
  {
    id: 'comm_08',
    name: 'giai-tri-meme-tech',
    displayName: 'Tech Memes & Chuyện Lập Trình',
    description: 'Giải trí sau giờ fix bug. Những câu chuyện dở khóc dở cười của dân IT, meme lập trình và góc tâm sự đêm muộn.',
    avatarUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    category: 'Giải trí',
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    memberCount: 112000,
    currentUserRole: 'NONE',
    ownerId: 'usr_08',
    ownerUsername: 'bug_hunter_vn',
    createdAt: '2022-04-01T00:00:00Z',
    rules: []
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post_01',
    communityName: 'lap-trinh-viet-nam',
    communityDisplayName: 'Lập trình Việt Nam',
    communityAvatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    author: {
      id: 'usr_me_01',
      username: 'huutri_dev',
      displayName: 'Hữu Trí (Software Engineer)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'OWNER'
    },
    title: 'Chia sẻ kiến trúc Fullstack: Xây dựng mạng xã hội DISCUSS với React 19 và Spring Boot 3 REST API',
    content: 'Chào các bạn, hôm nay mình xin chia sẻ toàn bộ kiến trúc frontend và backend của hệ thống DISCUSS mà mình vừa hoàn thiện cho đợt báo cáo tốt nghiệp. Ứng dụng áp dụng Clean Architecture phía Spring Boot kết hợp State Management bằng Zustand & Tailwind CSS phía React.\n\nMột số điểm mấu chốt:\n1. Phân tách hoàn toàn Presentation Layer và Domain Service.\n2. Bảo mật Stateless với HTTP-only Cookie và JWT Refresh Token rotation.\n3. Giao diện tối ưu hóa hiệu năng, animation 60fps mượt mà bằng Framer Motion.\n\nMời anh em xem qua cấu trúc Controller mẫu bên dưới!',
    mediaType: 'code',
    codeSnippet: {
      language: 'java',
      code: `@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;
    
    @GetMapping("/feed")
    public ResponseEntity<Page<PostResponse>> getFeed(
            @RequestParam(defaultValue = "for-you") String tab,
            @PageableDefault(size = 15, sort = "createdAt", direction = DESC) Pageable pageable) {
        return ResponseEntity.ok(postService.getCommunityFeed(tab, pageable));
    }
}`
    },
    tags: ['SpringBoot', 'React', 'Architecture', 'CleanCode'],
    heartCount: 342,
    commentCount: 28,
    isHearted: true,
    isSaved: true,
    createdAt: '2026-10-26T14:30:00Z',
    pinned: true
  },
  {
    id: 'post_02',
    communityName: 'frontend-mastery',
    communityDisplayName: 'Frontend Master & React',
    communityAvatar: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=150&auto=format&fit=crop&q=80',
    author: {
      id: 'usr_02',
      username: 'minh_frontend',
      displayName: 'Minh Nguyễn (Senior Frontend)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'MODERATOR'
    },
    title: 'Tailwind CSS v4 chính thức ra mắt: Có đáng để nâng cấp ngay từ Tailwind v3 không?',
    content: 'Tuần này Tailwind CSS v4 đã mang lại tốc độ biên dịch cực nhanh nhờ engine Oxide viết bằng Rust. Không còn cần file tailwind.config.js cồng kềnh nữa, mọi thứ đều cấu hình qua CSS native `@theme`. Tuy nhiên một số plugin cũ vẫn cần thời gian tương thích. Anh em team mình đã benchmark và nhận thấy build time giảm tới 70% trên dự án lớn!',
    mediaUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    tags: ['TailwindCSS', 'Frontend', 'WebDev'],
    heartCount: 185,
    commentCount: 19,
    isHearted: false,
    isSaved: false,
    createdAt: '2026-10-25T09:15:00Z'
  },
  {
    id: 'post_03',
    communityName: 'backend-spring-hub',
    communityDisplayName: 'Backend & Spring Boot Hub',
    communityAvatar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80',
    author: {
      id: 'usr_03',
      username: 'hoang_backend',
      displayName: 'Hoàng Lê (Cloud Architect)',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'USER'
    },
    title: 'Giải quyết bài toán High Concurrency: Tối ưu hàng đợi phản hồi và cache với Redis & Kafka',
    content: 'Khi số lượng người dùng đồng thời vượt quá 50,000 active sessions, truy vấn đếm lượt thích (reaction counter) và lượt bình luận trực tiếp vào PostgreSQL sẽ làm nghẽn connection pool. Giải pháp tốt nhất là ghi đệm Redis Stream hoặc Kafka topic rồi flush bất đồng bộ theo batch 500ms.',
    tags: ['PostgreSQL', 'Redis', 'Kafka', 'HighConcurrency'],
    heartCount: 224,
    commentCount: 31,
    isHearted: true,
    isSaved: true,
    createdAt: '2026-10-24T18:40:00Z'
  },
  {
    id: 'post_04',
    communityName: 'cong-nghe-ai',
    communityDisplayName: 'Trí tuệ nhân tạo & AI Việt',
    communityAvatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150&auto=format&fit=crop&q=80',
    author: {
      id: 'usr_04',
      username: 'tien_ai',
      displayName: 'Tiến Phạm (AI Engineer)',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      role: 'USER'
    },
    title: 'Tích hợp Gemini 2.5 Flash vào hệ thống kiểm duyệt nội dung cộng đồng tự động',
    content: 'Chúng tôi vừa thử nghiệm thành công pipeline kiểm duyệt văn bản và hình ảnh độc hại theo thời gian thực. Độ trễ trung bình của model là dưới 220ms, phân loại chính xác các bình luận vi phạm quy chuẩn cộng đồng với F1-score đạt 96.8%. Tiết kiệm 80% công sức cho đội ngũ Mod.',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    tags: ['AI', 'Gemini', 'MachineLearning', 'Moderation'],
    heartCount: 167,
    commentCount: 14,
    isHearted: false,
    isSaved: false,
    createdAt: '2026-10-23T11:20:00Z'
  },
  {
    id: 'post_05',
    communityName: 'ui-ux-vietnam',
    communityDisplayName: 'UI/UX Design Vietnam',
    communityAvatar: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=150&auto=format&fit=crop&q=80',
    author: {
      id: 'usr_05',
      username: 'linh_designer',
      displayName: 'Linh Trần (Product Designer)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'USER'
    },
    title: 'Dark Theme Design Tokens: Tại sao không nên dùng màu đen thuần túy (#000000)?',
    content: 'Màu đen tuyệt đối #000000 gây mỏi mắt nặng khi đọc văn bản trắng trong bóng tối vì độ tương phản quá gắt (21:1). Thay vào đó, các nền tảng cao cấp sử dụng các gam màu than ấm #0D0F10 kết hợp bề mặt nâng cao #191A1C và #222426 để thể hiện chiều sâu không gian (Elevation).',
    tags: ['UIUX', 'DesignTokens', 'DarkTheme', 'Accessibility'],
    heartCount: 310,
    commentCount: 22,
    isHearted: false,
    isSaved: true,
    createdAt: '2026-10-22T16:05:00Z'
  },
  {
    id: 'post_06',
    communityName: 'giao-duc-dai-hoc',
    communityDisplayName: 'Sinh viên & Đồ án Đại học',
    communityAvatar: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&auto=format&fit=crop&q=80',
    author: {
      id: 'usr_07',
      username: 'thay_tuan_edu',
      displayName: 'Thầy Tuấn (Giảng viên CNTT)',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      role: 'MODERATOR'
    },
    title: 'Lời khuyên cho các bạn sinh viên chuẩn bị bảo vệ Đồ án tốt nghiệp kỳ này',
    content: '1. Hội đồng sẽ quan tâm tính hoàn thiện của sản phẩm hơn là số lượng chức năng dang dở.\n2. Hãy chuẩn bị sẵn kịch bản Demo trực tiếp mượt mà, dự phòng trường hợp mạng yếu.\n3. Nắm chắc kiến trúc phân tầng (Clean Architecture), mô hình cơ sở dữ liệu và cách xử lý bảo mật.\nChúc các bạn sinh viên tự tin đạt điểm xuất sắc!',
    tags: ['SinhVien', 'DoAnTotNghiep', 'KhoaLuan', 'KinhNghiem'],
    heartCount: 420,
    commentCount: 45,
    isHearted: true,
    isSaved: false,
    createdAt: '2026-10-21T08:00:00Z'
  }
];

export const MOCK_COMMENTS: Record<string, Comment[]> = {
  post_01: [
    {
      id: 'cmt_01',
      postId: 'post_01',
      author: {
        id: 'usr_02',
        username: 'minh_frontend',
        displayName: 'Minh Nguyễn (Senior Frontend)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'MODERATOR'
      },
      content: 'Bài viết chia sẻ rất chi tiết và bài bản! Bạn xử lý re-render khi feed tải nhiều bài viết thế nào? Có dùng virtualization (như TanStack Virtual) không?',
      parentCommentId: null,
      heartCount: 14,
      isHearted: true,
      createdAt: '2026-10-26T15:00:00Z',
      replies: [
        {
          id: 'cmt_01_sub1',
          postId: 'post_01',
          author: {
            id: 'usr_me_01',
            username: 'huutri_dev',
            displayName: 'Hữu Trí (Software Engineer)',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            isAuthor: true,
            role: 'OWNER'
          },
          content: 'Cảm ơn anh Minh! Hiện tại em chia feed thành các trang 15 bài kết hợp cursor-based pagination. Phía client sử dụng React.memo cho Card item và hạn chế tối đa context re-renders nên lướt rất nhẹ nhàng ạ!',
          parentCommentId: 'cmt_01',
          heartCount: 9,
          isHearted: false,
          createdAt: '2026-10-26T15:25:00Z',
          replies: []
        }
      ]
    },
    {
      id: 'cmt_02',
      postId: 'post_01',
      author: {
        id: 'usr_03',
        username: 'hoang_backend',
        displayName: 'Hoàng Lê (Cloud Architect)',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'USER'
      },
      content: 'Code Controller Spring Boot sạch sẽ, tuân thủ đúng RESTful standard. 1 vote cho đồ án tốt nghiệp này!',
      parentCommentId: null,
      heartCount: 8,
      isHearted: false,
      createdAt: '2026-10-26T16:10:00Z',
      replies: []
    }
  ],
  post_02: [
    {
      id: 'cmt_03',
      postId: 'post_02',
      author: {
        id: 'usr_me_01',
        username: 'huutri_dev',
        displayName: 'Hữu Trí (Software Engineer)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'OWNER'
      },
      content: 'Chính xác anh ơi! Dự án DISCUSS này cũng đang chạy trực tiếp trên Vite với Tailwind v4. Tốc độ HMR cực kỳ ấn tượng, tiết kiệm nhiều thời gian phát triển.',
      parentCommentId: null,
      heartCount: 6,
      createdAt: '2026-10-25T10:05:00Z'
    }
  ]
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_01',
    type: 'REPLY',
    actor: {
      username: 'minh_frontend',
      displayName: 'Minh Nguyễn',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    message: 'đã trả lời bình luận của bạn trong bài viết "Chia sẻ kiến trúc Fullstack: Xây dựng mạng xã hội DISCUSS..."',
    targetUrl: '/post/post_01',
    isRead: false,
    createdAt: '2026-10-26T15:00:00Z'
  },
  {
    id: 'notif_02',
    type: 'INVITE',
    actor: {
      username: 'tien_ai',
      displayName: 'Tiến Phạm',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'
    },
    message: 'đã mời bạn làm Người kiểm duyệt (Moderator) cho cộng đồng "Trí tuệ nhân tạo & AI Việt"',
    targetUrl: '/c/cong-nghe-ai',
    isRead: false,
    createdAt: '2026-10-26T10:30:00Z'
  },
  {
    id: 'notif_03',
    type: 'MOD_ACTION',
    actor: {
      username: 'DISCUSS_BOT',
      displayName: 'DISCUSS System',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
    },
    message: 'Cộng đồng "Lập trình Việt Nam" vừa cán mốc 120,000 thành viên hoạt động!',
    targetUrl: '/c/lap-trinh-viet-nam',
    isRead: true,
    createdAt: '2026-10-24T09:00:00Z'
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_01',
    participant: {
      id: 'usr_02',
      username: 'minh_frontend',
      displayName: 'Minh Nguyễn (Senior Frontend)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'online'
    },
    lastMessage: 'Okie bạn, để mình check lại PR bên phía frontend nhé!',
    lastMessageTime: '15:45',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        senderId: 'usr_02',
        senderUsername: 'minh_frontend',
        text: 'Chào Trí, mình vừa xem qua bản demo giao diện DISCUSS, phần theme chuyển đổi rất mượt!',
        timestamp: '15:40',
        isMe: false
      },
      {
        id: 'm2',
        senderId: 'usr_me_01',
        senderUsername: 'huutri_dev',
        text: 'Cảm ơn anh Minh nhiều ạ! Em đang hoàn thiện nốt phần phân quyền kiểm duyệt và trang quản trị Admin.',
        timestamp: '15:42',
        isMe: true
      },
      {
        id: 'm3',
        senderId: 'usr_02',
        senderUsername: 'minh_frontend',
        text: 'Okie bạn, để mình check lại PR bên phía frontend nhé!',
        timestamp: '15:45',
        isMe: false
      }
    ]
  },
  {
    id: 'conv_02',
    participant: {
      id: 'usr_07',
      username: 'thay_tuan_edu',
      displayName: 'Thầy Tuấn (Giảng viên CNTT)',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      status: 'offline'
    },
    lastMessage: 'Thứ Năm tuần này em ghé văn phòng khoa duyệt slide báo cáo nhé.',
    lastMessageTime: 'Hôm qua',
    unreadCount: 0,
    messages: [
      {
        id: 'm4',
        senderId: 'usr_07',
        senderUsername: 'thay_tuan_edu',
        text: 'Thứ Năm tuần này em ghé văn phòng khoa duyệt slide báo cáo nhé.',
        timestamp: 'Hôm qua 10:15',
        isMe: false
      }
    ]
  }
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rep_01',
    contentType: 'POST',
    contentId: 'post_spam_99',
    contentTitle: 'Cung cấp bằng cấp giả, làm đồ án bao đậu 100%',
    contentSnippet: 'Liên hệ Zalo 09xx... để mua đồ án CNTT có sẵn điểm A...',
    communityName: 'lap-trinh-viet-nam',
    reporterUsername: 'minh_frontend',
    targetUsername: 'spam_account_01',
    reason: 'Spam dịch vụ bất hợp pháp, vi phạm nội quy đồ án đại học',
    status: 'PENDING',
    createdAt: '2026-10-27T00:15:00Z'
  },
  {
    id: 'rep_02',
    contentType: 'COMMENT',
    contentId: 'cmt_toxic_42',
    contentSnippet: 'Học lập trình làm gì cho cực, toàn bọn nói phét...',
    communityName: 'lap-trinh-viet-nam',
    reporterUsername: 'hoang_backend',
    targetUsername: 'troll_user_88',
    reason: 'Gây hấn, công kích cá nhân và dùng ngôn từ xúc phạm',
    status: 'PENDING',
    createdAt: '2026-10-26T21:40:00Z'
  },
  {
    id: 'rep_03',
    contentType: 'COMMUNITY',
    contentId: 'comm_banned_test',
    contentTitle: 'Hội Đua Xe Trái Phép Sài Gòn',
    contentSnippet: 'Cộng đồng tổ chức đua xe ban đêm...',
    reporterUsername: 'thay_tuan_edu',
    targetUsername: 'dark_rider_vn',
    reason: 'Tụ tập vi phạm pháp luật và an toàn xã hội',
    status: 'RESOLVED',
    resolutionNote: 'Đã khóa vĩnh viễn cộng đồng và cấm người tạo.',
    createdAt: '2026-10-25T14:10:00Z'
  }
];

export const MOCK_MEMBERS: CommunityMember[] = [
  {
    id: 'usr_me_01',
    username: 'huutri_dev',
    displayName: 'Hữu Trí (Software Engineer)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'OWNER',
    joinedAt: '2022-01-15',
    status: 'ACTIVE'
  },
  {
    id: 'usr_02',
    username: 'minh_frontend',
    displayName: 'Minh Nguyễn (Senior Frontend)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'MODERATOR',
    joinedAt: '2022-03-20',
    status: 'ACTIVE'
  },
  {
    id: 'usr_03',
    username: 'hoang_backend',
    displayName: 'Hoàng Lê (Cloud Architect)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'MEMBER',
    joinedAt: '2022-06-12',
    status: 'ACTIVE'
  },
  {
    id: 'usr_04',
    username: 'tien_ai',
    displayName: 'Tiến Phạm (AI Engineer)',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    role: 'MEMBER',
    joinedAt: '2023-02-01',
    status: 'ACTIVE'
  },
  {
    id: 'usr_05',
    username: 'linh_designer',
    displayName: 'Linh Trần (Product Designer)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'MEMBER',
    joinedAt: '2023-04-10',
    status: 'ACTIVE'
  }
];

export const MOCK_ADMIN_STATS = {
  totalUsers: 48920,
  activeUsersToday: 14320,
  totalCommunities: 86,
  totalPosts: 312540,
  pendingReports: 7,
  resolvedReports: 1420,
  userGrowth: [
    { month: 'T5', users: 12000, posts: 42000 },
    { month: 'T6', users: 18500, posts: 78000 },
    { month: 'T7', users: 26000, posts: 135000 },
    { month: 'T8', users: 34200, posts: 210000 },
    { month: 'T9', users: 41800, posts: 275000 },
    { month: 'T10', users: 48920, posts: 312540 }
  ]
};
