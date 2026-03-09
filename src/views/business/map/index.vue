<template>
  <div class="container">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline size="small">
        <el-form-item label="设备名称">
          <el-input v-model="queryParams.deviceName" placeholder="请输入设备名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="queryParams.status" placeholder="请选择设备状态">
            <el-option label="全部" value=""></el-option>
            <el-option label="在线" value="1"></el-option>
            <el-option label="离线" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 标签栏 -->
    <div class="tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="全部" name=""></el-tab-pane>
        <el-tab-pane v-for="item in productList" :key="item.productSn" :label="item.productName" :name="item.productSn"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 主体内容：左侧设备列表 + 右侧地图 -->
    <div class="main-content">
      <!-- 左侧设备列表：重构布局，修复排版问题 -->
      <div class="device-list" style="z-index: 10;">
        <!-- 卡片专属容器：负责卡片排版，数据少也规整 -->
        <div class="card-container">
          <el-card
            v-for="(device, index) in deviceList"
            :key="device.id || `device-${index}`"
            shadow="never"
            class="device-card"
            :class="{ 'online-card': device.status === '1', 'offline-card': device.status === '0' }"
            @click.native="handleDeviceClick(device)"
            @mousedown="handleDeviceClick(device)"
          >
            <!-- 卡片头部：名称 + 状态标签 -->
            <div class="device-header">
              <div class="device-title">{{ device.deviceName }}</div>
              <el-tag :type="device.status === '1' ? 'success' : 'danger'" size="mini">
                {{ device.status === '1' ? '在线' : '离线' }}
              </el-tag>
            </div>

            <!-- 卡片主体：设备信息 -->
            <div class="device-body">
              <div class="device-info-item">
                <span class="info-label">设备类型：</span>
                <span class="info-value">{{ deviceTypeText(device.deviceType) }}</span>
              </div>
              <div class="device-info-item">
                <span class="info-label">坐标位置：</span>
                <el-tooltip
                  :content="device.position || '未定位'"
                  placement="top"
                  effect="dark"
                  trigger="hover"
                  :disabled="!device.position && device.position === ''"
                >
                  <span class="info-value tooltip-trigger" :class="{ 'empty-value': !device.position }">
                    {{ device.position || '未定位' }}
                  </span>
                </el-tooltip>
              </div>
              <div class="device-info-item">
                <span class="info-label">位置名称：</span>
                <el-tooltip
                  :content="device.positionName || '未知位置'"
                  placement="top"
                  effect="dark"
                  trigger="hover"
                  :disabled="!device.positionName && device.positionName === ''"
                >
                  <span class="info-value tooltip-trigger">{{ device.positionName || '未知位置' }}</span>
                </el-tooltip>
              </div>
            </div>
          </el-card>

          <!-- 空数据提示 -->
          <div v-if="deviceList.length === 0" class="empty-tip">
            <el-empty description="暂无设备数据"></el-empty>
          </div>
        </div>

        <!-- 分页：固定在列表底部 -->
        <div class="pagination">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="prev, pager, next, jumper"
            :total="total"
          ></el-pagination>
        </div>
      </div>

      <!-- 右侧地图 -->
      <div class="map-section" v-if="isMapContainerReady">
        <div id="amap-container" class="amap-wrapper"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { listDevice } from "@/api/business/device";
import { listProduct } from "@/api/business/product";

// 配置高德地图安全密钥
window._AMapSecurityConfig = {
  securityJsCode: process.env.VUE_APP_AMAP_SECURITY_JS_CODE,
};

/**
 * 加载高德地图脚本
 * @returns {Promise<AMap>} 高德地图核心对象
 */
