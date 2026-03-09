// pages/index/index.js
import * as echarts from '../../components/ec-canvas/echarts';

const db = wx.cloud.database()

Page({
  data: {
    // ---- 新增选项数据 ----
    speciesList: ['发财树', '绿萝', '龟背竹', '君子兰', '吊兰', '多肉植物', '月季', '其他'],
    speciesIndex: 0,
    customSpecies: '', // 当选择其他时用户自定义的物种
    region: ['广东省', '广州市', '天河区'],
    // -----------------------

    currentData: {
      temp: '--',
      hum: '--',
      soil: '--',
      light: '--',
      soilTemp: '--',
      soilEC: '--',
      soilPH: '--'
    },
    updateTime: '--:--',
    aiAdvice: '',
    isAILoading: false,
    ec: {
      lazyLoad: true // 延迟加载，等获取到数据后再初始化
    }
  },

  // ---- 新增：选择器事件处理 ----
  bindSpeciesChange: function (e) {
    if (this.data.speciesIndex == e.detail.value) return; // 防止递归更新循环
    this.setData({
      speciesIndex: e.detail.value,
      customSpecies: '' // 切换选项时清空自定义输入
    });
  },

  bindCustomSpeciesInput: function (e) {
    if (this.data.customSpecies === e.detail.value) return; // 防止输入框重新赋值触发无限回调
    this.setData({
      customSpecies: e.detail.value
    });
  },

  bindRegionChange: function (e) {
    if (this.data.region.join(',') === e.detail.value.join(',')) return; // 防止递归更新循环
    this.setData({
      region: e.detail.value
    });
  },
  // ------------------------------

  onLoad() {
    this.fetchLatestData();
    // 设置定时器，每 10 秒刷新一次数据
    this.timer = setInterval(() => {
      this.fetchLatestData();
      this.initChartWithData(); // 同时刷新图表数据
    }, 10000);
  },

  onReady() {
    this.ecComponent = this.selectComponent('#mychart-dom-line');
    this.initChartWithData();
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  // 获取过去的数据并渲染图表 (ThingSpeak 版)
  initChartWithData() {
    // 你的 ThingSpeak Channel ID
    const channelId = '3069197';
    // 读取数据的 Read API Key
    const readApiKey = '';

    // 获取最近的 24 条记录用于图表展示
    wx.request({
      url: `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=24${readApiKey ? '&api_key=' + readApiKey : ''}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.feeds) {
          const historyData = res.data.feeds;
          this.renderChart(historyData);
        } else {
          // 如果没有数据，传入空数组以防报错
          this.renderChart([]);
        }
      },
      fail: (err) => {
        console.error('获取历史数据失败', err);
        this.renderChart([]);
      }
    });
  },

  renderChart(historyData) {
    if (!this.ecComponent) return;

    // 确保 historyData 是一个数组，哪怕是空的
    const safeData = Array.isArray(historyData) ? historyData : [];

    // 提取时间和温湿度数据
    const categories = safeData.map(item => {
      if (!item || !item.created_at) return '';
      const d = new Date(item.created_at);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    });
    // Field1是空气温度，Field2是空气湿度, Field3是光照强度, Field4是土壤水分
    const temps = safeData.map(item => (item && item.field1) ? parseFloat(item.field1) : 0);
    const hums = safeData.map(item => (item && item.field2) ? parseFloat(item.field2) : 0);
    const lights = safeData.map(item => (item && item.field3) ? parseFloat(item.field3) : 0);
    const soils = safeData.map(item => (item && item.field4) ? parseFloat(item.field4) : 0);

    const option = {
      color: ['#FF5722', '#03A9F4', '#FFC107', '#795548'],
      legend: {
        data: ['空温', '空湿', '光照', '土水'],
        top: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10 }
      },
      grid: {
        left: 30,
        right: 30,
        bottom: 15,
        top: 40,
        containLabel: true
      },
      tooltip: {
        show: true,
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: categories,
        axisLine: { lineStyle: { color: '#999' } }
      },
      yAxis: {
        x: 'center',
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLine: { lineStyle: { color: '#999' } }
      },
      series: [{
        name: '空温',
        type: 'line',
        smooth: true,
        data: temps
      }, {
        name: '空湿',
        type: 'line',
        smooth: true,
        data: hums
      }, {
        name: '光照',
        type: 'line',
        smooth: true,
        data: lights
      }, {
        name: '土水',
        type: 'line',
        smooth: true,
        data: soils
      }]
    };

    // 如果图表实例已经存在，就直接更新数据，不重新初始化页面 DOM
    if (this.chartInstance) {
      this.chartInstance.setOption(option);
    } else {
      // 首次加载初始化
      this.ecComponent.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        chart.setOption(option);
        this.chartInstance = chart; // 保存实例引用用于后续动态刷新
        return chart;
      });
    }
  },

  // 从 ThingSpeak 拉取最新的一条传感器数据
  fetchLatestData() {
    // 你的 ThingSpeak Channel ID (替换成上面的)
    const channelId = '3069197';
    // 读取数据的 Read API Key (如果是 Private Channel 需要带上，Public 的话可以不带，这里暂时留空或填入你的 Read API Key)
    const readApiKey = '';

    wx.request({
      url: `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=1${readApiKey ? '&api_key=' + readApiKey : ''}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.feeds && res.data.feeds.length > 0) {
          const latest = res.data.feeds[0];
          const timeStr = new Date(latest.created_at).toLocaleTimeString();

          this.setData({
            currentData: {
              // 注意检查我们在 ESP32 里约定的 Field 映射顺序
              temp: latest.field1 ? parseFloat(latest.field1).toFixed(1) : '--',
              hum: latest.field2 ? parseFloat(latest.field2).toFixed(1) : '--',
              light: latest.field3 ? parseFloat(latest.field3).toFixed(0) : '--',
              soil: latest.field4 ? parseFloat(latest.field4).toFixed(1) : '--',
              soilTemp: latest.field5 ? parseFloat(latest.field5).toFixed(1) : '--',
              soilEC: latest.field6 ? parseFloat(latest.field6).toFixed(0) : '--',
              soilPH: latest.field7 ? parseFloat(latest.field7).toFixed(1) : '--'
            },
            updateTime: timeStr
          });
        }
      },
      fail: (err) => {
        console.error('获取实时数据失败', err);
      }
    });
  },

  // 调用云函数获取 AI 养护建议
  getAIAdvice() {
    if (this.data.currentData.temp === '--') {
      wx.showToast({ title: '暂无环境数据', icon: 'none' });
      return;
    }

    this.setData({ isAILoading: true });

    // 收集用户最新选择的植物种类和位置
    let selectedSpecies = this.data.speciesList[this.data.speciesIndex];
    if (selectedSpecies === '其他' && this.data.customSpecies.trim() !== '') {
      selectedSpecies = this.data.customSpecies.trim();
    }
    const selectedRegion = this.data.region.join('');

    wx.cloud.callFunction({
      name: 'getAIAdvice',
      data: {
        ...this.data.currentData, // 将当前温湿度和土壤数据传给云函数
        species: selectedSpecies, // 传植物种类
        region: selectedRegion    // 传所在地区
      }
    }).then(res => {
      this.setData({
        aiAdvice: res.result.advice || res.result.error || '获取失败',
        isAILoading: false
      });
    }).catch(err => {
      console.error('AI分析调用失败', err);
      this.setData({
        aiAdvice: '网络开小差了，请检查云端函数配置。',
        isAILoading: false
      });
    });
  }
})