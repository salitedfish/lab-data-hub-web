import request from '@/utils/request'

// 查询s71200Tcp协议读取配置列表
export function listS71200Tcp(query) {
  return request({
    url: '/business/s71200/list',
    method: 'get',
    params: query
  })
}

// 查询s71200Tcp协议读取配置详细
export function getS71200Tcp(id) {
  return request({
    url: '/business/s71200/' + id,
    method: 'get'
  })
}

// 新增s71200Tcp协议读取配置
export function addS71200Tcp(data) {
  return request({
    url: '/business/s71200',
    method: 'post',
    data: data
  })
}

// 修改s71200Tcp协议读取配置
export function updateS71200Tcp(data) {
  return request({
    url: '/business/s71200',
    method: 'put',
    data: data
  })
}

// 删除s71200Tcp协议读取配置
export function delS71200Tcp(id) {
  return request({
    url: '/business/s71200/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readS71200TcpSwitchByDevice(data) {
  return request({
    url: '/business/s71200/readSwitchByDevice?deviceSn=' + data.deviceSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readS71200TcpSwitchByProduct(data) {
  return request({
    url: '/business/s71200/readSwitchByProduct?productSn=' + data.productSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 下发配置到该产品全部设备
export function syncConfigToDevice(productSn) {
  return request({
    url: '/business/s71200/syncConfigToDevice?productSn=' + productSn,
    method: 'post'
  })
}
