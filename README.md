# 恒泰视觉 AI 识别系统

这是一个使用网页技术调用手机摄像头进行物品智能识别的系统。项目利用TensorFlow.js的COCO-SSD模型在浏览器中实时检测和识别80种常见物体，具有科技感强、界面友好的特点。

## 功能特点

- 实时调用手机摄像头进行视频捕获
- 使用TensorFlow.js和COCO-SSD模型进行物体识别
- 在视频画面上显示彩色边界框和智能识别结果
- 不同类型物体使用不同颜色标识，视觉区分更明确
- 智能文字标签布局，确保不会超出显示区域
- 现代化科技感界面，带有动态效果和反馈
- 直观的管理后台，可配置识别参数
- 完全在前端运行，无需服务器
- 支持中文显示识别结果

## 技术栈

- HTML5 / CSS3 / JavaScript
- [MediaDevices API](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices) - 用于访问摄像头
- [TensorFlow.js](https://tensorflow.google.cn/js) - 机器学习框架
- [COCO-SSD模型](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) - 预训练的物体检测模型
- Canvas API - 用于绘制高级视觉效果

## 快速开始

由于使用纯前端技术，您可以通过以下方式运行项目：

1. 通过GitHub Pages访问: [https://github.com/lianbing22/look](https://github.com/lianbing22/look)
2. 或者在本地使用HTTP服务器（由于摄像头API安全限制，需要HTTPS或localhost环境）

```bash
# 使用Python启动简单HTTP服务器
python -m http.server

# 或使用Node.js的http-server
npx http-server
```

## 使用说明

1. 打开应用后，点击"开始识别"按钮
2. 允许浏览器访问摄像头
3. 将摄像头对准要识别的物体
4. 识别结果将在右侧列表中显示，不同物体使用不同颜色标识
5. 点击"停止识别"按钮结束识别过程

## 管理设置

点击导航栏中的"管理"进入管理页面，可以配置以下参数：

- **识别阈值**: 调整识别的准确度要求（0.1-0.9）
- **最大识别数量**: 每帧画面中最多识别的物体数量（1-20）
- **显示边界框**: 是否在视频上显示边界框和标签
- **更新间隔**: 物体检测的频率（毫秒）

## 界面特点

- **深色主题**: 采用现代化深色主题设计，减少眼睛疲劳
- **彩色识别**: 不同类型的物体使用不同颜色标识，便于区分
- **智能标签**: 文字标签位置自动调整，确保不会超出屏幕
- **动态效果**: 按钮、控件和识别框都带有细微动画效果
- **自适应布局**: 完美适配移动设备和桌面浏览器

## 浏览器兼容性

- Chrome 60+ (推荐)
- Firefox 55+
- Safari 11+
- Edge 79+

移动设备：
- iOS Safari 11+
- Android Chrome 60+

## 本地开发

如需修改或扩展功能，只需编辑相应的HTML/CSS/JavaScript文件：

```
/
├── index.html          # 主页面
├── style.css           # 主页样式
├── script.js           # 主要功能代码
├── admin/
│   ├── index.html      # 管理页面
│   ├── admin.css       # 管理页面样式
│   └── admin.js        # 管理功能代码
└── README.md           # 项目说明
```

## 部署到GitHub Pages

1. Fork或克隆此仓库
2. 修改为你需要的内容
3. 在仓库设置中启用GitHub Pages（Settings > Pages）
4. 选择main分支作为源
5. 保存后，你的应用将在几分钟内部署完成

## 许可

MIT License

## 贡献

欢迎通过微信：X08954提供改进建议和贡献代码。

---

注：本项目识别结果准确性受多种因素影响，如光线、角度、摄像头质量等。

© 2025 恒泰视觉 AI 识别系统 