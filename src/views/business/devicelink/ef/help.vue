<template>
    <el-dialog
            title="帮助"
            :visible.sync="dialogVisible"
            width="70%"
            customClass="flowHelp"
    >
        <el-tabs tab-position="left">
          <el-tab-pane label="规则标准">
            <el-divider content-position="left">规则标准</el-divider>
            <div>一条完整的线路必须要包含三个节点，设备指标->条件关系->执行动作，并且三种节点必须按照此顺序去连接，否则会提示错误，如下：</div>
            <el-image :src="require('@/assets/images/shili.png')"></el-image>
          </el-tab-pane>
            <el-tab-pane label="如何新增">
                <el-divider content-position="left">如何新增</el-divider>
                <div>按住鼠标拖拽左侧组件到中间画布中松开鼠标即可</div>
            </el-tab-pane>
            <el-tab-pane label="如何删除">
                <el-divider content-position="left">页面删除</el-divider>
                <div>
                    鼠标点中需要删除的节点，点击左上角的删除图标
                </div>
                <el-divider content-position="left">通过代码删除</el-divider>
                <pre>this.deleteNode(nodeId)</pre>
            </el-tab-pane>
            <el-tab-pane label="如何移动">
                <el-divider content-position="left">如何移动</el-divider>
                <div>鼠标移动到节点中，当鼠标变为可拖拽的图标时按下鼠标移动到新的位置松开鼠标</div>
            </el-tab-pane>
            <el-tab-pane label="如何连线">
                <el-divider content-position="left">如何连线</el-divider>
                <div>鼠标移动到节点中左侧的图标上，当鼠标变为+时按下鼠标移动到另一个节点中松开鼠标</div>
            </el-tab-pane>
        </el-tabs>
    </el-dialog>
</template>

<script>
    export default {
        data() {
            return {
                dialogVisible: false
            }
        },
        components: {},
        methods: {
            init() {
                this.dialogVisible = true
            }
        }
    }
</script>

<style>
    .flowHelp {
        height: 80%;
    }
</style>
