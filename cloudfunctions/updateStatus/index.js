const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  // event.body 是 ESP32 POST过来的JSON字符串，云函数会自动解析为对象
  const { deviceId, status, ledStatus } = JSON.parse(event.body);

  if (!deviceId || !status) {
    return {
      statusCode: 400,
      body: 'Missing deviceId or status'
    };
  }

  try {
    await db.collection('device_status').doc(deviceId).update({
      data: {
        status: status,
        ledStatus: ledStatus, // 更新LED状态
        updateTime: db.serverDate()
      }
    });
    // 返回给ESP32的响应
    return {
      success: true,
      message: 'Status updated'
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: e
    };
  }
}