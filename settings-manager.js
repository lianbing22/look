// 设置管理模块

/** 默认设置 */
const defaultSettings = {
    detectionThreshold: 0.5,
    maxDetections: 10,
    showLabels: true,
    showScores: true,
    detectionInterval: 500
};

/**
 * 从localStorage加载设置
 * @returns {Object}
 */
export function loadSettings() {
    const savedSettings = localStorage.getItem('aiRecognitionSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
}

/**
 * 保存设置到localStorage
 * @param {Object} settings
 */
export function saveSettings(settings) {
    localStorage.setItem('aiRecognitionSettings', JSON.stringify(settings));
}

// 其他设置相关工具函数...