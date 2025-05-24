// DOM 元素
let settingsForm;
let thresholdInput;
let thresholdValue;
let maxDetectionsInput;
// let showBoundingBoxInput; // Removed
let showBoxesAdminInput, showLabelsAdminInput, showScoresAdminInput; // Added
let updateIntervalInput;
let saveBtn;
let resetBtn;
let browserInfoEl;
let deviceInfoEl;
let cameraSupportEl;
let tensorflowStatusEl;

// 默认设置
const defaultSettings = {
    detectionThreshold: 0.5,
    maxDetections: 10,
    // showBoundingBox: true, // Removed
    showBoxes: true, // Added
    showLabels: true, // Added
    showScores: true, // Added
    updateInterval: 100
};

// 设置范围限制
const settingLimits = {
    detectionThreshold: { min: 0.1, max: 0.9, step: 0.05 },
    maxDetections: { min: 1, max: 20, step: 1 },
    updateInterval: { min: 50, max: 1000, step: 50 }
};

// 当前设置
let currentSettings = { ...defaultSettings };

// 添加设备能力检测函数
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
        isLowPerformance,
        devicePixelRatio: window.devicePixelRatio
    };
    
    return deviceCapabilities;
}

// 检测是否是高端移动设备（简易判断）
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

// 初始化
function init() {
    // Assign DOM elements here
    settingsForm = document.getElementById('settingsForm');
    thresholdInput = document.getElementById('detectionThreshold');
    thresholdValue = document.getElementById('thresholdValue');
    maxDetectionsInput = document.getElementById('maxDetections');
    // showBoundingBoxInput = document.getElementById('showBoundingBox'); // Removed
    showBoxesAdminInput = document.getElementById('showBoxesAdmin'); // Added
    showLabelsAdminInput = document.getElementById('showLabelsAdmin'); // Added
    showScoresAdminInput = document.getElementById('showScoresAdmin'); // Added
    updateIntervalInput = document.getElementById('updateInterval');
    saveBtn = document.getElementById('saveBtn');
    resetBtn = document.getElementById('resetBtn');
    browserInfoEl = document.getElementById('browserInfo');
    deviceInfoEl = document.getElementById('deviceInfo');
    cameraSupportEl = document.getElementById('cameraSupport');
    tensorflowStatusEl = document.getElementById('tensorflowStatus');

    // 加载设置
    loadSettings();
    
    // 根据设备能力调整默认设置
    const deviceAdjustedSettings = adjustSettingsForDevice();
    
    // 如果没有保存的设置，使用设备调整后的设置
    if (!localStorage.getItem('hengtaiVisionSettings')) {
        currentSettings = { ...deviceAdjustedSettings };
    }
    
    // 初始化表单值
    updateFormValues();
    
    // 检查系统状态
    checkSystemStatus();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 响应窗口大小变化
    window.addEventListener('resize', debounce(handleResize, 250));
}

// 加载存储的设置
function loadSettings() {
    const savedSettings = localStorage.getItem('hengtaiVisionSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            // 验证加载的设置是否合法
            const validatedSettings = validateSettingsObject(parsedSettings);
            currentSettings = { ...defaultSettings, ...validatedSettings };
        } catch (e) {
            console.error('加载设置失败:', e);
            showNotification(`加载设置失败: ${e.message}，已恢复默认设置`, 'warning', 4000);
            currentSettings = { ...defaultSettings };
        }
    }
}

// 更新表单值
function updateFormValues() {
    thresholdInput.value = currentSettings.detectionThreshold;
    thresholdValue.textContent = currentSettings.detectionThreshold;
    maxDetectionsInput.value = currentSettings.maxDetections;
    // showBoundingBoxInput.checked = currentSettings.showBoundingBox; // Removed
    if(showBoxesAdminInput) showBoxesAdminInput.checked = currentSettings.showBoxes; // Added
    if(showLabelsAdminInput) showLabelsAdminInput.checked = currentSettings.showLabels; // Added
    if(showScoresAdminInput) showScoresAdminInput.checked = currentSettings.showScores; // Added
    updateIntervalInput.value = currentSettings.updateInterval;
}

