import request from '@/utils/request'

// 查询omronFins协议读取配置列表
export function listOmronFinsTcp(query) {
  return request({
    url: '/business/omronFins/list',
    method: 'get',
    params: query
  })
}

// 查询omronFins协议读取配置详细
export function getOmronFinsTcp(id) {
  return request({
    url: '/business/omronFins/' + id,
    method: 'get'
  })
}

// 新增omronFins协议读取配置
export function addOmronFinsTcp(data) {
  return request({
    url: '/business/omronFins',
    method: 'post',
    data: data
  })
}

// 修改omronFins协议读取配置
export function updateOmronFinsTcp(data) {
  return request({
    url: '/business/omronFins',
    method: 'put',
    data: data
  })
}

// 删除omronFins协议读取配置
export function delOmronFinsTcp(id) {
  return request({
    url: '/business/omronFins/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readOmronFinsTcpSwitchByDevice(data) {
  return request({
    url: '/business/omronFins/readSwitchByDevice?deviceSn=' + data.deviceSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readOmronFinsTcpSwitchByProduct(data) {
  return request({
    url: '/business/omronFins/readSwitchByProduct?productSn=' + data.productSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}
