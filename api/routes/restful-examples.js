const express = require('express');
const router = express.Router();

/**
 * 模拟数据库存储
 */
let users = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', age: 28, status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', age: 32, status: 'active' },
  { id: 3, name: '王五', email: 'wangwu@example.com', age: 25, status: 'inactive' }
];

let nextId = 4;

/**
 * @swagger
 * tags:
 *   name: RESTful 示例
 *   description: 完整的 RESTful API 示例，展示所有 HTTP 方法
 */

/**
 * @swagger
 * /api/restful/users/{name}/{age}/{page}:
 *   get:
 *     summary: 查询用户列表
 *     description: GET 请求示例 - 通过姓名和年龄查询用户，支持分页（默认每页10条，最多3页）。自动生成30条模拟数据用于测试分页功能
 *     tags: [RESTful 示例]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户姓名前缀（会自动生成 name1, name2, ... name30）
 *         example: 张
 *       - in: path
 *         name: age
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 150
 *         description: 基准年龄（生成的用户年龄会在此基础上波动）
 *         example: 25
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 3
 *         description: 页码（1-3），每页10条数据
 *         example: 1
 *     responses:
 *       200:
 *         description: 查询成功，返回分页数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: 当前页的用户列表
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 用户ID
 *                         example: 1
 *                       name:
 *                         type: string
 *                         description: 用户姓名
 *                         example: 张1
 *                       email:
 *                         type: string
 *                         description: 用户邮箱
 *                         example: zhang1@example.com
 *                       age:
 *                         type: integer
 *                         description: 用户年龄
 *                         example: 26
 *                       status:
 *                         type: string
 *                         description: 用户状态
 *                         example: active
 *                   example:
 *                     - { id: 1, name: '张1', email: 'zhang1@example.com', age: 26, status: 'active' }
 *                     - { id: 2, name: '张2', email: 'zhang2@example.com', age: 27, status: 'active' }
 *                     - { id: 3, name: '张3', email: 'zhang3@example.com', age: 28, status: 'inactive' }
 *                 pagination:
 *                   type: object
 *                   description: 分页信息
 *                   properties:
 *                     page:
 *                       type: integer
 *                       description: 当前页码
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       description: 每页数量
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       description: 总记录数
 *                       example: 30
 *                     totalPages:
 *                       type: integer
 *                       description: 总页数
 *                       example: 3
 *                 query:
 *                   type: object
 *                   description: 查询条件
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: 张
 *                     age:
 *                       type: integer
 *                       example: 25
 *       400:
 *         description: 参数错误
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
 *                   example: 参数错误
 *                 message:
 *                   type: string
 *                   example: 页码必须在 1-3 之间
 */
router.get('/users/:name/:age/:page', (req, res) => {
  const { name, age, page } = req.params;
  const pageNum = parseInt(page);
  const ageNum = parseInt(age);
  const limit = 10; // 默认每页10条
  const maxPages = 3; // 最多支持3页
  
  // 验证页码
  if (pageNum < 1 || pageNum > maxPages) {
    return res.status(400).json({
      success: false,
      error: '参数错误',
      message: `页码必须在 1-${maxPages} 之间`
    });
  }
  
  // 验证年龄
  if (isNaN(ageNum) || ageNum < 0) {
    return res.status(400).json({
      success: false,
      error: '参数错误',
      message: '年龄必须是有效的数字'
    });
  }
  
  // 模拟生成30条数据（支持3页，每页10条）
  const allUsers = [];
  for (let i = 1; i <= 30; i++) {
    allUsers.push({
      id: i,
      name: `${name}${i}`,
      email: `${name.toLowerCase()}${i}@example.com`,
      age: ageNum + (i % 10), // 年龄在指定年龄附近波动
      status: i % 3 === 0 ? 'inactive' : 'active'
    });
  }
  
  // 分页
  const startIndex = (pageNum - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = allUsers.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedUsers,
    pagination: {
      page: pageNum,
      limit: limit,
      total: allUsers.length,
      totalPages: maxPages
    },
    query: {
      name,
      age: ageNum
    }
  });
});



