<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import CodeTree from "./components/CodeTree.vue";
import CodeBlock from "./components/CodeBlock.vue";
import type { PageData } from "./types";
import { loadPyodide } from "pyodide";
import { ElMessage } from "element-plus";
// 模拟数据
const pageData = ref<PageData>({
  pageId: "page1",
  title: "Python代码执行示例",
  desc: "这是一个展示Python代码执行功能的示例页面",
  codeList: [
    {
      id: "code1",
      code: `
import matplotlib.pyplot as plt
plt.plot([1,2,3])
plt.show()`,
    },
    {
      id: "code2",
      code: `
      import numpy as np
      print("numpy版本:", np.__version__)`,
      pid: "code1",
    },
    {
      id: "code3",
      code: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Python"))',
      pid: "code1",
    },
    {
      id: "code4",
      code: 'x = 10\ny = 20\nprint(f"x + y = {x + y}")',
      pid: "code2",
    },
    {
      id: "code5",
      code: 'x = 10\ny = 20\nprint(f"x + y = {x + y}")',
      pid: "code2",
    },
    {
      id: "code6",
      code: 'x = 10\ny = 20\nprint(f"x + y = {x + y}")',
      pid: "code3",
    },
    {
      id: "code7",
      code: 'x = 10\ny = 20\nprint(f"x + y = {x + y}")',
      pid: "code3",
    },
    {
      id: "code8",
      code: 'x = 10\ny = 20\nprint(f"x + y = {x + y}")',
      pid: "code3",
    },
    {
      id: "code9",
      code: 'x = 10\ny = 20\nprint(f"x + y = {x + y}")',
      pid: "code4",
    },
  ],
});

// pyodide加载状态
const pyodideLoading = ref(false)
const handleNodeClick = (node: { id: string }) => {
  const element = document.getElementById(node.id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const activeNodeId = ref<string>('')
const rightContentRef = ref<HTMLElement | null>(null)

// 监听滚动事件，更新激活的节点
const handleScroll = () => {
  if (!rightContentRef.value) return

  const container = rightContentRef.value
  const codeBlocks = container.querySelectorAll('.code-block')
  const containerRect = container.getBoundingClientRect()
  const tolerance = 50 // 允许50像素的误差，使触发更容易
  for (const [index, block] of codeBlocks.entries()) {
    const rect = block.getBoundingClientRect()
    const relativeTop = rect.top - containerRect.top
    
    // 当代码块顶部接近容器顶部时触发
    if (Math.abs(relativeTop) <= tolerance) {
      activeNodeId.value = block.getAttribute('data-id') || ''
      break
    }
  }
}

// 添加和移除滚动监听器
onMounted(() => {
  rightContentRef.value = document.querySelector('.right-content')
  if (rightContentRef.value) {
    rightContentRef.value.addEventListener('scroll', handleScroll, { passive: true })
    // 初始检查
    handleScroll()
  }
})

onUnmounted(() => {
  if (rightContentRef.value) {
    rightContentRef.value.removeEventListener('scroll', handleScroll)
  }
})

// 初始化Pyodide
onMounted(async () => {
  console.log("正在初始化 Pyodide...");
  ElMessage.warning("正在初始化 Pyodide...");
  pyodideLoading.value = true;
  try {
    window.pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.3/full/",
    });
    console.log("Pyodide初始化成功");
    ElMessage.success("Pyodide初始化成功");
  } catch (error) {
    console.error("Pyodide 初始化失败:", error);
    ElMessage.error("Pyodide 初始化失败");
  } finally {
    pyodideLoading.value = false;
  }
});

// 添加类型声明
declare global {
  interface Window {
    pyodide: any;
  }
}
</script>

<template>
  <div class="app-container">
    <header class="header">
      <h2>{{ pageData.title }}</h2>
      <p class="description">{{ pageData.desc }}</p>
    </header>

    <div class="main-content">
      <div class="left-content">
        <CodeTree
          :code-list="pageData.codeList"
          :active-id="activeNodeId"
          @node-click="handleNodeClick"
        />
      </div>

      <div class="right-content" ref="rightContentRef">
        <code-block
          v-for="(item, index) in pageData.codeList"
          :key="item.id"
          :id="item.id"
          :data-id="item.id"
          class="code-block"
          :code="item.code"
          :index="index"
          :pyodide-loading="pyodideLoading"
        />
      </div>
    </div>
  </div>
</template>

<style>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.header {
  padding: 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  text-align: left;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.description {
  margin: 10px 0 0;
  color: #606266;
  font-size: 1rem;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-content {
  width: 350px;
  overflow-y: auto;
}

.right-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.container {
  display: flex;
  height: 100vh;
}

.code-blocks {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.code-block {
  margin-bottom: 20px;
}
</style>
