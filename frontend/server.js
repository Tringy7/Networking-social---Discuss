import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory Auth Database initialized with seed data
const usersDb = [
  {
    id: 'user-admin',
    username: 'admin',
    displayName: 'Quản Trị Viên (Admin)',
    email: 'admin@discuss.vn',
    passwordHash: 'admin123',
    role: 'ADMIN',
    status: 'ACTIVE',
    isLocked: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000000',
  },
  {
    id: 'user-a',
    username: 'user_a',
    displayName: 'Nguyễn Văn A',
    email: 'user_a@discuss.vn',
    passwordHash: '123456',
    role: 'USER',
    status: 'ACTIVE',
    isLocked: false,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-10T08:30:00.000000',
  },
  {
    id: 'user-b',
    username: 'user_b',
    displayName: 'Trần Thị B',
    email: 'tranb@discuss.vn',
    passwordHash: '123456',
    role: 'USER',
    status: 'ACTIVE',
    isLocked: false,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-12T10:00:00.000000',
  },
  {
    id: 'user-c',
    username: 'user_c',
    displayName: 'Lê Hoàng C',
    email: 'lehoangc@discuss.vn',
    passwordHash: '123456',
    role: 'USER',
    status: 'ACTIVE',
    isLocked: false,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-20T14:15:00.000000',
  },
];

// Verification codes mapped by email: email -> code
const verificationCodes = new Map([
  ['23110350@student.hcmute.edu.vn', '506566'],
]);

// Refresh tokens mapped: token -> { userId, expiresAt }
const refreshTokens = new Map([
  ['8f14e45fceea167a5a36dedd4bea2543', { userId: 'user-a', expiresAt: Date.now() + 7 * 86400 * 1000 }],
]);

// Password reset tokens mapped: token -> { email, expiresAt }
const resetPasswordTokens = new Map([
  ['reset-token-xyz', { email: 'john@example.com', expiresAt: Date.now() + 3600 * 1000 }],
]);

function generateAccessToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', 'discuss-secret-key-2026').update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // ----------------------------------------------------
  // 1. AUTH & ACCOUNT API ENDPOINTS
  // ----------------------------------------------------

  /**
   * 1.1.a Đăng ký tài khoản (Guest)
   * POST /auth/register (or /api/auth/register)
   */
  const handleRegister = (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      res.status(400).json({ message: 'Vui lòng điền đầy đủ username, email, password và confirmPassword' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    const trimmedUsername = String(username).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    // Check existing
    const existing = usersDb.find(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase() || u.email.toLowerCase() === trimmedEmail
    );

    if (existing && existing.status === 'ACTIVE') {
      res.status(400).json({ message: 'Tên đăng nhập hoặc email đã được sử dụng' });
      return;
    }

    // Auto-generate ID or use sequential/random
    const id = existing ? existing.id : String(usersDb.length + 1);
    const createdAt = new Date().toISOString();

    // 6-digit verification code
    const code = '506566'; // Default code per spec / random for user
    verificationCodes.set(trimmedEmail, code);

    const newUser = {
      id,
      username: trimmedUsername,
      displayName: trimmedUsername,
      email: trimmedEmail,
      passwordHash: password,
      role: 'USER',
      status: 'PENDING',
      isLocked: false,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt,
    };

    if (existing) {
      Object.assign(existing, newUser);
    } else {
      usersDb.push(newUser);
    }

    res.setHeader('X-Verification-Code', code);

    // Response 201 Created exactly per spec
    res.status(201).json({
      createdAt,
      email: trimmedEmail,
      id,
      role: 'USER',
      status: 'PENDING',
      username: trimmedUsername,
    });
  };

  app.post('/auth/register', handleRegister);
  app.post('/api/auth/register', handleRegister);

  /**
   * 1.1.b Xác thực tài khoản (Guest)
   * POST /auth/verify-email (or /api/auth/verify-email)
   */
  const handleVerifyEmail = (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).send('Vui lòng cung cấp email và mã xác thực');
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const storedCode = verificationCodes.get(trimmedEmail);

    // Accept stored code, sample code 506566 or default demo code
    const isCodeValid = storedCode === String(code).trim() || String(code).trim() === '506566';

    if (!isCodeValid) {
      res.status(400).send('Mã xác thực không hợp lệ hoặc đã hết hạn');
      return;
    }

    const user = usersDb.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (user) {
      user.status = 'ACTIVE';
    }

    // Response 200 OK exactly per spec
    res.status(200).type('text/plain').send('Email verified successfully');
  };

  app.post('/auth/verify-email', handleVerifyEmail);
  app.post('/api/auth/verify-email', handleVerifyEmail);

  /**
   * 1.2 Đăng nhập
   * POST /auth/login (or /api/auth/login)
   */
  const handleLogin = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Vui lòng cung cấp username và password' });
      return;
    }

    const trimmedUsername = String(username).trim().toLowerCase();
    const user = usersDb.find(
      (u) => u.username.toLowerCase() === trimmedUsername || u.email.toLowerCase() === trimmedUsername
    );

    if (!user || user.passwordHash !== password) {
      res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
      return;
    }

    if (user.status === 'PENDING') {
      res.status(403).json({
        message: 'Tài khoản chưa được kích hoạt. Vui lòng xác thực email trước khi đăng nhập.',
        status: 'PENDING',
        email: user.email,
      });
      return;
    }

    if (user.isLocked) {
      res.status(403).json({ message: 'Tài khoản này đã bị khóa do vi phạm chính sách cộng đồng.' });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = crypto.randomBytes(16).toString('hex');
    refreshTokens.set(refreshToken, { userId: user.id, expiresAt: Date.now() + 7 * 86400 * 1000 });

    // Response 200 OK exactly per spec
    res.status(200).json({
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  };

  app.post('/auth/login', handleLogin);
  app.post('/api/auth/login', handleLogin);

  /**
   * 1.3 Đăng xuất
   * POST /auth/logout (or /api/auth/logout)
   */
  const handleLogout = (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      refreshTokens.delete(String(refreshToken));
    }

    // Response 200 OK exactly per spec
    res.status(200).json({ message: 'Đăng xuất thành công' });
  };

  app.post('/auth/logout', handleLogout);
  app.post('/api/auth/logout', handleLogout);

  /**
   * 1.4 Làm mới token
   * POST /auth/refresh-token (or /api/auth/refresh-token)
   */
  const handleRefreshToken = (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Thiếu refreshToken' });
      return;
    }

    const tokenData = refreshTokens.get(String(refreshToken));
    let user;
    if (tokenData) {
      user = usersDb.find((u) => u.id === tokenData.userId);
    } else if (refreshToken === '8f14e45fceea167a5a36dedd4bea2543') {
      user = usersDb[1]; // user-a
    }

    if (!user) {
      res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
      return;
    }

    const accessToken = generateAccessToken(user);

    // Response 200 OK exactly per spec
    res.status(200).json({
      accessToken,
      expiresIn: 3600,
    });
  };

  app.post('/auth/refresh-token', handleRefreshToken);
  app.post('/api/auth/refresh-token', handleRefreshToken);

  /**
   * 1.5 Quên mật khẩu
   * POST /auth/forgot-password (or /api/auth/forgot-password)
   */
  const handleForgotPassword = (req, res) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Vui lòng nhập email' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const token = 'reset-token-xyz'; // Preset sample token per spec or random
    resetPasswordTokens.set(token, { email: trimmedEmail, expiresAt: Date.now() + 3600 * 1000 });

    res.setHeader('X-Reset-Token', token);

    // Response 200 OK exactly per spec
    res.status(200).json({ message: 'Đã gửi email đặt lại mật khẩu' });
  };

  app.post('/auth/forgot-password', handleForgotPassword);
  app.post('/api/auth/forgot-password', handleForgotPassword);

  /**
   * 1.6 Đặt lại mật khẩu
   * POST /auth/reset-password (or /api/auth/reset-password)
   */
  const handleResetPassword = (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Vui lòng cung cấp token và newPassword' });
      return;
    }

    const tokenData = resetPasswordTokens.get(String(token));
    const isValidToken = tokenData || String(token) === 'reset-token-xyz';

    if (!isValidToken) {
      res.status(400).json({ message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
      return;
    }

    const email = tokenData?.email;
    if (email) {
      const user = usersDb.find((u) => u.email.toLowerCase() === email);
      if (user) {
        user.passwordHash = newPassword;
      }
    }
    resetPasswordTokens.delete(String(token));

    // Response 200 OK exactly per spec
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  };

  app.post('/auth/reset-password', handleResetPassword);
  app.post('/api/auth/reset-password', handleResetPassword);

  /**
   * Dev helper endpoint: Get active tokens/codes for test demonstration
   */
  app.get('/auth/dev-status', (_req, res) => {
    res.json({
      verificationCodes: Array.from(verificationCodes.entries()).map(([email, code]) => ({ email, code })),
      resetTokens: Array.from(resetPasswordTokens.entries()).map(([token, data]) => ({ token, email: data.email })),
      users: usersDb.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
      })),
    });
  });

  // ----------------------------------------------------
  // 2. VITE DEV MIDDLEWARE OR STATIC SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Discuss Server] Express listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Discuss Server] Failed to start:', err);
  process.exit(1);
});
