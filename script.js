// DOM元素
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const predictions = document.getElementById('predictions');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const historyCloseBtn = document.getElementById('historyCloseBtn');
const saveDialog = document.getElementById('saveDialog');
const saveName = document.getElementById('saveName');
const savePreview = document.getElementById('savePreview');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');
const historyClearBtn = document.getElementById('historyClearBtn');
const historyContent = document.getElementById('historyContent');

// 全局变量
let model = null;
let isStreaming = false;
let stream = null;
let detectionInterval = null;
let currentPredictions = [];
let videoWidth = 0;
let videoHeight = 0;

// 配置参数
const settings = {
    confidenceThreshold: 0.65,
    maxDetections: 10,
    detectionInterval: 300, // 毫秒
    showBoxes: true,
    showLabels: true,
    showScores: true,
    boxColor: '#00c8ff',
    textColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
};

// 初始化应用
async function init() {
    try {
        // 初始化事件监听器
        setupEventListeners();
        
        console.log('正在加载COCO-SSD模型...');
        
        // 加载模型
        model = await cocoSsd.load();
        
        console.log('模型加载成功!');
        
        // 读取本地存储的历史记录
        loadHistoryFromStorage();
    } catch (error) {
        console.error('初始化失败:', error);
        alert('初始化失败: ' + error.message);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 开始按钮
    startBtn.addEventListener('click', startDetection);
    
    // 停止按钮
    stopBtn.addEventListener('click', stopDetection);
    
    // 保存按钮
    saveBtn.addEventListener('click', showSaveDialog);
    
    // 帮助按钮
    helpBtn.addEventListener('click', () => {
        helpOverlay.style.display = 'flex';
    });
    
    // 关闭帮助按钮
    closeHelpBtn.addEventListener('click', () => {
        helpOverlay.style.display = 'none';
    });
    
    // 历史记录按钮
    historyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        historyPanel.classList.add('active');
    });
    
    // 关闭历史记录按钮
    historyCloseBtn.addEventListener('click', () => {
        historyPanel.classList.remove('active');
    });
    
    // 取消保存按钮
    cancelSaveBtn.addEventListener('click', () => {
        saveDialog.classList.remove('active');
    });
    
    // 确认保存按钮
    confirmSaveBtn.addEventListener('click', saveDetectionResult);
    
    // 清空历史记录按钮
    historyClearBtn.addEventListener('click', clearHistory);
}

// 开始检测
async function startDetection() {
    if (isStreaming) return;
    
    try {
        // 重置预测结果
        predictions.innerHTML = '';
        currentPredictions = [];
        
        // 请求摄像头权限
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // 优先使用后置摄像头
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        // 清理可能的旧连接
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // 设置视频源
        video.srcObject = stream;
        
        // 等待视频元数据加载
        video.onloadedmetadata = () => {
            // 设置画布尺寸与视频一致
            videoWidth = video.videoWidth;
            videoHeight = video.videoHeight;
            
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            
            // 显示视频，隐藏占位符
            cameraPlaceholder.style.display = 'none';
            
            // 更新状态
            isStreaming = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            saveBtn.disabled = false;
            
            // 开始检测循环
            detectionInterval = setInterval(detectObjects, settings.detectionInterval);
        };
        
        // 开始播放视频
        await video.play();
        
    } catch (error) {
        console.error('无法访问摄像头:', error);
        alert('无法访问摄像头: ' + error.message);
    }
}

