// src/utils/websocket.js

/**
 * 获取 WebSocket 连接地址
 * @param {string} type - 连接类型 (component, device, system)
 * @param {string} id - 组件/设备 ID
 * @returns {string} WebSocket URL
 */
export function getWebSocketUrl(type, id = '') {
  const configured = (process.env.VUE_APP_WS_BASE_URL || '').trim()
  // 显式配置了 WS 地址则直连；未配置时跟随当前页面地址（开发环境经 devServer 代理转发到后端，生产环境同源）
  let baseUrl
  if (configured) {
    baseUrl = configured
  } else {
    const scheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    baseUrl = scheme + window.location.host
  }

  // 对外的 WS 路径前缀，默认 /ws（对应后端 @ServerEndpoint("/ws/{type}/{sign}")）。
  // 生产若用别的路径对外暴露（如 nginx 把 /prod-hub-ws/ 转到后端的 /ws/），用 VUE_APP_WS_PATH_PREFIX 覆盖。
  const prefix = (process.env.VUE_APP_WS_PATH_PREFIX || '/ws').replace(/\/+$/, '')
  const pathMap = {
    component: `${prefix}/component/`,
    device: `${prefix}/device/`,
    system: `${prefix}/system/`
  }

  const path = pathMap[type] || `${prefix}/`
  return `${baseUrl.replace(/\/$/, '')}${path}${id}`
}

/**
 * 创建 WebSocket 连接
 * @param {string} type - 连接类型
 * @param {string} id - 组件/设备 ID
 * @param {Object} callbacks - 回调函数
 * @returns {WebSocket} WebSocket 实例
 */
export function createWebSocket(type, id, callbacks = {}) {
  const url = getWebSocketUrl(type, id)
  const ws = new WebSocket(url)

  const { onOpen, onMessage, onClose, onError } = callbacks

  if (onOpen) ws.onopen = onOpen
  if (onMessage) ws.onmessage = onMessage
  if (onClose) ws.onclose = onClose
  if (onError) ws.onerror = onError

  return ws
}
