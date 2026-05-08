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
 *     description: 演示 Cookie 请求头
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/request-cookie', (req, res) => {
  res.json({
    success: true,
    message: 'Cookie 示例',
    cookie: req.get('Cookie'),
    cookies: req.headers.cookie
  });
});

module.exports = router;
