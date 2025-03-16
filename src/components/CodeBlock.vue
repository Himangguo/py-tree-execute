<template>
  <div class="code-block" :id="id">
    <div class="code-header">
      <span class="code-id">{{ id }}</span>
      <div class="button-container">
        <el-button
          type="primary"
          size="small"
          @click="executeCode"
          :disabled="pyodideLoading || loading"
          :loading="loading"
          >执行</el-button
        >
      </div>
    </div>
    <div class="code-content">
      <pre><code class="language-python">{{ code }}</code></pre>
    </div>
    <div v-if="result" class="code-result">
      <h4>执行结果：</h4>
      <pre>{{ result }}</pre>
    </div>
    <div v-if="error" class="code-error">
      <h4>执行错误：</h4>
      <pre>{{ error }}</pre>
    </div>
    <div class="code-plot">
      <h4>pyplot 图像：</h4>
      <img src="" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import type { PyodideInterface } from "pyodide";

const props = defineProps<{
  id: string;
  code: string;
  index: number;
  pyodideLoading: boolean;
}>();

const result = ref<string>("");
const error = ref<string>("");
const loading = ref(false);
// 用于跟踪已安装的包
const installedPackages = ref<Set<string>>(new Set());

// 检查并安装所需的包
async function ensurePackagesInstalled(code: string): Promise<void> {
  if (!window.pyodide) return;

  // 简单的导入语句匹配
  const importMatches = code.match(/import\s+(\w+)|from\s+(\w+)\s+import/g);
  if (!importMatches) return;

  const packages = new Set<string>();
  importMatches.forEach((match) => {
    const pkg = match.split(/\s+/)[1];
    if (!installedPackages.value.has(pkg)) {
      packages.add(pkg);
    }
  });

  if (packages.size > 0) {
    console.log("正在安装新的包:", Array.from(packages));
    await window.pyodide.loadPackage("micropip");
    const micropip = window.pyodide.pyimport("micropip");
    console.log("micropip", micropip);

    await Promise.all(
      Array.from(packages).map((pkg) =>
        micropip
          .install(pkg)
          .then(() => {
            installedPackages.value.add(pkg);
            console.log(`包 ${pkg} 安装成功`);
          })
          .catch((error: Error) => {
            console.error(`包 ${pkg} 安装失败:`, error);
          })
      )
    );
  }
}

async function hijackMatplotlib(index: number) {
  if (!window.pyodide) return;

  // 在 Python 中预执行代码：劫持 Matplotlib 的 show() 方法
  await window.pyodide.runPython(`
import matplotlib
# 强制使用非交互式后端
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from js import document

# 保存原始 show 方法
_original_show = plt.show

# 定义新的 show 方法：捕获图像并插入 DOM
def _patched_show(*args, **kwargs):
    buf = BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    image_data = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()  # 关闭当前图像释放内存
    
    # 插入到指定 div
    block = document.querySelectorAll('.right-content .code-block')[${index}]
    plot = block.querySelector('.code-plot')
    img = plot.querySelector('img')
    img.src = f"data:image/png;base64,{image_data}"
    plot.style.display = 'block'
# 劫持 plt.show
plt.show = _patched_show
`);
}

const executeCode = async () => {
  loading.value = true;
  result.value = "";
  error.value = "";

  try {
    if (!window.pyodide) {
      throw new Error("Pyodide 未初始化，请等待加载完成后再试");
    }

    // 重定向 Python 的标准输出和错误输出
    window.pyodide.runPython(`
      import sys
      import io
      sys.stdout = io.StringIO()
      sys.stderr = io.StringIO()
    `);

    await ensurePackagesInstalled(props.code);
    console.log("前置依赖包检查安装完成");

    if (installedPackages.value.has("matplotlib")) {
      await hijackMatplotlib(props.index);
      console.log("matplotlib劫持完成");
    }

    // 执行代码
    await window.pyodide.runPythonAsync(props.code);

    // 获取输出
    const stdout = window.pyodide.runPython("sys.stdout.getvalue()");
    const stderr = window.pyodide.runPython("sys.stderr.getvalue()");

    if (stderr) {
      error.value = stderr;
    }
    if (stdout) {
      result.value = stdout;
    }

    // 恢复标准输出和错误输出
    window.pyodide.runPython(`
      sys.stdout = sys.__stdout__
      sys.stderr = sys.__stderr__
    `);
  } catch (e: any) {
    console.error("代码执行错误:", e);
    // 获取详细的错误信息
    if (e.message.includes("PythonError")) {
      try {
        // 尝试获取 Python 的错误信息
        const stderr = window.pyodide?.runPython("sys.stderr.getvalue()");
        if (stderr) {
          error.value = stderr;
        } else {
          // 如果没有stderr，则提取Python错误的详细信息
          const errorMatch = e.message.match(/PythonError: ([\s\S]+)$/);
          error.value = errorMatch ? errorMatch[1] : e.message;
        }
      } catch {
        error.value = e.message;
      }
    } else {
      error.value = e.message || "执行代码时发生错误";
    }
  } finally {
    // 确保恢复标准输出和错误输出
    try {
      window.pyodide?.runPython(`
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
      `);
    } catch {
      // 忽略恢复过程中的错误
    }
    loading.value = false;
  }
};

onMounted(() => {
  hljs.highlightAll();
});
</script>

<style scoped>
.code-block {
  margin-bottom: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: left;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.code-id {
  font-weight: bold;
}

.code-content {
  padding: 15px;
  background-color: #f8f9fa;
}

.code-result,
.code-plot,
.code-error {
  padding: 15px;
  border-top: 1px solid #dcdfe6;
  background-color: #f8f9fa;
}

.code-plot {
  display: none;
}

.code-error {
  color: #f56c6c;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.button-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

</style>

<script lang="ts">
// 为window对象添加pyodide类型声明
declare global {
  interface Window {
    pyodide?: PyodideInterface;
  }
}
</script>