// 保存设置
function saveSettings() {
    try {
        // 验证设置值的合法性
        validateSettings();
        
        // 保存到localStorage
        localStorage.setItem('hengtaiVisionSettings', JSON.stringify(currentSettings));
        
        // 显示详细的成功通知
        const message = `
            <div style="text-align: left;">
                <div><strong>设置已保存:</strong></div>
                <div>• 识别阈值: ${currentSettings.detectionThreshold}</div>
                <div>• 最大识别数量: ${currentSettings.maxDetections}</div>
                <div>• 显示边界框: ${currentSettings.showBoxes ? '是' : '否'}</div>
                <div>• 显示标签: ${currentSettings.showLabels ? '是' : '否'}</div>
                <div>• 显示置信度: ${currentSettings.showScores ? '是' : '否'}</div>
                <div>• 更新间隔: ${currentSettings.updateInterval}ms</div>
            </div>
        `;
        
        showNotification(message, 'success', 3000);
        
        console.log('设置已保存:', currentSettings);
    } catch (e) {
        console.error('保存设置失败:', e);
        showNotification(`设置保存失败: ${e.message}`, 'error', 5000);
    }
}

// 验证整个设置对象
function validateSettingsObject(settings) {
    // 创建一个新的经过验证的设置对象
    const validatedSettings = {};
    
    // 如果未提供设置对象，返回空对象
    if (!settings || typeof settings !== 'object') {
        return validatedSettings;
    }
    
    // 验证识别阈值
    if ('detectionThreshold' in settings) {
        let threshold = parseFloat(settings.detectionThreshold);
        const limits = settingLimits.detectionThreshold;
        
        // 检查是否是合法的数字
        if (isNaN(threshold)) {
            console.warn('识别阈值不是有效数字，使用默认值');
            threshold = defaultSettings.detectionThreshold;
        }
        
        // 检查范围
        if (threshold < limits.min || threshold > limits.max) {
            console.warn(`识别阈值超出范围(${limits.min}-${limits.max})，调整为最近的有效值`);
            threshold = Math.max(limits.min, Math.min(threshold, limits.max));
        }
        
        // 调整到步长的倍数
        threshold = Math.round(threshold / limits.step) * limits.step;
        threshold = parseFloat(threshold.toFixed(2)); // 保留两位小数
        
        validatedSettings.detectionThreshold = threshold;
    }
    
    // 验证最大识别数量
    if ('maxDetections' in settings) {
        let maxDetections = parseInt(settings.maxDetections);
        const limits = settingLimits.maxDetections;
        
        // 检查是否是合法的整数
        if (isNaN(maxDetections)) {
            console.warn('最大识别数量不是有效整数，使用默认值');
            maxDetections = defaultSettings.maxDetections;
        }
        
        // 检查范围
        if (maxDetections < limits.min || maxDetections > limits.max) {
            console.warn(`最大识别数量超出范围(${limits.min}-${limits.max})，调整为最近的有效值`);
            maxDetections = Math.max(limits.min, Math.min(maxDetections, limits.max));
        }
        
        // 调整到步长的倍数
        maxDetections = Math.round(maxDetections / limits.step) * limits.step;
        
        validatedSettings.maxDetections = maxDetections;
    }
    
    // 验证显示边界框设置 - Replaced
    // if ('showBoundingBox' in settings) {
    //     // 确保是布尔值
    //     validatedSettings.showBoundingBox = Boolean(settings.showBoundingBox);
    // }
    if ('showBoxes' in settings) { validatedSettings.showBoxes = Boolean(settings.showBoxes); } // Added
    if ('showLabels' in settings) { validatedSettings.showLabels = Boolean(settings.showLabels); } // Added
    if ('showScores' in settings) { validatedSettings.showScores = Boolean(settings.showScores); } // Added
    
    // 验证更新间隔
    if ('updateInterval' in settings) {
        let updateInterval = parseInt(settings.updateInterval);
        const limits = settingLimits.updateInterval;
        
        // 检查是否是合法的整数
        if (isNaN(updateInterval)) {
            console.warn('更新间隔不是有效整数，使用默认值');
            updateInterval = defaultSettings.updateInterval;
        }
        
        // 检查范围
        if (updateInterval < limits.min || updateInterval > limits.max) {
            console.warn(`更新间隔超出范围(${limits.min}-${limits.max})，调整为最近的有效值`);
            updateInterval = Math.max(limits.min, Math.min(updateInterval, limits.max));
        }
        
        // 调整到步长的倍数
        updateInterval = Math.round(updateInterval / limits.step) * limits.step;
        
        validatedSettings.updateInterval = updateInterval;
    }
    
    return validatedSettings;
}

