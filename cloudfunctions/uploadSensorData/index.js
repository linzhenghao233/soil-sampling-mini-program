const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
    try {
        // 微信云托管HTTP调用的请求体在 event.body 中（如果是字符串需解析）
        let data = event.body;
        if (typeof event.body === 'string') {
            try {
                data = JSON.parse(event.body);
            } catch (e) {
                return { statusCode: 400, body: "Invalid JSON format" };
            }
        } else if (!data) {
            // 如果直接通过云函数调用，参数在 event 中
            data = event;
        }

        // 将 ESP32 传来的字段映射为小程序渲染用的字段
        const record = {
            temp: data.air_temperature ?? 0,
            hum: data.air_humidity ?? 0,
            light: data.light_intensity ?? 0,
            soil: data.soil_moisture ?? 0,
            soilTemp: data.soil_temp ?? 0,
            soilEC: data.soil_ec ?? 0,
            soilPH: data.soil_ph ?? 0,
            soilN: data.soil_n ?? 0,
            soilP: data.soil_p ?? 0,
            soilK: data.soil_k ?? 0,
            timestamp: Date.now() // 使用当前时间戳
        };

        const res = await db.collection('sensor_data').add({
            data: record
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Data uploaded successfully',
                id: res._id
            })
        };
    } catch (error) {
        console.error('上传数据失败', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
