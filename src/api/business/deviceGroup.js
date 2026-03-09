import request from '@/utils/request'

// 查询设备分组列表
export function listDeviceGroup(query) {
  return request({
    url: '/business/deviceGroup/list',
    method: 'get',
    params: query
  })
}

// 查询设备分组详细
export function getDeviceGroup(id) {
  return request({
    url: '/business/deviceGroup/' + id,
    method: 'get'
  })
}

// 新增设备分组
export function addDeviceGroup(data) {
  return request({
    url: '/business/deviceGroup',
    method: 'post',
    data: data
  })
}

// 修改设备分组
export function updateDeviceGroup(data) {
  return request({
    url: '/business/deviceGroup',
    method: 'put',
    data: data
  })
}

// 删除设备分组
export function delDeviceGroup(id) {
  return request({
    url: '/business/deviceGroup/' + id,
    method: 'delete'
  })
}
