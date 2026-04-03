import request from '@/utils/request'

// 查询db协议读取配置列表
export function listDatabase(query) {
  return request({
    url: '/business/db/list',
    method: 'get',
    params: query
  })
}

// 查询db协议读取配置详细
export function getDatabase(id) {
  return request({
    url: '/business/db/' + id,
    method: 'get'
  })
}

// 新增db协议读取配置
export function addDatabase(data) {
  return request({
    url: '/business/db',
    method: 'post',
    data: data
  })
}

// 查询db协议读取配置表字段
export function listDatabaseTableColumns(data) {
  return request({
    url: '/business/db/listTableColumns',
    method: 'get',
    params: data
  })
}
// 修改db协议读取配置
export function updateDatabase(data) {
  return request({
    url: '/business/db',
    method: 'put',
    data: data
  })
}

// 删除db协议读取配置
export function delDatabase(id) {
  return request({
    url: '/business/db/' + id,
    method: 'delete'
  })
}

// 设备开关读取配置
export function readDatabaseSwitchByDevice(data) {
  return request({
    url: '/business/db/readSwitchByDevice?deviceSn=' + data.deviceSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}

// 产品开关读取配置
export function readDatabaseSwitchByProduct(data) {
  return request({
    url: '/business/db/readSwitchByProduct?productSn=' + data.productSn + "&isOpen=" + data.isOpen,
    method: 'post',
    data: data
  })
}
