// DOM 元素
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const predictionsEl = document.getElementById('predictions');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const cameraFocus = document.querySelector('.camera-focus');

// 创建加载指示器并设置样式
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.style.position = 'absolute';
loadingIndicator.style.top = '50%';
loadingIndicator.style.left = '50%';
loadingIndicator.style.transform = 'translate(-50%, -50%)';
loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
loadingIndicator.style.color = 'white';
loadingIndicator.style.padding = '15px 20px';
loadingIndicator.style.borderRadius = '8px';
loadingIndicator.style.zIndex = '1000';
loadingIndicator.style.textAlign = 'center';
loadingIndicator.style.transition = 'opacity 0.3s ease';
loadingIndicator.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
loadingIndicator.style.fontSize = '14px';
loadingIndicator.style.display = 'none';

// 添加帮助相关元素
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const startTutorialBtn = document.getElementById('startTutorialBtn');

// 添加历史记录相关元素
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const historyCloseBtn = document.getElementById('historyCloseBtn');
const historyContent = document.getElementById('historyContent');
const historyClearBtn = document.getElementById('historyClearBtn');
const saveDialog = document.getElementById('saveDialog');
const savePreview = document.getElementById('savePreview');
const saveName = document.getElementById('saveName');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');

// 全局变量
let model;
let stream;
let isModelLoading = true;
let isDetecting = false;
let detectInterval;
let lastDetectionTime = 0;
let pendingDetection = false;
let animationFrameId = null;
let devicePixelRatio = window.devicePixelRatio || 1;
let pageVisible = true;
let lowBattery = false;
let lowBatteryThreshold = 0.2; // 20%电量阈值
let isReducedFrameRate = false;
let originalUpdateInterval = 100;
let isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// 中文标签映射
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
    'traffic light': '红绿灯',
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
    'suitcase': '行李箱',
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
    'fork': '叉',
    'knife': '刀',
    'spoon': '勺',
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

// 颜色映射
const colorMap = {
    'person': '#FF5733',
    'vehicle': '#33A8FF', // 包括汽车、卡车、自行车等
    'animal': '#33FF57', // 包括猫、狗等
    'food': '#F033FF', // 包括披萨、热狗等
    'furniture': '#FFD700', // 包括椅子、桌子等
    'electronic': '#00FFFF', // 包括手机、电脑等
    'default': '#FFFFFF'
};

// 物体类别分组
const categoryGroups = {
    'vehicle': ['bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat'],
    'animal': ['bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'],
    'food': ['banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake'],
    'furniture': ['chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet'],
    'electronic': ['tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'refrigerator']
};

// 添加设备分辨率检测和处理函数
function detectDeviceCapabilities() {
    // 检测设备类型
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) || 
                    (window.innerWidth >= 768 && window.innerWidth <= 1024);
    const isLandscape = window.innerWidth > window.innerHeight;
    
    // 检测屏幕分辨率
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const screenRatio = screenWidth / screenHeight;
    const isHighDensity = window.devicePixelRatio > 1.5;
    
    // 检测性能级别（简易判断）
    const isLowPerformance = isMobile && !isHighEndMobile();
    
    // 存储设备能力信息
    const deviceCapabilities = {
        isMobile,
        isTablet,
        isLandscape,
        screenWidth,
        screenHeight,
        screenRatio,
        isHighDensity,
        isLowPerformance
    };
    
    console.log('设备能力:', deviceCapabilities);
    
    return deviceCapabilities;
}

// 检测是否是高端移动设备（简易判断，实际可基于更多因素）
function isHighEndMobile() {
    // 使用内存估计判断，8GB以上视为高端
    if (navigator.deviceMemory && navigator.deviceMemory >= 8) {
        return true;
    }
    
    // 使用硬件并发数判断，8核以上视为高端
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 8) {
        return true;
    }
    
    // 使用设备像素比判断，3以上视为高端
    if (window.devicePixelRatio >= 3) {
        return true;
    }
    
    return false;
}

// 基于设备能力调整视频请求参数
function getOptimalVideoConstraints() {
    const capabilities = detectDeviceCapabilities();
    
    // 基于设备类型和性能选择最佳视频设置
    let idealWidth, idealHeight;
    let facingMode = 'environment'; // 默认使用后置摄像头
    
    // iOS设备特殊处理
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (capabilities.isLowPerformance) {
        // 低性能设备使用较低分辨率
        idealWidth = 640;
        idealHeight = 480;
    } else if (capabilities.isTablet) {
        // 平板设备
        idealWidth = 1024;
        idealHeight = 768;
    } else if (!capabilities.isMobile) {
        // 桌面设备
        idealWidth = 1280;
        idealHeight = 720;
    } else {
        // 标准移动设备
        idealWidth = 1280;
        idealHeight = 720;
    }
    
    // 如果是横屏模式，交换宽高
    if (capabilities.isLandscape && capabilities.isMobile) {
        [idealWidth, idealHeight] = [idealHeight, idealWidth];
    }
    
    // iOS设备特殊处理
    if (isIOS) {
        // iOS设备通常更喜欢更简单的约束
        return {
            facingMode: { ideal: 'environment' },
            width: { ideal: idealWidth, max: 1280 },
            height: { ideal: idealHeight, max: 720 }
        };
    }
    
    // Android设备可以接受更具体的约束
    return {
        facingMode: { ideal: facingMode },
        width: { ideal: idealWidth },
        height: { ideal: idealHeight }
    };
}