/**
 * @swagger
 * /api/restful/users:
 *   post:
 *     summary: 创建新用户
 *     description: POST 请求示例 - 新增用户资源，支持创建包含姓名、邮箱、年龄和状态的用户信息
 *     tags: [RESTful 示例]
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
 *                 description: 用户姓名
 *                 example: 赵六
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱（必须唯一）
 *                 example: zhaoliu@example.com
 *               age:
 *                 type: integer
 *                 description: 用户年龄（可选）
 *                 example: 30
 *                 minimum: 1
 *                 maximum: 150
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 用户状态
 *                 default: active
 *                 example: active
 *     responses:
 *       201:
 *         description: 创建成功，返回新创建的用户信息
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
 *                   example: 用户创建成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 自动生成的用户ID
 *                       example: 4
 *                     name:
 *                       type: string
 *                       example: 赵六
 *                     email:
 *                       type: string
 *                       example: zhaoliu@example.com
 *                     age:
 *                       type: integer
 *                       example: 30
 *                     status:
 *                       type: string
 *                       example: active
 *       400:
 *         description: 请求参数错误
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
 *                   example: 参数错误
 *                 message:
 *                   type: string
 *                   example: name 和 email 是必填字段
 */
router.post('/users', (req, res) => {
  const { name, email, age, status = 'active' } = req.body;
  
  // 验证必填字段
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: '参数错误',
      message: 'name 和 email 是必填字段'
    });
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: '参数错误',
      message: '邮箱格式不正确'
    });
  }
  
  // 检查邮箱是否已存在
  if (users.some(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: '邮箱已存在',
      message: `邮箱 ${email} 已被使用`
    });
  }
  
  // 创建新用户
  const newUser = {
    id: nextId++,
    name,
    email,
    age: age || null,
    status
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    message: '用户创建成功',
    data: newUser
  });
});

/**
 * @swagger
 * /api/restful/users/{id}:
 *   put:
 *     summary: 完整更新用户
 *     description: PUT 请求示例 - 完整替换用户资源（需要提供所有字段），适用于需要更新用户全部信息的场景
 *     tags: [RESTful 示例]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 要更新的用户ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       description: 必须提供用户的所有字段信息
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - age
 *               - status
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用户姓名
 *                 example: 张三
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *                 example: zhangsan_new@example.com
 *               age:
 *                 type: integer
 *                 description: 用户年龄
 *                 example: 29
 *                 minimum: 1
 *                 maximum: 150
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 用户状态
 *                 example: active
 *     responses:
 *       200:
 *         description: 更新成功，返回更新后的用户信息
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
 *                   example: 用户更新成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: 张三
 *                     email:
 *                       type: string
 *                       example: zhangsan_new@example.com
 *                     age:
 *                       type: integer
 *                       example: 29
 *                     status:
 *                       type: string
 *                       example: active
 *       400:
 *         description: 请求参数错误
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
 *                   example: 参数错误
 *                 message:
 *                   type: string
 *                   example: PUT 请求需要提供所有字段：name, email, age, status
 *       404:
 *         description: 用户不存在
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
 *                   example: 用户不存在
 *                 message:
 *                   type: string
 *                   example: 未找到 ID 为 1 的用户
 */
router.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, age, status } = req.body;
  
  // 验证所有必填字段（PUT 需要完整数据）
  if (!name || !email || age === undefined || !status) {
    return res.status(400).json({
      success: false,
      error: '参数错误',
      message: 'PUT 请求需要提供所有字段：name, email, age, status'
    });
  }
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
      message: `未找到 ID 为 ${id} 的用户`
    });
  }
  
  // 检查邮箱是否被其他用户使用
  if (users.some(u => u.email === email && u.id !== id)) {
    return res.status(400).json({
      success: false,
      error: '邮箱已存在',
      message: `邮箱 ${email} 已被其他用户使用`
    });
  }
  
  // 完整替换用户数据
  users[userIndex] = {
    id,
    name,
    email,
    age,
    status
  };
  
  res.json({
    success: true,
    message: '用户更新成功',
    data: users[userIndex]
  });
});

