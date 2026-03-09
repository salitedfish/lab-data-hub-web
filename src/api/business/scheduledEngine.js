import request from '@/utils/request'

// 查询定时引擎
export function listScheduledEngine(query) {
  return request({
    url: '/business/scheduledEngine/list',
    method: 'get',
    params: query
  })
}

// 获取定时引擎详情
export function getScheduledEngine(id) {
  return request({
    url: '/business/scheduledEngine/' + id,
    method: 'get'
  })
}

// 新增定时引擎
export function addScheduledEngine(data) {
  return request({
    url: '/business/scheduledEngine',
    method: 'post',
    data: data
  })
}

// 修改定时引擎
export function updateScheduledEngine(data) {
  return request({
    url: '/business/scheduledEngine',
    method: 'put',
    data: data
  })
}

// 删除定时引擎
export function delScheduledEngine(id) {
  return request({
    url: '/business/scheduledEngine/' + id,
    method: 'delete'
  })
}

// 开关定时引擎
export function control(data) {
  return request({
    url: '/business/scheduledEngine/control?id='+data.id+"&isEnable="+data.isEnable,
    method: 'put',
    data: {}
  })
}

// 配置定时引擎
export function configScheduledEngine(data) {
  return request({
    url: '/business/scheduledEngine/configTask',
    method: 'put',
    data: data
  })
}
