const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '接口示例 API Demo',
      version: '1.0.0',
description: `
# 基于 Express 的演示 API

这是一个功能完整的 **Express.js** 演示项目，旨在展示现代 Web API 开发的最佳实践。

## 🚀 主要功能

- **用户管理系统** - 完整的用户 CRUD 操作
- **身份认证授权** - JWT Token 认证机制
- **文件上传处理** - 支持多种文件格式上传
- **RESTful API 设计** - 标准的 REST 接口规范
- **实时通信** - WebSocket 实时数据推送
- **错误处理机制** - 统一的错误处理和响应格式

## 📋 接口分类

### 核心功能
- 用户注册、登录、信息管理
- 权限控制和角色管理
- 数据验证和安全防护

### 高级特性
- 批量操作支持
- 跨域资源共享 (CORS)
- 请求超时处理
- 多级目录路由

## 🛠️ 技术栈

- **后端框架**: Express.js
- **文档工具**: Swagger/OpenAPI 3.0
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON, Form-data, XML

---

*本项目适用于学习和参考现代 Web API 开发模式*
`,
    },
    servers: [
      {
        url: `http://${config.server.host}:${config.server.port}`,
        description: '本地开发服务器',
      },
    ],
    tags: [
      { name: '不同请求方式组合示例', description: '测试前端对不同 HTTP 方法组合的智能识别（单个方法、2个方法、3个方法、ALL方法）' },
      { name: 'RESTful 示例', description: '完整的 RESTful API 示例，展示所有 HTTP 方法（GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS）' },
      { name: '实时接口', description: '实时通信接口演示' },
      { name: 'URL参数示例', description: 'URL 查询参数和路径参数演示' },
      { name: '请求体RequestBody不同类型示例', description: '各种请求体格式演示' },
      { name: '响应体ResponseBody不同类型示例', description: '各种响应体格式演示' },
      { name: 'HTTP状态码示例', description: 'HTTP 状态码演示' },
      { name: '错误处理示例', description: '错误处理场景演示' },
      { name: '请求头Header示例', description: '请求头使用演示' },
      { name: '认证授权示例', description: '认证授权方式演示' },
      { name: '批量操作示例', description: '批量操作演示' },
      { name: '多级目录示例', description: '多级目录路径演示' },
      { name: '跨域CORS示例', description: 'CORS 跨域演示' },
      { name: '超时处理示例', description: '超时处理演示' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'user1' },
            nickname: { type: 'string', example: '张三' },
            email: { type: 'string', example: 'user1@example.com' },
            phone: { type: 'string', example: '13800138000' },
            avatar: { type: 'string', example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            age: { type: 'integer', example: 25 },
            birthday: { type: 'string', example: '1998-01-01' },
            address: { type: 'string', example: '中国某省某市某区某街道1号' },
            bio: { type: 'string', example: '这是用户1的个人简介' },
            status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
            role: { type: 'string', enum: ['admin', 'user', 'guest'] },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js', './server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
