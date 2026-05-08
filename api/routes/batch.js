const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/batch/create:
 *   post:
 *     tags: [批量操作示例]
 *     summary: 批量创建示例
 *     description: 演示批量创建数据
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/create', express.json(), (req, res) => {
  const items = req.body.items || [];
  
  const created = items.map((item, index) => ({
    id: Date.now() + index,
    ...item,
    createdAt: new Date().toISOString()
  }));
  
  res.status(201).json({
    success: true,
    message: `批量创建成功，共 ${created.length} 条`,
    data: created
  });
});

/**
 * @openapi
 * /api/batch/update:
 *   put:
 *     tags: [批量操作示例]
 *     summary: 批量更新示例
 *     description: 演示批量更新数据
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/update', express.json(), (req, res) => {
  const items = req.body.items || [];
  
  const updated = items.map(item => ({
    ...item,
    updatedAt: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    message: `批量更新成功，共 ${updated.length} 条`,
    data: updated
  });
});

/**
 * @openapi
 * /api/batch/delete:
 *   delete:
 *     tags: [批量操作示例]
 *     summary: 批量删除示例
 *     description: 演示批量删除数据
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/delete', express.json(), (req, res) => {
  const ids = req.body.ids || [];
  
  res.json({
    success: true,
    message: `批量删除成功，共 ${ids.length} 条`,
    deletedIds: ids,
    deletedAt: new Date().toISOString()
  });
});

module.exports = router;
