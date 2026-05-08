const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/advanced/nested/level3:
 *   get:
 *     tags: [多级目录示例/嵌套路径/三级目录]
 *     summary: 三级目录
 *     description: 演示三级目录路径
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/nested/level3', (req, res) => {
  res.json({
    success: true,
    message: '三级目录示例',
    path: '/api/advanced/nested/level3',
    level: 3
  });
});

/**
 * @openapi
 * /api/advanced/nested/deep/level4/level5:
 *   get:
 *     tags: [多级目录示例/深层嵌套/四级目录/五级目录]
 *     summary: 五级目录
 *     description: 演示五级目录路径
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/nested/deep/level4/level5', (req, res) => {
  res.json({
    success: true,
    message: '五级目录示例',
    path: '/api/advanced/nested/deep/level4/level5',
    level: 5
  });
});

module.exports = router;