/**
 * @swagger
 * /api/restful/users/{id}:
 *   patch:
 *     summary: 部分更新用户
 *     description: PATCH 请求示例 - 部分更新用户资源（只需提供要修改的字段），适用于只需要更新部分信息的场景
 *     tags: [RESTful 示例]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 要更新的用户ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       description: 只需提供要修改的字段，其他字段保持不变
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 用户姓名（可选）
 *                 example: 张三三
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱（可选）
 *                 example: zhangsan_updated@example.com
 *               age:
 *                 type: integer
 *                 description: 用户年龄（可选）
 *                 example: 30
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 用户状态（可选）
 *                 example: inactive
 *           examples:
 *             只更新姓名:
 *               value:
 *                 name: 张三三
 *             只更新状态:
 *               value:
 *                 status: inactive
 *             更新多个字段:
 *               value:
 *                 name: 张三三
 *                 age: 30
 *                 status: inactive
 *     responses:
 *       200:
 *         description: 更新成功，返回更新后的完整用户信息
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
 *                   example: 用户部分更新成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: 张三三
 *                     email:
 *                       type: string
 *                       example: zhangsan@example.com
 *                     age:
 *                       type: integer
 *                       example: 30
 *                     status:
 *                       type: string
 *                       example: inactive
 *                 updatedFields:
 *                   type: array
 *                   description: 本次更新的字段列表
 *                   items:
 *                     type: string
 *                   example: ['name', 'age', 'status']
 *       400:
 *         description: 请求参数错误
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
 *                   example: 参数错误
 *                 message:
 *                   type: string
 *                   example: 至少需要提供一个要更新的字段
 *       404:
 *         description: 用户不存在
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
 *                   example: 用户不存在
 *                 message:
 *                   type: string
 *                   example: 未找到 ID 为 1 的用户
 */
router.patch('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;
  
  // 验证至少有一个字段需要更新
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: '参数错误',
      message: '至少需要提供一个要更新的字段'
    });
  }
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
      message: `未找到 ID 为 ${id} 的用户`
    });
  }
  
  // 如果更新邮箱，检查是否被其他用户使用
  if (updates.email && users.some(u => u.email === updates.email && u.id !== id)) {
    return res.status(400).json({
      success: false,
      error: '邮箱已存在',
      message: `邮箱 ${updates.email} 已被其他用户使用`
    });
  }
  
  // 部分更新用户数据
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    id // 确保 ID 不被修改
  };
  
  res.json({
    success: true,
    message: '用户部分更新成功',
    data: users[userIndex],
    updatedFields: Object.keys(updates)
  });
});

/**
 * @swagger
 * /api/restful/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     description: DELETE 请求示例 - 删除指定用户资源，删除后返回被删除的用户信息
 *     tags: [RESTful 示例]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 要删除的用户ID
 *         example: 3
 *     responses:
 *       200:
 *         description: 删除成功，返回被删除的用户信息
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
 *                   example: 用户删除成功
 *                 data:
 *                   type: object
 *                   description: 被删除的用户信息
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     name:
 *                       type: string
 *                       example: 王五
 *                     email:
 *                       type: string
 *                       example: wangwu@example.com
 *                     age:
 *                       type: integer
 *                       example: 25
 *                     status:
 *                       type: string
 *                       example: inactive
 *       404:
 *         description: 用户不存在
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
 *                   example: 用户不存在
 *                 message:
 *                   type: string
 *                   example: 未找到 ID 为 3 的用户
 */
router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
      message: `未找到 ID 为 ${id} 的用户`
    });
  }
  
  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  
  res.json({
    success: true,
    message: '用户删除成功',
    data: deletedUser
  });
});

module.exports = router;
