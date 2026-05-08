const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 不同请求方式组合示例
 *   description: 测试前端对不同 HTTP 方法组合的智能识别
 */

/**
 * @swagger
 * /api/method-test/single-get:
 *   get:
 *     summary: 1个方式（GET）
 *     description: 只支持 GET 请求，前端应显示单个 GET 标签
 *     tags: [不同请求方式组合示例]
 *     responses:
 *       200:
 *         description: 成功返回单一GET请求的示例数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 method:
 *                   type: string
 *                   example: GET
 *                   description: HTTP请求方法
 *                 message:
 *                   type: string
 *                   example: 这是一个只支持 GET 的接口
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-12-07T13:11:44.490Z
 *                   description: 响应时间戳
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1001
 *                     title:
 *                       type: string
 *                       example: 单一GET请求示例
 *                     description:
 *                       type: string
 *                       example: 这个接口只接受GET请求，用于演示前端如何显示单个HTTP方法
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['只读操作', '无需请求体', '幂等性']
 *                     example:
 *                       type: object
 *                       properties:
 *                         usage:
 *                           type: string
 *                           example: GET /api/method-test/single-get
 *                         response:
 *                           type: string
 *                           example: 返回基本信息和示例数据
 */
router.get('/single-get', (req, res) => {
  res.json({
    method: 'GET',
    message: '这是一个只支持 GET 的接口',
    timestamp: new Date().toISOString(),
    data: {
      id: 1001,
      title: '单一GET请求示例',
      description: '这个接口只接受GET请求，用于演示前端如何显示单个HTTP方法',
      features: ['只读操作', '无需请求体', '幂等性'],
      example: {
        usage: 'GET /api/method-test/single-get',
        response: '返回基本信息和示例数据'
      }
    }
  });
});

/**
 * @swagger
 * /api/method-test/get-post-same:
 *   get:
 *     summary: 2个请求方式（GET/POST）
 *     description: 支持 GET 和 POST，功能相同，前端应合并显示为 GET/POST 标签
 *     tags: [不同请求方式组合示例]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *         example: 测试关键词
 *     responses:
 *       200:
 *         description: 成功返回搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['GET', 'POST']
 *                 message:
 *                   type: string
 *                   example: 这个接口支持 GET 和 POST，功能相同
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-12-07T13:11:44.490Z
 *                 receivedMethod:
 *                   type: string
 *                   example: GET
 *                 keyword:
 *                   type: string
 *                   example: 默认关键词
 *                 data:
 *                   type: object
 *                   properties:
 *                     searchResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           score:
 *                             type: integer
 *                       example:
 *                         - { id: 2001, name: '搜索结果1 - 默认关键词', score: 95 }
 *                         - { id: 2002, name: '搜索结果2 - 默认关键词', score: 88 }
 *                         - { id: 2003, name: '搜索结果3 - 默认关键词', score: 76 }
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     description:
 *                       type: string
 *                       example: GET和POST方法功能完全相同，前端应该合并显示为 GET/POST
 *   post:
 *     summary: 2个请求方式（GET/POST）
 *     description: 支持 GET 和 POST，功能相同，前端应合并显示为 GET/POST 标签
 *     tags: [不同请求方式组合示例]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keyword:
 *                 type: string
 *                 example: 测试关键词
 *                 description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功返回搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['GET', 'POST']
 *                 message:
 *                   type: string
 *                   example: 这个接口支持 GET 和 POST，功能相同
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-12-07T13:11:44.490Z
 *                 receivedMethod:
 *                   type: string
 *                   example: POST
 *                 keyword:
 *                   type: string
 *                   example: 默认关键词
 *                 data:
 *                   type: object
 *                   properties:
 *                     searchResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           score:
 *                             type: integer
 *                       example:
 *                         - { id: 2001, name: '搜索结果1 - 默认关键词', score: 95 }
 *                         - { id: 2002, name: '搜索结果2 - 默认关键词', score: 88 }
 *                         - { id: 2003, name: '搜索结果3 - 默认关键词', score: 76 }
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     description:
 *                       type: string
 *                       example: GET和POST方法功能完全相同，前端应该合并显示为 GET/POST
 */
router.get('/get-post-same', (req, res) => {
  const keyword = req.query.keyword || req.body.keyword || '默认关键词';
  res.json({
    methods: ['GET', 'POST'],
    message: '这个接口支持 GET 和 POST，功能相同',
    timestamp: new Date().toISOString(),
    receivedMethod: 'GET',
    keyword,
    data: {
      searchResults: [
        { id: 2001, name: `搜索结果1 - ${keyword}`, score: 95 },
        { id: 2002, name: `搜索结果2 - ${keyword}`, score: 88 },
        { id: 2003, name: `搜索结果3 - ${keyword}`, score: 76 }
      ],
      total: 3,
      description: 'GET和POST方法功能完全相同，前端应该合并显示为 GET/POST'
    }
  });
});

