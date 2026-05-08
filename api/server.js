const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const config = require('./config');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// 路由模块
const indexRouter = require('./routes/index');
const { router: realtimeRouter, initWebSocket } = require('./routes/realtime');
const urlParamsRouter = require('./routes/url-params');
const requestBodyRouter = require('./routes/request-body');
const responseBodyRouter = require('./routes/response-body');
const statusCodeRouter = require('./routes/status-code');
const errorHandlingRouter = require('./routes/error-handling');
const headersRouter = require('./routes/headers');
const authRouter = require('./routes/auth');
const batchRouter = require('./routes/batch');
const advancedRouter = require('./routes/advanced');
const restfulExamplesRouter = require('./routes/restful-examples');
const methodCombinationsRouter = require('./routes/method-combinations');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = config.server.port;

// 中间件
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));
app.use(logger);

// Swagger 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '接口示例 API Demo - API 文档'
}));

// 提供 OpenAPI JSON
app.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API 路由
app.use('/', indexRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/url-params', urlParamsRouter);
app.use('/api/request-body', requestBodyRouter);
app.use('/api/response-body', responseBodyRouter);
app.use('/api/status-code', statusCodeRouter);
app.use('/api/error-handling', errorHandlingRouter);
app.use('/api/headers', headersRouter);
app.use('/api/auth', authRouter);
app.use('/api/batch', batchRouter);
app.use('/api/advanced', advancedRouter);
app.use('/api/restful', restfulExamplesRouter);
app.use('/api/method-test', methodCombinationsRouter);

// 初始化 WebSocket
initWebSocket(wss);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '未找到资源',
    message: `无法 ${req.method} ${req.path}`
  });
});

// 全局错误处理
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 服务器启动成功: http://localhost:${PORT}`);
  console.log(`📚 Swagger 文档: http://localhost:${PORT}/api-docs`);
  console.log(`📝 OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
});
