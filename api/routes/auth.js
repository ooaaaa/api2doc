const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/auth/basic:
 *   get:
 *     tags: [认证授权示例]
 *     summary: Basic Auth示例
 *     description: 演示 Basic Authentication
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         schema:
 *           type: string
 *           example: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
 *     responses:
 *       200:
 *         description: 认证成功
 *       401:
 *         description: 认证失败
 */
router.get('/basic', (req, res) => {
  const auth = req.get('Authorization');
  
  if (!auth || !auth.startsWith('Basic ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '需要 Basic Authentication'
    });
  }
  
  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [username, password] = credentials.split(':');
  
  // 简单验证（实际应该查数据库）
  if (username === 'admin' && password === 'password') {
    res.json({
      success: true,
      message: 'Basic Auth 认证成功',
      username
    });
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: '用户名或密码错误'
    });
  }
});

/**
 * @openapi
 * /api/auth/bearer:
 *   get:
 *     tags: [认证授权示例]
 *     summary: Bearer Token示例
 *     description: 演示 Bearer Token 认证
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *     responses:
 *       200:
 *         description: 认证成功
 *       401:
 *         description: 认证失败
 */
router.get('/bearer', (req, res) => {
  const auth = req.get('Authorization');
  
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '需要 Bearer Token'
    });
  }
  
  const token = auth.split(' ')[1];
  
  // 简单验证（实际应该验证 JWT）
  if (token && token.length > 10) {
    res.json({
      success: true,
      message: 'Bearer Token 认证成功',
      token: token.substring(0, 20) + '...'
    });
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token 无效'
    });
  }
});

/**
 * @openapi
 * /api/auth/api-key:
 *   get:
 *     tags: [认证授权示例]
 *     summary: API Key示例
 *     description: 演示 API Key 认证
 *     parameters:
 *       - name: X-API-Key
 *         in: header
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 认证成功
 *       401:
 *         description: 认证失败
 */
router.get('/api-key', (req, res) => {
  const apiKey = req.get('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '需要 API Key'
    });
  }
  
  // 简单验证（实际应该查数据库）
  if (apiKey === 'demo-api-key-12345') {
    res.json({
      success: true,
      message: 'API Key 认证成功',
      apiKey: apiKey.substring(0, 10) + '...'
    });
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API Key 无效'
    });
  }
});

module.exports = router;