router.post('/get-post-same', (req, res) => {
  const keyword = req.query.keyword || req.body.keyword || '默认关键词';
  res.json({
    methods: ['GET', 'POST'],
    message: '这个接口支持 GET 和 POST，功能相同',
    timestamp: new Date().toISOString(),
    receivedMethod: 'POST',
    keyword,
    data: {
      searchResults: [
        { id: 2001, name: `搜索结果1 - ${keyword}`, score: 95 },
        { id: 2002, name: `搜索结果2 - ${keyword}`, score: 88 },
        { id: 2003, name: `搜索结果3 - ${keyword}`, score: 76 }
      ],
      total: 3,
      description: 'GET和POST方法功能完全相同，前端应该合并显示为 GET/POST'
    }
  });
});



/**
 * @swagger
 * /api/method-test/three-methods:
 *   get:
 *     summary: 3个请求方式（GET/POST/PUT）
 *     description: 支持 GET、POST、PUT 三种方法，功能相同，前端应合并显示为 GET/POST/PUT 标签
 *     tags: [不同请求方式组合示例]
 *     responses:
 *       200:
 *         description: 成功返回资源信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['GET', 'POST', 'PUT']
 *                 message:
 *                   type: string
 *                   example: 这个接口支持 GET、POST、PUT 三种方法
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-12-07T13:11:44.490Z
 *                 receivedMethod:
 *                   type: string
 *                   example: GET
 *                 data:
 *                   type: object
 *                   properties:
 *                     resource:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 3001
 *                         name:
 *                           type: string
 *                           example: 资源对象
 *                         status:
 *                           type: string
 *                           example: active
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2024-01-01T00:00:00Z
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2024-12-07T00:00:00Z
 *                     operations:
 *                       type: object
 *                       properties:
 *                         GET:
 *                           type: string
 *                           example: 查询资源
 *                         POST:
 *                           type: string
 *                           example: 创建资源
 *                         PUT:
 *                           type: string
 *                           example: 更新资源
 *                     note:
 *                       type: string
 *                       example: 三种方法功能相同，前端应合并显示为 GET/POST/PUT
 *   post:
 *     summary: 3个请求方式（GET/POST/PUT）
 *     description: 支持 GET、POST、PUT 三种方法，功能相同，前端应合并显示为 GET/POST/PUT 标签
 *     tags: [不同请求方式组合示例]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 新资源名称
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       200:
 *         description: 成功返回资源信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['GET', 'POST', 'PUT']
 *                 message:
 *                   type: string
 *                   example: 这个接口支持 GET、POST、PUT 三种方法
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 receivedMethod:
 *                   type: string
 *                   example: POST
 *                 body:
 *                   type: object
 *                   description: 接收到的请求体
 *                 data:
 *                   type: object
 *                   properties:
 *                     resource:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 3001
 *                         name:
 *                           type: string
 *                           example: 资源对象
 *                         status:
 *                           type: string
 *                           example: active
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     operations:
 *                       type: object
 *                     note:
 *                       type: string
 *   put:
 *     summary: 3个请求方式（GET/POST/PUT）
 *     description: 支持 GET、POST、PUT 三种方法，功能相同，前端应合并显示为 GET/POST/PUT 标签
 *     tags: [不同请求方式组合示例]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 更新资源名称
 *               status:
 *                 type: string
 *                 example: inactive
 *     responses:
 *       200:
 *         description: 成功返回资源信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['GET', 'POST', 'PUT']
 *                 message:
 *                   type: string
 *                   example: 这个接口支持 GET、POST、PUT 三种方法
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 receivedMethod:
 *                   type: string
 *                   example: PUT
 *                 body:
 *                   type: object
 *                   description: 接收到的请求体
 *                 data:
 *                   type: object
 */
router.get('/three-methods', (req, res) => {
  res.json({
    methods: ['GET', 'POST', 'PUT'],
    message: '这个接口支持 GET、POST、PUT 三种方法',
    timestamp: new Date().toISOString(),
    receivedMethod: 'GET',
    data: {
      resource: {
        id: 3001,
        name: '资源对象',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-12-07T00:00:00Z'
      },
      operations: {
        GET: '查询资源',
        POST: '创建资源',
        PUT: '更新资源'
      },
      note: '三种方法功能相同，前端应合并显示为 GET/POST/PUT'
    }
  });
});

router.post('/three-methods', (req, res) => {
  res.json({
    methods: ['GET', 'POST', 'PUT'],
    message: '这个接口支持 GET、POST、PUT 三种方法',
    timestamp: new Date().toISOString(),
    receivedMethod: 'POST',
    body: req.body,
    data: {
      resource: {
        id: 3001,
        name: '资源对象',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-12-07T00:00:00Z'
      },
      operations: {
        GET: '查询资源',
        POST: '创建资源',
        PUT: '更新资源'
      },
      note: '三种方法功能相同，前端应合并显示为 GET/POST/PUT'
    }
  });
});

