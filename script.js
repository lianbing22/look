// DOM 元素
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const predictionsEl = document.getElementById('predictions');
const loadingIndicator = document.createElement('div'); // 加载指示器
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const cameraFocus = document.querySelector('.camera-focus');

// 全局变量
let model;
let stream;
let isRunning = false;
let animationId;
let isModelLoading = false;

// 设置参数（可从后台配置）
const settings = {
    detectionThreshold: 0.5,  // 识别阈值
    maxDetections: 10,        // 最大识别数量
    language: 'zh-CN',        // 语言设置
    showBoundingBox: true,    // 显示边界框
    updateInterval: 100       // 更新间隔(ms)
};

// 对象颜色映射
const colorMap = {
    'person': '#FF5733',       // 人 - 红橙色
    'bicycle': '#33FF57',      // 自行车 - 绿色
    'car': '#3357FF',          // 汽车 - 蓝色
    'motorcycle': '#FF33E6',   // 摩托车 - 粉色
    'airplane': '#33FFF3',     // 飞机 - 青色
    'bus': '#FFD433',          // 公交车 - 黄色
    'train': '#9A33FF',        // 火车 - 紫色
    'truck': '#FF9A33',        // 卡车 - 橙色
    'boat': '#33A2FF',         // 船 - 浅蓝色
    'default': '#00C8FF'       // 默认颜色
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
        // 设置加载指示器
        setupLoadingIndicator();
        
        // 启用按钮
        startBtn.disabled = false;
        
        // 加载本地存储的设置
        loadSettings();
        
        // 在后台加载模型，但不阻塞界面
        loadModelInBackground();
        
        // 检查iOS设备
        checkIOSDevice();
    } catch (error) {
        console.error('初始化失败:', error);
        hideLoadingIndicator();
    }
}

// 设置加载指示器
function setupLoadingIndicator() {
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '模型加载中...';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.padding = '15px 20px';
    loadingIndicator.style.borderRadius = '5px';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.style.display = 'none';
    document.body.appendChild(loadingIndicator);
}

// 显示加载指示器
function showLoadingIndicator(message = '模型加载中...') {
    loadingIndicator.innerHTML = message;
    loadingIndicator.style.display = 'block';
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
}

// 后台加载模型
async function loadModelInBackground() {
    try {
        if (!model && !isModelLoading) {
            isModelLoading = true;
            console.log('后台加载COCO-SSD模型...');
            // 这里不显示加载提示，让它在后台静默加载
            model = await cocoSsd.load();
            console.log('模型加载完成');
            isModelLoading = false;
        }
    } catch (error) {
        console.error('模型后台加载失败:', error);
        isModelLoading = false;
    }
}

// 检查iOS设备
function checkIOSDevice() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        console.log('检测到iOS设备，使用特定处理');
        // 为iOS设备添加特定处理
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
    }
}

// 开始摄像头
async function startCamera() {
    try {
        // 获取摄像头流
        const constraints = {
            video: {
                facingMode: 'environment', // 使用后置摄像头
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        console.log('请求摄像头权限...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('摄像头权限已获取');
        
        // 对于iOS设备的特殊处理
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            // 在iOS上，我们可能需要明确设置srcObject
            if ('srcObject' in video) {
                video.srcObject = stream;
            } else {
                // 旧版浏览器回退
                video.src = window.URL.createObjectURL(stream);
            }
        } else {
            video.srcObject = stream;
        }
        
        // 确保视频播放
        video.play().catch(e => console.error('视频播放失败:', e));
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                // 设置画布尺寸与视频相同
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // 确保视频元素填满容器
                video.style.width = '100%';
                video.style.height = 'auto';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                
                console.log(`视频尺寸: ${video.videoWidth}x${video.videoHeight}`);
                resolve();
            };
        });
    } catch (error) {
        console.error('摄像头访问失败:', error);
        
        // 提供更具体的错误信息
        if (error.name === 'NotAllowedError') {
            throw new Error('摄像头访问被拒绝。请在浏览器设置中允许摄像头访问，然后刷新页面。');
        } else if (error.name === 'NotFoundError') {
            throw new Error('找不到摄像头设备。请确保您的设备有可用的摄像头。');
        } else if (error.name === 'NotReadableError') {
            throw new Error('摄像头已被其他应用程序占用。请关闭其他可能使用摄像头的应用，然后刷新页面。');
        } else {
            throw new Error(`无法访问摄像头: ${error.message}。请确保您已授权浏览器使用摄像头。`);
        }
    }
}