// 停止检测
function stopDetection() {
    if (!isStreaming) return;
    
    // 清除检测间隔
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // 停止所有视频轨道
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // 清除视频源
    video.srcObject = null;
    
    // 显示占位符
    cameraPlaceholder.style.display = 'flex';
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新状态
    isStreaming = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// 检测对象
async function detectObjects() {
    if (!isStreaming || !model) return;
    
    try {
        // 执行预测
        const predictions = await model.detect(video);
        
        // 过滤预测结果
        const filteredPredictions = predictions
            .filter(pred => pred.score >= settings.confidenceThreshold)
            .slice(0, settings.maxDetections);
        
        // 更新当前预测结果
        currentPredictions = filteredPredictions;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制检测结果
        drawDetections(filteredPredictions);
        
        // 更新预测结果显示
        updatePredictionsList(filteredPredictions);
        
    } catch (error) {
        console.error('对象检测失败:', error);
    }
}

// 绘制检测结果
function drawDetections(predictions) {
    // 绘制检测框和标签
    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        
        if (settings.showBoxes) {
            // 绘制边界框
            ctx.strokeStyle = settings.boxColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }
        
        if (settings.showLabels) {
            // 准备标签文本
            const label = `${getChineseName(prediction.class)}`;
            const score = settings.showScores ? ` ${Math.round(prediction.score * 100)}%` : '';
            const text = label + score;
            
            // 设置文本样式
            ctx.fillStyle = settings.backgroundColor;
            ctx.font = '14px Arial, sans-serif';
            
            // 测量文本宽度
            const textWidth = ctx.measureText(text).width;
            const textHeight = 20;
            
            // 绘制标签背景
            ctx.fillRect(x, y - textHeight, textWidth + 10, textHeight);
            
            // 绘制标签文本
            ctx.fillStyle = settings.textColor;
            ctx.fillText(text, x + 5, y - 5);
        }
    });
}

// 更新预测结果列表
function updatePredictionsList(predictionResults) {
    // 获取预测结果容器
    const predictionsContainer = document.getElementById('predictions');
    
    // 清空之前的结果
    predictionsContainer.innerHTML = '';
    
    // 如果没有检测到物体
    if (predictionResults.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'prediction-item';
        emptyItem.innerText = '暂无检测到的物体，请将摄像头对准物体';
        predictionsContainer.appendChild(emptyItem);
        return;
    }
    
    // 创建检测结果元素
    predictionResults.forEach(prediction => {
        const item = document.createElement('div');
        item.className = 'prediction-item';
        
        // 获取分类图标
        const categoryIcon = getCategoryIcon(prediction.class);
        
        // 创建结果内容
        item.innerHTML = `
            <div class="category-icon">${categoryIcon}</div>
            <div class="prediction-details">
                <div class="prediction-label">${getChineseName(prediction.class)}</div>
                <div class="prediction-score">置信度: ${Math.round(prediction.score * 100)}%</div>
            </div>
        `;
        
        predictionsContainer.appendChild(item);
    });
}

// 获取对象类别图标
function getCategoryIcon(className) {
    // 根据类别返回对应图标
    const categoryIcons = {
        person: '👤',
        bicycle: '🚲',
        car: '🚗',
        motorcycle: '🏍️',
        airplane: '✈️',
        bus: '🚌',
        train: '🚆',
        truck: '🚚',
        boat: '🚢',
        'traffic light': '🚦',
        'fire hydrant': '🧯',
        'stop sign': '🛑',
        'parking meter': '🅿️',
        bench: '🪑',
        bird: '🐦',
        cat: '🐱',
        dog: '🐕',
        horse: '🐎',
        sheep: '🐑',
        cow: '🐄',
        elephant: '🐘',
        bear: '🐻',
        zebra: '🦓',
        giraffe: '🦒',
        backpack: '🎒',
        umbrella: '☂️',
        handbag: '👜',
        tie: '👔',
        suitcase: '🧳',
        frisbee: '🥏',
        skis: '🎿',
        snowboard: '🏂',
        'sports ball': '⚽',
        kite: '🪁',
        'baseball bat': '🏏',
        'baseball glove': '🧤',
        skateboard: '🛹',
        surfboard: '🏄',
        'tennis racket': '🎾',
        bottle: '🍾',
        'wine glass': '🍷',
        cup: '☕',
        fork: '🍴',
        knife: '🔪',
        spoon: '🥄',
        bowl: '🥣',
        banana: '🍌',
        apple: '🍎',
        sandwich: '🥪',
        orange: '🍊',
        broccoli: '🥦',
        carrot: '🥕',
        'hot dog': '🌭',
        pizza: '🍕',
        donut: '🍩',
        cake: '🍰',
        chair: '🪑',
        couch: '🛋️',
        'potted plant': '🪴',
        bed: '🛏️',
        'dining table': '🍽️',
        toilet: '🚽',
        tv: '📺',
        laptop: '💻',
        mouse: '🖱️',
        remote: '🎮',
        keyboard: '⌨️',
        'cell phone': '📱',
        microwave: '🔥',
        oven: '🍳',
        toaster: '🍞',
        sink: '🚰',
        refrigerator: '❄️',
        book: '📚',
        clock: '🕒',
        vase: '🏺',
        scissors: '✂️',
        'teddy bear': '🧸',
        'hair drier': '💨',
        toothbrush: '🪥'
    };
    
    return categoryIcons[className] || '🔍';
}

