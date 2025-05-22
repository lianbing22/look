# 恒泰视觉 AI 识别系统

基于TensorFlow.js的实时物体识别应用，可识别80多种常见物体，包括人、动物、交通工具、家具、电子设备等。

## 主要功能

- 实时摄像头物体识别
- 多种物体同时检测与标注
- 友好的中文界面与标签
- 移动设备优化支持
- 自适应界面设计
- 离线工作模式(PWA)
- 结果保存与历史记录

## 安装与使用

### 基本使用

1. 克隆此仓库到本地
2. 打开index.html文件即可运行应用
3. 点击"开始识别"按钮启动摄像头
4. 将摄像头对准要识别的物体

### 完整部署

1. 安装必要工具生成图标：
   ```
   # MacOS
   brew install librsvg imagemagick
   
   # Ubuntu/Debian
   sudo apt-get install librsvg2-bin imagemagick
   ```

2. 生成应用图标：
   ```
   chmod +x generate-icons.sh
   ./generate-icons.sh
   ```

3. 将所有文件部署到Web服务器

## 系统要求

- 现代浏览器（Chrome, Firefox, Safari, Edge等）
- 摄像头设备
- 支持JavaScript

## 移动设备兼容性

本应用已针对移动设备进行优化，特别是：

- iOS 13+ (Safari)
- Android 8.0+

在iOS设备上使用时，为获得最佳体验：
1. 使用Safari浏览器打开应用
2. 点击分享按钮，选择"添加到主屏幕"
3. 从主屏幕启动应用可获得全屏体验

## 管理后台

管理后台可调整以下参数：
- 识别阈值
- 最大识别数量
- 边界框显示控制
- 更新间隔

## 版权信息

© 2025 恒泰科技，保留所有权利

## 开发信息

- TensorFlow.js
- COCO-SSD模型
- 纯原生JavaScript
- PWA技术

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
