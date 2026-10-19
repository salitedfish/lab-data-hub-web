import request from '@/utils/request'

// 查询网络组件列表
export function listComponent(query) {
  return request({
    url: '/business/component/list',
    method: 'get',
    params: query
  })
}

// 查询网络组件详细
export function getComponent(id) {
  return request({
    url: '/business/component/' + id,
    method: 'get'
  })
}

// 新增网络组件
export function addComponent(data) {
  return request({
    url: '/business/component',
    method: 'post',
    data: data
  })
}

// 修改网络组件
export function updateComponent(data) {
  return request({
    url: '/business/component',
    method: 'put',
    data: data
  })
}

// 删除网络组件
export function delComponent(id) {
  return request({
    url: '/business/component/' + id,
    method: 'delete'
  })
}

// 开启 / 关闭网络组件
// config 可选：透传给 axios 的额外配置。批量启停时传 { silentError: true }，
// 让每条的失败提示不再各自弹窗，交由调用方收齐后统一汇总。
export function control(data, config) {
  return request({
    url: '/business/component/control?id=' + data.id + "&status=" + data.status,
    method: 'put',
    data: {},
    ...config
  })
}

// 获取数据库表列表
export function getTableList(data) {
  return request({
    url: '/business/component/listAllTables',
    method: 'post',
    data: data
  })
}
