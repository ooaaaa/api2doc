const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/url-params/query:
 *   get:
 *     tags: [URL参数示例]
 *     summary: URL拼接参数示例
 *     description: 演示 URL 查询参数（?key=value&key2=value2），支持多个参数拼接，常用于搜索、筛选、分页等场景
 *     parameters:
 *       - name: name
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: 用户姓名（可选）
 *         example: 张三
 *       - name: age
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: 用户年龄（可选）
 *         example: 25
 *       - name: city
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: 所在城市（可选）
 *         example: 北京
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *         description: 用户状态（可选）
 *         example: active
 *     responses:
 *       200:
 *         description: 成功返回查询参数信息和模拟数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: URL 查询参数示例
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 请求时间戳
 *                   example: 2024-12-07T13:30:00.000Z
 *                 params:
 *                   type: object
 *                   description: 接收到的查询参数
 *                   example:
 *                     name: 张三
 *                     age: '25'
 *                     city: 北京
 *                     status: active
 *                 count:
 *                   type: integer
 *                   description: 查询参数的数量
 *                   example: 4
 *                 data:
 *                   type: object
 *                   description: 根据查询参数返回的模拟数据
 *                   properties:
 *                     users:
 *                       type: array
 *                       description: 匹配的用户列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           age:
 *                             type: integer
 *                           city:
 *                             type: string
 *                           status:
 *                             type: string
 *                       example:
 *                         - { id: 1, name: '张三', age: 25, city: '北京', status: 'active' }
 *                         - { id: 2, name: '张三丰', age: 25, city: '北京', status: 'active' }
 *                     total:
 *                       type: integer
 *                       description: 匹配的总数
 *                       example: 2
 *                 usage:
 *                   type: object
 *                   description: 使用说明
 *                   properties:
 *                     example:
 *                       type: string
 *                       example: /api/url-params/query?name=张三&age=25&city=北京&status=active
 *                     note:
 *                       type: string
 *                       example: 查询参数通过 ? 开始，多个参数用 & 连接
 */