// 验证设置值
function validateSettings() {
    const errors = [];
    const warnings = [];
    
    // 验证检测阈值
    const thresholdLimits = settingLimits.detectionThreshold;
    if (currentSettings.detectionThreshold < thresholdLimits.min || 
        currentSettings.detectionThreshold > thresholdLimits.max) {
        errors.push(`识别阈值必须在${thresholdLimits.min}到${thresholdLimits.max}之间`);
    } else if (currentSettings.detectionThreshold !== parseFloat(currentSettings.detectionThreshold.toFixed(2))) {
        // 检查小数位数
        warnings.push(`识别阈值已自动调整为${parseFloat(currentSettings.detectionThreshold.toFixed(2))}`);
        currentSettings.detectionThreshold = parseFloat(currentSettings.detectionThreshold.toFixed(2));
    }
    
    // 验证最大检测数量
    const maxDetectionsLimits = settingLimits.maxDetections;
    if (currentSettings.maxDetections < maxDetectionsLimits.min || 
        currentSettings.maxDetections > maxDetectionsLimits.max) {
        errors.push(`最大识别数量必须在${maxDetectionsLimits.min}到${maxDetectionsLimits.max}之间`);
    } else if (!Number.isInteger(currentSettings.maxDetections)) {
        // 确保是整数
        warnings.push(`最大识别数量已自动调整为${Math.round(currentSettings.maxDetections)}`);
        currentSettings.maxDetections = Math.round(currentSettings.maxDetections);
    }
    
    // 验证更新间隔
    const updateIntervalLimits = settingLimits.updateInterval;
    if (currentSettings.updateInterval < updateIntervalLimits.min || 
        currentSettings.updateInterval > updateIntervalLimits.max) {
        errors.push(`更新间隔必须在${updateIntervalLimits.min}到${updateIntervalLimits.max}毫秒之间`);
    } else if (currentSettings.updateInterval % updateIntervalLimits.step !== 0) {
        // 调整到步长的倍数
        const adjustedInterval = Math.round(currentSettings.updateInterval / updateIntervalLimits.step) * updateIntervalLimits.step;
        warnings.push(`更新间隔已自动调整为${adjustedInterval}毫秒`);
        currentSettings.updateInterval = adjustedInterval;
    }
    
    // 如果存在错误，抛出异常
    if (errors.length > 0) {
        throw new Error(errors.join('<br>'));
    }
    
    // 如果存在警告，显示警告通知
    if (warnings.length > 0) {
        setTimeout(() => {
            showNotification(warnings.join('<br>'), 'warning', 4000);
        }, 500);
    }
    
    return true;
}

// 重置设置
function resetSettings() {
    currentSettings = { ...defaultSettings };
    updateFormValues();
    saveSettings();
}