// 初始化
async function init() {
    // 将加载指示器添加到camera-container中，使其居中显示
    const cameraContainer = document.querySelector('.camera-container');
    if (cameraContainer) {
        cameraContainer.appendChild(loadingIndicator);
    } else {
        document.body.appendChild(loadingIndicator);
    }
    
    loadingIndicator.textContent = '正在加载模型...';
    loadingIndicator.style.display = 'block';
    
    // 初始化设置
    loadSettings();
    
    // 添加窗口大小调整监听器
    window.addEventListener('resize', handleResize);
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 添加设备方向变化监听
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else if (window.orientation !== undefined) {
        window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    // 添加按钮事件监听器
    startBtn.addEventListener('click', startDetection);
    stopBtn.addEventListener('click', stopDetection);
    
    // 监听电池状态（如果浏览器支持）
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            handleBatteryStatus(battery);
            
            // 监听电池状态变化
            battery.addEventListener('levelchange', () => handleBatteryStatus(battery));
            battery.addEventListener('chargingchange', () => handleBatteryStatus(battery));
        } catch (e) {
            console.log('电池API不可用:', e);
        }
    }
    
    // 隐藏相机占位符，初始时显示
    cameraPlaceholder.style.display = 'flex';
    
    try {
        // 后台加载模型
        loadModel();
    } catch (error) {
        console.error('初始化错误:', error);
        loadingIndicator.textContent = '加载失败: ' + error.message;
    }
}

// 加载模型
async function loadModel() {
    try {
        // 显示加载指示器
        loadingIndicator.textContent = '正在加载AI模型...';
        loadingIndicator.style.display = 'block';
        
        console.time('模型加载时间');
        console.log('开始加载COCO-SSD模型...');
        
        // 开始加载模型
        model = await cocoSsd.load();
        
        console.timeEnd('模型加载时间');
        console.log('模型加载完成');
        
        // 更新状态
        isModelLoading = false;
        loadingIndicator.textContent = 'AI模型加载完成，点击按钮开始识别';
        
        // 淡出加载指示器
        setTimeout(() => {
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
                loadingIndicator.style.opacity = '1'; // 重置透明度以便下次显示
            }, 500);
        }, 1500);
        
        return model;
    } catch (error) {
        console.error('模型加载错误:', error);
        
        // 显示错误信息
        loadingIndicator.textContent = '模型加载失败: ' + error.message;
        loadingIndicator.style.backgroundColor = 'rgba(220, 53, 69, 0.9)'; // 红色背景表示错误
        
        // 3秒后隐藏错误信息
        setTimeout(() => {
            loadingIndicator.style.opacity = '0';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
                loadingIndicator.style.opacity = '1';
                loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // 恢复原来的背景色
            }, 500);
        }, 3000);
        
        throw error;
    }
}

// 加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('hengtaiVisionSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            // 应用设置
            applySettings(settings);
        } catch (e) {
            console.error('加载设置失败:', e);
        }
    }
}

// 应用设置
function applySettings(settings) {
    // 这里可以根据需要应用不同的设置
    // 例如设置检测阈值、最大检测数量等
    if (settings) {
        if (settings.detectionThreshold) {
            // 设置检测阈值
        }
        
        if (settings.maxDetections) {
            // 设置最大检测数量
        }
    }
}

// 开始检测 - 更新为使用优化的视频约束
async function startDetection() {
    if (isDetecting) return;
    
    console.log('开始识别流程...');
    
    // 更新UI状态
    startBtn.disabled = true;
    startBtn.textContent = '正在准备...';
    predictionsEl.innerHTML = '';
    
    // 显示加载指示器
    loadingIndicator.textContent = '正在启动摄像头...';
    loadingIndicator.style.display = 'block';
    
    try {
        // 确保模型已加载
        if (!model) {
            loadingIndicator.textContent = '正在加载AI模型，请稍候...';
            await loadModel();
        }
        
        // 清理之前可能存在的视频流
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('停止现有视频轨道:', track.kind);
            });
            stream = null;
            video.srcObject = null;
        }
        
        // 准备视频约束条件
        const constraints = getOptimalVideoConstraints();
        console.log('使用视频约束:', constraints);
        
        // 特殊处理iOS设备
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        
        try {
            // 首先尝试使用指定的约束
            loadingIndicator.textContent = '请求摄像头权限...';
            stream = await navigator.mediaDevices.getUserMedia({
                video: constraints,
                audio: false
            });
            console.log('成功获取视频流，轨道数量:', stream.getVideoTracks().length);
            
            // 检查视频轨道
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const settings = videoTrack.getSettings();
                console.log('视频轨道设置:', settings);
            }
        } catch (initialError) {
            console.warn('使用优化约束获取摄像头失败，尝试备用方法', initialError);
            loadingIndicator.textContent = '摄像头访问失败，尝试备用方法...';
            
            // 如果是iOS设备且初次请求失败，尝试使用简化约束
            if (isIOS) {
                try {
                    // iOS备用方案：使用最简单的约束
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                    console.log('使用简化约束成功获取iOS摄像头');
                } catch (iosError) {
                    throw new Error(`iOS设备摄像头访问失败: ${iosError.message}`);
                }
            } else {
                // 非iOS设备备用方案：尝试只指定后置摄像头
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: 'environment' } },
                        audio: false
                    });
                    console.log('使用基本后置摄像头约束成功');
                } catch (fallbackError) {
                    // 最后尝试最简单的约束
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                    console.log('使用最简单约束成功获取摄像头');
                }
            }
        }
        
        loadingIndicator.textContent = '正在初始化视频流...';
        
        // 连接视频流
        video.srcObject = stream;
        
        // 等待视频准备好
        if (video.readyState === 0) {
            await new Promise(resolve => {
                video.onloadedmetadata = () => {
                    console.log('视频元数据已加载，尺寸:', video.videoWidth, 'x', video.videoHeight);
                    resolve();
                };
                // 设置超时，防止无限等待
                setTimeout(resolve, 2000);
            });
        }
        
        // 确保视频已开始播放
        if (video.paused) {
            try {
                await video.play();
                console.log('视频播放已开始');
            } catch (playError) {
                console.error('视频播放失败:', playError);
                throw new Error(`无法播放视频: ${playError.message}`);
            }
        }
        
        // 隐藏加载指示器
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
            loadingIndicator.style.opacity = '1';
        }, 300);
        
        // 重设画布尺寸
        resizeCanvas();
        
        // 隐藏占位符
        cameraPlaceholder.style.display = 'none';
        
        // 显示对焦框
        cameraFocus.style.display = 'block';
        
        // 启动检测循环
        isDetecting = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        saveBtn.disabled = false; // 启用保存按钮
        startBtn.textContent = '识别中...';
        
        // 加载设置并开始检测循环
        loadSettings();
        startDetectionLoop();
        
        console.log('识别已开始');
        showNotification('已开始物体识别', 'success');
        
    } catch (error) {
        console.error('启动识别失败:', error);
        
        // 隐藏加载指示器
        loadingIndicator.style.opacity = '0';
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
            loadingIndicator.style.opacity = '1';
        }, 300);
        
        startBtn.disabled = false;
        startBtn.textContent = '开始识别';
        
        // 提供更具体的错误信息
        let errorMessage = '无法访问摄像头，请确保已授予权限。';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = '摄像头访问被拒绝。请在浏览器设置中允许摄像头访问，然后刷新页面。';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage = '未检测到摄像头设备。请确保您的设备有可用的摄像头。';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage = '摄像头可能被其他应用程序占用。请关闭其他使用摄像头的应用，然后刷新页面。';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = '您的摄像头不支持请求的分辨率或功能。正在尝试兼容模式...';
            // 这里可以添加自动重试逻辑，使用更简单的约束
            setTimeout(() => {
                startDetection();
            }, 1000);
            return;
        } else if (error.message && error.message.includes('getUserMedia is not implemented')) {
            errorMessage = '您的浏览器不支持摄像头访问。请使用最新版本的Chrome、Firefox或Safari浏览器。';
        }
        
        showNotification(errorMessage, 'error', 5000);
    }
}

