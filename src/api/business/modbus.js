import request from '@/utils/request'

// 查询modbus协议读取配置列表
export function listModbus(query) {
  return request({
    url: '/business/modbus/list',
    method: 'get',
    params: query
  })
}

// 查询modbus协议读取配置详细
export function getModbus(id) {
  return request({
    url: '/business/modbus/' + id,
    method: 'get'
  })
}

// 新增modbus协议读取配置
export function addModbus(data) {
  return request({
    url: '/business/modbus',
    method: 'post',
    data: data
  })
}

// 修改modbus协议读取配置
export function updateModbus(data) {
  return request({
    url: '/business/modbus',
    method: 'put',
    data: data
  })
}

// 删除modbus协议读取配置
export function delModbus(id) {
  return request({
    url: '/business/modbus/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readSwitchByDevice(data) {
  return request({
    url: '/business/modbus/readSwitchByDevice?deviceSn='+data.deviceSn+"&isOpen="+data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readSwitchByProduct(data) {
  return request({
    url: '/business/modbus/readSwitchByProduct?productSn='+data.productSn+"&isOpen="+data.isOpen,
    method: 'post',
    data: data
  })
}

// 下发配置到该产品全部设备
export function syncConfigToDevice(productSn) {
  return request({
    url: '/business/modbus/syncConfigToDevice?productSn=' + productSn,
    method: 'post'
  })
}
