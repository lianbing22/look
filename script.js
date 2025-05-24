// 安全获取DOM元素的工具函数
function $(id) {
    return document.getElementById(id);
}

// DOM元素 - Declare globally, assign in init()
let video;
let canvas;
let ctx;
let startBtn;
let stopBtn;
let saveBtn;
let cameraPlaceholder;
let predictions;
let helpBtn;
let helpOverlay;
let closeHelpBtn;
let historyBtn;
let historyPanel;
let historyCloseBtn;
let saveDialog;
let saveName;
let savePreview;
let cancelSaveBtn;
let confirmSaveBtn;
let historyClearBtn;
let historyContent;

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
    // Assign DOM elements now that DOM is loaded
    video = $('video');
    canvas = $('canvas');
    ctx = canvas && canvas.getContext('2d');
    startBtn = $('startBtn');
    stopBtn = $('stopBtn');
    saveBtn = $('saveBtn');
    cameraPlaceholder = $('cameraPlaceholder');
    predictions = $('predictions');
    helpBtn = $('helpBtn');
    helpOverlay = $('helpOverlay');
    closeHelpBtn = $('closeHelpBtn');
    historyBtn = $('historyBtn');
    historyPanel = $('historyPanel');
    historyCloseBtn = $('historyCloseBtn');
    saveDialog = $('saveDialog');
    saveName = $('saveName');
    savePreview = $('savePreview');
    cancelSaveBtn = $('cancelSaveBtn');
    confirmSaveBtn = $('confirmSaveBtn');
    historyClearBtn = $('historyClearBtn');
    historyContent = $('historyContent');

    console.log('正在初始化应用...');
    
    try {
        // 检查基本元素是否可用
        // Note: The check for video, canvas, ctx availability is now more critical here,
        // as they are assigned just above.
        if (!video || !canvas || !ctx) {
            throw new Error('视频或画布元素不可用，请刷新页面重试');
        }
        
        // 初始化事件监听器
        setupEventListeners();
        
        console.log('正在加载COCO-SSD模型...');
        
        // 检查TensorFlow和COCO-SSD是否可用
        if (typeof cocoSsd === 'undefined') {
            throw new Error('COCO-SSD模型未加载，请检查网络连接后刷新页面');
        }

        // 加载模型
        let modelLoaded = false;
        for (let i = 0; i < 3; i++) {
            try {
                console.log(`Attempting to load COCO-SSD model... Attempt #${i + 1}`);
                model = await cocoSsd.load();
                modelLoaded = true;
                console.log('模型加载成功!');
                break; // Exit loop if successful
            } catch (modelError) {
                console.error(`Model loading attempt #${i + 1} failed:`, modelError);
                if (i < 2) { // If not the last attempt
                    console.log('Waiting 1 second before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    // All retries failed
                    console.error('COCO-SSD model loading failed after 3 attempts.');
                    if (cameraPlaceholder) {
                        cameraPlaceholder.innerHTML = `
                            <div style="color: white; background-color: rgba(220, 53, 69, 0.9); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-weight: bold; margin-bottom: 10px;">AI Model Failed to Load</div>
                                <div style="font-size: 14px;">Could not load the object detection model after multiple attempts. Please check your internet connection and try refreshing the page. If you are on an iOS device, using the Safari browser might help.</div>
                                <button onclick="location.reload()" style="margin-top: 10px; background: rgba(255,255,255,0.3); border: none; color: white; padding: 5px 10px; border-radius: 4px;">Refresh Page</button>
                            </div>
                        `;
                    } else {
                        alert('AI Model Failed to Load. Please check your internet connection and try refreshing the page. If you are on an iOS device, using the Safari browser might help.');
                    }
                    // Re-throw the error to be caught by the outer try...catch or to stop further execution if not caught.
                    // Or simply return to prevent further execution within init if model loading is critical.
                    return; // Stop further initialization if model fails to load
                }
            }
        }

        if (!modelLoaded) {
            // This case should ideally be handled by the error thrown in the loop's final attempt,
            // but as a fallback, ensure we don't proceed.
            console.error('Model was not loaded. Stopping initialization.');
            return;
        }
        
        // 读取本地存储的历史记录
        loadHistoryFromStorage();
        
        // 检查iOS设备并应用专门的修复
        checkIOSAndApplyFix();
        
    } catch (error) { // This is the main try...catch for the init function
        console.error('初始化失败:', error);
        
        // 显示用户友好的错误信息
        // This block handles general errors caught during the init process,
        // excluding the specific "AI Model Failed to Load" which is handled earlier.
        if (cameraPlaceholder) {
            if (!cameraPlaceholder.innerHTML.includes('AI Model Failed to Load')) { // Avoid overwriting specific model load error
                cameraPlaceholder.innerHTML = `
                    <div style="color: white; background-color: rgba(220, 53, 69, 0.9); padding: 15px; border-radius: 8px; text-align: center; max-width: 90%; margin: auto;">
                        <div style="font-weight: bold; margin-bottom: 10px; font-size: 1.1em;">Application Error</div>
                        <div style="font-size: 0.9em; margin-bottom: 15px;">An unexpected error occurred during application startup:</div>
                        <div style="font-size: 0.8em; background-color: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; margin-bottom:15px; word-break: break-word;">${error.message}</div>
                        <button onclick="location.reload()" style="margin-top: 10px; background: rgba(255,255,255,0.3); border: none; color: white; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
                    </div>
                `;
            }
            cameraPlaceholder.style.display = 'flex'; // Ensure it's visible
        } else {
            // Fallback if cameraPlaceholder itself is not available for some reason
            alert('Critical Application Error: ' + error.message);
        }
    }
}