// 开始识别
async function startDetection() {
    if (isRunning) return;
    
    try {
        startBtn.disabled = true;
        startBtn.textContent = '正在启动...';
        
        // 清除之前的结果
        predictionsEl.innerHTML = '';
        
        // 重新加载最新设置
        loadSettings();
        console.log('已加载设置:', settings);
        
        // 显示加载提示
        if (!model) {
            showLoadingIndicator('正在加载模型...');
        }
        
        // 确保模型已加载
        if (!model) {
            console.log('开始加载模型...');
            try {
                model = await cocoSsd.load();
                console.log('模型加载完成');
            } catch (modelError) {
                throw new Error(`模型加载失败: ${modelError.message}`);
            }
        }
        
        // 隐藏加载提示，显示摄像头加载提示
        hideLoadingIndicator();
        showLoadingIndicator('正在启动摄像头...');
        
        // 隐藏摄像头占位符
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'none';
        }
        
        // 启动摄像头
        await startCamera();
        hideLoadingIndicator();
        
        // 显示相机聚焦效果
        if (cameraFocus) {
            cameraFocus.style.opacity = '1';
        }
        
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        // 开始检测循环
        console.log('开始物体检测');
        detectObjects();
    } catch (error) {
        console.error('启动失败:', error);
        hideLoadingIndicator();
        
        // 显示摄像头占位符
        if (cameraPlaceholder) {
            cameraPlaceholder.style.display = 'flex';
            const spanElement = cameraPlaceholder.querySelector('span');
            if (spanElement) {
                spanElement.textContent = '启动失败: ' + error.message;
            }
        }
        
        alert(error.message);
        startBtn.disabled = false;
        startBtn.textContent = '开始识别';
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
    
    // 隐藏相机聚焦效果
    if (cameraFocus) {
        cameraFocus.style.opacity = '0';
    }
    
    // 显示摄像头占位符
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'flex';
        const spanElement = cameraPlaceholder.querySelector('span');
        if (spanElement) {
            spanElement.textContent = '准备就绪，点击下方按钮开始';
        }
    }
    
    // 更新状态
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// 物体检测循环
async function detectObjects() {
    if (!isRunning) return;
    
    try {
        // 检查模型是否已加载
        if (!model) {
            console.log('模型未加载，尝试重新加载...');
            model = await cocoSsd.load();
        }
        
        // 检查视频流是否正常
        if (!video.srcObject || !video.srcObject.active) {
            console.log('视频流异常，尝试重新获取...');
            await startCamera();
        }
        
        // 检查视频是否已准备好
        if (video.readyState !== 4) {
            console.log('视频尚未准备好，等待中...');
            setTimeout(() => {
                animationId = requestAnimationFrame(detectObjects);
            }, 500);
            return;
        }
        
        // 确保画布尺寸正确
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log(`调整画布尺寸: ${canvas.width}x${canvas.height}`);
        }
        
        console.log('执行检测...');
        // 执行检测
        const predictions = await model.detect(video, settings.maxDetections);
        console.log('检测结果:', predictions);
        
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
        
        // 尝试恢复三次，如果仍然失败则停止
        if (!window.retryCount) {
            window.retryCount = 1;
        } else {
            window.retryCount++;
        }
        
        if (window.retryCount <= 3) {
            console.log(`尝试恢复 (${window.retryCount}/3)...`);
            
            // 短暂延迟后重试
            setTimeout(() => {
                animationId = requestAnimationFrame(detectObjects);
            }, 1000);
        } else {
            // 重置计数
            window.retryCount = 0;
            stopDetection();
            alert('检测过程中发生错误，已停止识别。请检查网络连接并刷新页面重试。');
        }
    }
}