function loadAMapScript() {
  return new Promise((resolve, reject) => {
    // 移除旧脚本避免重复加载
    const oldScript = document.querySelector(`script[src*="webapi.amap.com/maps"]`);
    if (oldScript) oldScript.remove();

    // 如果已加载直接返回
    if (window.AMap && typeof window.AMap === 'object') {
      resolve(window.AMap);
      return;
    }

    const apiKey = process.env.VUE_APP_AMAP_KEY;
    if (!apiKey) {
      reject(new Error('未配置高德地图Key，请检查环境变量 VUE_APP_AMAP_KEY'));
      return;
    }

    const script = document.createElement('script');
    // 2.0版本基础加载（包含核心地图，控件需单独加载）
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.ToolBar`;
    script.type = "text/javascript";
    script.async = true;
    script.defer = true;

    // 10秒超时处理
    const timeoutTimer = setTimeout(() => {
      reject(new Error('高德地图API加载超时（10秒），请检查网络或Key有效性'));
    }, 10000);

    // 加载成功
    script.onload = () => {
      clearTimeout(timeoutTimer);
      setTimeout(() => {
        if (window.AMap) {
          resolve(window.AMap);
        } else {
          reject(new Error('高德地图核心对象初始化失败'));
        }
      }, 500);
    };

    // 加载失败
    script.onerror = (err) => {
      clearTimeout(timeoutTimer);
      reject(new Error(`高德地图脚本加载失败：${err.message}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * 检查地图容器是否存在
 * @returns {Promise<boolean>} 容器是否存在
 */
function checkMapContainerExist() {
  return new Promise((resolve) => {
    let checkCount = 0;
    const maxCheck = 10;
    const checkInterval = 500;

    const check = () => {
      const container = document.getElementById('amap-container');
      if (container || checkCount >= maxCheck) {
        resolve(!!container);
        return;
      }
      checkCount++;
      setTimeout(check, checkInterval);
    };

    check();
  });
}

export default {
  name: 'DeviceMap',
  data() {
    return {
      queryParams: { deviceName: '', status: '',productSn:'' },
      activeTab: '',
      productList: [],
      deviceList: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      map: null,
      markers: [],
      MARKER_CLICK_ZOOM: 15,
      isMapLoaded: false,
      isMapContainerReady: true
    };
  },
  mounted() {
    this.$nextTick(async () => {
      try {
        const containerExist = await checkMapContainerExist();
        if (!containerExist) {
          throw new Error('地图容器DOM元素不存在');
        }
        await this.initAMap();
      } catch (err) {
        console.error('地图初始化前置检查失败:', err);
        this.$message.error(`地图加载失败：${err.message}`);
        this.isMapContainerReady = false;
      }

      this.getProductList();
      this.getDeviceList();
    });
  },
  beforeDestroy() {
    if (this.map) {
      this.clearMarkers();
      this.map.destroy();
      this.map = null;
    }
  },
  methods: {
    /**
     * 初始化高德地图
     */
    async initAMap() {
      try {
        const container = document.getElementById('amap-container');
        if (!container) {
          throw new Error('地图容器div不存在');
        }

        const AMap = await loadAMapScript();
        this.map = new AMap.Map(container, {
          zoom: 5,
          center: [104.0, 36.0],
          viewMode: '2D',
          resizeEnable: true,
          animateEnable: true
        });

        // 添加工具栏控件
        await new Promise((resolve) => {
          AMap.plugin(['AMap.ToolBar'], () => {
            try {
              const toolBar = new AMap.ToolBar({
                position: 'RB',
                offset: [10, 10],
                ruler: true,
                liteStyle: false
              });
              this.map.addControl(toolBar);
            } catch (e) {
              console.warn('工具栏控件加载失败:', e);
            } finally {
              resolve();
            }
          });
        });

        this.isMapLoaded = true;
        console.log('地图初始化完成');

      } catch (error) {
        this.isMapLoaded = false;
        console.error('地图初始化失败:', error);
        this.$message.warning('地图加载失败，点击设备卡片将无法定位，但可查看设备信息');
      }
    },

    /**
     * 清理地图上的所有标记
     */
    clearMarkers() {
      if (this.map && this.markers.length > 0) {
        this.map.remove(this.markers);
        this.markers = [];
      }
    },

    /**
     * 渲染设备标记（适配2.0版本动画）
     */
    initDevicePointToMap() {
      if (!this.isMapLoaded || !this.map) return;
      this.clearMarkers();

      this.deviceList.forEach(device => {
        if (!device.position) return;

        try {
          const [lng, lat] = device.position.split(',').map(Number);
          if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            console.warn(`设备【${device.deviceName}】坐标无效：${device.position}`);
            return;
          }
          const imageUrl = device.status==0?"https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png":"https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png"
          // 2.0版本标记配置（预定义弹跳动画）
          const marker = new AMap.Marker({
            position: [lng, lat],
            title: device.deviceName,
            extData: { deviceId: device.id },
            icon: new AMap.Icon({
              size: new AMap.Size(25, 30),
              image: imageUrl,
              imageSize: new AMap.Size(25, 30)
            }),
            anchor: 'bottom-center',
            animate: false, // 初始关闭动画
            animation: 'bounce' // 2.0版本动画类型：bounce（弹跳）
          });

          marker.on('click', () => {
            this.map.setZoomAndCenter(this.MARKER_CLICK_ZOOM, [lng, lat], true);
          });

          marker.setMap(this.map);
          this.markers.push(marker);

        } catch (e) {
          console.error(`渲染设备【${device.deviceName}】标记失败:`, e);
        }
      });
    },

    /**
     * 点击设备卡片定位（核心修复：替换setAnimation为2.0版本API）
     */
    handleDeviceClick(device) {
      console.log('点击事件已触发，设备信息:', device);

      if (!this.isMapLoaded) {
        this.$message.warning(`地图尚未加载完成，无法定位设备【${device.deviceName}】！`);
        return;
      }
      if (!device.position) {
        this.$message.warning(`设备【${device.deviceName}】未定位，无法跳转地图！`);
        return;
      }

      try {
        const positionArr = device.position.split(',').map(Number);
        if (positionArr.length !== 2 || isNaN(positionArr[0]) || isNaN(positionArr[1])) {
          this.$message.error(`设备【${device.deviceName}】坐标格式错误！`);
          return;
        }
        const [lng, lat] = positionArr;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          this.$message.error(`设备【${device.deviceName}】坐标超出有效范围！`);
          return;
        }

        // 地图跳转
        this.map.setZoomAndCenter(this.MARKER_CLICK_ZOOM, [lng, lat], true);

        // 高亮标记（适配2.0版本动画API）
        this.markers.forEach(marker => {
          const markerExtData = marker.getExtData();
          const isMatch = markerExtData?.deviceId === device.id || marker.getTitle() === device.deviceName;
          const imageUrl = device.status==0?"https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png":"https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png"
          if (isMatch) {
            // 切换高亮图标
            marker.setIcon(new AMap.Icon({
              size: new AMap.Size(25, 33),
              image: imageUrl,
              imageSize: new AMap.Size(25, 33)
            }));
          }
        });

      } catch (e) {
        console.error(`设备【${device.deviceName}】地图跳转失败:`, e);
        this.$message.error(`设备【${device.deviceName}】定位失败：${e.message}`);
      }
    },

    /**
     * 查询设备列表
     */
    handleQuery() {
      this.currentPage = 1;
      this.getDeviceList();
    },

    /**
     * 重置查询条件
     */
    resetQuery() {
      this.queryParams = { deviceName: '', status: '' };
      this.currentPage = 1;
      this.getDeviceList();
    },

    /**
     * 标签页切换
     */
    handleTabChange(tab) {
      this.currentPage = 1;
      this.queryParams.productSn = tab.name
      this.getDeviceList();
    },

    /**
     * 分页-每页条数改变
     */
    handleSizeChange(val) {
      this.pageSize = val;
      this.getDeviceList();
    },

    /**
     * 分页-当前页改变
     */
    handleCurrentChange(val) {
      this.currentPage = val;
      this.getDeviceList();
    },

    /**
     * 获取产品列表
     */
    getProductList() {
      listProduct().then(res => {
        if (res?.code === 200) {
          this.productList = res?.rows || [];
        }
      }).catch(err => {
        console.error('获取产品列表失败:', err);
        this.$message.error('获取产品列表失败');
      });
    },

    /**
     * 获取设备列表
     */
    getDeviceList() {
      const params = {
        pageNum: this.currentPage,
        pageSize: this.pageSize,
        deviceName: this.queryParams.deviceName,
        status: this.queryParams.status,
        productSn:this.queryParams.productSn
      };

      listDevice(params).then(res => {
        if (res?.code === 200) {
          this.deviceList = res?.rows || [];
          this.total = res?.total || 0;
          this.initDevicePointToMap();
        }
      }).catch(err => {
        console.error('获取设备列表失败:', err);
        this.$message.error('获取设备列表失败');
      });
    },

    handleAdd() {},
    handleEdit(device) {},
    handleDelete(device) {
      this.$confirm('确定删除该设备吗？', '提示', { type: 'warning' }).then(() => {
        this.getDeviceList();
        this.$message.success('删除成功');
      });
    },
    deviceTypeText(deviceType) {
      const typeMap = {
        "0": '直连设备',
        "1": '网关设备',
        "2": '无状态设备'
      };
      return typeMap[deviceType] || '未知类型';
    }
  }
};
</script>

<style scoped>
/* 全局样式 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.container {
  width: 100%;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f5f7fa;
  overflow: hidden;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 16px;
  height: 40px;
}

/* 标签栏 */
.tabs {
  margin-bottom: 16px;
  height: 40px;
}

/* 主体内容 */
.main-content {
  display: flex;
  gap: 16px;
  height: calc(100% - 112px);
  overflow: hidden;
}

/* 左侧设备列表：列布局，卡片容器占满高度，分页固定底部 */
.device-list {
  width: 35%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
  height: 100%;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

/* 卡片容器：负责卡片排版，数据少也保持规整 */
.card-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-start;
  align-content: flex-start;
  padding-bottom: 8px;
}

/* 设备卡片：固定尺寸，不随内容拉伸 */
.device-card {
  width: calc(50% - 6px);
  height: 200px;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e6e8eb;
  background: #fff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer !important;
  pointer-events: auto !important;
  user-select: none;
  flex-shrink: 0;
}

.device-card:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.online-card {
  border-left: 4px solid #67c23a;
}

.offline-card {
  border-left: 4px solid #f56c6c;
}

.device-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #51a3b2;
}

