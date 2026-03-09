const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  // 从URL查询参数中获取deviceId, e.g., ?deviceId=esp32-01
  const { deviceId } = event.queryStringParameters;
  if (!deviceId) return { command: 'error', reason: 'no deviceId' };

  try {
    const res = await db.collection('device_status').doc(deviceId).get();
    // 获取指令后，立即将其重置为'none'，防止重复执行
    await db.collection('device_status').doc(deviceId).update({ data: { command: 'none' } });
    return res.data; // 返回整个文档
  } catch (e) {
    return { command: 'error', reason: e.toString() };
  }
}