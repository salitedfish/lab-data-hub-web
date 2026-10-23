<template>
  <div class="app-container">
    <!-- 搜索区域保持不变 -->
    <!-- 只有组件名称一个输入框：不加 @submit.native.prevent 的话回车会触发浏览器原生表单提交，整页刷新 -->
    <el-form
      :model="queryParams"
      ref="queryForm"
      size="small"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
      @submit.native.prevent
    >
      <el-form-item label="组件名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入组件名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          icon="el-icon-search"
          size="mini"
          @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery"
          >重置</el-button
        >
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="3" class="select-all-col">
        <el-checkbox
          :value="isAllSelected"
          :indeterminate="isPartialSelected"
          :disabled="batchRunning || componentList.length == 0"
          @change="toggleSelectAll"
          >全选本页</el-checkbox
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['business:component:add']"
          >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-open"
          size="mini"
          :loading="batchRunning"
          :disabled="batchRunning || selectedCards.length == 0"
          @click="batchToggleStatus(1)"
          >批量启动
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-switch-button"
          size="mini"
          :loading="batchRunning"
          :disabled="batchRunning || selectedCards.length == 0"
          @click="batchToggleStatus(0)"
          >批量停止
        </el-button>
      </el-col>
      <el-col :span="1.5" class="startup-retry-tip-col">
        <!-- 启动自愈说明：与后端 ComponentStartupRetryer 的行为保持一致（60 秒 / 10 分钟，可在 application.yml 调整），悬停显示 -->
        <el-tooltip effect="dark" placement="bottom-start">
          <div
            slot="content"
            style="max-width: 380px; line-height: 1.6"
          >启动自愈：平台重启时会自动开启所有「启用」状态的网络组件；首次连接失败的组件每 60 秒自动重试一次，最长重试 10 分钟，全部开启成功或超时后停止。重试期间手动关闭某个组件，会立即取消对它的重试；超时后仍未开启的组件保持停用，需要手动开启。</div>
          <i class="el-icon-info startup-retry-icon"></i>
        </el-tooltip>
      </el-col>
      <el-col :span="6" class="batch-tip-col">
        <!-- 批量进度：请求已在批量接口上补了建连探针，单个组件最长约 3 秒，
             一批 5 个并发，这里把「已处理 / 总数」显出来，避免看着像卡住 -->
        <span v-if="batchRunning" class="batch-tip"
          >批量处理中 {{ batchDone }}/{{ batchTotal }}</span
        >
        <span v-else-if="selectedCards.length > 0" class="batch-tip"
          >已选 {{ selectedCards.length }} 个</span
        >
      </el-col>
      <right-toolbar
        :showSearch.sync="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <!-- 卡片展示区域保持不变 -->
    <div class="component-card-container">
      <div class="card-grid">
        <el-card
          v-for="(item, index) in componentList"
          :key="index"
          class="component-card"
          shadow="hover"
          :class="item.status == 1 ? 'active-status' : 'inactive-status'"
        >
          <div
            class="status-trapezoid"
            :class="item.status == 1 ? 'active' : 'inactive'"
          >
            {{ item.status == 1 ? "启用" : "停用" }}
          </div>
          <div slot="header" class="card-header">
            <!-- 批量启停的勾选框：批量进行中禁掉，避免中途改变待处理的集合 -->
            <el-checkbox
              class="card-select"
              :value="isCardSelected(item.id)"
              :disabled="batchRunning"
              @change="onCardSelectChange(item, $event)"
              @click.native.stop
            />
            <h4 class="component-name">{{ item.name }}</h4>
          </div>
          <div class="card-content">
            <div class="card-item">
              <i>类型：</i>
              <span class="value">{{ item.netType || "未知" }}</span>
            </div>
            <div class="card-item">
              <i>地址：</i>
              <span class="value">{{ item.ipAddr || "未知" }}</span>
            </div>
            <div class="card-item">
              <i>端口：</i>
              <span class="value">{{ item.port || "未知" }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-button
              size="mini"
              class="action-btn status-btn"
              :class="item.status == 1 ? 'stop-btn' : 'start-btn'"
              :icon="
                item.status == 1 ? 'el-icon-switch-button' : 'el-icon-open'
              "
              :loading="statusLoadingMap[item.id]"
              :disabled="statusLoadingMap[item.id]"
              @click.stop="toggleStatus(item)"
            >
              {{ statusBtnText(item) }}
            </el-button>
            <el-button
              size="mini"
              class="action-btn edit-btn"
              icon="el-icon-edit"
              @click.stop="handleUpdate(item)"
              >修改
            </el-button>
            <el-button
              size="mini"
              class="action-btn copy-btn"
              icon="el-icon-document-copy"
              @click.stop="handleCopy(item)"
              >复制
            </el-button>
            <el-button
              size="mini"
              class="action-btn debug-btn"
              icon="el-icon-connection"
              @click.stop="showComponentDetail(item)"
              >调试
            </el-button>
            <el-button
              size="mini"
              class="action-btn delete-btn"
              icon="el-icon-delete"
              @click.stop="handleDelete(item)"
              >删除
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <div class="pagination-wrapper">
      <pagination
        v-show="total > 0"
        :total="total"
        :page-sizes="[12, 24, 48, 96]"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 抽屉组件 -->
    <el-drawer
      :title="title"
      :visible.sync="open"
      direction="rtl"
      size="40%"
      :before-close="cancel"
      class="component-drawer"
    >
      <div class="drawer-content">
        <!-- 核心：校验规则匹配form下的dynamicConfig字段 -->
        <el-form
          ref="form"
          :model="form"
          :rules="dynamicRules"
          label-width="120px"
        >
          <el-form-item label="组件名称" prop="name" required>
            <el-input v-model="form.name" placeholder="请输入组件名称" />
          </el-form-item>
          <el-form-item label="网络类型" prop="netType" required>
            <el-select
              v-model="form.netType"
              placeholder="请选择"
              @change="handleNetTypeChange"
            >
              <el-option label="MQTT_CLIENT" value="MQTT_CLIENT"></el-option>
              <el-option label="MQTT_BROKER" value="MQTT_BROKER"></el-option>
              <el-option label="TCP_SERVER" value="TCP_SERVER"></el-option>
              <el-option label="UDP_SERVER" value="UDP_SERVER"></el-option>
              <el-option label="COAP_SERVER" value="COAP_SERVER"></el-option>
              <el-option label="HTTP_SERVER" value="HTTP_SERVER"></el-option>
              <el-option
                label="WEBSOCKET_SERVER"
                value="WEBSOCKET_SERVER"
              ></el-option>
              <el-option label="MODBUS_TCP" value="MODBUS_TCP"></el-option>
              <el-option label="S71200_TCP" value="S71200_TCP"></el-option>
              <el-option
                label="OMRONFINS_TCP"
                value="OMRONFINS_TCP"
              ></el-option>
              <el-option
                label="BROTHER_TCP"
                value="BROTHER_TCP"
              ></el-option>
              <el-option
                label="FANUC_TCP"
                value="FANUC_TCP"
              ></el-option>
              <el-option
                label="MITSUBISHI_MC3E_TCP"
                value="MITSUBISHI_MC3E_TCP"
              ></el-option>
              <el-option
                label="MITSUBISHI_MC3E_UDP"
                value="MITSUBISHI_MC3E_UDP"
              ></el-option>
              <el-option
                label="MITSUBISHI_CNC_TCP"
                value="MITSUBISHI_CNC_TCP"
              ></el-option>
              <el-option label="DATABASE_TCP" value="DATABASE_TCP"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status" required>
            <el-select v-model="form.status" placeholder="请选择">
              <el-option label="启用" value="1"></el-option>
              <el-option label="停用" value="0"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="协议绑定">
            <el-select
              v-model="selectProtocolId"
              placeholder="请选择"
              @change="handleProtocolChange"
              :disabled="!form.netType || !!form.protocolId"
            >
              <el-option
                v-for="item in filteredProtocolList"
                :key="item.id"
                :label="item.protocolName"
                :value="item.id"
              >
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 动态配置区域 -->
          <div class="dynamic-config-section">
            <div class="section-title">其余配置</div>
            <div class="dynamic-config-fields">
              <!-- MQTT 客户端配置：prop和v-model都指向form.dynamicConfig -->
              <template v-if="form.netType === 'MQTT_CLIENT'">
                <el-form-item label="服务器地址" prop="dynamicConfig.brokerUrl">
                  <el-input
                    v-model="form.dynamicConfig.brokerUrl"
                    placeholder="如 tcp://127.0.0.1:1883"
                  />
                </el-form-item>
                <el-form-item label="用户名" prop="dynamicConfig.username">
                  <el-input
                    v-model="form.dynamicConfig.username"
                    placeholder="请输入用户名"
                  />
                </el-form-item>
                <el-form-item label="密码" prop="dynamicConfig.password">
                  <el-input
                    v-model="form.dynamicConfig.password"
                    type="password"
                    placeholder="请输入密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="订阅主题" prop="dynamicConfig.topicStr">
                  <el-input
                    v-model="form.dynamicConfig.topicStr"
                    placeholder="用英文逗号分割,如：#,/#,/topic1/#,topic2"
                  />
                </el-form-item>
                <el-form-item
                  label="Keep Alive(秒)"
                  prop="dynamicConfig.keepAliveInterval"
                >
                  <el-input-number
                    v-model="form.dynamicConfig.keepAliveInterval"
                    :min="0"
                    :max="65535"
                  />
                </el-form-item>
              </template>

              <!-- MQTT Broker 配置 -->
              <template v-else-if="form.netType === 'MQTT_BROKER'">
                <el-form-item label="TCP端口" prop="dynamicConfig.tcpPort">
                  <el-input
                    v-model="form.dynamicConfig.tcpPort"
                    placeholder="请输入TCP端口，如：1883"
                  />
                </el-form-item>

                <el-form-item label="WebSocket端口" prop="dynamicConfig.wsPort">
                  <el-input
                    v-model="form.dynamicConfig.wsPort"
                    placeholder="请输入WebSocket端口，如：8083（可选）"
                  />
                </el-form-item>

                <el-form-item
                  label="允许匿名"
                  prop="dynamicConfig.allowAnonymous"
                >
                  <el-switch
                    v-model="form.dynamicConfig.allowAnonymous"
                    active-text="允许"
                    inactive-text="禁止"
                    @change="handleAnonymousChange"
                  />
                </el-form-item>

                <!-- 不允许匿名时显示用户名密码 -->
                <template v-if="form.dynamicConfig.allowAnonymous === false">
                  <el-form-item
                    label="用户名"
                    prop="dynamicConfig.mqttUsername"
                  >
                    <el-input
                      v-model="form.dynamicConfig.username"
                      placeholder="请输入用户名"
                    />
                  </el-form-item>

                  <el-form-item label="密码" prop="dynamicConfig.mqttPassword">
                    <el-input
                      v-model="form.dynamicConfig.password"
                      type="password"
                      placeholder="请输入密码"
                      show-password
                    />
                  </el-form-item>
                </template>
              </template>

              <!-- TCP服务器配置 -->
              <template v-else-if="form.netType === 'TCP_SERVER'">
                <el-form-item label="端口" prop="dynamicConfig.serverPort">
                  <el-input
                    v-model="form.dynamicConfig.serverPort"
                    placeholder="端口"
                  />
                </el-form-item>
                <el-form-item label="拆包分隔符" prop="dynamicConfig.delimiter">
                  <el-input
                    v-model="form.dynamicConfig.delimiter"
                    placeholder="拆包分隔符，默认\n\r"
                  />
                </el-form-item>
                <el-form-item
                  label="缓冲区大小(byte)"
                  prop="dynamicConfig.cacheSize"
                >
                  <el-input
                    v-model="form.dynamicConfig.cacheSize"
                    placeholder="缓冲区大小(byte)"
                  />
                </el-form-item>
              </template>

              <!-- UDP 服务器配置 -->
              <template v-else-if="form.netType === 'UDP_SERVER'">
                <el-form-item label="端口" prop="dynamicConfig.serverPort">
                  <el-input
                    v-model="form.dynamicConfig.serverPort"
                    placeholder="端口"
                  />
                </el-form-item>
              </template>

              <!-- TCP/UDP 客户端配置 -->
              <template
                v-else-if="
                  form.netType === 'TCP_CLIENT' || form.netType === 'UDP_CLIENT'
                "
              >
                <el-form-item
                  label="连接超时"
                  prop="dynamicConfig.connectionTimeout"
                >
                  <el-input
                    v-model="form.dynamicConfig.connectionTimeout"
                    placeholder="如: 30000"
                  >
                    <template slot="append">ms</template>
                  </el-input>
                </el-form-item>
                <el-form-item
                  label="重连间隔"
                  prop="dynamicConfig.reconnectInterval"
                >
                  <el-input
                    v-model="form.dynamicConfig.reconnectInterval"
                    placeholder="如: 5000"
                  >
                    <template slot="append">ms</template>
                  </el-input>
                </el-form-item>
                <el-form-item label="心跳包" prop="dynamicConfig.heartbeat">
                  <el-input
                    v-model="form.dynamicConfig.heartbeat"
                    placeholder="如: HEARTBEAT"
                  />
                </el-form-item>
              </template>

              <!-- COAP 服务器配置 -->
              <template v-else-if="form.netType === 'COAP_SERVER'">
                <el-form-item label="端口" prop="dynamicConfig.port">
                  <el-input
                    v-model="form.dynamicConfig.port"
                    placeholder="端口"
                  />
                </el-form-item>
                <el-form-item label="是否鉴权" prop="dynamicConfig.isAuth">
                  <el-switch
                    v-model="form.dynamicConfig.isAuth"
                    active-text="是"
                    inactive-text="否"
                    @change="handleIsAuthChange"
                  />
                </el-form-item>
                <!-- 不允许匿名时显示用户名密码 -->
                <template v-if="form.dynamicConfig.isAuth === true">
                  <el-form-item
                    label="TOKEN令牌"
                    prop="dynamicConfig.tokenConfig"
                  >
                    <el-input
                      v-model="form.dynamicConfig.tokenConfig"
                      placeholder="TOKEN令牌"
                    />
                  </el-form-item>
                </template>
              </template>

              <!-- HTTP 服务器配置 -->
              <template v-else-if="form.netType === 'HTTP_SERVER'">
                <el-form-item label="端口" prop="dynamicConfig.port">
                  <el-input
                    v-model="form.dynamicConfig.port"
                    placeholder="端口"
                  />
                </el-form-item>
                <el-form-item
                  label="是否需要回复"
                  prop="dynamicConfig.needReply"
                >
                  <el-switch
                    v-model="form.dynamicConfig.needReply"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </template>

              <!-- WebSocket 服务器配置 -->
              <template v-else-if="form.netType === 'WEBSOCKET_SERVER'">
                <el-form-item label="端口" prop="dynamicConfig.port">
                  <el-input
                    v-model="form.dynamicConfig.port"
                    placeholder="端口"
                  />
                </el-form-item>
                <el-form-item label="路径配置" prop="dynamicConfig.path">
                  <el-input
                    v-model="form.dynamicConfig.path"
                    placeholder="默认所有路径可连接"
                  />
                </el-form-item>
              </template>

              <!-- Modbus TCP / Fins / Brother / FANUC / 三菱MC / 三菱CNC 配置 -->
              <template
                v-else-if="
                  form.netType === 'MODBUS_TCP' ||
                  form.netType === 'OMRONFINS_TCP' ||
                  form.netType === 'BROTHER_TCP' ||
                  form.netType === 'FANUC_TCP' ||
                  form.netType === 'MITSUBISHI_MC3E_TCP' ||
                  form.netType === 'MITSUBISHI_MC3E_UDP' ||
                  form.netType === 'MITSUBISHI_CNC_TCP'
                "
              >
                <el-form-item label="服务器IP" prop="dynamicConfig.ipAddr">
                  <el-input
                    v-model="form.dynamicConfig.ipAddr"
                    placeholder="如：192.168.1.123"
                  />
                </el-form-item>
                <el-form-item label="服务器端口" prop="dynamicConfig.port">
                  <el-input
                    v-model="form.dynamicConfig.port"
                    placeholder="如：三菱 MC 默认 5007（UDP 常见 5040，以网关为准）/ FANUC 8193 / 三菱CNC 683"
                  />
                </el-form-item>
                <el-form-item label="连接超时(ms)" prop="dynamicConfig.timeout">
                  <el-input
                    type="number"
                    v-model="form.dynamicConfig.timeout"
                    placeholder="如：3000"
                  />
                </el-form-item>
                <!-- FANUC 专用：FOCAS2 库路径（可选，默认自动搜索 java.library.path / lib 目录等） -->
                <el-form-item
                  label="FOCAS2库路径"
                  prop="dynamicConfig.libPath"
                  v-if="form.netType === 'FANUC_TCP'"
                >
                  <el-input
                    v-model="form.dynamicConfig.libPath"
                    placeholder="可空；Windows 如 C:\fanuc\Fwlib64.dll，Linux 如 /opt/fanuc/libfwlib32.so（不填则自动搜索常见目录）"
                  />
                </el-form-item>
                <!-- 三菱 CNC 专用：机床机型 / NC 型（机型不改变协议族，只决定设备详情页取哪张语义点位表）
                     ⚠️ 红星用 is-required 类而不是 required 属性：后者会被 el-form-item 追加一条裸
                     {required:true} 规则，而 dynamicRules 里没有 dynamicConfig.model 的条目，
                     提交时先弹一句英文的 "dynamicConfig.model is required"，submitForm 里那句
                     中文 JS 提示就永远轮不到。必填校验统一走 JS（见 submitForm）。 -->
                <el-form-item
                  label="机型 / NC型"
                  class="is-required"
                  prop="dynamicConfig.model"
                  v-if="form.netType === 'MITSUBISHI_CNC_TCP'"
                >
                  <el-select
                    v-model="form.dynamicConfig.model"
                    placeholder="请选择机床机型 / NC 型"
                  >
                    <el-option
                      v-for="m in cncModels"
                      :key="m.value"
                      :label="m.label"
                      :value="m.value"
                    >
                      <span>{{ m.label }}</span>
                      <span class="model-desc">{{ m.desc }}</span>
                    </el-option>
                  </el-select>
                  <div class="model-tip">
                    机型不改变协议族（同一套 MOCHA 帧吃多个机型），只决定设备/产品详情页
                    「点位」下拉取哪张语义点位表；未确认的机型按 M70/M700 点位表工作。
                  </div>
                </el-form-item>
              </template>
              <template v-else-if="form.netType === 'S71200_TCP'">
                <el-form-item label="服务器IP" prop="dynamicConfig.ipAddr">
                  <el-input
                    v-model="form.dynamicConfig.ipAddr"
                    placeholder="如：192.168.1.123"
                  />
                </el-form-item>
                <el-form-item label="服务器端口" prop="dynamicConfig.port">
                  <el-input
                    v-model="form.dynamicConfig.port"
                    placeholder="如：8080"
                  />
                </el-form-item>
                <el-form-item label="机架号" prop="dynamicConfig.rack">
                  <el-input v-model="form.dynamicConfig.rack" type="number" />
                </el-form-item>
                <el-form-item label="插槽号" prop="dynamicConfig.slot">
                  <el-input v-model="form.dynamicConfig.slot" type="number" />
                </el-form-item>
                <el-form-item label="连接超时(ms)" prop="dynamicConfig.timeout">
                  <el-input
                    type="number"
                    v-model="form.dynamicConfig.timeout"
                    placeholder="如：3000"
                  />
                </el-form-item>
              </template>
              <template v-else-if="form.netType === 'DATABASE_TCP'">
                <el-form-item label="数据库类型:" prop="dynamicConfig.dbType">
                  <el-select v-model="form.dynamicConfig.dbType">
                    <el-option label="MySQL" value="mysql" />
                    <el-option label="PostgreSQL" value="postgresql" />
                    <el-option label="Oracle" value="oracle" />
                  </el-select>
                </el-form-item>
                <el-form-item label="IP地址" prop="dynamicConfig.ipAddr">
                  <el-input
                    v-model="form.dynamicConfig.ipAddr"
                    placeholder="如 tcp://127.0.0.1:1883"
                  />
                </el-form-item>
                <el-form-item label="端口" prop="dynamicConfig.port">
                  <el-input
                    v-model="form.dynamicConfig.port"
                    placeholder="如：1883"
                  />
                </el-form-item>
                <el-form-item label="用户名" prop="dynamicConfig.username">
                  <el-input
                    v-model="form.dynamicConfig.username"
                    placeholder="请输入用户名"
                  />
                </el-form-item>
                <el-form-item label="密码" prop="dynamicConfig.password">
                  <el-input
                    v-model="form.dynamicConfig.password"
                    type="password"
                    placeholder="请输入密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item
                  label="数据库名称"
                  prop="dynamicConfig.databaseName"
                  required
                >
                  <el-input
                    v-model="form.dynamicConfig.databaseName"
                    placeholder="请输入数据库名称"
                  />
                </el-form-item>
                <el-form-item label="连接超时(ms)" prop="dynamicConfig.timeout">
                  <el-input
                    type="number"
                    v-model="form.dynamicConfig.timeout"
                    placeholder="如：3000"
                  />
                </el-form-item>
                <el-form-item
                  label="选择数据表:"
                  prop="dynamicConfig.tableName"
                >
                  <el-select
                    v-model="form.dynamicConfig.tableName"
                    placeholder="请选择数据表"
                    clearable
                    filterable
                  >
                    <el-option
                      v-for="item in tableNameList"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </el-select>
                  <el-button
                    @click="getTableListData"
                    style="margin-left: 10px"
                    type="primary"
                    >获取数据表</el-button
                  >
                </el-form-item>
              </template>
              <!-- 默认配置（当没有匹配的类型时） -->
              <template v-else>
                <el-form-item label="自定义配置" prop="dynamicConfig.custom">
                  <el-input
                    v-model="form.dynamicConfig.custom"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入自定义配置（建议JSON格式）"
                  />
                </el-form-item>
              </template>
            </div>
          </div>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-form>
        <div class="drawer-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 组件详情弹窗保持不变 -->
    <component-detail
      :visible="dialogVisible"
      :component="selectedComponent"
      @close="handleDialogClose"
    />
  </div>
</template>

<script>
import {
  listComponent,
  getComponent,
  delComponent,
  addComponent,
  updateComponent,
  control,
  getTableList,
} from "@/api/business/component";
import { listProtocol } from "@/api/business/protocol";
import ComponentDetail from "@/views/business/component/detail";
// 三菱 CNC 机型/NC型 选项（机型决定设备/产品详情页取哪张语义点位表）
import { CNC_TCP_MODELS } from "@/utils/cncTcpPoints";

// 批量启停的并发批大小。取 5 与浏览器对同一主机的并发连接数是同一量级：
// 一次把上百个请求全丢出去，浏览器自己也会在本地排队，还容易把服务端的建连探针占满；
// 固定小批既能给出「已处理 / 总数」这种确定进度，也让中途失败的影响范围可控。
const BATCH_CONCURRENCY = 5;

export default {
  name: "ComponentList",
  components: { ComponentDetail },
  data() {
    // 端口校验方法
    const validatePort = (rule, value, callback) => {
      if (!value && !rule.required) {
        callback();
        return;
      }
      if (!value) {
        callback(new Error(rule.message || "该字段不能为空"));
        return;
      }
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        callback(new Error("端口范围必须在1-65535之间"));
      } else {
        callback();
      }
    };

    return {
      loading: true,
      ids: [],
      // 已勾选的组件 id（批量启停的操作对象），由卡片上的复选框与工具栏「全选本页」共同维护。
      // 只存 id 不存对象：列表刷新或翻页后对象就过期了，按 id 现取才能保证拿到的是当前状态
      // （批量时要按 status 过滤，用过期的对象会漏处理或重复处理）。
      selectedIds: [],
      // 批量启停是否在进行中：进行中禁掉批量按钮与各处勾选框，避免中途改变待处理的集合
      batchRunning: false,
      // 本轮批量的总数与已处理数，用于「批量处理中 5/50」这类进度显示
      batchTotal: 0,
      batchDone: 0,
      // 上一条批量汇总通知的实例（失败汇总用 duration:0 长驻，好让人看清是哪些组件失败了）。
      // 存下来是为了下一批开头先把它关掉 —— 否则连跑几批就在右上角叠成一摞。
      batchNotify: null,
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      componentList: [],
      title: "",
      open: false,
      // 每张卡片「启动/停止」按钮各自的 loading 状态，键为组件 id。
      // 组件开启是后端同步建连，目标连不通时最长要等一个建连探针超时（默认 3 秒，
      // 见 ModbusConnectionManager#probeReachable），期间按钮必须转圈并禁用；
      // 若共用一个标记，点一张卡片的按钮会让整页卡片的按钮一起转。
      statusLoadingMap: {},
      // 三菱 CNC 机型/NC型 下拉选项（见 utils/cncTcpPoints.js）
      cncModels: CNC_TCP_MODELS,
      queryParams: {
        pageNum: 1,
        pageSize: 12,
        name: null,
        netType: null,
        ipAddr: null,
        port: null,
        openTls: null,
        status: null,
        otherConfig: null,
        protocolId: null,
        protocolName: null,
      },
      // 核心修改：dynamicConfig作为form的子对象初始化
      form: {
        dynamicConfig: {},
      },
      config: {},
      validatePort,
      protocolList: [],
      filteredProtocolList: [],
      selectProtocolId: null,
      dialogVisible: false,
      selectedComponent: null,
      tableNameList: [],
    };
  },
  computed: {
    // 已勾选的组件对象：按 id 从「当前这一页」的列表里现取，保证拿到的是最新状态。
    // 翻页后旧的 id 取不到对象，选中自然落空，不会带到别的页面去
    selectedCards() {
      return this.componentList.filter(
        (item) => this.selectedIds.indexOf(item.id) != -1
      );
    },
    // 当前页是否已全部勾选（工具栏「全选本页」的勾选态）
    isAllSelected() {
      return (
        this.componentList.length > 0 &&
        this.selectedCards.length == this.componentList.length
      );
    },
    // 是否只勾选了一部分（「全选本页」显示为半选）
    isPartialSelected() {
      return (
        this.selectedCards.length > 0 &&
        this.selectedCards.length < this.componentList.length
      );
    },
    // 动态生成校验规则（核心：prop指向form.dynamicConfig.xxx）
    dynamicRules() {
      const baseRules = {
        name: [
          { required: true, message: "组件名称不能为空", trigger: "blur" },
        ],
        netType: [
          { required: true, message: "网络类型不能为空", trigger: "change" },
        ],
        status: [
          { required: true, message: "状态不能为空", trigger: "change" },
        ],
      };

      // 根据当前网络类型添加动态校验规则
      switch (this.form.netType) {
        case "MQTT_CLIENT":
          return {
            ...baseRules,
            "dynamicConfig.brokerUrl": [
              {
                required: true,
                message: "服务器地址不能为空",
                trigger: "blur",
              },
            ],
            "dynamicConfig.topicStr": [
              { required: true, message: "订阅主题不能为空", trigger: "blur" },
            ],
            "dynamicConfig.keepAliveInterval": [
              {
                required: true,
                message: "Keep Alive不能为空",
                trigger: "blur",
                type: "number",
              },
            ],
          };
        case "MQTT_BROKER":
          return {
            ...baseRules,
            "dynamicConfig.tcpPort": [
              {
                required: true,
                message: "TCP端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.mqttUsername": [
              {
                required: !this.form.dynamicConfig.allowAnonymous,
                message: "用户名不能为空",
                trigger: "blur",
              },
            ],
            "dynamicConfig.mqttPassword": [
              {
                required: !this.form.dynamicConfig.allowAnonymous,
                message: "密码不能为空",
                trigger: "blur",
              },
            ],
          };
        case "TCP_SERVER":
        case "UDP_SERVER":
          return {
            ...baseRules,
            "dynamicConfig.serverPort": [
              {
                required: true,
                message: "端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
          };
        case "COAP_SERVER":
          return {
            ...baseRules,
            "dynamicConfig.port": [
              {
                required: true,
                message: "端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.tokenConfig": [
              {
                required: this.form.dynamicConfig.isAuth,
                message: "TOKEN令牌不能为空",
                trigger: "blur",
              },
            ],
          };
        case "HTTP_SERVER":
          return {
            ...baseRules,
            "dynamicConfig.port": [
              {
                required: true,
                message: "端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
          };
        case "WEBSOCKET_SERVER":
          return {
            ...baseRules,
            "dynamicConfig.port": [
              {
                required: true,
                message: "端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
          };
        case "MODBUS_TCP":
          return {
            ...baseRules,
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
                type: "number",
              },
            ],
          };
        case "OMRONFINS_TCP":
          return {
            ...baseRules,
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
              },
            ],
          };
        case "BROTHER_TCP":
          return {
            ...baseRules,
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
              },
            ],
          };
        case "FANUC_TCP":
          return {
            ...baseRules,
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
              },
            ],
          };
        case "MITSUBISHI_MC3E_TCP":
        case "MITSUBISHI_MC3E_UDP":
          return {
            ...baseRules,
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
              },
            ],
          };
        case "MITSUBISHI_CNC_TCP":
          return {
            ...baseRules,
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
              },
            ],
          };
        case "S71200_TCP":
          return {
            ...baseRules,
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
              },
            ],
          };
        case "DATABASE_TCP":
          return {
            ...baseRules,
            "dynamicConfig.dbType": [
              {
                required: true,
                message: "数据库类型不能为空",
                trigger: "change",
              },
            ],
            "dynamicConfig.ipAddr": [
              { required: true, message: "服务器IP不能为空", trigger: "blur" },
            ],
            "dynamicConfig.port": [
              {
                required: true,
                message: "服务器端口不能为空",
                trigger: "blur",
                validator: this.validatePort,
              },
            ],
            "dynamicConfig.username": [
              { required: true, message: "用户名不能为空", trigger: "blur" },
            ],
            "dynamicConfig.password": [
              { required: true, message: "密码不能为空", trigger: "blur" },
            ],
            "dynamicConfig.databaseName": [
              {
                required: true,
                message: "数据库名称不能为空",
                trigger: "blur",
              },
            ],
            "dynamicConfig.tableName": [
              { required: true, message: "数据表不能为空", trigger: "blur" },
            ],
            "dynamicConfig.timeout": [
              {
                required: true,
                message: "连接超时不能为空",
                trigger: "blur",
              },
            ],
          };
        default:
          return baseRules;
      }
    },
  },
  created() {
    this.getList();
    this.getProtocolList();
  },
  methods: {
    /** 查询网络组件列表 */
    getList() {
      this.loading = true;
      listComponent(this.queryParams).then((response) => {
        this.componentList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /**获取协议列表*/
    getProtocolList() {
      listProtocol().then((response) => {
        this.protocolList = response.rows;
        // 如果已经选择了网络类型，则过滤协议列表
        if (this.form.netType) {
          this.filterProtocols(this.form.netType);
        }
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置（核心：重置form下的dynamicConfig）
    reset() {
      // 清空表单数据
      this.form = {
        id: null,
        name: null,
        netType: null,
        ipAddr: null,
        port: null,
        openTls: null,
        remark: null,
        createTime: null,
        createBy: null,
        updateTime: null,
        updateBy: null,
        status: null,
        otherConfig: null,
        protocolId: null,
        protocolName: null,
        dynamicConfig: {}, // 重置动态配置
      };
      // 清空协议选择
      this.selectProtocolId = null;
      // 清除表单校验状态
      if (this.$refs.form) {
        this.$refs.form.clearValidate();
      }
    },
    // 根据网络类型过滤协议列表
    filterProtocols(netType) {
      if (!netType) {
        this.filteredProtocolList = [];
        return;
      }
      this.filteredProtocolList = this.protocolList.filter(
        (protocol) => protocol.protocolType === netType
      );
    },
    /** 网络类型变化处理（操作 form.dynamicConfig） */
    handleNetTypeChange(netType) {
      // 重置动态配置
      this.form.dynamicConfig = {};
      // 清空已选择的协议
      if (!this.form.protocolId) {
        this.selectProtocolId = null;
      }
      // 根据网络类型过滤协议列表
      this.filterProtocols(netType);
      // 清除当前表单校验状态
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });

      // 根据网络类型设置默认值
      if (netType === "MQTT_CLIENT") {
        this.form.dynamicConfig = {
          brokerUrl: "",
          username: "",
          password: "",
          topicStr: "",
          cleanSession: true,
          keepAliveInterval: 60,
        };
      } else if (netType === "MQTT_BROKER") {
        this.form.dynamicConfig = {
          tcpPort: "1883", // 默认TCP端口
          wsPort: "", // WebSocket端口可选
          allowAnonymous: true, // 默认允许匿名
          username: "",
          password: "",
        };
      } else if (netType === "TCP_SERVER") {
        this.form.dynamicConfig = {
          serverPort: "",
          delimiter: "\\r,\\n",
          cacheSize: "8192",
        };
      } else if (netType === "UDP_SERVER") {
        this.form.dynamicConfig = {
          serverPort: "",
        };
      } else if (netType === "TCP_CLIENT" || netType === "UDP_CLIENT") {
        this.form.dynamicConfig = {
          connectionTimeout: "30000",
          reconnectInterval: "5000",
          heartbeat: "",
        };
      } else if (netType === "HTTP_SERVER") {
        this.form.dynamicConfig = {
          port: "18080",
          needReply: false,
        };
      } else if (netType === "COAP_SERVER") {
        this.form.dynamicConfig = {
          port: "5683",
          isAuth: false,
          tokenConfig: "123456",
        };
      } else if (netType === "WEBSOCKET_SERVER") {
        this.form.dynamicConfig = {
          port: "10883",
          path: "/**",
        };
      } else if (netType === "OMRONFINS_TCP") {
        this.form.dynamicConfig = {
          timeout: 3000,
          port: 9600,
        };
      } else if (
        netType === "MODBUS_TCP" ||
        netType === "BROTHER_TCP" ||
        netType === "DATABASE_TCP"
      ) {
        this.form.dynamicConfig = {
          timeout: 3000,
        };
      } else if (netType === "FANUC_TCP") {
        this.form.dynamicConfig = {
          timeout: 3000,
          port: 8193,
        };
      } else if (netType === "MITSUBISHI_MC3E_TCP") {
        this.form.dynamicConfig = {
          timeout: 3000,
          port: 5007,
        };
      } else if (netType === "MITSUBISHI_MC3E_UDP") {
        // UDP 端口以供应商网关为准（现场常见 5040），默认仍给 MC 标准 5007
        this.form.dynamicConfig = {
          timeout: 3000,
          port: 5007,
        };
      } else if (netType === "MITSUBISHI_CNC_TCP") {
        this.form.dynamicConfig = {
          timeout: 3000,
          port: 683,
        };
      } else if (netType === "S71200_TCP") {
        this.form.dynamicConfig = {
          timeout: 3000,
          rack: 0,
          slot: 1,
        };
      }

      // 清除当前表单校验状态（在设置默认值之后）
      if (this.$refs.form) {
        this.$refs.form.clearValidate();
      }
    },
    /** 匿名开关变化处理 */
    handleAnonymousChange(value) {
      if (value === true) {
        // 允许匿名时清空用户名密码
        this.form.dynamicConfig.username = "";
        this.form.dynamicConfig.password = "";
      }
      // 重新校验表单
      if (this.$refs.form) {
        this.$refs.form.validateField([
          "dynamicConfig.mqttUsername",
          "dynamicConfig.mqttPassword",
        ]);
      }
    },

    /** 鉴权开关变化处理 */
    handleIsAuthChange(value) {
      if (value === true) {
        this.form.dynamicConfig.tokenConfig = "";
      }
      // 重新校验表单
      if (this.$refs.form) {
        this.$refs.form.validateField("dynamicConfig.tokenConfig");
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 卡片是否处于勾选态（卡片复选框的取值） */
    isCardSelected(id) {
      return this.selectedIds.indexOf(id) != -1;
    },
    /** 卡片复选框变化：勾上加进待处理集合，取消勾选移出 */
    onCardSelectChange(item, checked) {
      const index = this.selectedIds.indexOf(item.id);
      if (checked) {
        if (index == -1) {
          this.selectedIds.push(item.id);
        }
      } else if (index != -1) {
        this.selectedIds.splice(index, 1);
      }
    },
    /** 工具栏「全选本页」：已全选则清空，否则勾选当前页全部 */
    toggleSelectAll(checked) {
      this.selectedIds = checked
        ? this.componentList.map((item) => item.id)
        : [];
    },
    /**
     * 关掉上一批的汇总通知（由AI修改）。
     * 汇总通知是 duration:0 长驻的 —— 它要挂在右上角让人看清是哪些组件失败了，自动消失反而读不完。
     * 代价是连跑几批就会叠成一摞，所以每批开头先收掉上一条。
     * 用户已手动点「×」关掉时，句柄指向的实例已经销毁 —— 容错跳过，别为了一条提示把批量带崩。
     */
    closeBatchNotify() {
      if (this.batchNotify) {
        try {
          this.batchNotify.close();
        } catch (error) {
          console.error("关闭上一条批量汇总通知失败", error);
        }
        this.batchNotify = null;
      }
    },
    /**
     * 批量开启 / 关闭所选组件（status：1 开启，0 关闭）。
     *
     * 这里是页面侧分批并发调既有的单组件接口，没有加后端批量接口，原因有两个：
     * ① 组件的开启是「同步建连」，单个最长要等满建连探针超时（3 秒，见
     *    ModbusConnectionManager），上百个组件交给后端同步跑必然超过前端 10 秒的 axios 超时；
     * ② 交给后端异步跑，页面就拿不回「哪个成功了、哪个失败了」。
     * 放在页面侧分批跑，每张卡片沿用既有的独立 loading 逐张转圈、逐张出结果，失败项能指名道姓。
     *
     * ⚠️ 批量期间这个页面不能关：请求是从这个浏览器发出的。关掉页面等于中断剩下的批次，
     * 已处理完的组件保持处理后的状态（后端不会因为页面关了而回滚）。
     */
    async batchToggleStatus(status) {
      const actionName = status == 1 ? "启动" : "停止";
      const stateName = status == 1 ? "启用" : "停用";
      // 只处理状态与目标不一致的：勾选的里面本来就已经是启用态的，不必再启动一次
      const targets = this.selectedCards.filter((item) => item.status != status);
      if (targets.length == 0) {
        this.$message.info("所选组件均已处于「" + stateName + "」状态");
        return;
      }
      this.batchRunning = true;
      this.batchTotal = targets.length;
      this.batchDone = 0;
      // 开新的一批前先收掉上一批的汇总通知，免得几批下来右上角叠成一摞
      this.closeBatchNotify();
      // 长驻提示，逐批改写文案显示进度；下面 finally 里一定关掉，别让它留在页面上
      const tip = this.$message({
        message: "批量" + actionName + "中 0/" + targets.length,
        duration: 0,
        showClose: true,
      });
      const failed = [];
      try {
        for (let i = 0; i < targets.length; i += BATCH_CONCURRENCY) {
          const chunk = targets.slice(i, i + BATCH_CONCURRENCY);
          // 单个失败不往外抛（见 batchToggleOne），所以 Promise.all 不会中断这一批
          const results = await Promise.all(
            chunk.map((item) => this.batchToggleOne(item, status))
          );
          for (const result of results) {
            if (!result.ok) {
              failed.push(result);
            }
          }
          tip.message =
            "批量" + actionName + "中 " + this.batchDone + "/" + targets.length;
        }
      } catch (error) {
        // 正常到不了这里：batchToggleOne 自己吞掉失败
        console.error("批量" + actionName + "组件异常", error);
      } finally {
        tip.close();
        this.batchRunning = false;
        // 重新拉列表：成功/失败直接体现在卡片的「启用 / 停用」角标上
        this.getList();
      }
      const okCount = targets.length - failed.length;
      if (failed.length == 0) {
        this.$modal.msgSuccess(
          "批量" + actionName + "完成：" + okCount + " 个全部成功"
        );
      } else {
        // 逐个弹窗会叠成一堵墙，这里汇总成一条：失败的组件名点出来，
        // 具体原因可单独点该组件的启动/停止按钮复现（批量下走的是静默模式，不弹逐条提示）
        const names = failed.map((item) => item.item.name).join("、");
        this.batchNotify = this.$notify({
          title: "批量" + actionName + "完成",
          type: "warning",
          duration: 0,
          message:
            "成功 " +
            okCount +
            " 个，失败 " +
            failed.length +
            " 个：" +
            names +
            "（详细原因见浏览器控制台，或单独点该组件的按钮复现）",
        });
      }
    },
    /**
     * 批量里的单个组件：成功、失败都以结果对象返回，不向外抛 ——
     * 一个组件失败不该中断整批，也不该让 Promise.all 把这一批的其余结果丢掉。
     */
    async batchToggleOne(item, status) {
      this.$set(this.statusLoadingMap, item.id, true);
      try {
        // silentError：批量下逐条弹提示会叠成一堵墙，改由调用方收齐后统一汇总
        await control(
          { id: item.id, status: status },
          { silentError: true }
        );
        return { item: item, ok: true };
      } catch (error) {
        console.error("批量启停组件失败：" + item.name, error);
        return { item: item, ok: false, reason: error && error.message };
      } finally {
        this.$set(this.statusLoadingMap, item.id, false);
        this.batchDone++;
      }
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset(); // 先彻底重置
      this.open = true;
      this.form.status = "0";
      this.form.openTls = "0";
      this.title = "添加网络组件";
    },
    /** 修改按钮操作（解析数据到form.dynamicConfig） */
    handleUpdate(row) {
      this.reset(); // 先重置再赋值
      const id = row.id || this.ids[0];
      getComponent(id).then((response) => {
        this.form = {
          ...response.data,
          dynamicConfig: {}, // 初始化动态配置
        };
        if (this.form.protocolId) {
          this.selectProtocolId = this.form.protocolId;
        }
        // 解析 otherConfig 到 form.dynamicConfig
        if (this.form.otherConfig) {
          try {
            this.form.dynamicConfig = JSON.parse(this.form.otherConfig);
          } catch (e) {
            this.form.dynamicConfig = {};
          }
        }

        // 如果有网络类型，过滤协议列表
        if (this.form.netType) {
          this.filterProtocols(this.form.netType);
        }

        this.open = true;
        this.title = "修改网络组件";
      });
    },
    /** 复制网络组件：打开新增态表单（协议绑定解锁）预填原数据，名称加"副本"，保存走新增 */
    handleCopy(row) {
      this.reset();
      const id = row.id || this.ids[0];
      getComponent(id).then((response) => {
        const data = response.data;
        // ⚠️ dynamicConfig 必须写在对象字面量里。Vue2 侦测不到「给已 observe 的对象新增属性」：
        // 先建对象、事后再 this.form.dynamicConfig = {} 的话这个键根本没有 getter/setter，
        // 后续所有对它的赋值都不触发重渲染 —— 而 el-input 的 handleInput 里有
        // $nextTick(setNativeInputValue)，会把「上一次渲染时的旧 prop 值」写回输入框，
        // 于是「其余配置」里刚敲进去的内容下一个 tick 就被顶回旧值（模型已更新、输入框回退），
        // 要动一下上面任何响应式字段（如组件名称）触发重渲染才会同步过来。
        this.form = {
          ...data,
          id: null,
          name: (data.name || "") + "副本",
          // 复制出来的组件一律以停用状态创建：status 是运行时状态而不是配置，
          // 原组件启用时若把它一起复制过去，保存（走新增接口）会立刻尝试建连并直接启用副本。
          status: "0",
          dynamicConfig: {},
        };
        // 先按原网络类型初始化动态配置默认值（会重置 dynamicConfig）
        if (this.form.netType) {
          this.handleNetTypeChange(this.form.netType);
        }
        // 协议绑定：新增态可重新选择，原协议作为默认选中
        this.selectProtocolId = data.protocolId;
        this.form.protocolId = null;
        // 用原组件的动态配置覆盖默认值
        if (data.otherConfig) {
          try {
            this.form.dynamicConfig = JSON.parse(data.otherConfig);
          } catch (e) {
            console.error("解析组件动态配置失败", e);
          }
        }
        this.open = true;
        this.title = "复制网络组件";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          // MQTT Broker 特殊验证
          if (this.form.netType === "MQTT_BROKER") {
            // 如果不允许匿名，必须填写用户名密码
            if (this.form.dynamicConfig.allowAnonymous === false) {
              if (
                !this.form.dynamicConfig.username ||
                !this.form.dynamicConfig.password
              ) {
                this.$modal.msgError("不允许匿名时，用户名和密码为必填项");
                return;
              }
            }
          }
          // 三菱 CNC 机型/NC型：决定设备/产品详情页「点位」下拉取哪张语义点位表，必须选一个。
          // 存量组件的 other_config 里没有 model，编辑保存时会在这里要求补选一次（故意的：
          // 不补的话点表由谁兜底就是隐式的，读不到值时无从判断是机型不对还是地址不对）。
          if (
            this.form.netType == "MITSUBISHI_CNC_TCP" &&
            !this.form.dynamicConfig.model
          ) {
            this.$modal.msgError("请选择机床机型 / NC型");
            return;
          }
          // 将form.dynamicConfig转换为 JSON 字符串
          this.form.otherConfig = JSON.stringify(this.form.dynamicConfig);
          if (this.selectProtocolId) {
            this.form.protocolId = this.selectProtocolId;
            let protocol = this.protocolList.find(
              (item) => item.id === this.form.protocolId
            );
            this.form.protocolName = protocol?.protocolName || "";
          }
          if (this.form.id != null) {
            updateComponent(this.form).then((response) => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addComponent(this.form).then((response) => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal
        .confirm('是否确认删除网络组件编号为"' + ids + '"的数据项？')
        .then(function () {
          return delComponent(ids);
        })
        .then(() => {
          this.getList();
          // 清空勾选：删掉的组件可能还在待处理集合里，留着会让批量启停拿到已经不存在的 id
          this.selectedIds = [];
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => {});
    },
    /**
     * 「启动/停止」按钮文案：请求进行中显示「启动中…/停止中…」。
     * 组件开启是后端同步建连，目标连不通时最长要等一个建连探针超时（默认 3 秒），
     * 光转圈不足以说明在干什么；这段时间里用户很容易误以为没反应而反复点。
     */
    statusBtnText(item) {
      if (this.statusLoadingMap[item.id]) {
        return item.status == 1 ? "停止中…" : "启动中…";
      }
      return item.status == 1 ? "停止" : "启动";
    },
    async toggleStatus(item) {
      // 按组件 id 单独置 loading：只锁被点的那张卡片，其余卡片的按钮照常可用
      this.$set(this.statusLoadingMap, item.id, true);
      try {
        await control({ id: item.id, status: item.status == 1 ? 0 : 1 });
        this.$message.success("操作成功");
        this.getList();
      } catch (error) {
        // 失败原因由 request 拦截器统一提示：开启失败多为协议包加载不了，
        // 后端会给出一条带「可能原因 / 处理办法」的详情通知（长驻，不自动消失）
        console.error("切换网络组件状态失败", error);
      } finally {
        this.$set(this.statusLoadingMap, item.id, false);
      }
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download(
        "business/component/export",
        {
          ...this.queryParams,
        },
        `component_${new Date().getTime()}.xlsx`
      );
    },
    handleProtocolChange(selectedIds) {
      if (!selectedIds || selectedIds.length === 0) {
        this.form.protocolName = "";
      }
    },
    showComponentDetail(component) {
      this.selectedComponent = component;
      this.dialogVisible = true;
    },
    handleDialogClose() {
      this.dialogVisible = false;
      this.selectedComponentId = "";
    },

    getTableListData() {
      getTableList(this.form.dynamicConfig).then((response) => {
        if (response?.code == 200) {
          this.tableNameList = response.data;
        }
      });
    },
  },
};
</script>

<style scoped>
/* 工具栏「全选本页」：复选框自身只有 ~19px 高，和 28px 的 mini 按钮同为顶对齐时文字偏上，用 flex 垂直居中 */
.select-all-col {
  display: flex;
  align-items: center;
  height: 28px;
}

/* 启动自愈说明图标：与工具栏按钮同一行、同高居中，悬停才显示说明 */
.startup-retry-tip-col {
  display: flex;
  align-items: center;
  height: 28px;
}
.startup-retry-icon {
  color: #909399;
  font-size: 16px;
  vertical-align: middle;
  cursor: help;
}

/* 底部留白：分页条是 fixed 悬浮层，留出足够高度避免最后一行卡片被遮挡 */
.component-card-container {
  margin-bottom: 100px;
}

/* 三菱 CNC 机型下拉：选项右侧灰显机型说明（同 MitsubishiCncTcpConfig 的 .pt-symbol 写法） */
.model-desc {
  float: right;
  color: #999;
  font-size: 12px;
  padding-left: 16px;
}

/* 机型说明提示（下拉下方） */
.model-tip {
  margin-top: 6px;
  color: #999;
  font-size: 12px;
  line-height: 1.6;
}

/* 使用 Grid 布局替代 Element UI 栅格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 每行4个卡片 */
  gap: 20px;
}

/* 栅格子项默认 min-width:auto，会被卡片内 nowrap 文本的 min-content 撑宽，
   `1fr` 列宽就不再受容器约束、各列宽窄不一 —— 归零后列宽才真正等于容器均分 */
.card-grid > *,
.card-grid > * > *,
.card-grid > * > * > * {
  min-width: 0;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr); /* 每行3个 */
  }
}

@media (max-width: 992px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr); /* 每行2个 */
  }
}

@media (max-width: 576px) {
  .card-grid {
    grid-template-columns: 1fr; /* 每行1个 */
  }
}

.card-col {
  margin-bottom: 0; /* Grid布局使用gap控制间距 */
  transition: transform 0.3s;
}

.card-col:hover {
  transform: translateY(-5px);
}

.card-checkbox {
  display: block;
  width: 100%;
  position: relative;
}

.card-checkbox ::v-deep .el-checkbox__label {
  width: 100%;
  padding: 0;
}

.component-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid #e6e8eb;
  background: #fff;
}

/* 内容撑满卡片剩余高度，底部操作栏始终贴卡片底部（同行卡片按钮才能对齐） */
.component-card ::v-deep .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.component-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  border-color: #c0c4cc;
}

/* 启用状态渐变背景 */
.component-card.active-status {
  position: relative;
  overflow: hidden;
}

.component-card.active-status::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(64, 158, 255, 0.15) 0%,
    rgba(64, 158, 255, 0.05) 20%,
    rgba(64, 158, 255, 0) 40%
  );
  pointer-events: none;
  z-index: 1;
}

/* 停用状态渐变背景 */
.component-card.inactive-status {
  position: relative;
  overflow: hidden;
}

.component-card.inactive-status::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(245, 108, 108, 0.1) 0%,
    rgba(245, 108, 108, 0.05) 15%,
    rgba(245, 108, 108, 0) 30%
  );
  pointer-events: none;
  z-index: 1;
}