// 设置事件监听器
function setupEventListeners() {
    // 阈值滑块更新
    thresholdInput.addEventListener('input', function() {
        thresholdValue.textContent = this.value;
    });
    
    // 表单提交
    settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 收集表单数据
        currentSettings.detectionThreshold = parseFloat(thresholdInput.value);
        currentSettings.maxDetections = parseInt(maxDetectionsInput.value);
        // currentSettings.showBoundingBox = showBoundingBoxInput.checked; // Removed
        if(showBoxesAdminInput) currentSettings.showBoxes = showBoxesAdminInput.checked; // Added
        if(showLabelsAdminInput) currentSettings.showLabels = showLabelsAdminInput.checked; // Added
        if(showScoresAdminInput) currentSettings.showScores = showScoresAdminInput.checked; // Added
        currentSettings.updateInterval = parseInt(updateIntervalInput.value);
        
        // 保存设置
        saveSettings();
    });
    
    // 输入验证 - 最大识别数量
    maxDetectionsInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        const limits = settingLimits.maxDetections;
        
        if (isNaN(value) || value < limits.min || value > limits.max) {
            this.classList.add('invalid');
        } else {
            this.classList.remove('invalid');
        }
    });
    
    // 输入验证 - 更新间隔
    updateIntervalInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        const limits = settingLimits.updateInterval;
        
        if (isNaN(value) || value < limits.min || value > limits.max) {
            this.classList.add('invalid');
        } else {
            this.classList.remove('invalid');
        }
    });
    
    // 重置按钮
    resetBtn.addEventListener('click', resetSettings);
}

// 检查系统状态
async function checkSystemStatus() {
    // 浏览器信息
    const userAgent = navigator.userAgent;
    let browserName = "未知";
    let browserVersion = "";
    
    if (userAgent.indexOf("Chrome") > -1) {
        browserName = "Chrome";
        const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (userAgent.indexOf("Safari") > -1) {
        browserName = "Safari";
        const match = userAgent.match(/Version\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (userAgent.indexOf("Firefox") > -1) {
        browserName = "Firefox";
        const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
        browserName = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
        browserName = "Edge";
        const match = userAgent.match(/Edge\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    }
    
    browserInfoEl.textContent = `${browserName} ${browserVersion || navigator.appVersion}`;
    
    // 设备信息 - 增强版
    const capabilities = detectDeviceCapabilities();
    const deviceType = capabilities.isTablet ? "平板设备" : 
                      (capabilities.isMobile ? "移动设备" : "桌面设备");
    
    let deviceInfo = `${deviceType}, ${capabilities.screenWidth}x${capabilities.screenHeight}`;
    deviceInfo += `, 像素比:${capabilities.devicePixelRatio.toFixed(1)}`;
    
    // 添加硬件信息（如果可用）
    if (navigator.hardwareConcurrency) {
        deviceInfo += `, ${navigator.hardwareConcurrency}核`;
    }
    if (navigator.deviceMemory) {
        deviceInfo += `, ${navigator.deviceMemory}GB内存`;
    }
    
    deviceInfoEl.textContent = deviceInfo;
    
    // 摄像头支持 - 增强版
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            // 检查是否支持后置摄像头
            const hasEnvCamera = await checkEnvironmentCamera();
            
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            
            // 获取支持的视频约束
            const videoTracks = stream.getVideoTracks();
            
            if (videoTracks.length > 0) {
                const capabilities = videoTracks[0].getCapabilities ? 
                                     videoTracks[0].getCapabilities() : null;
                
                let cameraInfo = "支持";
                
                if (capabilities) {
                    // 最大分辨率
                    if (capabilities.width && capabilities.height) {
                        const maxWidth = capabilities.width.max;
                        const maxHeight = capabilities.height.max;
                        if (maxWidth && maxHeight) {
                            cameraInfo += `, 最大${maxWidth}x${maxHeight}`;
                        }
                    }
                    
                    // 前后摄像头
                    if (capabilities.facingMode) {
                        const modes = Array.isArray(capabilities.facingMode) ? 
                                     capabilities.facingMode : [capabilities.facingMode];
                        
                        if (modes.includes('environment') && modes.includes('user')) {
                            cameraInfo += ', 前后摄像头';
                        } else if (modes.includes('environment')) {
                            cameraInfo += ', 后置摄像头';
                        } else if (modes.includes('user')) {
                            cameraInfo += ', 前置摄像头';
                        }
                    } else if (hasEnvCamera) {
                        cameraInfo += ', 支持后置摄像头';
                    }
                }
                
                cameraSupportEl.textContent = cameraInfo;
                cameraSupportEl.style.color = "green";
            } else {
                cameraSupportEl.textContent = "支持，但无视频轨道";
                cameraSupportEl.style.color = "orange";
            }
            
            // 停止所有轨道
            stream.getTracks().forEach(track => track.stop());
            
        } catch (e) {
            cameraSupportEl.textContent = `不支持或未授权: ${e.message}`;
            cameraSupportEl.style.color = "red";
        }
    } else {
        cameraSupportEl.textContent = "不支持";
        cameraSupportEl.style.color = "red";
    }
    
    // TensorFlow.js 状态 - 增强版
    if (typeof tf !== 'undefined') {
        try {
            // 尝试运行一个简单的操作来测试 TensorFlow.js 是否正常工作
            const tensor = tf.tensor([1, 2, 3]);
            
            // 检查后端
            const backend = tf.getBackend();
            
            // 获取版本
            const version = tf.version ? tf.version.tfjs : "未知";
            
            tensor.dispose();
            
            tensorflowStatusEl.textContent = `正常，后端:${backend}，版本:${version}`;
            tensorflowStatusEl.style.color = "green";
        } catch (e) {
            tensorflowStatusEl.textContent = `加载异常: ${e.message}`;
            tensorflowStatusEl.style.color = "red";
        }
    } else {
        tensorflowStatusEl.textContent = "未加载";
        tensorflowStatusEl.style.color = "red";
    }
}

// 检查是否支持后置摄像头
async function checkEnvironmentCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' } }
        });
        
        // 停止所有轨道
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (e) {
        return false;
    }
}

