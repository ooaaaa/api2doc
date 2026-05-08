<template>
  <div 
    ref="editorRef" 
    class="code-editor"
    :style="{
      '--editor-min-height': minHeight,
      '--editor-max-height': maxHeight
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { html } from '@codemirror/lang-html'
import { xml } from '@codemirror/lang-xml'
import { oneDark } from '@codemirror/theme-one-dark'

interface Props {
  modelValue: string
  language?: 'json' | 'html' | 'xml' | 'text'
  readonly?: boolean
  theme?: 'light' | 'dark'
  minHeight?: string
  maxHeight?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  language: 'json',
  readonly: false,
  theme: 'light',
  minHeight: '200px',
  maxHeight: '600px'
})

const emit = defineEmits<Emits>()

const editorRef = ref<HTMLElement>()
let editorView: EditorView | null = null

// 获取语言扩展
const getLanguageExtension = () => {
  switch (props.language) {
    case 'json':
      return json()
    case 'html':
      return html()
    case 'xml':
      return xml()
    default:
      return []
  }
}

// 初始化编辑器
onMounted(() => {
  if (!editorRef.value) return

  const extensions = [
    basicSetup,
    getLanguageExtension(),
    EditorView.lineWrapping,
    EditorState.readOnly.of(props.readonly),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !props.readonly) {
        emit('update:modelValue', update.state.doc.toString())
      }
    })
  ]

  // 添加主题
  if (props.theme === 'dark') {
    extensions.push(oneDark)
  }

  editorView = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions
    }),
    parent: editorRef.value
  })
})

// 监听内容变化
watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue
      }
    })
  }
})

// 监听只读状态变化
watch(() => props.readonly, (newReadonly) => {
  if (editorView) {
    // 重新创建编辑器以应用只读状态
    const currentDoc = editorView.state.doc.toString()
    editorView.destroy()
    
    const extensions = [
      basicSetup,
      getLanguageExtension(),
      EditorView.lineWrapping,
      EditorState.readOnly.of(newReadonly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !newReadonly) {
          emit('update:modelValue', update.state.doc.toString())
        }
      })
    ]

    if (props.theme === 'dark') {
      extensions.push(oneDark)
    }

    editorView = new EditorView({
      state: EditorState.create({
        doc: currentDoc,
        extensions
      }),
      parent: editorRef.value!
    })
  }
})

// 清理
onUnmounted(() => {
  editorView?.destroy()
})
</script>

<style scoped>
.code-editor {
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  overflow: hidden;
  height: auto;
}

.code-editor :deep(.cm-editor) {
  height: auto;
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
}

.code-editor :deep(.cm-scroller) {
  overflow: auto;
  height: auto;
}

/* 动态高度通过 props 控制 */
.code-editor :deep(.cm-scroller) {
  min-height: var(--editor-min-height, 80px);
  max-height: var(--editor-max-height, 600px);
}

.code-editor :deep(.cm-gutters) {
  background-color: #f9fafb;
  border-right: none;
  color: #9ca3af;
  min-width: 40px;
}

.code-editor :deep(.cm-lineNumbers .cm-gutterElement) {
  padding: 0 8px;
  min-width: 32px;
  text-align: right;
}

.code-editor :deep(.cm-content) {
  padding: 8px 0;
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
}

.code-editor :deep(.cm-line) {
  padding: 0 8px;
  line-height: 1.6;
}

/* 光标样式 */
.code-editor :deep(.cm-cursor) {
  border-left-color: var(--color-primary);
}

/* 选中文本样式 */
.code-editor :deep(.cm-selectionBackground) {
  background-color: rgba(66, 184, 131, 0.2) !important;
}

/* 聚焦时的边框 */
.code-editor :deep(.cm-focused) {
  outline: none;
}

.code-editor:has(.cm-focused) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.08);
}
</style>
