import request from '@/utils/request'

// 查询设备联动告警
export function listWarnLinkage(query) {
  return request({
    url: '/business/linkage/list',
    method: 'get',
    params: query
  })
}

// 获取设备联动告警详情
export function getWarnLinkage(id) {
  return request({
    url: '/business/linkage/' + id,
    method: 'get'
  })
}

// 新增设备联动告警
export function addWarnLinkage(data) {
  return request({
    url: '/business/linkage',
    method: 'post',
    data: data
  })
}

// 修改设备联动告警
export function updateWarnLinkage(data) {
  return request({
    url: '/business/linkage',
    method: 'put',
    data: data
  })
}

// 删除设备联动告警
export function delWarnLinkage(id) {
  return request({
    url: '/business/linkage/' + id,
    method: 'delete'
  })
}

// 开关设备联动告警
export function control(data) {
  return request({
    url: '/business/linkage/control?id='+data.id+"&isEnable="+data.isEnable,
    method: 'put',
    data: {}
  })
}

// 配置设备联动告警
export function configLinkage(data) {
  return request({
    url: '/business/linkage/configLinkage',
    method: 'put',
    data: data
  })
}