/* 梯形状态标识 */
.status-trapezoid {
  position: absolute;
  top: 12px;
  right: -18px;
  width: 70px;
  padding: 4px 0;
  color: white;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  transform: rotate(45deg);
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-trapezoid.active {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.status-trapezoid.inactive {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
}

.card-header {
  padding: 15px;
  border-bottom: 1px solid #f0f2f5;
  position: relative;
  z-index: 2;
  /* 勾选框与组件名同一行。名字仍要能省略号截断，所以 h4 得拿 flex:1 + min-width:0，
     否则 flex 子项的默认 min-width:auto 会让长名字把卡片撑破而不是出省略号 */
  display: flex;
  align-items: center;
}

.card-select {
  margin-right: 8px;
}

/* 工具栏上的批量状态提示（已选 N 个 / 批量处理中 x/y）。
   line-height 取与 size="mini" 按钮同高，文字才不会比按钮矮一截 */
.batch-tip-col {
  line-height: 28px;
}

.batch-tip {
  font-size: 12px;
  color: #909399;
}

.component-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card-content {
  flex: 1;
  padding: 15px;
  position: relative;
  z-index: 2;
}

.card-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.card-item i {
  margin-right: 8px;
  color: #909399;
  font-size: 14px;
}

.card-item .value {
  color: #606266;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.card-actions {
  padding: 12px 15px;
  border-top: 1px solid #f0f2f5;
  text-align: center;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  row-gap: 8px;
  column-gap: 6px;
  margin-top: auto;
  position: relative;
  z-index: 2;
}

.action-btn {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 5px 8px;
  /* 按钮间距由 actions 的 gap 统一控制，去掉 Element 相邻按钮自带的 10px 左外边距 */
  margin-left: 0 !important;
  transition: all 0.2s;
  font-size: 12px;
}

.edit-btn {
  background: linear-gradient(to bottom, #f0f9ff, #e6f7ff);
  border-color: #91d5ff;
  color: #1890ff;
}

.edit-btn:hover {
  background: linear-gradient(to bottom, #e6f7ff, #d3eefe);
  border-color: #69c0ff;
  color: #096dd9;
}

.delete-btn {
  background: linear-gradient(to bottom, #fff2f0, #fff0ed);
  border-color: #ffccc7;
  color: #ff4d4f;
}

.delete-btn:hover {
  background: linear-gradient(to bottom, #fff0ed, #ffeae8);
  border-color: #ffa39e;
  color: #f5222d;
}

.copy-btn {
  background: linear-gradient(to bottom, #f6ffed, #f0fdf4);
  border-color: #b7eb8f;
  color: #52c41a;
}

.copy-btn:hover {
  background: linear-gradient(to bottom, #f0fdf4, #e6fce8);
  border-color: #95de64;
  color: #389e0d;
}

/* 添加分页容器样式 */
.pagination-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 15px;
  z-index: 1000;
}

/* 可选：如果需要进一步美化分页组件本身 */
::v-deep .el-pagination {
  background: transparent;
}

::v-deep .el-pagination .btn-prev,
::v-deep .el-pagination .btn-next,
::v-deep .el-pagination .number {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

::v-deep .el-pagination .number.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* 抽屉样式 */
.component-drawer ::v-deep .el-drawer {
  overflow-y: auto;
}

.drawer-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-footer {
  margin-top: auto;
  padding: 20px 0;
  text-align: right;
}
/* 动态配置区域样式 */
.dynamic-config-section {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.dynamic-config-fields {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e6e8eb;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .component-drawer ::v-deep .el-drawer {
    width: 85% !important;
  }

  .dynamic-config-section {
    margin: 15px 0;
    padding: 10px;
  }

  .dynamic-config-fields {
    padding: 10px;
  }
}
</style>
