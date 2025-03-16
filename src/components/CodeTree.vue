<template>
  <div class="code-tree" :style="{ width: containerWidth + 'px' }">
    <div class="chart-container">
      <v-chart 
        class="chart" 
        :option="chartOption" 
        :autoresize="true" 
        @click="handleChartClick"
        ref="chartRef"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { TreeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import type { TreeNode } from '../types'
import type { EChartsOption } from 'echarts'

// 注册必需的组件
use([
  CanvasRenderer,
  TreeChart,
  TitleComponent,
  TooltipComponent,
  GridComponent
])

const props = defineProps<{
  codeList: Array<{ id: string; code: string; pid?: string }>,
  activeId?: string // 新增：当前激活的节点ID
}>()

const emit = defineEmits<{
  (e: 'node-click', node: TreeNode): void
}>()

const chartRef = ref()

// 监听 activeId 变化，高亮对应节点
watch(() => props.activeId, (newId?: string) => {
  if (newId) {
    nextTick(() => {
      triggerNodeHighlight(newId)
    })
  }
})

const treeDataDfsList = computed(() => {
  const list: { id?: string; children?: any[] }[] = []
  const dfs = (node: any): void => {
      list.push(node)
      if(node.children){
        for(const child of node.children){
          dfs(child)
        }
      }
  }
  dfs(treeData.value)
  return list
})

// 查找节点在数据中的索引（使用深度优先搜索）
const findNodeIndex = (id: string): number => {
  const index = treeDataDfsList.value.findIndex(item => item.id === id)
  return index + 1
}

function triggerNodeHighlight(newId: string): void {
  if (newId && chartRef.value) {
    const chart = chartRef.value.chart
    // 取消所有节点的高亮
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    })
    const nodeIndex = findNodeIndex(newId)
    console.log('nodeIndex',nodeIndex);
    // 高亮当前节点
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: nodeIndex
    })
    // 将节点滚动到视图中心
    chart.dispatchAction({
      type: 'focusNodeAdjacency',
      seriesIndex: 0,
      dataIndex: nodeIndex
    })
  }
}

// 计算每层最大节点数
const getMaxNodesPerLevel = (data: any): number[] => {
  const levelCounts: number[] = []
  
  const traverse = (node: any, level: number) => {
    if (!levelCounts[level]) levelCounts[level] = 0
    levelCounts[level]++
    
    if (node.children) {
      node.children.forEach((child: any) => traverse(child, level + 1))
    }
  }
  
  traverse(data, 0)
  return levelCounts
}

// 计算容器宽度
const containerWidth = computed(() => {
  const minWidth = 300 // 最小宽度
  const nodeWidth = 55 // 每个节点的最小宽度
  const maxLevelNodes = Math.max(...getMaxNodesPerLevel(treeData.value))
  return Math.max(minWidth, nodeWidth * maxLevelNodes)
})

// 将扁平数据转换为树形结构
const treeData = computed(() => {
  const itemMap = new Map()
  let sequence = 1

  // 创建所有节点
  props.codeList.forEach(item => {
    itemMap.set(item.id, {
      name: String(sequence++),
      id: item.id,
      code: item.code,
      originName: item.id, // 添加原始名称用于tooltip
      children: [],
      itemStyle: {
        color: '#f5f7fa',
        borderColor: '#dcdfe6',
        borderWidth: 2
      },
      label: {
        color: '#303133',
        fontSize: 14,
        fontWeight: 'bold'
      }
    })
  })

  // 构建树结构
  props.codeList.forEach(item => {
    if (item.pid) {
      const parent = itemMap.get(item.pid)
      const node = itemMap.get(item.id)
      if (parent && node) {
        parent.children.push(node)
      }
    }
  })

  // 找到根节点
  const roots = []
  for (const [id, node] of itemMap) {
    if (!props.codeList.find(item => item.id === id)?.pid) {
      roots.push(node)
    }
  }

  return roots.length === 1 ? roots[0] : {
    name: 'root',
    children: roots,
    itemStyle: { opacity: 0 }
  }
})

// ECharts 配置项
const chartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    formatter: (params: any) => {
      return params.data.originName || params.name
    }
  },
  series: [{
    type: 'tree',
    data: [treeData.value],
    top: '10%',
    bottom: '10%',
    left: '10%',
    right: '10%',
    symbolSize: 30,
    orient: 'vertical',
    layout: 'orthogonal',
    initialTreeDepth: -1,
    roam: true,
    lineStyle: {
      color: '#dcdfe6',
      width: 2,
      curveness: 0.5
    },
    edgeSymbol: ['none', 'arrow'],
    edgeSymbolSize: [0, 10],
    itemStyle: {
      borderWidth: 2
    },
    label: {
      position: 'inside',
      fontSize: 14,
      color: '#303133'
    },
    emphasis: {
      focus: 'none',
      itemStyle: {
        color: '#ecf5ff',
        borderColor: '#409eff'
      }
    },
    expandAndCollapse: false,
    animationDuration: 550,
    animationDurationUpdate: 750
  }]
}))

// 处理节点点击事件
const handleChartClick = (params: any) => {
  if (params.data && params.data.id) {
    emit('node-click', {
      id: params.data.id,
      code: params.data.code
    } as TreeNode)
  }
}
</script>

<style scoped>
.code-tree {
  height: 100%;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 300px;
  transition: width 0.3s ease;
}

.chart-container {
  height: 500px;
  min-height: 500px;
  flex-shrink: 0;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>

<script lang="ts">
// 扩展 TreeNode 类型以包含序号
declare module '../types' {
  interface TreeNode {
    sequence?: number;
  }
}
</script> 