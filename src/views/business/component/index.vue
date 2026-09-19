<template>
  <div class="app-container">
    <!-- 搜索区域保持不变 -->
    <el-form
      :model="queryParams"
      ref="queryForm"
      size="small"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
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
              @click.stop="toggleStatus(item)"
            >
              {{ item.status == 1 ? "停止" : "启动" }}
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
                    placeholder="如：三菱 MC 默认 5007 / FANUC 8193 / 三菱CNC 683"
                  />
                </el-form-item>
                <el-form-item label="连接超时(ms)" prop="dynamicConfig.timeout">
                  <el-input
                    type="number"
                    v-model="form.dynamicConfig.timeout"
                    placeholder="如：3000"
                  />
                </el-form-item>
                <!-- FANUC 专用：fwlib32 库路径（可选，默认自动搜索 java.library.path / lib 目录等） -->
                <el-form-item
                  label="fwlib32库路径"
                  prop="dynamicConfig.libPath"
                  v-if="form.netType === 'FANUC_TCP'"
                >
                  <el-input
                    v-model="form.dynamicConfig.libPath"
                    placeholder="可空；如 /opt/fanuc/libfwlib32.so（不填则自动搜索常见目录）"
                  />
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

export default {
  name: "ComponentView",
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
      selectedCards: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      componentList: [],
      title: "",
      open: false,
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
    // 卡片选择变化
    handleCardSelectionChange(selection) {
      this.ids = selection;
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
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
        this.form = {
          ...data,
          id: null,
          name: (data.name || "") + "副本",
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
          this.selectedCards = [];
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => {});
    },
    toggleStatus(item) {
      control({ id: item.id, status: item.status == 1 ? 0 : 1 }).then((res) => {
        if (res?.code == 200) {
          this.$message.success("操作成功");
          this.getList();
        }
      });
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
.component-card-container {
  margin-bottom: 30px;
}

/* 使用 Grid 布局替代 Element UI 栅格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 每行4个卡片 */
  gap: 20px;
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
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid #e6e8eb;
  background: #fff;
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
}

.component-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content {
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
  justify-content: space-around;
  flex-wrap: wrap;
  row-gap: 8px;
  column-gap: 4px;
  position: relative;
  z-index: 2;
}

.action-btn {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 6px 10px;
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

/* 调整卡片容器底部边距，避免内容被分页遮挡 */
.product-card-container {
  margin-bottom: 80px;
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