router.get('/query', (req, res) => {
  const { name, age, city, status } = req.query;
  
  // 生成模拟数据
  const mockUsers = [];
  if (name || age || city || status) {
    // 根据查询条件生成1-3条模拟数据
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 1; i <= count; i++) {
      mockUsers.push({
        id: i,
        name: name ? `${name}${i > 1 ? i : ''}` : `用户${i}`,
        age: age ? parseInt(age) : 20 + i,
        city: city || '未知',
        status: status || 'active',
        email: `user${i}@example.com`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
  }
  
  res.json({
    success: true,
    message: 'URL 查询参数示例',
    timestamp: new Date().toISOString(),
    params: req.query,
    count: Object.keys(req.query).length,
    data: {
      users: mockUsers,
      total: mockUsers.length,
      filters: {
        name: name || null,
        age: age ? parseInt(age) : null,
        city: city || null,
        status: status || null
      }
    },
    usage: {
      example: '/api/url-params/query?name=张三&age=25&city=北京&status=active',
      note: '查询参数通过 ? 开始，多个参数用 & 连接',
      tips: [
        '所有参数都是可选的',
        '参数值会自动进行URL解码',
        '数字类型的参数会以字符串形式接收，需要手动转换'
      ]
    }
  });
});

/**
 * @openapi
 * /api/url-params/path/{id}:
 *   get:
 *     tags: [URL参数示例]
 *     summary: URL路径参数示例
 *     description: 演示 URL 路径参数（/path/:id），路径参数是URL的一部分，常用于指定资源ID、用户名等唯一标识
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 资源ID或用户标识（必填）
 *         example: user123
 *     responses:
 *       200:
 *         description: 成功返回路径参数信息和对应的资源数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: URL 路径参数示例
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: 请求时间戳
 *                   example: 2024-12-07T13:30:00.000Z
 *                 pathParam:
 *                   type: string
 *                   description: 接收到的路径参数
 *                   example: user123
 *                 data:
 *                   type: object
 *                   description: 根据路径参数返回的资源信息
 *                   properties:
 *                     resource:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: user123
 *                         type:
 *                           type: string
 *                           example: user
 *                         name:
 *                           type: string
 *                           example: 张三
 *                         email:
 *                           type: string
 *                           example: zhangsan@example.com
 *                         status:
 *                           type: string
 *                           example: active
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: 2024-01-01T00:00:00.000Z
 *                         metadata:
 *                           type: object
 *                           properties:
 *                             lastAccess:
 *                               type: string
 *                               format: date-time
 *                             accessCount:
 *                               type: integer
 *                           example:
 *                             lastAccess: 2024-12-07T13:30:00.000Z
 *                             accessCount: 42
 *                 usage:
 *                   type: object
 *                   description: 使用说明
 *                   properties:
 *                     example:
 *                       type: string
 *                       example: /api/url-params/path/user123
 *                     note:
 *                       type: string
 *                       example: 路径参数是URL的一部分，用 / 分隔
 *       404:
 *         description: 资源不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: 资源不存在
 *                 message:
 *                   type: string
 *                   example: 未找到ID为 xxx 的资源
 */
router.get('/path/:id', (req, res) => {
  const { id } = req.params;
  
  // 模拟资源数据
  const mockResource = {
    id: id,
    type: id.startsWith('user') ? 'user' : 'resource',
    name: id.startsWith('user') ? '张三' : `资源-${id}`,
    email: id.startsWith('user') ? `${id}@example.com` : null,
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    metadata: {
      lastAccess: new Date().toISOString(),
      accessCount: Math.floor(Math.random() * 100) + 1,
      tags: ['示例', '测试', 'API'],
      description: `这是ID为 ${id} 的资源详细信息`
    }
  };
  
  res.json({
    success: true,
    message: 'URL 路径参数示例',
    timestamp: new Date().toISOString(),
    pathParam: id,
    data: {
      resource: mockResource,
      relatedResources: [
        { id: `${id}-related-1`, name: '相关资源1', type: 'related' },
        { id: `${id}-related-2`, name: '相关资源2', type: 'related' }
      ]
    },
    usage: {
      example: '/api/url-params/path/user123',
      note: '路径参数是URL的一部分，用 / 分隔',
      tips: [
        '路径参数是必填的',
        '路径参数会自动进行URL解码',
        '常用于RESTful API中指定资源ID',
        '可以有多个路径参数，如 /users/:userId/posts/:postId'
      ]
    }
  });
});

/**
 * @openapi
 * /api/url-params/users/{userId}/posts/{postId}:
 *   get:
 *     tags: [URL参数示例]
 *     summary: 多路径参数+查询参数混合示例
 *     description: 演示多个路径参数与查询参数混合使用的场景，常见于嵌套资源的 RESTful API 设计
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *         example: u001
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 文章ID
 *         example: p100
 *       - name: format
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [full, brief, raw]
 *         description: 返回格式
 *         example: full
 *       - name: withComments
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: 是否包含评论
 *         example: true
 *     responses:
 *       200:
 *         description: 成功返回用户文章详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 userId:
 *                   type: string
 *                   example: u001
 *                 postId:
 *                   type: string
 *                   example: p100
 *                 post:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: 示例文章标题
 *                     content:
 *                       type: string
 *                       example: 这是文章内容...
 *                     author:
 *                       type: string
 *                       example: u001
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 query:
 *                   type: object
 *                   description: 接收到的查询参数
 */
router.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  const { format, withComments } = req.query;

  const post = {
    id: postId,
    title: `用户 ${userId} 的文章 ${postId}`,
    content: format === 'brief' ? '摘要内容...' : '这是一篇完整的示例文章内容，用于测试多路径参数与查询参数的混合使用场景。',
    author: userId,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  const result = {
    success: true,
    userId,
    postId,
    post,
    query: req.query
  };

  if (withComments === 'true') {
    result.comments = [
      { id: 'c1', author: 'visitor1', content: '写得不错', createdAt: new Date().toISOString() },
      { id: 'c2', author: 'visitor2', content: '学到了', createdAt: new Date().toISOString() }
    ];
  }

  res.json(result);
});

module.exports = router;
