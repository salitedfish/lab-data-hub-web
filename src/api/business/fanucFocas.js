import request from '@/utils/request'

// 查询FANUC协议读取配置列表
export function listFanucFocas(query) {
  return request({
    url: '/business/fanucTcp/list',
    method: 'get',
    params: query
  })
}

// 查询FANUC协议读取配置详细
export function getFanucFocas(id) {
  return request({
    url: '/business/fanucTcp/' + id,
    method: 'get'
  })
}

// 新增FANUC协议读取配置
export function addFanucFocas(data) {
  return request({
    url: '/business/fanucTcp',
    method: 'post',
    data: data
  })
}

// 修改FANUC协议读取配置
export function updateFanucFocas(data) {
  return request({
    url: '/business/fanucTcp',
    method: 'put',
    data: data
  })
}

// 删除FANUC协议读取配置
export function delFanucFocas(id) {
  return request({
    url: '/business/fanucTcp/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readFanucFocasSwitchByDevice(data) {
  return request({
    url: '/business/fanucTcp/readSwitchByDevice?deviceSn=' + data.deviceSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readFanucFocasSwitchByProduct(data) {
  return request({
    url: '/business/fanucTcp/readSwitchByProduct?productSn=' + data.productSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 下发配置到该产品全部设备
export function syncConfigToDevice(productSn) {
  return request({
    url: '/business/fanucTcp/syncConfigToDevice?productSn=' + productSn,
    method: 'post'
  })
}
