const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/error-handling/400:
 *   get:
 *     tags: [错误处理示例]
 *     summary: 400错误示例
 *     description: 演示 400 Bad Request 错误
 *     responses:
 *       400:
 *         description: 请求错误
 */
router.get('/400', (req, res) => {
  res.status(400).json({
    error: 'Bad Request',
    message: '请求参数错误',
    code: 400,
    timestamp: new Date().toISOString()
  });
});

/**
 * @openapi
 * /api/error-handling/401:
 *   get:
 *     tags: [错误处理示例]
 *     summary: 401错误示例
 *     description: 演示 401 Unauthorized 错误
 *     responses:
 *       401:
 *         description: 未授权
 */
router.get('/401', (req, res) => {
  res.status(401).json({
    error: 'Unauthorized',
    message: '未授权，请先登录',
    code: 401,
    timestamp: new Date().toISOString()
  });
});

/**
 * @openapi
 * /api/error-handling/403:
 *   get:
 *     tags: [错误处理示例]
 *     summary: 403错误示例
 *     description: 演示 403 Forbidden 错误
 *     responses:
 *       403:
 *         description: 禁止访问
 */
router.get('/403', (req, res) => {
  res.status(403).json({
    error: 'Forbidden',
    message: '无权限访问此资源',
    code: 403,
    timestamp: new Date().toISOString()
  });
});

/**
 * @openapi
 * /api/error-handling/404:
 *   get:
 *     tags: [错误处理示例]
 *     summary: 404错误示例
 *     description: 演示 404 Not Found 错误
 *     responses:
 *       404:
 *         description: 未找到
 */
router.get('/404', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '请求的资源不存在',
    code: 404,
    timestamp: new Date().toISOString()
  });
});

/**
 * @openapi
 * /api/error-handling/500:
 *   get:
 *     tags: [错误处理示例]
 *     summary: 500错误示例
 *     description: 演示 500 Internal Server Error 错误
 *     responses:
 *       500:
 *         description: 服务器错误
 */
router.get('/500', (req, res) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: '服务器内部错误',
    code: 500,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
