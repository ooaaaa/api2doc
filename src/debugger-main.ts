import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import StandaloneDebugger from './components/standalone-debugger/index.vue'

const app = createApp(StandaloneDebugger)
app.use(Antd)
app.mount('#app')
