import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const frontendRoot = fileURLToPath(new URL('../', import.meta.url));
const entry = fileURLToPath(new URL('./api-services.entry.ts', import.meta.url));
let modules;

before(async () => {
  const result = await build({
    root: frontendRoot,
    configFile: false,
    envFile: false,
    logLevel: 'error',
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('https://api.discuss.test') },
    build: {
      write: false,
      minify: false,
      lib: { entry, formats: ['es'], fileName: 'test-services' },
    },
  });
  const bundle = (Array.isArray(result) ? result[0] : result).output.find((item) => item.type === 'chunk' && item.isEntry);
  modules = await import('data:text/javascript;base64,' + Buffer.from(bundle.code).toString('base64'));
});

function mockRequests(context, response) {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ path: new URL(url).pathname, ...options });
    return response ? response(calls.at(-1), calls.length) : Response.json({});
  });
  return calls;
}

test('updates only the selected profile privacy settings', async (context) => {
  const calls = mockRequests(context);

  await modules.userService.updatePrivacy({ showLocation: false });

  assert.equal(calls[0].path, '/users/me/settings/privacy');
  assert.equal(calls[0].method, 'PATCH');
  assert.equal(calls[0].credentials, 'include');
  assert.deepEqual(JSON.parse(calls[0].body), { showLocation: false });
});

test('encodes community names and sends the join approval decision', async (context) => {
  const calls = mockRequests(context, () => Response.json({ joinRequestPending: true }, { status: 202 }));

  const pending = await modules.communityService.join('java & web');
  assert.equal(pending.joinRequestPending, true);
  await modules.communityService.reviewJoinRequest('java & web', 17, false);

  assert.equal(calls[0].path, '/communities/java%20%26%20web/members');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[1].path, '/communities/java%20%26%20web/join-requests/17');
  assert.equal(calls[1].method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[1].body), { approved: false });
});

test('pins, unpins and removes the vote on a post using the appropriate methods', async (context) => {
  const calls = mockRequests(context);

  await modules.postService.setPinned('8', true);
  await modules.postService.setPinned('8', false);
  await modules.postService.vote('8', null);

  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ['PUT', '/posts/8/pin'],
    ['DELETE', '/posts/8/pin'],
    ['DELETE', '/posts/8/vote'],
  ]);
});

test('sends comment metadata and images as multipart without forcing a content type', async (context) => {
  const calls = mockRequests(context);
  const file = new File(['fixture'], 'image.png', { type: 'image/png' });

  await modules.commentService.create('4', 'My reply', '2', [file]);

  assert.equal(calls[0].path, '/comments');
  assert.ok(calls[0].body instanceof FormData);
  assert.equal(calls[0].headers, undefined);
  assert.equal(calls[0].body.get('files').name, 'image.png');
  assert.deepEqual(JSON.parse(await calls[0].body.get('comment').text()), {
    postId: '4', parentId: '2', content: 'My reply',
  });
});

test('rejects invalid report target IDs before sending a request', async (context) => {
  const calls = mockRequests(context);

  await assert.rejects(modules.reportService.create({ targetType: 'POST', targetId: -1, reason: 'SPAM' }),
    /Nội dung báo cáo không hợp lệ/);
  assert.equal(calls.length, 0);
});

test('sends notification actions and accepts responses with no body', async (context) => {
  const calls = mockRequests(context, () => new Response(null, { status: 204 }));

  await modules.notificationService.markNotificationAsRead('11');
  await modules.notificationService.markAllNotificationsAsRead();
  await modules.notificationService.deleteReadNotifications();

  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ['PUT', '/notifications/11/read'],
    ['PUT', '/notifications/read-all'],
    ['DELETE', '/notifications/read'],
  ]);
});

test('uses the admin lock endpoint and surfaces a forbidden result', async (context) => {
  const calls = mockRequests(context, () => Response.json({ message: 'Forbidden' }, { status: 403 }));

  await assert.rejects(modules.adminService.lockUser(15), { name: 'ApiError', status: 403 });
  assert.equal(calls[0].path, '/admin/users/15/lock');
  assert.equal(calls[0].method, 'PATCH');
});

test('refreshes an expired session and retries the original request', async (context) => {
  const calls = mockRequests(context, (_request, callNumber) => callNumber === 1
    ? Response.json({ code: 'ACCESS_TOKEN_EXPIRED' }, { status: 401 })
    : Response.json({ unreadCount: 3 }));
  modules.setApiSessionAuthenticated(true);
  context.after(() => modules.setApiSessionAuthenticated(false));

  assert.deepEqual(await modules.notificationService.getUnreadNotificationCount(), { unreadCount: 3 });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ['GET', '/notifications/unread-count'],
    ['POST', '/auth/refresh'],
    ['GET', '/notifications/unread-count'],
  ]);
});

test('sends a chat reply and preserves the client id across multipart retries', async (context) => {
  const calls = mockRequests(context);
  const clientId = 1234567890123;
  await modules.chatService.sendMessage(7, 'Reply', clientId, 42);
  const files = [new File(['test'], 'notes.txt')];
  await modules.chatService.sendMessage(7, '', clientId, 42, files);
  await modules.chatService.sendMessage(7, '', clientId, 42, files);

  assert.equal(calls[0].path, '/chat/7/messages');
  assert.deepEqual(JSON.parse(calls[0].body), { text: 'Reply', clientId, replyToId: 42 });
  for (const call of calls.slice(1)) {
    assert.ok(call.body instanceof FormData);
    assert.equal(call.headers, undefined);
    assert.equal(call.body.get('clientId'), String(clientId));
    assert.equal(call.body.get('replyToId'), '42');
    assert.equal(call.body.get('files').name, 'notes.txt');
  }
});

test('routes message reports without exposing chat history through the report endpoint', async (context) => {
  const calls = mockRequests(context);
  await modules.reportService.create({ targetType: 'MESSAGE', targetId: 17, reason: 'HARASSMENT' });
  assert.equal(calls[0].path, '/reports');
  assert.deepEqual(JSON.parse(calls[0].body), { targetType: 'MESSAGE', targetId: 17, reason: 'HARASSMENT' });
});

test('opens My Reports with the matching type and outcome for every reviewed report', async (context) => {
  const types = ['POST', 'COMMENT', 'COMMUNITY', 'MESSAGE'];
  mockRequests(context, () => Response.json({
    content: types.map((reportTargetType, id) => ({
      id, type: 'REPORT_REVIEWED', reportTargetType,
      reportStatus: id % 2 === 0 ? 'RESOLVED' : 'REJECTED',
      read: false,
    })),
    last: true,
  }));

  const result = await modules.notificationService.getNotifications();
  assert.deepEqual(result.content.map(item => item.targetUrl), [
    '/reports/mine?type=POST&status=RESOLVED',
    '/reports/mine?type=COMMENT&status=REJECTED',
    '/reports/mine?type=COMMUNITY&status=RESOLVED',
    '/reports/mine?type=MESSAGE&status=REJECTED',
  ]);
});
