/**
 * 应用配置文件
 */
module.exports = {
  // 服务器配置
  server: {
    port: 3010,
    host: 'localhost'
  },

  // CORS 配置
  cors: {
    origin: '*',
    credentials: true
  },

  // 文件上传配置
  upload: {
    dest: 'uploads/',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },

  // JWT 配置
  jwt: {
    secret: 'demo-secret-key',
    expiresIn: '24h'
  }
};