// 优化画布大小调整函数
function resizeCanvas() {
    if (!video || !video.videoWidth) {
        console.log('视频尚未准备好，无法调整画布大小');
        return;
    }
    
    // 获取容器尺寸
    const container = document.querySelector('.camera-container');
    if (!container) {
        console.error('未找到相机容器');
        return;
    }
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    console.log(`容器尺寸: ${containerWidth}x${containerHeight}`);
    
    // 计算视频宽高比
    const videoRatio = video.videoWidth / video.videoHeight;
    console.log(`视频分辨率: ${video.videoWidth}x${video.videoHeight}, 比例: ${videoRatio.toFixed(2)}`);
    
    // 调整画布大小以匹配容器
    let canvasWidth, canvasHeight;
    
    if (containerWidth / containerHeight > videoRatio) {
        // 容器更宽，以高度为准
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * videoRatio;
    } else {
        // 容器更高，以宽度为准
        canvasWidth = containerWidth;
        canvasHeight = canvasWidth / videoRatio;
    }
    
    // 设置画布尺寸
    const capabilities = detectDeviceCapabilities();
    const scaleFactor = capabilities.isHighDensity ? Math.min(window.devicePixelRatio, 2) : devicePixelRatio;
    
    // 调整画布大小
    canvas.width = canvasWidth * scaleFactor;
    canvas.height = canvasHeight * scaleFactor;
    
    // 设置画布CSS尺寸
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    // 调整渲染上下文比例
    ctx.scale(scaleFactor, scaleFactor);
    
    console.log(`画布已调整: ${canvasWidth}x${canvasHeight}, 设备像素比: ${scaleFactor}, 实际画布尺寸: ${canvas.width}x${canvas.height}`);
}

// 开始检测循环
function startDetectionLoop(overrideSettings) {
    // 确保不会重复启动检测循环
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // 获取更新间隔设置
    const savedSettings = localStorage.getItem('hengtaiVisionSettings');
    let updateInterval = 100; // 默认值
    
    if (overrideSettings && overrideSettings.updateInterval) {
        // 使用临时覆盖设置
        updateInterval = overrideSettings.updateInterval;
    } else if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            if (settings && settings.updateInterval) {
                updateInterval = settings.updateInterval;
                originalUpdateInterval = updateInterval; // 记录原始设置
            }
        } catch (e) {
            console.error('读取设置失败:', e);
        }
    }
    
    console.log('开始检测循环，更新间隔:', updateInterval, 'ms');
    
    // 如果低电量且是移动设备，增加间隔减少耗电
    if (lowBattery && isMobileDevice && !isReducedFrameRate) {
        updateInterval = Math.min(updateInterval * 2, 1000);
        isReducedFrameRate = true;
    }
    
    // 重置检测计时器
    lastDetectionTime = 0;
    pendingDetection = false;
    
    // 使用requestAnimationFrame进行高效渲染
    function detectFrame(timestamp) {
        if (!isDetecting || !pageVisible) return;
        
        // 每帧绘制视频
        drawVideoFrame();
        
        // 根据时间间隔执行检测
        if (!pendingDetection && (timestamp - lastDetectionTime >= updateInterval || lastDetectionTime === 0)) {
            pendingDetection = true;
            lastDetectionTime = timestamp;
            
            // 异步执行物体检测
            detectObjects()
                .then(() => {
                    pendingDetection = false;
                })
                .catch(error => {
                    pendingDetection = false;
                    console.error('检测过程出错:', error);
                });
        }
        
        // 如果仍在检测状态，则请求下一帧
        if (isDetecting) {
            animationFrameId = requestAnimationFrame(detectFrame);
        }
    }
    
    // 开始循环
    animationFrameId = requestAnimationFrame(detectFrame);
}

