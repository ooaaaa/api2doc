const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const router = express.Router();

const xmlParser = new xml2js.Parser();
const xmlBuilder = new xml2js.Builder();

// 配置文件上传
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

/**
 * @openapi
 * /api/request-body/json:
 *   post:
 *     tags: [请求体RequestBody不同类型示例]
 *     summary: JSON示例
 *     description: 演示接收 JSON 格式的请求体，这是最常用的 API 数据格式
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用户名
 *                 example: 张三
 *               age:
 *                 type: integer
 *                 description: 年龄
 *                 minimum: 0
 *                 maximum: 150
 *                 example: 25
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *                 example: zhangsan@example.com
 *     responses:
 *       200:
 *         description: 成功接收 JSON 数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 是否成功
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: 响应消息
 *                   example: 接收 JSON 数据成功
 *                 contentType:
 *                   type: string
 *                   description: 请求的 Content-Type
 *                   example: application/json
 *                 data:
 *                   type: object
 *                   description: 接收到的 JSON 数据
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: 张三
 *                     age:
 *                       type: integer
 *                       example: 25
 *                     email:
 *                       type: string
 *                       example: zhangsan@example.com
 */
router.post('/json', express.json(), (req, res) => {
  res.json({
    success: true,
    message: '接收 JSON 数据成功',
    contentType: req.get('Content-Type'),
    data: req.body
  });
});

/**
 * @openapi
 * /api/request-body/form:
 *   post:
 *     tags: [请求体RequestBody不同类型示例]
 *     summary: 表单示例
 *     description: 演示接收表单格式的请求体
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *               password:
 *                 type: string
 *                 description: 密码
 *               remember:
 *                 type: boolean
 *                 description: 记住我
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 是否成功
 *                 message:
 *                   type: string
 *                   description: 响应消息
 *                 contentType:
 *                   type: string
 *                   description: 请求的 Content-Type
 *                 data:
 *                   type: object
 *                   description: 接收到的表单数据
 */
router.post('/form', express.urlencoded({ extended: true }), (req, res) => {
  res.json({
    success: true,
    message: '接收表单数据成功',
    contentType: req.get('Content-Type'),
    data: req.body
  });
});

/**
 * @openapi
 * /api/request-body/xml:
 *   post:
 *     tags: [请求体RequestBody不同类型示例]
 *     summary: XML示例
 *     description: 演示接收 XML 格式的请求体，支持解析 XML 数据并返回 XML 格式的响应
 *     requestBody:
 *       required: true
 *       content:
 *         application/xml:
 *           schema:
 *             type: string
 *             description: XML 格式的用户数据
 *           example: |
 *             <?xml version="1.0" encoding="UTF-8"?>
 *             <user>
 *               <name>张三</name>
 *               <age>25</age>
 *               <email>zhangsan@example.com</email>
 *             </user>
 *     responses:
 *       200:
 *         description: 成功接收并解析 XML 数据
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               description: XML 格式的响应数据
 *             example: |
 *               <?xml version="1.0" encoding="UTF-8"?>
 *               <response>
 *                 <success>true</success>
 *                 <message>接收 XML 数据成功</message>
 *                 <data>
 *                   <user>
 *                     <name>张三</name>
 *                     <age>25</age>
 *                     <email>zhangsan@example.com</email>
 *                   </user>
 *                 </data>
 *               </response>
 *       400:
 *         description: XML 解析失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: 错误信息
 *                   example: XML 解析失败
 */
router.post('/xml', express.text({ type: 'application/xml' }), async (req, res) => {
  try {
    const result = await xmlParser.parseStringPromise(req.body);
    res.set('Content-Type', 'application/xml');
    res.send(xmlBuilder.buildObject({
      response: {
        success: true,
        message: '接收 XML 数据成功',
        data: result
      }
    }));
  } catch (error) {
    res.status(400).json({ error: 'XML 解析失败' });
  }
});

/**
 * @openapi
 * /api/request-body/file:
 *   post:
 *     tags: [请求体RequestBody不同类型示例]
 *     summary: 二进制数据示例-文件上传示例
 *     description: 演示单文件上传
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }
  res.json({
    success: true,
    message: '文件上传成功',
    file: {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

/**
 * @openapi
 * /api/request-body/files:
 *   post:
 *     tags: [请求体RequestBody不同类型示例]
 *     summary: 多文件上传示例
 *     description: 演示多文件上传
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/files', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '未上传文件' });
  }
  res.json({
    success: true,
    message: '多文件上传成功',
    count: req.files.length,
    files: req.files.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }))
  });
});

/**
 * @openapi
 * /api/request-body/text:
 *   post:
 *     tags: [请求体RequestBody不同类型示例]
 *     summary: 文本txt示例
 *     description: 演示接收纯文本格式的请求体，可用于日志、配置文件、Markdown 等文本数据的传输
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: 纯文本内容，支持多行文本
 *           example: |
 *             这是一段纯文本内容
 *             可以包含多行文字
 *             用于测试文本格式的请求体
 *             
 *             支持空行和特殊字符：!@#$%^&*()
 *     responses:
 *       200:
 *         description: 成功接收文本数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 是否成功
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: 响应消息
 *                   example: 接收文本数据成功
 *                 contentType:
 *                   type: string
 *                   description: 请求的 Content-Type
 *                   example: text/plain
 *                 data:
 *                   type: string
 *                   description: 接收到的文本内容
 *                   example: 这是一段纯文本内容
 *                 length:
 *                   type: integer
 *                   description: 文本长度（字符数）
 *                   example: 42
 */
router.post('/text', express.text(), (req, res) => {
  res.json({
    success: true,
    message: '接收文本数据成功',
    contentType: req.get('Content-Type'),
    data: req.body,
    length: req.body.length
  });
});

module.exports = router;
