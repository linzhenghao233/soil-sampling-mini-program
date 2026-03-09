const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { deviceId, command } = event;

  try {
    await db.collection('device_status').doc(deviceId).update({
      data: {
        command: command,
        updateTime: db.serverDate() // 使用服务器时间
      }
    });
    return { success: true, message: 'Command sent.' };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
}