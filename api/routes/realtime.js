const express = require('express');
const router = express.Router();

// WebSocket 初始化函数
function initWebSocket(wss) {
  /**
   * @openapi
   * /ws:
   *   get:
   *     tags: [实时接口]
   *     summary: WebSocket - 双向通信
   *     description: WebSocket 连接地址 ws://localhost:3030/ws，支持消息回显和定期推送
   *     responses:
   *       101:
   *         description: 切换协议到 WebSocket
   */
  wss.on('connection', (ws) => {
    console.log('✅ WebSocket 客户端已连接');
    
    ws.send(JSON.stringify({
      type: 'connection',
      message: '已连接到 WebSocket 服务器',
      timestamp: new Date().toISOString()
    }));

    ws.on('message', (message) => {
      console.log('📨 收到消息:', message.toString());
      
      // 回显消息
      ws.send(JSON.stringify({
        type: 'echo',
        data: message.toString(),
        timestamp: new Date().toISOString()
      }));
    });

    ws.on('close', () => {
      console.log('❌ WebSocket 客户端已断开');
    });

    // 定期发送更新
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          message: '来自服务器的定期更新',
          timestamp: new Date().toISOString()
        }));
      }
    }, 10000);

    ws.on('close', () => clearInterval(interval));
  });
}

/**
 * @openapi
 * /api/realtime/sse:
 *   get:
 *     tags: [实时接口]
 *     summary: SSE - 服务器推送事件
 *     description: |
 *       使用 Server-Sent Events (SSE) 推送实时数据流。SSE是一种服务器向客户端推送数据的技术，基于HTTP协议，单向通信（服务器→客户端）。
 *       
 *       特点：
 *       - 自动重连机制
 *       - 基于HTTP，穿透防火墙能力强
 *       - 文本格式，易于调试
 *       - 适用于股票行情、新闻推送、进度更新等场景
 *       
 *       本接口会推送10条消息，每2秒推送一条，包含实时数据、系统状态、模拟事件等信息。
 *     parameters:
 *       - name: interval
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 2000
 *           minimum: 500
 *           maximum: 10000
 *         description: 推送间隔（毫秒），默认2000ms
 *         example: 2000
 *       - name: count
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: 推送消息数量，默认10条
 *         example: 10
 *     responses:
 *       200:
 *         description: SSE 数据流，持续推送实时消息
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: 内容类型
 *             example: text/event-stream
 *           Cache-Control:
 *             schema:
 *               type: string
 *             description: 缓存控制
 *             example: no-cache
 *           Connection:
 *             schema:
 *               type: string
 *             description: 连接类型
 *             example: keep-alive
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: "SSE消息格式，每条消息以 data: 开头，以两个换行符结束"
 *               example: |
 *                 data: {"type":"connected","message":"SSE 连接已建立","timestamp":"2024-12-07T13:30:00.000Z"}
 *                 
 *                 data: {"type":"update","id":1,"message":"服务器推送消息 1","data":{"temperature":25.5,"humidity":60},"timestamp":"2024-12-07T13:30:02.000Z"}
 *                 
 *                 data: {"type":"complete","message":"推送结束","total":10,"timestamp":"2024-12-07T13:30:20.000Z"}
 */
router.get('/sse', (req, res) => {
  // 获取查询参数
  const interval = Math.min(Math.max(parseInt(req.query.interval) || 2000, 500), 10000);
  const maxCount = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 50);
  
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用nginx缓冲
  
  // 发送连接成功消息
  const connectMsg = {
    type: 'connected',
    message: 'SSE 连接已建立',
    config: {
      interval: `${interval}ms`,
      totalMessages: maxCount
    },
    timestamp: new Date().toISOString()
  };
  res.write(`data: ${JSON.stringify(connectMsg)}\n\n`);
  
  let counter = 0;
  
  // 模拟数据类型
  const dataTypes = ['sensor', 'notification', 'status', 'alert', 'metric'];
  
  const pushInterval = setInterval(() => {
    counter++;
    
    // 生成不同类型的模拟数据
    const dataType = dataTypes[counter % dataTypes.length];
    let eventData = {
      type: 'update',
      id: counter,
      dataType: dataType,
      message: `服务器推送消息 ${counter}/${maxCount}`,
      timestamp: new Date().toISOString()
    };
    
    // 根据类型添加不同的数据
    switch (dataType) {
      case 'sensor':
        eventData.data = {
          temperature: (20 + Math.random() * 10).toFixed(1),
          humidity: (50 + Math.random() * 30).toFixed(1),
          pressure: (1000 + Math.random() * 50).toFixed(1)
        };
        break;
      case 'notification':
        eventData.data = {
          title: `通知 ${counter}`,
          content: '您有新的消息需要查看',
          priority: counter % 3 === 0 ? 'high' : 'normal'
        };
        break;
      case 'status':
        eventData.data = {
          service: 'API服务',
          status: counter % 5 === 0 ? 'warning' : 'healthy',
          uptime: `${counter * 2}秒`,
          requests: Math.floor(Math.random() * 1000)
        };
        break;
      case 'alert':
        eventData.data = {
          level: counter % 4 === 0 ? 'error' : 'info',
          message: counter % 4 === 0 ? '检测到异常' : '系统运行正常',
          code: `E${1000 + counter}`
        };
        break;
      case 'metric':
        eventData.data = {
          cpu: (Math.random() * 100).toFixed(1) + '%',
          memory: (Math.random() * 100).toFixed(1) + '%',
          disk: (Math.random() * 100).toFixed(1) + '%'
        };
        break;
    }
    
    // 发送数据
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    
    // 达到最大数量后结束
    if (counter >= maxCount) {
      clearInterval(pushInterval);
      const completeMsg = {
        type: 'complete',
        message: '推送结束',
        total: maxCount,
        duration: `${(maxCount * interval) / 1000}秒`,
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(completeMsg)}\n\n`);
      res.end();
    }
  }, interval);
  
  // 客户端断开连接时清理
  req.on('close', () => {
    clearInterval(pushInterval);
    console.log(`SSE 客户端断开连接，已推送 ${counter}/${maxCount} 条消息`);
    res.end();
  });
});

/**
 * @openapi
 * /api/realtime/streamable:
 *   get:
 *     tags: [实时接口]
 *     summary: HTTP Streamable - 流式传输
 *     description: 使用 HTTP Chunked Transfer 流式传输数据
 *     responses:
 *       200:
 *         description: 流式响应
 *         content:
 *           application/x-ndjson:
 *             schema:
 *               type: string
 */
router.get('/streamable', (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  let count = 0;
  const interval = setInterval(() => {
    const data = {
      id: ++count,
      message: `流式数据 ${count}`,
      timestamp: new Date().toISOString()
    };
    res.write(JSON.stringify(data) + '\n');
    
    if (count >= 10) {
      clearInterval(interval);
      res.end();
    }
  }, 1000);
  
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

module.exports = { router, initWebSocket };
