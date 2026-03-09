import request from '@/utils/request'

// 查询设备联动告警记录列表
export function listLinkageRecord(query) {
  return request({
    url: '/business/linkageRecord/list',
    method: 'get',
    params: query
  })
}

// 查询设备联动告警记录详细
export function getLinkageRecord(id) {
  return request({
    url: '/business/linkageRecord/' + id,
    method: 'get'
  })
}

// 新增设备联动告警记录
export function addLinkageRecord(data) {
  return request({
    url: '/business/linkageRecord',
    method: 'post',
    data: data
  })
}

// 修改设备联动告警记录
export function updateLinkageRecord(data) {
  return request({
    url: '/business/linkageRecord',
    method: 'put',
    data: data
  })
}

// 删除设备联动告警记录
export function delLinkageRecord(id) {
  return request({
    url: '/business/linkageRecord/' + id,
    method: 'delete'
  })
}

// 处理设备联动告警记录
export function dealLinkageRecord(id) {
  return request({
    url: '/business/linkageRecord/deal/' + id,
    method: 'put',
    data:{}
  })
}