// 绘制视频帧到画布
function drawVideoFrame() {
    // 绘制视频帧，确保不会重复绘制
    if (!isDetecting) return;
    
    if (!video || !video.videoWidth || !video.videoHeight) {
        return;
    }
    
    if (video.paused || video.ended) {
        return;
    }
    
    if (!ctx) {
        console.error('未找到画布上下文');
        return;
    }
    
    const containerWidth = canvas.width / devicePixelRatio;
    const containerHeight = canvas.height / devicePixelRatio;
    
    // 清除画布
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    // 在画布上绘制视频帧
    try {
        // 简单绘制整个视频帧，不添加任何分屏效果
        ctx.drawImage(
            video,
            0, 0, video.videoWidth, video.videoHeight,
            0, 0, containerWidth, containerHeight
        );
    } catch (error) {
        console.error('绘制视频帧失败:', error);
    }
}

// 检测物体
async function detectObjects() {
    if (!model) {
        console.warn('模型尚未加载，跳过检测');
        return [];
    }
    
    if (!video.readyState || video.readyState < 2) {
        console.warn('视频尚未准备好，跳过检测');
        return [];
    }
    
    if (video.paused || video.ended) {
        console.warn('视频已暂停或结束，跳过检测');
        return [];
    }
    
    try {
        // 获取设置
        let threshold = 0.5; // 默认阈值
        let maxDetections = 10; // 默认最大检测数量
        let showBoundingBox = true; // 默认显示边界框
        
        const savedSettings = localStorage.getItem('hengtaiVisionSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings) {
                    threshold = settings.detectionThreshold || threshold;
                    maxDetections = settings.maxDetections || maxDetections;
                    showBoundingBox = settings.showBoundingBox !== undefined ? 
                                     settings.showBoundingBox : showBoundingBox;
                }
            } catch (e) {
                console.error('读取设置失败:', e);
            }
        }
        
        // 执行检测
        console.log('执行物体检测...');
        const predictions = await model.detect(video);
        
        if (predictions && predictions.length > 0) {
            console.log(`检测到 ${predictions.length} 个物体:`);
            predictions.forEach((pred, idx) => {
                console.log(`${idx+1}. ${pred.class} (${Math.round(pred.score*100)}%) - 位置: [${pred.bbox.join(', ')}]`);
            });
        } else {
            console.log('未检测到任何物体');
        }
        
        // 过滤低置信度结果和限制数量
        const filteredPredictions = predictions
            .filter(prediction => prediction.score >= threshold)
            .slice(0, maxDetections);
        
        // 绘制检测结果
        if (showBoundingBox) {
            drawPredictions(filteredPredictions);
        }
        
        // 更新结果列表
        updatePredictionsList(filteredPredictions);
        
        return filteredPredictions;
    } catch (error) {
        console.error('检测错误:', error);
        return [];
    }
}

// 绘制预测结果
function drawPredictions(predictions) {
    // 确保先完全清除画布，避免叠加绘制
    const canvasWidth = canvas.width / devicePixelRatio;
    const canvasHeight = canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 重新绘制视频帧
    if (video && video.readyState >= 2 && !video.paused && !video.ended) {
        try {
            ctx.drawImage(
                video,
                0, 0, video.videoWidth, video.videoHeight,
                0, 0, canvasWidth, canvasHeight
            );
        } catch (error) {
            console.error('绘制视频帧失败:', error);
        }
    }
    
    // 没有预测结果时直接返回
    if (!predictions || predictions.length === 0) {
        return;
    }
    
    // 计算视频和画布实际尺寸比例
    const videoRatio = video.videoWidth / video.videoHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    
    // 计算视频在画布中的实际显示尺寸和位置
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (videoRatio > canvasRatio) {
        // 视频更宽，两侧有黑边
        drawHeight = canvasHeight;
        drawWidth = drawHeight * videoRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
    } else {
        // 视频更高，上下有黑边
        drawWidth = canvasWidth;
        drawHeight = drawWidth / videoRatio;
        offsetY = (canvasHeight - drawHeight) / 2;
    }
    
    // 计算缩放比例
    const scaleX = drawWidth / video.videoWidth;
    const scaleY = drawHeight / video.videoHeight;
    
    // 绘制每个预测结果
    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        const label = prediction.class;
        const score = Math.round(prediction.score * 100);
        
        // 计算缩放后的坐标和尺寸（考虑偏移量）
        const scaledX = x * scaleX + offsetX;
        const scaledY = y * scaleY + offsetY;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;
        
        // 确定颜色
        let color = colorMap.default;
        // 检查物体类别属于哪个组
        for (const category in categoryGroups) {
            if (categoryGroups[category].includes(label)) {
                color = colorMap[category];
                break;
            }
        }
        
        // 如果是人，直接使用人的颜色
        if (label === 'person') {
            color = colorMap.person;
        }
        
        // 设置边界框样式
        ctx.strokeStyle = color;
        ctx.lineWidth = 3; // 加粗线条
        
        // 绘制边界框
        ctx.beginPath();
        ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
        ctx.stroke();
        
        // 创建标签背景
        const chineseLabel = labelMap[label] || label;
        const labelText = `${chineseLabel} ${score}%`;
        
        // 设置文本样式并测量文本宽度
        ctx.font = 'bold 14px Arial, PingFang SC, Microsoft YaHei';
        const textMetrics = ctx.measureText(labelText);
        const labelWidth = textMetrics.width + 10;
        const labelHeight = 24;
        
        // 绘制标签背景
        ctx.fillStyle = color;
        ctx.fillRect(scaledX, scaledY - labelHeight, labelWidth, labelHeight);
        
        // 设置文本样式
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'middle';
        
        // 绘制标签文本
        ctx.fillText(labelText, scaledX + 5, scaledY - labelHeight / 2);
    });
}

