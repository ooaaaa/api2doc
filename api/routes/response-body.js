const express = require('express');
const xml2js = require('xml2js');
const path = require('path');
const router = express.Router();

const xmlBuilder = new xml2js.Builder();

/**
 * @openapi
 * /api/response-body/json:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: JSON示例
 *     description: 演示返回 JSON 格式的响应
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/json', (req, res) => {
  res.json({
    success: true,
    message: 'JSON 响应示例',
    data: {
      id: 1,
      name: '示例数据',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @openapi
 * /api/response-body/text:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: 文本txt示例
 *     description: 演示返回纯文本格式的响应
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/text', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send('这是一个纯文本响应示例\n包含多行文本\n时间戳: ' + new Date().toISOString());
});

/**
 * @openapi
 * /api/response-body/xml:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: XML示例
 *     description: 演示返回 XML 格式的响应
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 */
router.get('/xml', (req, res) => {
  const data = {
    response: {
      success: true,
      message: 'XML 响应示例',
      data: {
        id: 1,
        name: '示例数据',
        timestamp: new Date().toISOString()
      }
    }
  };
  res.set('Content-Type', 'application/xml');
  res.send(xmlBuilder.buildObject(data));
});

/**
 * @openapi
 * /api/response-body/html:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: HTML示例
 *     description: 演示返回 HTML 格式的响应
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/html', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HTML 响应示例</title>
</head>
<body>
  <h1>HTML 响应示例</h1>
  <p>这是一个 HTML 格式的响应</p>
  <p>时间戳: ${new Date().toISOString()}</p>
</body>
</html>
  `;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

/**
 * @openapi
 * /api/response-body/csv:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: CSV示例
 *     description: 演示返回 CSV 格式的响应
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/csv', (req, res) => {
  const csv = `ID,名称,年龄,创建时间
1,张三,25,${new Date().toISOString()}
2,李四,30,${new Date().toISOString()}
3,王五,28,${new Date().toISOString()}`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
  res.send(csv);
});

/**
 * @openapi
 * /api/response-body/svg-icon:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: SVG图标示例
 *     description: 演示返回 SVG 图标文件流，支持前端预览和下载
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           image/svg+xml:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/svg-icon', (req, res) => {
  // 生成一个简单的 SVG 图标
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆 -->
  <circle cx="100" cy="100" r="90" fill="url(#grad1)" />
  
  <!-- API 文字 -->
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="white" text-anchor="middle">API</text>
  
  <!-- 装饰性元素 -->
  <circle cx="50" cy="50" r="8" fill="white" opacity="0.6" />
  <circle cx="150" cy="50" r="6" fill="white" opacity="0.4" />
  <circle cx="50" cy="150" r="6" fill="white" opacity="0.4" />
  <circle cx="150" cy="150" r="8" fill="white" opacity="0.6" />
</svg>`;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Disposition', 'inline; filename="api-icon.svg"');
  res.send(svg);
});

/**
 * @openapi
 * /api/response-body/png-image:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: PNG图片示例
 *     description: 演示返回 PNG 图片文件流，支持前端预览和下载
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: 图片文件不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/png-image', (req, res) => {
  const fs = require('fs');
  const filePath = path.join(__dirname, '../public/测试图片.png');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: '图片文件不存在',
      path: filePath
    });
  }

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', 'inline; filename="test-image.png"');
  fs.createReadStream(filePath).pipe(res);
});

/**
 * @openapi
 * /api/response-body/binary-txt-download:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: 二进制-txt文件下载示例
 *     description: 演示文件下载功能，返回二进制文件流供浏览器下载。该接口会设置 Content-Disposition 为 attachment，触发浏览器的下载行为而不是预览。
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/binary-txt-download', (req, res) => {
  const fs = require('fs');
  
  // 使用api目录下的public文件夹
  const filePath = path.join(__dirname, '../public/测试下载文件.txt');
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: '文件不存在',
      path: filePath 
    });
  }
  
  // 使用 res.download 方法，它会自动处理文件名编码
  res.download(filePath, '测试下载文件.txt', (err) => {
    if (err) {
      console.error('文件下载失败:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: '文件下载失败',
          message: err.message 
        });
      }
    }
  });
});

/**
 * @openapi
 * /api/response-body/binary-word-download:
 *   get:
 *     tags: [响应体ResponseBody不同类型示例]
 *     summary: 二进制-word文件下载示例
 *     description: 演示Word文档下载功能，返回.docx格式的二进制文件流供浏览器下载。该接口会设置正确的Content-Type和Content-Disposition头，触发浏览器的下载行为。
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: 文件不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 path:
 *                   type: string
 */
router.get('/binary-word-download', (req, res) => {
  const fs = require('fs');
  
  // 使用api目录下的public文件夹
  const filePath = path.join(__dirname, '../public/测试下载.docx');
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: '文件不存在',
      path: filePath 
    });
  }
  
  // 设置正确的Content-Type和文件名
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="测试下载.docx"');
  
  // 下载文件
  res.download(filePath, '测试下载.docx', (err) => {
    if (err) {
      console.error('Word文档下载失败:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Word文档下载失败',
          message: err.message 
        });
      }
    }
  });
});

module.exports = router;