router.put('/three-methods', (req, res) => {
  res.json({
    methods: ['GET', 'POST', 'PUT'],
    message: '这个接口支持 GET、POST、PUT 三种方法',
    timestamp: new Date().toISOString(),
    receivedMethod: 'PUT',
    body: req.body,
    data: {
      resource: {
        id: 3001,
        name: '资源对象',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-12-07T00:00:00Z'
      },
      operations: {
        GET: '查询资源',
        POST: '创建资源',
        PUT: '更新资源'
      },
      note: '三种方法功能相同，前端应合并显示为 GET/POST/PUT'
    }
  });
});

/**
 * @swagger
 * /api/method-test/all-methods:
 *   get:
 *     summary: 全部请求方式（ALL）
 *     description: 支持 GET、POST、PUT、PATCH、DELETE 五种主要方法，前端应合并显示为 ALL 标签
 *     tags: [不同请求方式组合示例]
 *     parameters:
 *       - in: query
 *         name: test
 *         schema:
 *           type: string
 *         description: 测试参数
 *         example: test-value
 *     responses:
 *       200:
 *         description: 成功返回通用资源信息和统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
 *                 message:
 *                   type: string
 *                   example: 这个接口支持所有主要 HTTP 方法
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-12-07T13:11:44.490Z
 *                 receivedMethod:
 *                   type: string
 *                   example: GET
 *                 query:
 *                   type: object
 *                   description: 查询参数
 *                 body:
 *                   type: object
 *                   description: 请求体
 *                 data:
 *                   type: object
 *                   properties:
 *                     resource:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 4001
 *                         name:
 *                           type: string
 *                           example: 通用资源
 *                         type:
 *                           type: string
 *                           example: universal
 *                         attributes:
 *                           type: object
 *                           properties:
 *                             flexible:
 *                               type: boolean
 *                               example: true
 *                             multiMethod:
 *                               type: boolean
 *                               example: true
 *                             restful:
 *                               type: boolean
 *                               example: true
 *                     supportedOperations:
 *                       type: object
 *                       properties:
 *                         GET:
 *                           type: string
 *                           example: 获取资源信息
 *                         POST:
 *                           type: string
 *                           example: 创建新资源
 *                         PUT:
 *                           type: string
 *                           example: 完整更新资源
 *                         PATCH:
 *                           type: string
 *                           example: 部分更新资源
 *                         DELETE:
 *                           type: string
 *                           example: 删除资源
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalRequests:
 *                           type: integer
 *                           example: 12580
 *                         successRate:
 *                           type: number
 *                           example: 99.8
 *                         avgResponseTime:
 *                           type: string
 *                           example: 45ms
 *                     note:
 *                       type: string
 *                       example: 支持所有主要HTTP方法，前端应显示为 ALL 标签
 *   post:
 *     summary: 全部请求方式（ALL）
 *     description: 支持 GET、POST、PUT、PATCH、DELETE 五种主要方法，前端应合并显示为 ALL 标签
 *     tags: [不同请求方式组合示例]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 新资源
 *               type:
 *                 type: string
 *                 example: custom
 *     responses:
 *       200:
 *         description: 成功返回通用资源信息和统计数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllMethodsResponse'
 *   put:
 *     summary: 全部请求方式（ALL）
 *     description: 支持 GET、POST、PUT、PATCH、DELETE 五种主要方法，前端应合并显示为 ALL 标签
 *     tags: [不同请求方式组合示例]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 成功
 *   patch:
 *     summary: 全部请求方式（ALL）
 *     description: 支持 GET、POST、PUT、PATCH、DELETE 五种主要方法，前端应合并显示为 ALL 标签
 *     tags: [不同请求方式组合示例]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 成功
 *   delete:
 *     summary: 全部请求方式（ALL）
 *     description: 支持 GET、POST、PUT、PATCH、DELETE 五种主要方法，前端应合并显示为 ALL 标签
 *     tags: [不同请求方式组合示例]
 *     responses:
 *       200:
 *         description: 成功
 */
router.all('/all-methods', (req, res) => {
  res.json({
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    message: '这个接口支持所有主要 HTTP 方法',
    timestamp: new Date().toISOString(),
    receivedMethod: req.method,
    query: req.query,
    body: req.body,
    data: {
      resource: {
        id: 4001,
        name: '通用资源',
        type: 'universal',
        attributes: {
          flexible: true,
          multiMethod: true,
          restful: true
        }
      },
      supportedOperations: {
        GET: '获取资源信息',
        POST: '创建新资源',
        PUT: '完整更新资源',
        PATCH: '部分更新资源',
        DELETE: '删除资源'
      },
      statistics: {
        totalRequests: 12580,
        successRate: 99.8,
        avgResponseTime: '45ms'
      },
      note: '支持所有主要HTTP方法，前端应显示为 ALL 标签'
    }
  });
});

module.exports = router;