// 检查iOS设备并应用专门的修复
function checkIOSAndApplyFix() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        console.log('检测到iOS设备，应用专门修复...');
        
        // 移除可能存在的多余视频元素
        document.querySelectorAll('video').forEach((v, index) => {
            if (v.id !== 'video') {
                console.log('移除多余视频元素:', v);
                v.parentNode.removeChild(v);
            }
        });
        
        if (video && canvas) {
            // 应用iOS专用样式
            video.style.cssText = `
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                z-index: 1 !important;
                transform: translateZ(0) !important;
            `;
            
            canvas.style.cssText = `
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 2 !important;
                background: transparent !important;
                transform: translateZ(0) !important;
            `;
            
            // 设置视频属性
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('muted', '');
            video.setAttribute('autoplay', '');
        }
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 开始按钮
    if (startBtn) startBtn.addEventListener('click', startDetection);
    
    // 停止按钮
    if (stopBtn) stopBtn.addEventListener('click', stopDetection);
    
    // 保存按钮
    if (saveBtn) saveBtn.addEventListener('click', showSaveDialog);
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('执行页面刷新...');
            
            // 停止所有活动的媒体流
            stopAllMediaStreams();
            
            // 重新加载页面
            window.location.reload();
        });
    }
    
    // 帮助按钮
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            helpOverlay.style.display = 'flex';
        });
    }
    
    // 关闭帮助按钮
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', () => {
            helpOverlay.style.display = 'none';
        });
    }
    
    // 历史记录按钮
    if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (historyPanel) historyPanel.classList.add('active');
        });
    }
    
    // 关闭历史记录按钮
    if (historyCloseBtn) {
        historyCloseBtn.addEventListener('click', () => {
            if (historyPanel) historyPanel.classList.remove('active');
        });
    }
    
    // 取消保存按钮
    if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', () => {
            if (saveDialog) saveDialog.classList.remove('active');
        });
    }
    
    // 确认保存按钮
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', saveDetectionResult);
    
    // 清空历史记录按钮
    if (historyClearBtn) historyClearBtn.addEventListener('click', clearHistory);
}

// 强制更新视频容器样式
function forceUpdateVideoStyles() {
    if (!isStreaming) return;
    
    console.log('强制更新视频样式...');
    
    // 获取元素
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const cameraContainer = document.getElementById('cameraContainer');
    
    // 确保容器样式正确
    cameraContainer.style.cssText += `
        position: relative !important;
        overflow: hidden !important;
        background-color: #000 !important;
        z-index: 1 !important;
    `;
    
    // 确保视频样式正确
    video.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        background-color: #000 !important;
        z-index: 1 !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        border: none !important;
        outline: none !important;
        margin: 0 !important;
        padding: 0 !important;
    `;
    
    // 确保画布样式正确
    canvas.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 2 !important;
        background: transparent !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        border: none !important;
        outline: none !important;
        margin: 0 !important;
        padding: 0 !important;
    `;
    
    // 移除可能干扰的元素
    Array.from(cameraContainer.children).forEach(child => {
        if (child.id !== 'video' && child.id !== 'canvas' && child.id !== 'cameraPlaceholder') {
            child.style.display = 'none';
        }
    });
    
    // 重设画布大小
    canvas.width = video.videoWidth || cameraContainer.offsetWidth;
    canvas.height = video.videoHeight || cameraContainer.offsetHeight;
}

