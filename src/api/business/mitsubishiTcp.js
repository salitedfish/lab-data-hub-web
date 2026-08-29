import request from '@/utils/request'

// 查询三菱MC协议读取配置列表
export function listMitsubishiTcp(query) {
  return request({
    url: '/business/mitsubishiTcp/list',
    method: 'get',
    params: query
  })
}

// 查询三菱MC协议读取配置详细
export function getMitsubishiTcp(id) {
  return request({
    url: '/business/mitsubishiTcp/' + id,
    method: 'get'
  })
}

// 新增三菱MC协议读取配置
export function addMitsubishiTcp(data) {
  return request({
    url: '/business/mitsubishiTcp',
    method: 'post',
    data: data
  })
}

// 修改三菱MC协议读取配置
export function updateMitsubishiTcp(data) {
  return request({
    url: '/business/mitsubishiTcp',
    method: 'put',
    data: data
  })
}

// 删除三菱MC协议读取配置
export function delMitsubishiTcp(id) {
  return request({
    url: '/business/mitsubishiTcp/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readMitsubishiTcpSwitchByDevice(data) {
  return request({
    url: '/business/mitsubishiTcp/readSwitchByDevice?deviceSn=' + data.deviceSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readMitsubishiTcpSwitchByProduct(data) {
  return request({
    url: '/business/mitsubishiTcp/readSwitchByProduct?productSn=' + data.productSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 下发配置到该产品全部设备
export function syncConfigToDevice(productSn) {
  return request({
    url: '/business/mitsubishiTcp/syncConfigToDevice?productSn=' + productSn,
    method: 'post'
  })
}
