// 模型加载工具模块
import * as tf from '@tensorflow/tfjs';

/**
 * 加载COCO-SSD模型
 * @returns {Promise<tf.GraphModel>}
 */
export async function loadCocoSsdModel() {
    try {
        const model = await tf.loadGraphModel('https://storage.googleapis.com/tfjs-models/savedmodel/coco-ssd_mobilenet_v1_1.0_quant/detect_model.json');
        console.log('模型加载完成');
        return model;
    } catch (error) {
        console.error('模型加载失败:', error);
        throw error;
    }
}

// 其他模型相关工具函数...