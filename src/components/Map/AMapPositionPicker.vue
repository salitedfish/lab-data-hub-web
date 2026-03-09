<template>
  <div class="amap-picker-container">
    <div id="amap-container" class="amap-wrapper">
      <div class="map-search-bar">
        <el-autocomplete
          v-model="searchKeyword"
          :fetch-suggestions="querySearch"
          :trigger-on-focus="false"
          :debounce="300"
          placeholder="请输入地址/地名搜索"
          size="small"
          popper-class="amap-search-popper"
          @select="handleSelectResult"
          clearable
          popper-append-to-body="false"
        >
          <template slot="suggestion" slot-scope="{ item }">
            <div class="search-item">
              <span>{{ item.name }}</span>
              <small class="search-address">{{ item.address }}</small>
            </div>
          </template>
        </el-autocomplete>
      </div>
    </div>

    <div class="position-info" v-if="selectedLng && selectedLat">
      <div class="info-item">
        <span class="label">选中地址：</span>
        <span class="value">{{ selectedAddress || '未解析到具体地址' }}</span>
      </div>
      <div class="info-item">
        <span class="label">经纬度：</span>
        <span class="value">{{ selectedLng.toFixed(6) }}, {{ selectedLat.toFixed(6) }}</span>
      </div>
    </div>

    <div class="action-btns">
      <el-button type="primary" @click="confirmSelection" :disabled="!selectedLng || !selectedLat">确认选择</el-button>
      <el-button @click="clearSelection">清空选择</el-button>
    </div>
  </div>
</template>

<script>
window._AMapSecurityConfig = {
  securityJsCode: process.env.VUE_APP_AMAP_SECURITY_JS_CODE, // 读取环境变量
};

function loadAMapScript() {
  return new Promise((resolve, reject) => {
    const oldScript = document.querySelector(`script[src*="webapi.amap.com/maps"]`);
    if (oldScript) oldScript.remove();

    if (window.AMap && window.AMap.plugin) {
      resolve(window.AMap);
      return;
    }

    const apiKey = process.env.VUE_APP_AMAP_KEY;
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
    script.type = "text/javascript";
    script.async = false;
    script.defer = false;

    const timeoutTimer = setTimeout(() => {
      reject(new Error('高德地图 2.0 API 加载超时（10秒），请检查网络或Key'));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeoutTimer);
      setTimeout(() => {
        if (window.AMap) {
          resolve(window.AMap);
        } else {
          reject(new Error('高德地图 2.0 核心对象未初始化'));
        }
      }, 500);
    };

    script.onerror = (err) => {
      clearTimeout(timeoutTimer);
      reject(new Error(`高德地图脚本加载失败：${err.message}`));
    };

    document.head.appendChild(script);
  });
}

