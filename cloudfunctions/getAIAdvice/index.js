const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// --- 配置 AI 大模型 API ---
const API_KEY = 'api';

// 【请选择/修改你使用的模型端点和模型名称】
// 例如：DeepSeek API
const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL_NAME = 'deepseek-chat';
// --- 配置结束 ---

exports.main = async (event, context) => {
  const { temp, hum, light, soil, soilTemp, soilEC, soilPH, species, region } = event;

  if (temp === undefined) {
    return {
      success: false,
      advice: '未提供环境数据，无法生成建议。'
    };
  }

  // 构建传给 AI 的系统提示词和用户输入
  const systemPrompt = `你是一个专业的植物养护专家。请根据提供的室内植物生长环境数据（空气温湿度、光照、土壤参数）以及植物品种、所在地区、当前时间，给出专业、针对性的养护建议，指出目前环境中可能存在的问题以及改善建议，并考虑白天和夜晚对光照和温度的不同要求。总字数控制在600字以内。`;

  // 获取当前时间（北京时间 UTC+8）
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const beijingTime = new Date(utcMs + 3600000 * 8);
  const hour = beijingTime.getHours();
  const timeOfDay = (hour >= 6 && hour < 18) ? '白天' : '夜晚';

  const userMessage = `当前的植物环境数据如下：
- 植物种类：${species || '未知'}
- 所在地区：${region || '未知'}
- 当前时间：${hour}点 (${timeOfDay})
- 空气温度：${temp} °C
- 空气湿度：${hum} %
- 光照强度：${light} Lux
- 土壤水分：${soil} %
- 土壤温度：${soilTemp !== undefined ? soilTemp : '--'} °C
- 土壤电导率(EC)：${soilEC !== undefined ? soilEC : '--'}
- 土壤PH值：${soilPH !== undefined ? soilPH : '--'}
请给出当前的养护建议。`;

  try {
    // 调用AI接口
    const response = await axios.post(
      API_URL,
      {
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 700
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    const advice = response.data.choices[0].message.content;

    return {
      success: true,
      advice: advice
    };
  } catch (error) {
    console.error('AI API Request Error:', error);
    return {
      success: false,
      advice: '获取AI建议失败，请检查云函数配置或稍后再试。'
    };
  }
};