// 获取类别的中文名称
function getChineseName(className) {
    // 类别的中文映射
    const chineseNames = {
        person: '人',
        bicycle: '自行车',
        car: '汽车',
        motorcycle: '摩托车',
        airplane: '飞机',
        bus: '公交车',
        train: '火车',
        truck: '卡车',
        boat: '船',
        'traffic light': '交通灯',
        'fire hydrant': '消防栓',
        'stop sign': '停止标志',
        'parking meter': '停车计时器',
        bench: '长椅',
        bird: '鸟',
        cat: '猫',
        dog: '狗',
        horse: '马',
        sheep: '羊',
        cow: '牛',
        elephant: '大象',
        bear: '熊',
        zebra: '斑马',
        giraffe: '长颈鹿',
        backpack: '背包',
        umbrella: '雨伞',
        handbag: '手提包',
        tie: '领带',
        suitcase: '行李箱',
        frisbee: '飞盘',
        skis: '滑雪板',
        snowboard: '单板滑雪',
        'sports ball': '运动球',
        kite: '风筝',
        'baseball bat': '棒球棒',
        'baseball glove': '棒球手套',
        skateboard: '滑板',
        surfboard: '冲浪板',
        'tennis racket': '网球拍',
        bottle: '瓶子',
        'wine glass': '酒杯',
        cup: '杯子',
        fork: '叉子',
        knife: '刀',
        spoon: '勺子',
        bowl: '碗',
        banana: '香蕉',
        apple: '苹果',
        sandwich: '三明治',
        orange: '橙子',
        broccoli: '西兰花',
        carrot: '胡萝卜',
        'hot dog': '热狗',
        pizza: '披萨',
        donut: '甜甜圈',
        cake: '蛋糕',
        chair: '椅子',
        couch: '沙发',
        'potted plant': '盆栽',
        bed: '床',
        'dining table': '餐桌',
        toilet: '马桶',
        tv: '电视',
        laptop: '笔记本电脑',
        mouse: '鼠标',
        remote: '遥控器',
        keyboard: '键盘',
        'cell phone': '手机',
        microwave: '微波炉',
        oven: '烤箱',
        toaster: '烤面包机',
        sink: '水槽',
        refrigerator: '冰箱',
        book: '书',
        clock: '时钟',
        vase: '花瓶',
        scissors: '剪刀',
        'teddy bear': '泰迪熊',
        'hair drier': '吹风机',
        toothbrush: '牙刷'
    };
    
    return chineseNames[className] || className;
}

// 显示保存对话框
function showSaveDialog() {
    if (!isStreaming) return;
    
    // 生成预览图
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    
    // 设置预览图
    savePreview.src = tempCanvas.toDataURL('image/jpeg');
    
    // 显示对话框
    saveDialog.classList.add('active');
}

// 保存检测结果
function saveDetectionResult() {
    const name = saveName.value.trim() || '未命名识别 ' + new Date().toLocaleString();
    
    // 创建保存记录
    const record = {
        id: Date.now(),
        name: name,
        timestamp: new Date().toISOString(),
        image: savePreview.src,
        predictions: currentPredictions.map(p => ({
            class: p.class,
            chineseClass: getChineseName(p.class),
            score: p.score
        }))
    };
    
    // 获取现有历史记录
    let history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');
    
    // 添加新记录
    history.unshift(record);
    
    // 限制历史记录数量
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    // 保存到本地存储
    localStorage.setItem('detectionHistory', JSON.stringify(history));
    
    // 更新历史面板
    loadHistoryFromStorage();
    
    // 关闭对话框
    saveDialog.classList.remove('active');
    saveName.value = '';
    
    // 显示成功消息
    alert('识别结果已保存');
}

