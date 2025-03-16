# Python代码执行器

这是一个基于Vue3开发的Python代码执行器前端项目。它提供了一个树形结构的界面来展示和执行Python代码。

## 功能特点

- 树形结构展示代码模块
- 支持Python代码高亮显示
- 支持代码执行和结果显示
- 支持代码模块之间的跳转
- 响应式布局设计

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- Highlight.js
- 
## 开发环境要求

- Node.js >= 16
- npm >= 7

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 环境配置

在项目根目录创建`.env`文件，配置后端API地址：

```
VITE_API_BASE_URL=http://localhost:8000
```

## 项目结构

```
src/
  ├── components/     # 组件目录
  │   ├── CodeTree.vue    # 代码树组件
  │   └── CodeBlock.vue   # 代码块组件
  ├── types/         # 类型定义
  │   └── index.ts   # 接口类型
  ├── App.vue        # 主应用组件
  └── main.ts        # 应用入口
```

## 使用说明

1. 页面顶部显示页面标题和描述
2. 左侧显示代码模块的树形结构
3. 右侧显示代码内容和执行结果
4. 点击左侧树节点可以跳转到对应的代码块
5. 点击代码块上的"执行"按钮可以运行对应的Python代码

## 注意事项

- 确保后端API服务已经启动并正确配置
- 代码执行结果会显示在代码块下方
- 如果执行出错，错误信息会以红色显示