/* 空数据提示 */
.empty-tip {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}

/* 卡片头部 */
.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f2f5;
}

.device-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

/* 卡片主体 */
.device-body {
  height: 90px;
  overflow-y: auto;
  padding-right: 4px;
}

.device-info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.info-label {
  color: #86909c;
  min-width: 70px;
  flex-shrink: 0;
  pointer-events: none;
}

.info-value {
  color: #4e5969;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
  pointer-events: auto !important;
}

.tooltip-trigger {
  pointer-events: auto !important;
  position: relative;
  z-index: 100;
}

/* 卡片滚动条 */
.device-body::-webkit-scrollbar {
  width: 4px;
}

.device-body::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 2px;
}

/* 分页：固定在列表底部，加分割线 */
.pagination {
  width: 100%;
  text-align: center;
  padding: 8px 0;
  flex-shrink: 0;
  border-top: 1px solid #f0f2f5;
  background: #fff;
  border-radius: 4px;
}

/* 地图区域 */
.map-section {
  flex: 1;
  height: 100% !important;
  min-width: 300px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e6e8eb;
  position: relative;
  z-index: 0;
}

.amap-wrapper {
  width: 100% !important;
  height: 100% !important;
  min-height: 300px;
}

/* 标签页样式 */
.tabs ::v-deep .el-tabs__item {
  font-weight: 500;
  font-size: 14px;
}

.tabs ::v-deep .el-tabs__active-bar {
  height: 2px;
  background-color: #409eff;
}

/* 卡片容器滚动条 */
.card-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.card-container::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

/* 适配小屏幕 */
@media (max-width: 1440px) {
  .card-container {
    gap: 10px;
  }
  .device-card {
    width: 100%;
    height: 180px;
  }
}

/* 空值样式 */
.empty-value {
  color: #f56c6c;
  font-style: italic;
}

/* Tooltip样式：提升层级确保显示 */
::v-deep .el-tooltip__popper {
  max-width: 300px;
  padding: 8px 12px;
  font-size: 14px;
  z-index: 9999 !important;
  pointer-events: none;
}
</style>
