const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - 系统信息
 *     summary: API 服务器信息
 *     description: 获取 API 服务器的基本信息和可用端点
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 接口示例 API Demo Server
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 endpoints:
 *                   type: object
 */
router.get('/', (_req, res) => {
  res.json({
    message: '接口示例 API Demo Server',
    version: '1.0.0',
    endpoints: {
      swagger: '/api-docs',
      swaggerJson: '/openapi.json',
      httpDemo: '/api/http-demo',
      httpMethods: '/api/http-methods',
      users: '/api/users',
      auth: '/api/auth',
      upload: '/api/upload',
      sse: '/api/sse',
      statusCodes: '/api/status',
      contentTypes: '/api/content-types',
      websocket: 'ws://localhost:3030/ws',
      errors: '/api/error'
    }
  });
});

module.exports = router;
