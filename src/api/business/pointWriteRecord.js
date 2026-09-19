import request from '@/utils/request'

// 查询点位写值记录列表（设备详情页物模型 tab「写值记录」弹窗）
// 只读接口：这张表是审计日志，没有新增/修改/删除
// 支持的查询参数：deviceSn / code / source / isSuccess / startTime / endTime / pageNum / pageSize
export function listPointWriteRecord(query) {
  return request({
    url: '/business/pointWriteRecord/list',
    method: 'get',
    params: query
  })
}
