import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import type { Plugin } from 'vite'

/**
 * 开发模式代理插件
 * 在 vite dev server 中提供 /proxy 和 /api/services 接口
 * 与 cli/server.js 的行为一致
 */
function devProxyPlugin(): Plugin {
  return {
    name: 'dev-proxy',
    configureServer(server) {
      // 代理模式检测
      server.middlewares.use('/api/services', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end('[]')
      })

      // 代理：获取远端 openapi.json
      server.middlewares.use('/proxy', async (req, res, next) => {
        if (req.method !== 'GET') return next()

        const url = new URL(req.url || '', 'http://localhost')
        const targetUrl = url.searchParams.get('url')
        if (!targetUrl) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: '缺少 url 参数' }))
          return
        }

        try {
          const headers: Record<string, string> = { Accept: 'application/json' }
          const customAuth = req.headers['x-custom-auth']
          if (customAuth) {
            headers['Authorization'] = Array.isArray(customAuth) ? customAuth[0] : customAuth
          }

          const resp = await fetch(targetUrl, { headers })
          if (!resp.ok) {
            res.statusCode = resp.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `远端返回 ${resp.status}: ${resp.statusText}` }))
            return
          }

          const contentType = resp.headers.get('content-type') || 'application/json'
          res.setHeader('Content-Type', contentType)
          res.end(await resp.text())
        } catch (err: any) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `代理请求失败: ${err.message}` }))
        }
      })

      // 代理：转发 API 调试请求
      server.middlewares.use('/proxy/api', async (req, res, next) => {
        if (req.method !== 'POST') return next()

        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString())
            if (!body || !body.url) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '缺少 url' }))
              return
            }

            const fetchOptions: RequestInit = {
              method: body.method || 'GET',
              headers: body.headers || {},
            }
            if (body.body && !['GET', 'HEAD'].includes((fetchOptions.method as string).toUpperCase())) {
              fetchOptions.body = typeof body.body === 'string' ? body.body : JSON.stringify(body.body)
            }

            const resp = await fetch(body.url, fetchOptions)
            const responseHeaders: Record<string, string> = {}
            resp.headers.forEach((value, key) => { responseHeaders[key] = value })

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              status: resp.status,
              statusText: resp.statusText,
              headers: responseHeaders,
              body: await resp.text(),
            }))
          } catch (err: any) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `API 代理请求失败: ${err.message}` }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          hoistStatic: true,
          cacheHandlers: true,
        },
      },
    }),
    devProxyPlugin(),
  ],
  server: {
    port: 5200,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        debugger: resolve(__dirname, 'debugger.html'),
      },
      output: {
        manualChunks: {
          'vue-vendor': ['vue'],
          'antd-vendor': ['ant-design-vue', '@ant-design/icons-vue'],
          'codemirror-vendor': [
            'codemirror',
            '@codemirror/lang-json',
            '@codemirror/lang-html',
            '@codemirror/lang-xml',
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/language',
            '@codemirror/theme-one-dark',
          ],
          'utils-vendor': ['marked'],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'ant-design-vue',
      '@ant-design/icons-vue',
      'marked',
      'codemirror',
    ],
  },
})
