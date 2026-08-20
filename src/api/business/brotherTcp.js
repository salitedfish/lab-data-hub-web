import request from '@/utils/request'

// 查询Brother协议读取配置列表
export function listBrotherTcp(query) {
  return request({
    url: '/business/brotherTcp/list',
    method: 'get',
    params: query
  })
}

// 查询Brother协议读取配置详细
export function getBrotherTcp(id) {
  return request({
    url: '/business/brotherTcp/' + id,
    method: 'get'
  })
}

// 新增Brother协议读取配置
export function addBrotherTcp(data) {
  return request({
    url: '/business/brotherTcp',
    method: 'post',
    data: data
  })
}

// 修改Brother协议读取配置
export function updateBrotherTcp(data) {
  return request({
    url: '/business/brotherTcp',
    method: 'put',
    data: data
  })
}

// 删除Brother协议读取配置
export function delBrotherTcp(id) {
  return request({
    url: '/business/brotherTcp/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readBrotherTcpSwitchByDevice(data) {
  return request({
    url: '/business/brotherTcp/readSwitchByDevice?deviceSn=' + data.deviceSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readBrotherTcpSwitchByProduct(data) {
  return request({
    url: '/business/brotherTcp/readSwitchByProduct?productSn=' + data.productSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}