// 根据设备能力调整默认设置
function adjustSettingsForDevice() {
    const capabilities = detectDeviceCapabilities();
    
    // 创建调整后的设置
    const adjustedSettings = { ...defaultSettings };
    
    // 如果是低性能设备，调整更新间隔和最大识别数量
    if (capabilities.isLowPerformance) {
        adjustedSettings.updateInterval = 200; // 降低刷新率
        adjustedSettings.maxDetections = 5; // 减少同时识别的物体数量
    }
    
    // 如果是高端设备，可以提高阈值和最大识别数量
    else if (!capabilities.isMobile || isHighEndMobile()) {
        adjustedSettings.detectionThreshold = 0.45; // 稍微降低阈值以识别更多物体
        adjustedSettings.maxDetections = 15; // 增加同时识别的物体数量
    }
    
    return adjustedSettings;
}

// 处理窗口大小变化
function handleResize() {
    // 更新设备信息显示
    const capabilities = detectDeviceCapabilities();
    const deviceType = capabilities.isTablet ? "平板设备" : 
                      (capabilities.isMobile ? "移动设备" : "桌面设备");
    
    let deviceInfo = `${deviceType}, ${capabilities.screenWidth}x${capabilities.screenHeight}`;
    deviceInfo += `, 像素比:${capabilities.devicePixelRatio.toFixed(1)}`;
    
    // 添加硬件信息（如果可用）
    if (navigator.hardwareConcurrency) {
        deviceInfo += `, ${navigator.hardwareConcurrency}核`;
    }
    if (navigator.deviceMemory) {
        deviceInfo += `, ${navigator.deviceMemory}GB内存`;
    }
    
    deviceInfoEl.textContent = deviceInfo;
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    // 添加样式
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '15px 20px';
    notification.style.color = 'white';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '1000';
    notification.style.maxWidth = '80%';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    
    // 根据类型设置不同背景色
    switch(type) {
        case 'success':
            notification.style.backgroundColor = 'rgba(16, 185, 129, 0.95)'; // 成功绿色
            break;
        case 'error':
            notification.style.backgroundColor = 'rgba(239, 68, 68, 0.95)'; // 错误红色
            break;
        case 'warning':
            notification.style.backgroundColor = 'rgba(245, 158, 11, 0.95)'; // 警告黄色
            break;
        default:
            notification.style.backgroundColor = 'rgba(59, 130, 246, 0.95)'; // 信息蓝色
    }
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 添加淡入效果
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    // 强制重绘以应用初始透明度
    notification.getBoundingClientRect();
    
    // 淡入显示
    notification.style.opacity = '1';
    
    // 指定时间后删除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        notification.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, duration);
}

// 页面加载完成后初始化
window.addEventListener('load', init); 