// 绘制检测结果
function drawPredictions(predictions) {
    // 过滤掉低置信度的预测
    const filteredPredictions = predictions.filter(pred => 
        pred.score >= settings.detectionThreshold
    );
    
    // 遍历检测结果
    filteredPredictions.forEach((prediction, index) => {
        const [x, y, width, height] = prediction.bbox;
        const label = prediction.class;
        const score = Math.round(prediction.score * 100);
        
        // 获取中文标签
        const chineseLabel = labelMap[label] || label;
        
        // 在画布上绘制边界框
        if (settings.showBoundingBox) {
            // 获取物体的颜色
            const color = colorMap[label] || colorMap['default'];
            
            // 绘制边界框
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            // 添加辅助线条效果（角落增强）
            const cornerLength = Math.min(width, height) * 0.2; // 角落长度
            ctx.beginPath();
            
            // 左上角
            ctx.moveTo(x, y + cornerLength);
            ctx.lineTo(x, y);
            ctx.lineTo(x + cornerLength, y);
            
            // 右上角
            ctx.moveTo(x + width - cornerLength, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + cornerLength);
            
            // 右下角
            ctx.moveTo(x + width, y + height - cornerLength);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x + width - cornerLength, y + height);
            
            // 左下角
            ctx.moveTo(x + cornerLength, y + height);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x, y + height - cornerLength);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 设置文本样式
            ctx.font = 'bold 16px Arial';
            const labelText = `${chineseLabel}: ${score}%`;
            const textMetrics = ctx.measureText(labelText);
            const textWidth = textMetrics.width + 20; // 添加一些内边距
            const textHeight = 30;
            
            // 根据物体在画布中的位置调整标签位置
            let textX = x;
            let textY = y - textHeight - 5; // 默认在物体上方
            
            // 检查是否超出顶部边界
            if (textY < 10) {
                textY = y + height + textHeight; // 改为在物体下方显示
            }
            
            // 检查是否超出右侧边界
            if (textX + textWidth > canvas.width) {
                textX = canvas.width - textWidth - 5; // 确保不超出右边界
            }
            
            // 检查是否超出左侧边界
            if (textX < 5) {
                textX = 5; // 确保不超出左边界
            }
            
            // 创建标签背景渐变
            const bgColor = color;
            const gradient = ctx.createLinearGradient(textX, textY, textX + textWidth, textY);
            gradient.addColorStop(0, bgColor + 'DD'); // 半透明
            gradient.addColorStop(1, bgColor + '77'); // 更透明
            
            // 绘制标签背景（带圆角）
            ctx.fillStyle = gradient;
            const radius = 4;
            ctx.beginPath();
            ctx.moveTo(textX + radius, textY);
            ctx.lineTo(textX + textWidth - radius, textY);
            ctx.quadraticCurveTo(textX + textWidth, textY, textX + textWidth, textY + radius);
            ctx.lineTo(textX + textWidth, textY + textHeight - radius);
            ctx.quadraticCurveTo(textX + textWidth, textY + textHeight, textX + textWidth - radius, textY + textHeight);
            ctx.lineTo(textX + radius, textY + textHeight);
            ctx.quadraticCurveTo(textX, textY + textHeight, textX, textY + textHeight - radius);
            ctx.lineTo(textX, textY + radius);
            ctx.quadraticCurveTo(textX, textY, textX + radius, textY);
            ctx.closePath();
            ctx.fill();
            
            // 添加连接线（从物体到标签）
            ctx.beginPath();
            ctx.moveTo(x + width/2, textY < y ? textY + textHeight : textY);
            ctx.lineTo(x + width/2, textY < y ? y : y + height);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 绘制标签文字（白色，带细微阴影效果）
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(labelText, textX + 10, textY + 20);
            
            // 重置阴影效果
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // 更新预测结果列表（使用相同的颜色）
        const predItem = document.createElement('div');
        predItem.className = 'prediction-item';
        predItem.style.borderLeftColor = colorMap[label] || colorMap['default'];
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