// 更新预测结果列表
function updatePredictionsList(predictions) {
    // 清除旧结果
    predictionsEl.innerHTML = '';
    
    if (predictions.length === 0) {
        predictionsEl.innerHTML = '<div class="no-predictions">未检测到物体</div>';
        return;
    }
    
    // 创建新结果项
    predictions.forEach(prediction => {
        const label = prediction.class;
        const score = Math.round(prediction.score * 100);
        const chineseLabel = labelMap[label] || label;
        
        // 确定颜色
        let color = colorMap.default;
        let category = 'default';
        
        // 检查物体类别属于哪个组
        for (const cat in categoryGroups) {
            if (categoryGroups[cat].includes(label)) {
                color = colorMap[cat];
                category = cat;
                break;
            }
        }
        
        // 如果是人，直接使用人的颜色和类别
        if (label === 'person') {
            color = colorMap.person;
            category = 'person';
        }
        
        // 创建结果项元素
        const predictionItem = document.createElement('div');
        predictionItem.className = 'prediction-item';
        predictionItem.style.borderLeftColor = color;
        
        // 添加分类图标
        let categoryIcon = '';
        switch (category) {
            case 'person':
                categoryIcon = '<i class="category-icon">👤</i>';
                break;
            case 'vehicle':
                categoryIcon = '<i class="category-icon">🚗</i>';
                break;
            case 'animal':
                categoryIcon = '<i class="category-icon">🐾</i>';
                break;
            case 'food':
                categoryIcon = '<i class="category-icon">🍔</i>';
                break;
            case 'furniture':
                categoryIcon = '<i class="category-icon">🪑</i>';
                break;
            case 'electronic':
                categoryIcon = '<i class="category-icon">💻</i>';
                break;
            default:
                categoryIcon = '<i class="category-icon">📦</i>';
        }
        
        // 设置HTML内容
        predictionItem.innerHTML = `
            ${categoryIcon}
            <div class="prediction-details">
                <div class="prediction-label">${chineseLabel}</div>
                <div class="prediction-score">置信度: ${score}%</div>
            </div>
        `;
        
        // 添加到结果列表
        predictionsEl.appendChild(predictionItem);
    });
}

// 停止检测
function stopDetection() {
    // 先设置状态，防止新的检测循环开始
    isDetecting = false;
    
    // 取消动画帧
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // 关闭摄像头
    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
            console.log('已停止视频轨道:', track.kind);
        });
        stream = null;
    }
    
    // 清除视频源
    if (video) {
        video.srcObject = null;
        video.load(); // 强制重置视频元素
    }
    
    // 完全清除画布
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // 显示相机占位符
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = 'flex';
    }
    
    // 隐藏对焦框
    if (cameraFocus) {
        cameraFocus.style.display = 'none';
    }
    
    // 重置按钮状态
    startBtn.disabled = false;
    startBtn.textContent = '开始识别';
    stopBtn.disabled = true;
    saveBtn.disabled = true;
    
    // 清除结果列表
    if (predictionsEl) {
        predictionsEl.innerHTML = '';
    }
    
    console.log('检测已停止，所有资源已释放');
    showNotification('识别已停止', 'info');
}

// 帮助按钮点击事件
if (helpBtn) {
    helpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showHelp();
    });
}

// 关闭帮助按钮点击事件
if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', function() {
        hideHelp();
    });
}

// 查看教程按钮点击事件
if (startTutorialBtn) {
    startTutorialBtn.addEventListener('click', function() {
        // 可以跳转到详细教程页面，或者展示更多教程内容
        hideHelp();
        alert('详细教程正在开发中，敬请期待！');
    });
}

// 点击覆盖层背景关闭帮助（但点击内容区域不关闭）
if (helpOverlay) {
    helpOverlay.addEventListener('click', function(e) {
        if (e.target === helpOverlay) {
            hideHelp();
        }
    });
}

// ESC键关闭帮助
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && helpOverlay && helpOverlay.classList.contains('active')) {
        hideHelp();
    }
});

// 显示帮助覆盖层
function showHelp() {
    if (helpOverlay) {
        helpOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
}

// 隐藏帮助覆盖层
function hideHelp() {
    if (helpOverlay) {
        helpOverlay.classList.remove('active');
        document.body.style.overflow = ''; // 恢复背景滚动
    }
}

// 首次访问自动显示帮助（可选，取消注释启用）
/*
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是首次访问
    const hasVisitedBefore = localStorage.getItem('hengtaiVisionHasVisited');
    
    if (!hasVisitedBefore) {
        // 标记为已访问
        localStorage.setItem('hengtaiVisionHasVisited', 'true');
        
        // 延迟显示帮助，让页面先加载完成
        setTimeout(showHelp, 1000);
    }
});
*/

// 页面加载完成后初始化
window.addEventListener('load', init);

// 处理电池状态
function handleBatteryStatus(battery) {
    const wasPreviouslyLowBattery = lowBattery;
    
    // 如果电量低于阈值且未充电，则进入低电量模式
    lowBattery = battery.level < lowBatteryThreshold && !battery.charging;
    
    // 如果低电量状态改变且正在检测，调整性能设置
    if (wasPreviouslyLowBattery !== lowBattery && isDetecting) {
        if (lowBattery) {
            enterLowPowerMode();
        } else {
            exitLowPowerMode();
        }
    }
    
    console.log(`电池状态: ${Math.round(battery.level * 100)}%, 充电中: ${battery.charging}`);
    console.log(`低电量模式: ${lowBattery ? '已启用' : '已禁用'}`);
}

// 进入低电量模式
function enterLowPowerMode() {
    if (!isReducedFrameRate) {
        isReducedFrameRate = true;
        
        // 获取当前更新间隔
        const savedSettings = localStorage.getItem('hengtaiVisionSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.updateInterval) {
                    originalUpdateInterval = settings.updateInterval;
                }
            } catch (e) {
                console.error('读取设置失败:', e);
            }
        }
        
        // 如果正在检测，通知用户
        if (isDetecting) {
            // 创建通知元素
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = '低电量模式已启用，帧率已降低以节省电量';
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.padding = '10px 20px';
            notification.style.background = 'rgba(255, 159, 10, 0.95)';
            notification.style.color = 'white';
            notification.style.borderRadius = '8px';
            notification.style.zIndex = '1000';
            
            // 添加到文档
            document.body.appendChild(notification);
            
            // 2秒后移除
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 2000);
        }
        
        // 调整检测间隔为原来的2倍
        const newInterval = Math.min(originalUpdateInterval * 2, 1000);
        
        // 临时修改设置
        const tempSettings = { updateInterval: newInterval };
        
        // 应用临时设置
        if (isDetecting) {
            // 停止当前检测循环
            cancelAnimationFrame(animationFrameId);
            
            // 使用新设置重新开始检测循环
            startDetectionLoop(tempSettings);
        }
    }
}