// 从本地存储加载历史记录
function loadHistoryFromStorage() {
    // 获取历史记录
    const history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');
    
    // 清空历史内容
    historyContent.innerHTML = '';
    
    // 如果没有历史记录
    if (history.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'history-empty';
        emptyMsg.innerText = '暂无保存的识别记录';
        historyContent.appendChild(emptyMsg);
        return;
    }
    
    // 创建历史记录项
    history.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // 获取检测到的物体类别文本
        const objectClasses = record.predictions.map(p => p.chineseClass).join(', ');
        
        // 创建历史记录内容
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-title">${record.name}</div>
                <div class="history-timestamp">${new Date(record.timestamp).toLocaleString()}</div>
            </div>
            <img src="${record.image}" alt="${record.name}" class="history-item-image">
            <div class="history-item-info">检测到的物体: ${objectClasses || '无'}</div>
            <div class="history-item-objects">
                ${record.predictions.map(p => `
                    <span class="history-item-tag">
                        ${p.chineseClass} (${Math.round(p.score * 100)}%)
                    </span>
                `).join('')}
            </div>
            <div class="history-actions">
                <button class="history-action-btn view-btn" data-id="${record.id}">查看</button>
                <button class="history-action-btn delete-btn" data-id="${record.id}">删除</button>
            </div>
        `;
        
        // 添加事件监听器
        historyItem.querySelector('.delete-btn').addEventListener('click', () => {
            deleteHistoryItem(record.id);
        });
        
        historyItem.querySelector('.view-btn').addEventListener('click', () => {
            viewHistoryItem(record);
        });
        
        historyContent.appendChild(historyItem);
    });
}

// 查看历史记录项
function viewHistoryItem(record) {
    // 创建大图查看模态框
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.innerHTML = `
        <div class="history-modal-content">
            <span class="history-modal-close">&times;</span>
            <h3>${record.name}</h3>
            <img src="${record.image}" alt="${record.name}" class="history-modal-image">
            <div class="history-modal-info">
                <p>时间: ${new Date(record.timestamp).toLocaleString()}</p>
                <p>检测到的物体: ${record.predictions.map(p => `${p.chineseClass} (${Math.round(p.score * 100)}%)`).join(', ')}</p>
            </div>
        </div>
    `;
    
    // 添加关闭事件
    modal.querySelector('.history-modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 添加到页面
    document.body.appendChild(modal);
}

// 删除历史记录项
function deleteHistoryItem(id) {
    if (confirm('确认删除此记录？')) {
        // 获取历史记录
        let history = JSON.parse(localStorage.getItem('detectionHistory') || '[]');
        
        // 过滤掉要删除的项
        history = history.filter(item => item.id !== id);
        
        // 保存到本地存储
        localStorage.setItem('detectionHistory', JSON.stringify(history));
        
        // 更新历史面板
        loadHistoryFromStorage();
    }
}

// 清空历史记录
function clearHistory() {
    if (confirm('确认清空所有历史记录？此操作不可恢复。')) {
        // 清空本地存储中的历史记录
        localStorage.removeItem('detectionHistory');
        
        // 更新历史面板
        loadHistoryFromStorage();
    }
}

// 添加帮助样式
document.head.insertAdjacentHTML('beforeend', `
<style>
.history-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
}

.history-modal-content {
    width: 90%;
    max-width: 800px;
    background: #1e293b;
    border-radius: 10px;
    padding: 1.5rem;
    position: relative;
    max-height: 90vh;
    overflow-y: auto;
}

.history-modal-close {
    position: absolute;
    top: 10px;
    right: 15px;
    color: white;
    font-size: 28px;
    cursor: pointer;
}

.history-modal-image {
    width: 100%;
    max-height: 60vh;
    object-fit: contain;
    margin: 1rem 0;
    border-radius: 8px;
}

.history-modal-info {
    color: white;
    line-height: 1.6;
}
</style>
`);

// 启动应用
window.addEventListener('DOMContentLoaded', init); 