export default {
  name: 'AMapPositionPicker',
  // 1. 新增props接收外部传入的经纬度
  props: {
    // 传入的经度（可选，数字类型）
    initLng: {
      type: Number,
      default: null
    },
    // 传入的纬度（可选，数字类型）
    initLat: {
      type: Number,
      default: null
    },
    // 也可以接收经纬度字符串（如 "116.403874,39.914885"），二选一即可
    initPosition: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      map: null,
      marker: null,
      geocoder: null,
      placeSearch: null,
      searchKeyword: '',
      selectedLng: '',
      selectedLat: '',
      selectedAddress: ''
    };
  },
  mounted() {
    this.initAMap();
  },
  beforeDestroy() {
    if (this.map) {
      this.map.destroy();
      this.map = null;
      this.placeSearch = null;
      this.geocoder = null;
      this.marker = null;
    }
  },
  methods: {
    // 初始化高德地图
    async initAMap() {
      try {
        const AMap = await loadAMapScript();
        console.log('✅ 高德地图 2.0 核心API加载成功', AMap);

        // 初始化地图实例
        this.map = new AMap.Map('amap-container', {
          zoom: 15, // 有初始经纬度时默认放大到15级，更精准
          center: [116.397428, 39.90923], // 默认中心点（北京）
          viewMode: '2D',
          resizeEnable: true,
          animateEnable: true
        });

        const vm = this;
        AMap.plugin(['AMap.PlaceSearch', 'AMap.Geocoder'], function () {
          console.log('✅ 高德地图插件加载完成');

          vm.geocoder = new AMap.Geocoder({
            radius: 1000,
            extensions: 'all'
          });

          vm.placeSearch = new AMap.PlaceSearch({
            city: '全国',
            pageSize: 8,
            pageIndex: 1,
            extensions: 'all',
            map: vm.map
          });

          // 2. 地图插件加载完成后，处理初始经纬度
          vm.handleInitPosition();
        });

        // 地图点击选点
        this.map.on('click', (e) => {
          const { lng, lat } = e.lnglat;
          vm.selectedLng = lng;
          vm.selectedLat = lat;
          vm.updateMarker(lng, lat);
          vm.getAddressByLngLat(lng, lat);
        });

      } catch (error) {
        console.error('❌ 地图初始化失败', error);
        this.$message.error(`地图加载失败：${error.message}`);
      }
    },

    /**
     * 3. 处理初始经纬度（外部传入）
     * 优先级：initLng/initLat > initPosition字符串
     */
    handleInitPosition() {
      let lng = null;
      let lat = null;

      // 优先解析 initLng/initLat
      if (this.initLng && this.initLat) {
        lng = this.initLng;
        lat = this.initLat;
      }
      // 其次解析 initPosition 字符串（如 "116.403874,39.914885"）
      else if (this.initPosition && this.initPosition.split(',').length === 2) {
        const [lngStr, latStr] = this.initPosition.split(',');
        lng = Number(lngStr);
        lat = Number(latStr);
      }

      // 验证经纬度有效性（范围：经度-180~180，纬度-90~90）
      if (!lng || !lat || isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.log('⚠️ 无有效初始经纬度，使用默认中心点');
        return;
      }

      // 4. 定位到初始经纬度 + 创建标记点 + 解析地址
      this.selectedLng = lng;
      this.selectedLat = lat;
      // 地图定位到该位置
      this.map.setCenter([lng, lat]);
      // 创建标记点
      this.updateMarker(lng, lat);
      // 解析经纬度对应的中文地址
      this.getAddressByLngLat(lng, lat);
      console.log(`✅ 初始经纬度定位成功：${lng}, ${lat}`);
    },

    /**
     * 核心：el-autocomplete 搜索建议函数
     */
    querySearch(queryString, callback) {
      if (!queryString.trim() || !this.placeSearch) {
        callback([]);
        return;
      }

      this.placeSearch.search(queryString, (status, result) => {
        console.log('高德搜索结果：', status, result);
        if (status === 'complete' && result.info === 'OK') {
          const pois = result.poiList?.pois || [];
          const suggestions = pois.slice(0, 8).map(item => ({
            value: item.name,
            name: item.name,
            address: item.address || `${item.city}${item.district}`,
            lng: item.location.lng,
            lat: item.location.lat
          }));
          callback(suggestions);
        } else {
          callback([]);
        }
      });
    },

    // 选中下拉项触发定位
    handleSelectResult(item) {
      if (!item || !item.lng || !item.lat) return;

      if (this.marker) this.map.remove(this.marker);

      this.map.setCenter([item.lng, item.lat]);
      this.map.setZoom(15);

      this.selectedLng = item.lng;
      this.selectedLat = item.lat;
      this.selectedAddress = `${item.name}(${item.address})`;
      this.updateMarker(item.lng, item.lat);
    },

    // 更新标记点（锚点已设为底部中心）
    updateMarker(lng, lat) {
      if (this.marker) this.map.remove(this.marker);

      this.marker = new AMap.Marker({
        position: [lng, lat],
        icon: new AMap.Icon({
          size: new AMap.Size(32, 32),
          image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
          imageSize: new AMap.Size(32, 32)
        }),
        anchor: 'bottom-center', // 图标下角对齐定位点
        draggable: true,
        zIndex: 100,
        animation: 'AMAP_ANIMATION_DROP'
      });

      this.map.add(this.marker);

      this.marker.on('dragend', (e) => {
        const { lng, lat } = e.lnglat;
        this.selectedLng = lng;
        this.selectedLat = lat;
        this.getAddressByLngLat(lng, lat);
      });
    },

    // 逆地理编码：经纬度转中文地址
    getAddressByLngLat(lng, lat) {
      if (!this.geocoder) return;

      this.geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          this.selectedAddress = result.regeocode.formattedAddress;
        } else {
          this.selectedAddress = '';
          this.$message.warning('经纬度解析地址失败，请手动选择');
        }
      });
    },

    // 清空选择
    clearSelection() {
      this.searchKeyword = '';
      this.selectedLng = '';
      this.selectedLat = '';
      this.selectedAddress = '';
      if (this.marker) {
        this.map.remove(this.marker);
        this.marker = null;
      }
      // 清空后回到默认中心点
      this.map.setCenter([116.397428, 39.90923]);
      this.map.setZoom(12);
    },

    // 确认选择
    confirmSelection() {
      if (!this.selectedLng || !this.selectedLat) {
        this.$message.warning('请先在地图上选择位置');
        return;
      }

      this.$emit('confirm', {
        position: `${this.selectedLng.toFixed(6)},${this.selectedLat.toFixed(6)}`,
        positionName: this.selectedAddress || `(${this.selectedLng.toFixed(6)},${this.selectedLat.toFixed(6)})`
      });
      this.$emit('close');
    }
  }
};
</script>

<style scoped lang="scss">
.amap-picker-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  padding: 0;
}

.amap-wrapper {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  position: relative;
}

.map-search-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  width: 300px;
  background: #ffffff;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  ::v-deep .el-autocomplete {
    width: 100%;
  }

  ::v-deep .el-input__inner {
    padding: 6px 10px;
  }
}

// 下拉列表样式
::v-deep .amap-search-popper {
  z-index: 2000 !important;
  width: 300px !important;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 5px !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: 1px solid #e4e7ed;

  .search-item {
    padding: 8px 10px;
    line-height: 1.4;
    color: #303133;

    .search-address {
      display: block;
      color: #909399;
      font-size: 12px;
      margin-top: 2px;
    }
  }

  .el-autocomplete-suggestion__item--highlighted {
    background-color: #f5f7fa !important;
  }
}

.position-info {
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;

  .info-item {
    display: flex;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #606266;
      font-size: 14px;
      min-width: 80px;
    }

    .value {
      color: #303133;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.action-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