// 退出低电量模式
function exitLowPowerMode() {
    if (isReducedFrameRate) {
        isReducedFrameRate = false;
        
        // 如果正在检测，恢复原来的帧率
        if (isDetecting) {
            // 停止当前检测循环
            cancelAnimationFrame(animationFrameId);
            
            // 使用原始设置重新开始检测循环
            const tempSettings = { updateInterval: originalUpdateInterval };
            startDetectionLoop(tempSettings);
            
            // 通知用户
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = '已退出低电量模式，帧率已恢复';
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.padding = '10px 20px';
            notification.style.background = 'rgba(52, 199, 89, 0.95)';
            notification.style.color = 'white';
            notification.style.borderRadius = '8px';
            notification.style.zIndex = '1000';
            
            // 添加到文档
            document.body.appendChild(notification);
            
            // 2秒后移除
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 2000);
        }
    }
}

// 处理页面可见性变化
function handleVisibilityChange() {
    pageVisible = document.visibilityState === 'visible';
    
    if (isDetecting) {
        if (!pageVisible) {
            // 页面不可见时暂停检测
            pauseDetection();
        } else {
            // 页面可见时恢复检测
            resumeDetection();
        }
    }
}

// 暂停检测
function pauseDetection() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    console.log('检测已暂停（页面不可见）');
}

// 恢复检测
function resumeDetection() {
    if (!animationFrameId && isDetecting) {
        startDetectionLoop();
        console.log('检测已恢复（页面可见）');
    }
}

// 处理设备方向变化
function handleOrientationChange() {
    // 方向变化时重新调整画布大小
    setTimeout(resizeCanvas, 300); // 延迟一点以等待方向变化完成
}

// 更新窗口大小调整处理函数
function handleResize() {
    // 检测设备方向变化
    const newIsLandscape = window.innerWidth > window.innerHeight;
    const oldCapabilities = detectDeviceCapabilities();
    
    // 如果是移动设备且方向发生变化，可能需要重新启动视频
    if (oldCapabilities.isMobile && newIsLandscape !== oldCapabilities.isLandscape && isDetecting) {
        // 如果正在检测，先停止当前视频流
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // 延迟一点以等待方向变化完成
        setTimeout(() => {
            // 重新开始检测
            startDetection();
        }, 500);
        return;
    }
    
    // 大小变化时重新调整画布大小
    resizeCanvas();
    
    // 如果是移动设备，降低暂时性的UI更新频率
    if (oldCapabilities.isMobile && isDetecting) {
        // 暂停检测以减少负载
        let wasPaused = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            wasPaused = true;
        }
        
        // 短暂延迟后恢复检测
        if (wasPaused) {
            setTimeout(() => {
                if (isDetecting && !animationFrameId) {
                    startDetectionLoop();
                }
            }, 500);
        }
    }
}

// 添加保存按钮事件监听
if (saveBtn) {
    saveBtn.addEventListener('click', function() {
        if (isDetecting) {
            prepareSaveResult();
        }
    });
}

