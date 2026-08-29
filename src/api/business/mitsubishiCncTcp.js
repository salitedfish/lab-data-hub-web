import request from '@/utils/request'

// 查询三菱CNC TCP(MOCHA)协议读取配置列表
export function listMitsubishiCncTcp(query) {
  return request({
    url: '/business/mitsubishiCncTcp/list',
    method: 'get',
    params: query
  })
}

// 查询三菱CNC TCP(MOCHA)协议读取配置详细
export function getMitsubishiCncTcp(id) {
  return request({
    url: '/business/mitsubishiCncTcp/' + id,
    method: 'get'
  })
}

// 新增三菱CNC TCP(MOCHA)协议读取配置
export function addMitsubishiCncTcp(data) {
  return request({
    url: '/business/mitsubishiCncTcp',
    method: 'post',
    data: data
  })
}

// 修改三菱CNC TCP(MOCHA)协议读取配置
export function updateMitsubishiCncTcp(data) {
  return request({
    url: '/business/mitsubishiCncTcp',
    method: 'put',
    data: data
  })
}

// 删除三菱CNC TCP(MOCHA)协议读取配置
export function delMitsubishiCncTcp(id) {
  return request({
    url: '/business/mitsubishiCncTcp/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readMitsubishiCncTcpSwitchByDevice(data) {
  return request({
    url: '/business/mitsubishiCncTcp/readSwitchByDevice?deviceSn=' + data.deviceSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readMitsubishiCncTcpSwitchByProduct(data) {
  return request({
    url: '/business/mitsubishiCncTcp/readSwitchByProduct?productSn=' + data.productSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 下发配置到该产品全部设备
export function syncConfigToDevice(productSn) {
  return request({
    url: '/business/mitsubishiCncTcp/syncConfigToDevice?productSn=' + productSn,
    method: 'post'
  })
}
