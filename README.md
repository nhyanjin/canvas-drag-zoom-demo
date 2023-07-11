## canvas-drag-zoom-demo

微信小程序 新版本canvas 实现拖拽、缩放、删除、添加
```javascript
wx.createSelectorQuery()
      .select('#myCanvas') // 在 WXML 中填入的 id
      .fields({
          node: true,
          size: true
      })
      .exec(this.initCanvas.bind(this))
```
## 概述

本示例是一个可以添加多种元素（图片、文字、背景）的canvas画板，可以自由拖动、旋转、缩放元素拼成自己喜欢的画布，不跳屏、不闪屏。

## 组件效果

<img width="300" src="https://github.com/nhyanjin/canvas-drag-zoom-demo/blob/main/demo.jpg"></img>

## 使用之前

使用前，请确保你已经学习过微信官方的 [小程序简易教程](https://mp.weixin.qq.com/debug/wxadoc/dev/)。

## 安装


#### 下载代码

直接通过 git 下载 canvas-drag-zoom-demo 源代码，可直接在微信开发者工具运行



## 问题反馈

有什么问题可以直接提issue