// 准备保存识别结果
function prepareSaveResult() {
    // 捕获当前画面和识别结果
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = canvas.width;
    captureCanvas.height = canvas.height;
    const captureCtx = captureCanvas.getContext('2d');
    
    // 绘制当前画布内容到捕获画布
    captureCtx.drawImage(canvas, 0, 0);
    
    // 获取图像数据URL
    const imageDataURL = captureCanvas.toDataURL('image/jpeg');
    
    // 设置预览图像
    savePreview.src = imageDataURL;
    
    // 获取当前识别的物体
    const detectedObjects = [];
    const predictionItems = document.querySelectorAll('.prediction-item');
    
    predictionItems.forEach(item => {
        const label = item.querySelector('.prediction-label').textContent;
        const score = item.querySelector('.prediction-score').textContent;
        detectedObjects.push({ label, score });
    });
    
    // 设置默认名称
    const now = new Date();
    const defaultName = `识别结果_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    saveName.value = defaultName;
    
    // 临时存储当前识别数据
    saveDialog.dataset.imageData = imageDataURL;
    saveDialog.dataset.detectedObjects = JSON.stringify(detectedObjects);
    saveDialog.dataset.timestamp = now.toISOString();
    
    // 显示保存对话框
    saveDialog.classList.add('active');
}

// 保存识别结果
function saveResult() {
    const name = saveName.value.trim() || '未命名结果';
    const imageData = saveDialog.dataset.imageData;
    const detectedObjects = JSON.parse(saveDialog.dataset.detectedObjects || '[]');
    const timestamp = saveDialog.dataset.timestamp;
    
    // 创建结果对象
    const resultItem = {
        id: generateUniqueId(),
        name,
        imageData,
        detectedObjects,
        timestamp,
        objectCount: detectedObjects.length
    };
    
    // 保存到本地存储
    saveToHistory(resultItem);
    
    // 关闭对话框
    saveDialog.classList.remove('active');
    
    // 显示成功通知
    showNotification('识别结果已保存', 'success');
}

// 生成唯一ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 保存到历史记录
function saveToHistory(item) {
    // 从本地存储获取历史记录
    let historyItems = getHistoryItems();
    
    // 添加新项到历史记录
    historyItems.unshift(item);
    
    // 限制历史记录数量（最多保存20条）
    if (historyItems.length > 20) {
        historyItems = historyItems.slice(0, 20);
    }
    
    // 保存回本地存储
    localStorage.setItem('hengtaiVisionHistory', JSON.stringify(historyItems));
    
    // 如果历史面板是打开的，更新显示
    if (historyPanel.classList.contains('active')) {
        updateHistoryPanel();
    }
}

// 获取历史记录项
function getHistoryItems() {
    const historyStr = localStorage.getItem('hengtaiVisionHistory');
    return historyStr ? JSON.parse(historyStr) : [];
}

// 显示历史记录面板
function showHistoryPanel() {
    updateHistoryPanel();
    historyPanel.classList.add('active');
    
    // 添加点击外部关闭功能
    document.addEventListener('click', handleOutsideHistoryClick);
}

// 更新历史记录面板
function updateHistoryPanel() {
    const historyItems = getHistoryItems();
    
    // 清空现有内容
    historyContent.innerHTML = '';
    
    if (historyItems.length === 0) {
        // 如果没有历史记录，显示空状态
        const emptyEl = document.createElement('div');
        emptyEl.className = 'history-empty';
        emptyEl.textContent = '暂无保存的识别记录';
        historyContent.appendChild(emptyEl);
    } else {
        // 创建历史记录项
        historyItems.forEach(item => {
            const historyItemEl = createHistoryItemElement(item);
            historyContent.appendChild(historyItemEl);
        });
    }
}

// 创建历史记录项元素
function createHistoryItemElement(item) {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.dataset.id = item.id;
    
    // 创建标题和时间戳
    const header = document.createElement('div');
    header.className = 'history-item-header';
    
    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = item.name;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'history-timestamp';
    timestamp.textContent = formatTimestamp(item.timestamp);
    
    header.appendChild(title);
    header.appendChild(timestamp);
    
    // 创建图像
    const image = document.createElement('img');
    image.className = 'history-item-image';
    image.src = item.imageData;
    image.alt = item.name;
    
    // 创建信息
    const info = document.createElement('div');
    info.className = 'history-item-info';
    info.textContent = `检测到 ${item.objectCount} 个物体`;
    
    // 创建标签容器
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'history-item-objects';
    
    // 添加唯一标签（避免重复）
    const uniqueLabels = new Set();
    item.detectedObjects.forEach(obj => {
        uniqueLabels.add(obj.label);
    });
    
    // 最多显示5个标签
    let tagCount = 0;
    uniqueLabels.forEach(label => {
        if (tagCount < 5) {
            const tag = document.createElement('span');
            tag.className = 'history-item-tag';
            tag.textContent = label;
            tagsContainer.appendChild(tag);
            tagCount++;
        }
    });
    
    // 如果有更多标签，显示+N
    if (uniqueLabels.size > 5) {
        const moreTag = document.createElement('span');
        moreTag.className = 'history-item-tag';
        moreTag.textContent = `+${uniqueLabels.size - 5}`;
        tagsContainer.appendChild(moreTag);
    }
    
    // 创建操作按钮
    const actions = document.createElement('div');
    actions.className = 'history-actions';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'history-action-btn view';
    viewBtn.textContent = '查看详情';
    viewBtn.addEventListener('click', () => viewHistoryItem(item.id));
    
    const shareBtn = document.createElement('button');
    shareBtn.className = 'history-action-btn share';
    shareBtn.textContent = '分享';
    shareBtn.addEventListener('click', () => shareHistoryItem(item.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'history-action-btn delete';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => deleteHistoryItem(item.id));
    
    actions.appendChild(viewBtn);
    actions.appendChild(shareBtn);
    actions.appendChild(deleteBtn);
    
    // 组装元素
    el.appendChild(header);
    el.appendChild(image);
    el.appendChild(info);
    el.appendChild(tagsContainer);
    el.appendChild(actions);
    
    return el;
}

// 格式化时间戳
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 查看历史记录项
function viewHistoryItem(id) {
    const historyItems = getHistoryItems();
    const item = historyItems.find(item => item.id === id);
    
    if (!item) return;
    
    // 创建弹窗内容
    const detailDialog = document.createElement('div');
    detailDialog.className = 'save-dialog active';
    
    const content = document.createElement('div');
    content.className = 'save-dialog-content';
    content.style.maxWidth = '700px';
    
    const title = document.createElement('h3');
    title.textContent = item.name;
    
    const image = document.createElement('img');
    image.className = 'save-preview';
    image.style.height = '300px';
    image.src = item.imageData;
    
    const objectsTitle = document.createElement('h4');
    objectsTitle.textContent = '识别结果';
    objectsTitle.style.color = 'var(--text-light)';
    objectsTitle.style.marginTop = '1rem';
    
    const objectsList = document.createElement('div');
    objectsList.style.maxHeight = '200px';
    objectsList.style.overflowY = 'auto';
    objectsList.style.background = 'rgba(15, 23, 42, 0.5)';
    objectsList.style.padding = '0.8rem';
    objectsList.style.borderRadius = '6px';
    
    // 添加对象列表
    item.detectedObjects.forEach(obj => {
        const objItem = document.createElement('div');
        objItem.style.display = 'flex';
        objItem.style.justifyContent = 'space-between';
        objItem.style.padding = '0.5rem 0';
        objItem.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        
        const label = document.createElement('div');
        label.textContent = obj.label;
        
        const score = document.createElement('div');
        score.textContent = obj.score;
        
        objItem.appendChild(label);
        objItem.appendChild(score);
        objectsList.appendChild(objItem);
    });
    
    const timestamp = document.createElement('div');
    timestamp.style.marginTop = '1rem';
    timestamp.style.color = 'rgba(255, 255, 255, 0.6)';
    timestamp.style.fontSize = '0.9rem';
    timestamp.textContent = `保存时间: ${formatTimestamp(item.timestamp)}`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'save-dialog-btn cancel';
    closeBtn.textContent = '关闭';
    closeBtn.style.marginTop = '1.5rem';
    
    // 点击关闭
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(detailDialog);
    });
    
    // 点击背景关闭
    detailDialog.addEventListener('click', (e) => {
        if (e.target === detailDialog) {
            document.body.removeChild(detailDialog);
        }
    });
    
    // 组装内容
    content.appendChild(title);
    content.appendChild(image);
    content.appendChild(objectsTitle);
    content.appendChild(objectsList);
    content.appendChild(timestamp);
    content.appendChild(closeBtn);
    
    detailDialog.appendChild(content);
    document.body.appendChild(detailDialog);
}

// 分享历史记录项
function shareHistoryItem(id) {
    const historyItems = getHistoryItems();
    const item = historyItems.find(item => item.id === id);
    
    if (!item) return;
    
    // 检查是否支持Web Share API
    if (navigator.share) {
        try {
            // 转换图像为Blob
            fetch(item.imageData)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `${item.name}.jpg`, { type: 'image/jpeg' });
                    
                    // 分享文本和图像
                    navigator.share({
                        title: '恒泰视觉AI识别结果',
                        text: `我用恒泰视觉AI识别系统识别了${item.objectCount}个物体: ${item.detectedObjects.map(o => o.label).join(', ')}`,
                        files: [file]
                    }).then(() => {
                        console.log('分享成功');
                    }).catch(err => {
                        console.error('分享失败:', err);
                        showFallbackShare(item);
                    });
                });
        } catch (err) {
            console.error('无法分享:', err);
            showFallbackShare(item);
        }
    } else {
        // 不支持Web Share API，使用备用方法
        showFallbackShare(item);
    }
}

// 备用分享方法
function showFallbackShare(item) {
    // 创建一个临时下载链接
    const a = document.createElement('a');
    a.href = item.imageData;
    a.download = `${item.name}.jpg`;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // 触发下载
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        
        // 显示提示
        showNotification('图像已下载，您可以手动分享它', 'info', 3000);
    }, 100);
}

// 删除历史记录项
function deleteHistoryItem(id) {
    // 获取历史记录
    let historyItems = getHistoryItems();
    
    // 找到要删除的项的索引
    const index = historyItems.findIndex(item => item.id === id);
    
    if (index !== -1) {
        // 从数组中移除
        historyItems.splice(index, 1);
        
        // 保存回本地存储
        localStorage.setItem('hengtaiVisionHistory', JSON.stringify(historyItems));
        
        // 更新显示
        updateHistoryPanel();
        
        // 显示通知
        showNotification('已删除', 'info');
    }
}

// 清除所有历史记录
function clearAllHistory() {
    // 清空本地存储
    localStorage.removeItem('hengtaiVisionHistory');
    
    // 更新显示
    updateHistoryPanel();
    
    // 显示通知
    showNotification('已清空所有历史记录', 'info');
}

// 处理点击历史面板外部关闭
function handleOutsideHistoryClick(e) {
    if (historyPanel.classList.contains('active') && 
        !historyPanel.contains(e.target) && 
        e.target !== historyBtn) {
        historyPanel.classList.remove('active');
        document.removeEventListener('click', handleOutsideHistoryClick);
    }
}

// 显示通知
function showNotification(message, type = 'info', duration = 2000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // 添加样式
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.zIndex = '1200';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.transition = 'all 0.3s ease';
    
    // 根据类型设置颜色
    switch (type) {
        case 'success':
            notification.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
            break;
        case 'error':
            notification.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
            break;
        case 'warning':
            notification.style.backgroundColor = 'rgba(245, 158, 11, 0.9)';
            break;
        default:
            notification.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
    }
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 淡入
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // 到时间后淡出并删除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// 为历史记录按钮添加事件监听
if (historyBtn) {
    historyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showHistoryPanel();
    });
}

// 为历史面板关闭按钮添加事件监听
if (historyCloseBtn) {
    historyCloseBtn.addEventListener('click', function() {
        historyPanel.classList.remove('active');
        document.removeEventListener('click', handleOutsideHistoryClick);
    });
}

// 为清空历史记录按钮添加事件监听
if (historyClearBtn) {
    historyClearBtn.addEventListener('click', function() {
        if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
            clearAllHistory();
        }
    });
}

// 为保存对话框按钮添加事件监听
if (cancelSaveBtn) {
    cancelSaveBtn.addEventListener('click', function() {
        saveDialog.classList.remove('active');
    });
}

if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener('click', function() {
        saveResult();
    });
}

// 点击保存对话框背景关闭
if (saveDialog) {
    saveDialog.addEventListener('click', function(e) {
        if (e.target === saveDialog) {
            saveDialog.classList.remove('active');
        }
    });
}

// ESC键关闭对话框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (saveDialog.classList.contains('active')) {
            saveDialog.classList.remove('active');
        }
        if (historyPanel.classList.contains('active')) {
            historyPanel.classList.remove('active');
            document.removeEventListener('click', handleOutsideHistoryClick);
        }
    }
}); 