// DOM 元素
const settingsForm = document.getElementById('settingsForm');
const thresholdInput = document.getElementById('detectionThreshold');
const thresholdValue = document.getElementById('thresholdValue');
const maxDetectionsInput = document.getElementById('maxDetections');
const showBoundingBoxInput = document.getElementById('showBoundingBox');
const updateIntervalInput = document.getElementById('updateInterval');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const browserInfoEl = document.getElementById('browserInfo');
const deviceInfoEl = document.getElementById('deviceInfo');
const cameraSupportEl = document.getElementById('cameraSupport');
const tensorflowStatusEl = document.getElementById('tensorflowStatus');

// 默认设置
const defaultSettings = {
    detectionThreshold: 0.5,
    maxDetections: 10,
    showBoundingBox: true,
    updateInterval: 100
};

// 当前设置
let currentSettings = { ...defaultSettings };

// 初始化
function init() {
    // 加载设置
    loadSettings();
    
    // 初始化表单值
    updateFormValues();
    
    // 检查系统状态
    checkSystemStatus();
    
    // 设置事件监听器
    setupEventListeners();
}

// 加载存储的设置
function loadSettings() {
    const savedSettings = localStorage.getItem('hengtaiVisionSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            currentSettings = { ...defaultSettings, ...parsedSettings };
        } catch (e) {
            console.error('加载设置失败:', e);
        }
    }
}

// 更新表单值
function updateFormValues() {
    thresholdInput.value = currentSettings.detectionThreshold;
    thresholdValue.textContent = currentSettings.detectionThreshold;
    maxDetectionsInput.value = currentSettings.maxDetections;
    showBoundingBoxInput.checked = currentSettings.showBoundingBox;
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
                <div>• 显示边界框: ${currentSettings.showBoundingBox ? '是' : '否'}</div>
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

// 验证设置值
function validateSettings() {
    // 验证检测阈值
    if (currentSettings.detectionThreshold < 0.1 || currentSettings.detectionThreshold > 0.9) {
        throw new Error('识别阈值必须在0.1到0.9之间');
    }
    
    // 验证最大检测数量
    if (currentSettings.maxDetections < 1 || currentSettings.maxDetections > 20) {
        throw new Error('最大识别数量必须在1到20之间');
    }
    
    // 验证更新间隔
    if (currentSettings.updateInterval < 50 || currentSettings.updateInterval > 1000) {
        throw new Error('更新间隔必须在50到1000毫秒之间');
    }
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
        currentSettings.showBoundingBox = showBoundingBoxInput.checked;
        currentSettings.updateInterval = parseInt(updateIntervalInput.value);
        
        // 保存设置
        saveSettings();
    });
    
    // 重置按钮
    resetBtn.addEventListener('click', resetSettings);
}

// 检查系统状态
async function checkSystemStatus() {
    // 浏览器信息
    const userAgent = navigator.userAgent;
    let browserName = "未知";
    
    if (userAgent.indexOf("Chrome") > -1) {
        browserName = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
        browserName = "Safari";
    } else if (userAgent.indexOf("Firefox") > -1) {
        browserName = "Firefox";
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
        browserName = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
        browserName = "Edge";
    }
    
    browserInfoEl.textContent = `${browserName} ${navigator.appVersion}`;
    
    // 设备信息
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    deviceInfoEl.textContent = isMobile ? "移动设备" : "桌面设备";
    
    // 摄像头支持
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            cameraSupportEl.textContent = "支持";
            cameraSupportEl.style.color = "green";
        } catch (e) {
            cameraSupportEl.textContent = "不支持或未授权";
            cameraSupportEl.style.color = "red";
        }
    } else {
        cameraSupportEl.textContent = "不支持";
        cameraSupportEl.style.color = "red";
    }
    
    // TensorFlow.js 状态
    if (typeof tf !== 'undefined') {
        try {
            // 尝试运行一个简单的操作来测试 TensorFlow.js 是否正常工作
            const tensor = tf.tensor([1, 2, 3]);
            tensor.dispose();
            
            tensorflowStatusEl.textContent = "正常";
            tensorflowStatusEl.style.color = "green";
        } catch (e) {
            tensorflowStatusEl.textContent = "加载异常";
            tensorflowStatusEl.style.color = "red";
        }
    } else {
        tensorflowStatusEl.textContent = "未加载";
        tensorflowStatusEl.style.color = "red";
    }
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