// 停止所有活动的媒体流
function stopAllMediaStreams() {
    // 停止所有视频轨道
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(videoElement => {
        if (videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    });
    
    // 如果有全局stream也停止它
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// 开始检测
async function startDetection() {
    if (isStreaming) return;
    if (!video || !canvas || !ctx) {
        console.error('视频或画布元素不可用');
        alert('视频或画布元素不可用，请刷新页面重试');
        return;
    }
    
    try {
        // 先停止所有现有的媒体流
        stopAllMediaStreams();
        
        // 移除可能存在的额外视频元素
        document.querySelectorAll('video').forEach(v => {
            if (v.id !== 'video' && v.parentNode) {
                v.parentNode.removeChild(v);
            }
        });
        
        // 重置预测结果
        if (predictions) {
            predictions.innerHTML = '';
        }
        currentPredictions = [];
        
        console.log('请求摄像头权限...');
        const initialConstraints = {
            video: {
                facingMode: 'environment', // 优先使用后置摄像头
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        console.log('Attempting getUserMedia with initial constraints:', JSON.stringify(initialConstraints));
        
        try {
            stream = await navigator.mediaDevices.getUserMedia(initialConstraints);
            console.log('Initial getUserMedia attempt succeeded.');
        } catch (cameraError) {
            console.error('Initial getUserMedia attempt failed:', cameraError.name, cameraError.message);
            console.log('Attempting fallback getUserMedia with simpler constraints...');
            const fallbackConstraints = {
                video: true,
                audio: false
            };
            console.log('Attempting getUserMedia with fallback constraints:', JSON.stringify(fallbackConstraints));
            try {
                stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                console.log('Fallback getUserMedia attempt succeeded.');
            } catch (fallbackError) {
                console.error('Fallback getUserMedia attempt failed:', fallbackError.name, fallbackError.message);
                throw fallbackError; // Rethrow to be caught by the outer catch, preserving error.name
            }
        }
        
        // 确保视频元素存在且可用
        if (!video) {
            throw new Error('视频元素不可用');
        }
        
        // 清理可能的旧连接
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
        
        // 设置视频属性
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        
        // 设置视频源
        video.srcObject = stream;
        
        // 等待视频元数据加载
        video.onloadedmetadata = () => {
            console.log('视频元数据已加载, 分辨率:', video.videoWidth, 'x', video.videoHeight);
            
            // 设置画布尺寸与视频一致
            videoWidth = video.videoWidth || 640;
            videoHeight = video.videoHeight || 480;
            
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            
            // 显示视频，隐藏占位符
            if (cameraPlaceholder) {
                cameraPlaceholder.style.display = 'none';
            }
            
            // 更新状态
            isStreaming = true;
            if (startBtn) startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            if (saveBtn) saveBtn.disabled = false;
            
            // 开始检测循环
            detectionInterval = setInterval(detectObjects, settings.detectionInterval);
            
            // 触发开始检测事件 - 用于iOS视频修复
            document.dispatchEvent(new Event('startDetection'));
            
            // 2秒后强制更新视频样式，确保正确显示
            setTimeout(forceUpdateVideoStyles, 2000);
        };
        
        // 添加错误处理
        video.onerror = (e) => {
            console.error('视频加载错误:', e);
            throw new Error('视频加载失败');
        };
        
        // 开始播放视频
        try {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('视频播放失败:', error);
                    alert('视频播放失败: ' + error.message);
                });
            }
        } catch (playError) {
            console.error('视频播放异常:', playError);
        }
        
        // 3秒后再次强制更新样式 - 双重保险
        setTimeout(forceUpdateVideoStyles, 3000);
        
    } catch (error) {
        console.error('启动检测失败:', error.name, error.message);
        let userMessage = `无法访问摄像头: ${error.message}`;

        switch (error.name) {
            case 'NotFoundError':
            case 'DevicesNotFoundError': // Some browsers might use this
                userMessage = "未找到摄像头。请确保摄像头已连接并启用。";
                break;
            case 'NotAllowedError': // Permission denied
            case 'PermissionDeniedError': // Firefox uses this
                userMessage = "摄像头访问被拒绝。请在浏览器设置中允许摄像头权限，然后刷新页面。";
                break;
            case 'NotReadableError': // Hardware error or in use
            case 'TrackStartError': // Another variant
                userMessage = "摄像头正在使用中或访问时发生错误。请尝试关闭其他可能正在使用摄像头的应用程序，或重启浏览器。";
                break;
            case 'OverconstrainedError': // Constraints not met
            case 'ConstraintNotSatisfiedError': // Another variant
                userMessage = "摄像头不支持所请求的设置。正在尝试使用默认设置。"; // This message might appear if the fallback also fails for constraint reasons.
                break;
            case 'SecurityError': // Insecure context (HTTP)
                userMessage = "摄像头访问不安全。请确保页面通过 HTTPS 加载。";
                break;
            case 'TypeError': // Constraints object malformed (developer error, but good to catch)
                userMessage = "请求摄像头权限时发生技术错误。请联系技术支持。";
                console.error("TypeError during getUserMedia. Constraints might be malformed:", error.message)
                break;
            default:
                // Keep the generic message for other errors
                console.log(`Unhandled camera error type: ${error.name}`);
        }
        
        alert(userMessage);
        
        // 恢复状态
        isStreaming = false;
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (saveBtn) saveBtn.disabled = true;
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
        // 首先完全清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 执行预测
        const predictions = await model.detect(video);
        
        // 过滤预测结果
        const filteredPredictions = predictions
            .filter(pred => pred.score >= settings.confidenceThreshold)
            .slice(0, settings.maxDetections);
        
        // 更新当前预测结果
        currentPredictions = filteredPredictions;
        
        // 绘制检测结果 - 只有当有检测结果时才绘制
        if (filteredPredictions.length > 0) {
            drawDetections(filteredPredictions);
        }
        
        // 更新预测结果显示
        updatePredictionsList(filteredPredictions);
        
    } catch (error) {
        console.error('对象检测失败:', error);
        // 再次清空画布以防止错误后的残余显示
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// 绘制检测结果
function drawDetections(predictions) {
    if (!predictions || predictions.length === 0) return;
    
    // 绘制检测框和标签
    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        
        if (settings.showBoxes) {
            // 绘制边界框 - 使用纯色无渐变
            ctx.strokeStyle = '#00c8ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.stroke();
        }
        
        if (settings.showLabels) {
            // 准备标签文本
            const label = getChineseName(prediction.class);
            const score = settings.showScores ? ` ${Math.round(prediction.score * 100)}%` : '';
            const text = label + score;
            
            // 设置文本样式
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.font = '14px Arial, sans-serif';
            
            // 测量文本宽度
            const textWidth = ctx.measureText(text).width;
            const textHeight = 20;
            
            // 绘制标签背景
            ctx.fillRect(x, y - textHeight, textWidth + 10, textHeight);
            
            // 绘制标签文本
            ctx.fillStyle = '#ffffff';
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
    if (!historyContent) {
        console.error("Error: historyContent element not found in loadHistoryFromStorage(). Cannot display history.");
        return;
    }
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
    if (!historyContent) { // Safeguard, though loadHistoryFromStorage will also check
        console.error("Error: historyContent element not found in clearHistory(). Cannot clear history.");
        return;
    }
    if (confirm('确认清空所有历史记录？此操作不可恢复。')) {
        // 清空本地存储中的历史记录
        localStorage.removeItem('detectionHistory');
        
        // 更新历史面板
        loadHistoryFromStorage(); // This will now also have the null check
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

// 页面加载后清理多余的视频元素
window.addEventListener('load', function() {
    console.log('页面完全加载，执行清理操作...');
    
    // 执行清理操作
    setTimeout(function() {
        cleanupVideoElements();
    }, 500);
    
    // 每隔3秒检查并清理一次
    setInterval(cleanupVideoElements, 3000);
});

// 清理多余的视频元素
function cleanupVideoElements() {
    console.log('检查视频元素...');
    
    // 获取所有视频元素
    const videos = document.querySelectorAll('video');
    
    // 如果有多于一个视频元素，移除多余的
    if (videos.length > 1) {
        console.log('发现多余视频元素，数量:', videos.length);
        
        // 只保留id为'video'的元素
        videos.forEach(function(videoElement) {
            if (videoElement.id !== 'video' && videoElement.parentNode) {
                console.log('移除多余视频元素:', videoElement);
                videoElement.parentNode.removeChild(videoElement);
            }
        });
    }
    
    // 确保id为'video'的视频元素存在于正确的容器中
    const mainVideo = document.getElementById('video');
    const cameraContainer = document.getElementById('cameraContainer');
    
    if (mainVideo && cameraContainer) {
        // 检查视频元素是否在正确的容器中
        if (mainVideo.parentNode !== cameraContainer) {
            console.log('视频元素不在正确容器中，重新放置');
            mainVideo.parentNode.removeChild(mainVideo);
            cameraContainer.insertBefore(mainVideo, cameraContainer.firstChild);
        }
    }
} 