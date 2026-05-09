const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/headers/request-custom:
 *   get:
 *     tags: [请求头Header示例]
 *     summary: 自定义请求头示例
 *     description: 演示接收自定义请求头
 *     parameters:
 *       - name: X-Custom-Header
 *         in: header
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/request-custom', (req, res) => {
  res.json({
    success: true,
    message: '自定义请求头示例',
    customHeader: req.get('X-Custom-Header'),
    allHeaders: req.headers
  });
});

/**
 * @openapi
 * /api/headers/request-content-type:
 *   post:
 *     tags: [请求头Header示例]
 *     summary: Content-Type示例
 *     description: 演示 Content-Type 请求头
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/request-content-type', express.json(), (req, res) => {
  res.json({
    success: true,
    message: 'Content-Type 示例',
    contentType: req.get('Content-Type'),
    body: req.body
  });
});

/**
 * @openapi
 * /api/headers/request-authorization:
 *   get:
 *     tags: [请求头Header示例]
 *     summary: Authorization示例
 *     description: 演示 Authorization 请求头
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/request-authorization', (req, res) => {
  const auth = req.get('Authorization');
  res.json({
    success: true,
    message: 'Authorization 示例',
    authorization: auth,
    hasAuth: !!auth
  });
});

/**
 * @openapi
 * /api/headers/request-cookie:
 *   get:
 *     tags: [请求头Header示例]
 *     summary: Cookie示例
 *     description: |
 *       演示 Cookie 请求头的读取，同时在响应中通过 Set-Cookie 设置 Cookie。
 *       客户端发送的 Cookie 会在响应体中回显，响应头会设置示例 Cookie 供后续请求使用。
 *     parameters:
 *       - name: Cookie
 *         in: header
 *         description: 客户端携带的 Cookie，格式为 key=value; key2=value2
 *         schema:
 *           type: string
 *           example: "session_id=abc123; theme=dark"
 *     responses:
 *       200:
 *         description: 成功，响应头包含 Set-Cookie
 *         headers:
 *           Set-Cookie:
 *             description: 服务端设置的 Cookie
 *             schema:
 *               type: string
 *               example: "token=eyJhbGciOiJIUzI1NiJ9; Path=/; HttpOnly"
 */
router.get('/request-cookie', (req, res) => {
  // 设置响应 Cookie 示例
  res.setHeader('Set-Cookie', [
    'token=eyJhbGciOiJIUzI1NiJ9.demo; Path=/; HttpOnly; SameSite=Lax',
    'user_id=10086; Path=/; Max-Age=3600',
    'theme=dark; Path=/; Secure; SameSite=Strict'
  ]);

  res.json({
    success: true,
    message: 'Cookie 示例',
    receivedCookie: req.get('Cookie') || '(未携带 Cookie)',
    parsedCookies: parseCookieHeader(req.get('Cookie')),
    tip: '响应头中已设置 Set-Cookie，可在调试器中查看并一键回填到请求'
  });
});

/**
 * 解析 Cookie 请求头为键值对
 */
function parseCookieHeader(cookieStr) {
  if (!cookieStr) return {};
  const result = {};
  cookieStr.split(';').forEach(pair => {
    const [key, ...rest] = pair.trim().split('=');
    if (key) result[key.trim()] = rest.join('=').trim();
  });
  return result;
}

module.exports = router;
