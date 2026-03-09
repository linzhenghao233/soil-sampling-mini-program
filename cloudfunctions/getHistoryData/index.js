const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
    // 获取条数限制，默认返回最近一天(每小时1条类似，或者限制24条)或者最近的 24 条数据
    const limit = event.limit || 24;

    try {
        const res = await db.collection('sensor_data')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        // 返回给小程序端时，可以将数据反转，时间早的在前
        return {
            success: true,
            data: res.data.reverse()
        };
    } catch (err) {
        console.error('获取历史记录失败:', err);
        return {
            success: false,
            error: err
        };
    }
};
