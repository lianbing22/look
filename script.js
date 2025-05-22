// DOM 元素
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const predictionsEl = document.getElementById('predictions');

// 全局变量
let model;
let stream;
let isRunning = false;
let animationId;

// 设置参数（可从后台配置）
const settings = {
    detectionThreshold: 0.5,  // 识别阈值
    maxDetections: 10,        // 最大识别数量
    language: 'zh-CN',        // 语言设置
    showBoundingBox: true,    // 显示边界框
    updateInterval: 100       // 更新间隔(ms)
};

// 中文标签映射（COCO-SSD默认为英文）
const labelMap = {
    'person': '人',
    'bicycle': '自行车',
    'car': '汽车',
    'motorcycle': '摩托车',
    'airplane': '飞机',
    'bus': '公交车',
    'train': '火车',
    'truck': '卡车',
    'boat': '船',
    'traffic light': '交通灯',
    'fire hydrant': '消防栓',
    'stop sign': '停止标志',
    'parking meter': '停车计时器',
    'bench': '长椅',
    'bird': '鸟',
    'cat': '猫',
    'dog': '狗',
    'horse': '马',
    'sheep': '羊',
    'cow': '牛',
    'elephant': '大象',
    'bear': '熊',
    'zebra': '斑马',
    'giraffe': '长颈鹿',
    'backpack': '背包',
    'umbrella': '雨伞',
    'handbag': '手提包',
    'tie': '领带',
    'suitcase': '手提箱',
    'frisbee': '飞盘',
    'skis': '滑雪板',
    'snowboard': '滑雪板',
    'sports ball': '运动球',
    'kite': '风筝',
    'baseball bat': '棒球棒',
    'baseball glove': '棒球手套',
    'skateboard': '滑板',
    'surfboard': '冲浪板',
    'tennis racket': '网球拍',
    'bottle': '瓶子',
    'wine glass': '酒杯',
    'cup': '杯子',
    'fork': '叉子',
    'knife': '刀',
    'spoon': '勺子',
    'bowl': '碗',
    'banana': '香蕉',
    'apple': '苹果',
    'sandwich': '三明治',
    'orange': '橙子',
    'broccoli': '西兰花',
    'carrot': '胡萝卜',
    'hot dog': '热狗',
    'pizza': '披萨',
    'donut': '甜甜圈',
    'cake': '蛋糕',
    'chair': '椅子',
    'couch': '沙发',
    'potted plant': '盆栽',
    'bed': '床',
    'dining table': '餐桌',
    'toilet': '马桶',
    'tv': '电视',
    'laptop': '笔记本电脑',
    'mouse': '鼠标',
    'remote': '遥控器',
    'keyboard': '键盘',
    'cell phone': '手机',
    'microwave': '微波炉',
    'oven': '烤箱',
    'toaster': '烤面包机',
    'sink': '水槽',
    'refrigerator': '冰箱',
    'book': '书',
    'clock': '时钟',
    'vase': '花瓶',
    'scissors': '剪刀',
    'teddy bear': '泰迪熊',
    'hair drier': '吹风机',
    'toothbrush': '牙刷'
};

// 初始化
async function init() {
    try {
        // 加载模型
        console.log('正在加载 COCO-SSD 模型...');
        model = await cocoSsd.load();
        console.log('模型加载完成');
        
        // 启用按钮
        startBtn.disabled = false;
        
        // 加载本地存储的设置
        loadSettings();
    } catch (error) {
        console.error('初始化失败:', error);
        alert('模型加载失败，请检查网络连接并刷新页面重试。');
    }
}

// 开始摄像头
async function startCamera() {
    try {
        // 获取摄像头流
        const constraints = {
            video: {
                facingMode: 'environment', // 使用后置摄像头
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                // 设置画布尺寸与视频相同
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                resolve();
            };
        });
    } catch (error) {
        console.error('摄像头访问失败:', error);
        throw new Error('无法访问摄像头。请确保您已授权浏览器使用摄像头，并且您的设备具有可用的摄像头。');
    }
}

// 开始识别
async function startDetection() {
    if (isRunning) return;
    
    try {
        await startCamera();
        
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        // 开始检测循环
        detectObjects();
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

// 停止识别
function stopDetection() {
    if (!isRunning) return;
    
    // 停止动画
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // 停止视频流
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 清除结果
    predictionsEl.innerHTML = '';
    
    // 更新状态
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// 物体检测循环
async function detectObjects() {
    if (!isRunning) return;
    
    try {
        // 执行检测
        const predictions = await model.detect(video, settings.maxDetections);
        
        // 清除画布和预测结果
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        predictionsEl.innerHTML = '';
        
        // 处理检测结果
        drawPredictions(predictions);
        
        // 定时循环
        setTimeout(() => {
            animationId = requestAnimationFrame(detectObjects);
        }, settings.updateInterval);
    } catch (error) {
        console.error('检测过程中发生错误:', error);
        stopDetection();
        alert('检测过程中发生错误，已停止识别。');
    }
}

// 绘制检测结果
function drawPredictions(predictions) {
    // 过滤掉低置信度的预测
    const filteredPredictions = predictions.filter(pred => 
        pred.score >= settings.detectionThreshold
    );
    
    // 遍历检测结果
    filteredPredictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        const label = prediction.class;
        const score = Math.round(prediction.score * 100);
        
        // 获取中文标签
        const chineseLabel = labelMap[label] || label;
        
        // 在画布上绘制边界框
        if (settings.showBoundingBox) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            
            // 绘制标签背景
            ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
            ctx.fillRect(x, y - 30, 150, 30);
            
            // 绘制标签文字
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText(`${chineseLabel}: ${score}%`, x + 5, y - 10);
        }
        
        // 更新预测结果列表
        const predItem = document.createElement('div');
        predItem.className = 'prediction-item';
        predItem.innerHTML = `<strong>${chineseLabel}</strong>: ${score}%`;
        predictionsEl.appendChild(predItem);
    });
    
    // 显示未检测到物体的消息
    if (filteredPredictions.length === 0) {
        const noPredItem = document.createElement('div');
        noPredItem.className = 'prediction-item';
        noPredItem.innerHTML = '未检测到任何物体';
        predictionsEl.appendChild(noPredItem);
    }
}

// 加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('hengtaiVisionSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            Object.assign(settings, parsedSettings);
        } catch (e) {
            console.error('加载设置失败:', e);
        }
    }
}

// 事件监听器
startBtn.addEventListener('click', startDetection);
stopBtn.addEventListener('click', stopDetection);

// 页面加载完成后初始化
window.addEventListener('load', init); 