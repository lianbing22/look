# 恒泰视觉 AI 识别系统

恒泰视觉 AI 识别系统是一款基于TensorFlow.js的实时物体识别应用，可以通过浏览器直接访问，无需安装任何软件。该系统利用先进的COCO-SSD模型，能够实时识别摄像头画面中的80多种常见物体。

## 主要功能

- **实时物体识别**：利用设备摄像头进行实时物体检测和识别
- **多物体同时识别**：支持同时检测多个物体，默认最多10个（可调整）
- **中文标签显示**：所有识别结果均以中文显示，便于中国用户使用
- **可调节参数**：支持调整识别阈值、最大识别数量、显示设置等
- **响应式设计**：适配各种设备，从手机到桌面电脑均可流畅使用
- **离线支持**：通过PWA技术，支持安装到主屏幕并离线使用核心功能
- **低电量优化**：在移动设备电量低时自动降低刷新率以节省电量

## 使用方法

1. 打开系统网页
2. 点击"开始识别"按钮（首次使用需要授予摄像头权限）
3. 将摄像头对准需要识别的物体
4. 查看右侧识别结果列表
5. 完成后点击"停止识别"按钮

## 系统要求

- 现代浏览器（Chrome, Firefox, Safari, Edge的最新版本）
- 摄像头
- 支持JavaScript的设备
- 推荐使用较新的移动设备或电脑，以获得更流畅的体验

## 隐私说明

- 所有识别过程均在本地进行，不会上传任何图像或视频数据
- 不会收集用户个人信息
- 设置数据仅保存在本地浏览器中

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **AI模型**：TensorFlow.js, COCO-SSD模型
- **PWA技术**：Service Worker, Web App Manifest
- **响应式设计**：适配移动端和桌面端

## 本地开发

1. 克隆仓库：`git clone https://github.com/yourusername/hengtai-vision.git`
2. 进入项目目录：`cd hengtai-vision`
3. 使用任意HTTP服务器运行项目，例如：
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve`
4. 在浏览器中访问：`http://localhost:8000`

## 许可证

MIT

## 联系方式

如有问题或建议，请通过以下方式联系我们：

- 邮箱：contact@example.com
- GitHub Issues: [https://github.com/yourusername/hengtai-vision/issues](https://github.com/yourusername/hengtai-vision/issues)

---

&copy; 2025 恒泰科技
