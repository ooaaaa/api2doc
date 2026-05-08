const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/status-code/2xx:
 *   get:
 *     tags: [HTTP状态码示例]
 *     summary: 2xx成功状态码示例
 *     description: 演示 2xx 系列成功状态码
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: integer
 *           enum: [200, 201, 204]
 *           default: 200
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/2xx', (req, res) => {
  const code = parseInt(req.query.code) || 200;
  const allowedCodes = [200, 201, 204];
  const messages = {
    200: 'OK - 请求成功',
    201: 'Created - 资源已创建',
    204: 'No Content - 无内容'
  };
  
  // 验证状态码是否在允许的范围内
  if (!allowedCodes.includes(code)) {
    return res.status(400).json({
      error: 'Invalid status code',
      message: `状态码必须是以下值之一: ${allowedCodes.join(', ')}`,
      received: code
    });
  }
  
  if (code === 204) {
    return res.status(204).send();
  }
  
  res.status(code).json({
    code,
    message: messages[code],
    timestamp: new Date().toISOString()
  });
});

/**
 * @openapi
 * /api/status-code/3xx:
 *   get:
 *     tags: [HTTP状态码示例]
 *     summary: 3xx重定向状态码示例
 *     description: 演示 3xx 系列重定向状态码
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: integer
 *           enum: [301, 302, 304]
 *           default: 302
 *     responses:
 *       302:
 *         description: 重定向
 */
router.get('/3xx', (req, res) => {
  const code = parseInt(req.query.code) || 302;
  const allowedCodes = [301, 302, 304];
  
  // 验证状态码是否在允许的范围内
  if (!allowedCodes.includes(code)) {
    return res.status(400).json({
      error: 'Invalid status code',
      message: `状态码必须是以下值之一: ${allowedCodes.join(', ')}`,
      received: code
    });
  }
  
  if (code === 301 || code === 302) {
    return res.redirect(code, '/api/status-code/2xx');
  }
  
  if (code === 304) {
    return res.status(304).send();
  }
  
  res.status(code).json({
    code,
    message: '重定向示例',
    timestamp: new Date().toISOString()
  });
});

/**
 * @openapi
 * /api/status-code/4xx:
 *   get:
 *     tags: [HTTP状态码示例]
 *     summary: 4xx客户端错误示例
 *     description: 演示 4xx 系列客户端错误状态码
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: integer
 *           enum: [400, 401, 403, 404]
 *           default: 400
 *     responses:
 *       400:
 *         description: 客户端错误
 */
router.get('/4xx', (req, res) => {
  const code = parseInt(req.query.code) || 400;
  const allowedCodes = [400, 401, 403, 404];
  const messages = {
    400: 'Bad Request - 请求错误',
    401: 'Unauthorized - 未授权',
    403: 'Forbidden - 禁止访问',
    404: 'Not Found - 未找到'
  };
  
  // 验证状态码是否在允许的范围内
  if (!allowedCodes.includes(code)) {
    return res.status(400).json({
      error: 'Invalid status code',
      message: `状态码必须是以下值之一: ${allowedCodes.join(', ')}`,
      received: code
    });
  }
  
  res.status(code).json({
    code,
    message: messages[code],
    timestamp: new Date().toISOString()
  });
});

/**
 * @openapi
 * /api/status-code/5xx:
 *   get:
 *     tags: [HTTP状态码示例]
 *     summary: 5xx服务器错误示例
 *     description: 演示 5xx 系列服务器错误状态码
 *     parameters:
 *       - name: code
 *         in: query
 *         schema:
 *           type: integer
 *           enum: [500, 502, 503]
 *           default: 500
 *     responses:
 *       500:
 *         description: 服务器错误
 */
router.get('/5xx', (req, res) => {
  const code = parseInt(req.query.code) || 500;
  const allowedCodes = [500, 502, 503];
  const messages = {
    500: 'Internal Server Error - 服务器内部错误',
    502: 'Bad Gateway - 网关错误',
    503: 'Service Unavailable - 服务不可用'
  };
  
  // 验证状态码是否在允许的范围内
  if (!allowedCodes.includes(code)) {
    return res.status(400).json({
      error: 'Invalid status code',
      message: `状态码必须是以下值之一: ${allowedCodes.join(', ')}`,
      received: code
    });
  }
  
  res.status(code).json({
    code,
    message: messages[code],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
