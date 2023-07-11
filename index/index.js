import utils from '../utils/util'

let isDragging = false; // 是否开始拖拽
let selectedImageIndex = -1; // images数据的索引号
let lastTouchX = 0; // 移动到x
let lastTouchY = 0; // 移动到y
let maxLevel = 0 // texts、images数据里面最层级的最大值，方便新加的数据直接就是层级最高
let action = '' // 当前操作move、resize、del
let fillType = '' // 文字类型、图片类型
let selectTime = 5 // 秒，选择框停留时间，如果未操作的情况下超过5秒就让框消失selected=false
let canvasData = {
    texts: [],
    background: '',
    images: [{
            x: 180,
            y: 80,
            initWidth: 100, // 初始宽
            initHeight: 100, // 初始高
            width: 100,
            height: 100,
            src: './ico.png',
            selected: true,
            rotate: 20,
            level: 0,
            id: utils.generateUUID()
        },
        {
            x: 100,
            y: 200,
            initWidth: 100, // 初始宽
            initHeight: 100, // 初始高
            width: 100,
            height: 100,
            src: './108.png',
            selected: false,
            rotate: 0,
            level: 2,
            id: utils.generateUUID()
        },
        {
            x: 100,
            y: 200,
            initWidth: 100, // 初始宽
            initHeight: 100, // 初始高
            width: 100,
            height: 50,
            src: './car.png',
            selected: false,
            rotate: 0,
            level: 0,
            id: utils.generateUUID()
        }
    ]
}
Page({
    data: {},
    onLoad() {
        // 初始图片存储区域
        this._imgData = {},
            // 初始删除、拖拽图标存储区域
            this._icon = {
                delImg: null,
                dragImg: null
            }
        wx.createSelectorQuery()
            .select('#myCanvas') // 在 WXML 中填入的 id
            .fields({
                node: true,
                size: true
            })
            .exec(this.initCanvas.bind(this))
    },
    initCanvas(res) {
        this._img = {}
        const width = res[0].width
        const height = res[0].height

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        const renderLoop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            this.startDraw(ctx, canvas)
            canvas.requestAnimationFrame(renderLoop)
        }
        canvas.requestAnimationFrame(renderLoop)
        this.selectInter = setInterval(() => {
            if (selectTime > 0) {
                selectTime--
            }
            if (selectTime === 0) {
                canvasData.images.forEach(item => {
                    item.selected = false
                })
                canvasData.texts.forEach(item => {
                    item.selected = false
                })
            }
        }, 1000);
    },
    async startDraw(ctx, canvas) {
        if (canvasData.background) {
            ctx.fillStyle = canvasData.background; // Fill with white color
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Draw white background
        }
        const newTexts = JSON.parse(JSON.stringify(canvasData.texts))
        const newTextsData = newTexts.sort((a, b) => {
            return a.level - b.level;
        });
        this.drawData(newTextsData, ctx, canvas, 'text')
        const newImages = JSON.parse(JSON.stringify(canvasData.images));
        const newImgageData = newImages.sort((a, b) => {
            return a.level - b.level;
        });
        this.drawData(newImgageData, ctx, canvas, 'image')
    },
    async drawData(levelsData, ctx, canvas, type) {
        if (levelsData.length === 0) return
        for (let i = 0; i < levelsData.length; i++) {
            const item = levelsData[i];
            ctx.save(); // 保存当前绘图状态
            if (item.rotate) {
                const centerX = item.x + item.width / 2
                const centerY = item.y + item.height / 2
                ctx.translate(centerX, centerY); // 将坐标原点移至图片中心
                ctx.rotate(item.rotate * Math.PI / 180);
                ctx.translate(-centerX, -centerY);
            }
            if (type === 'image') { // 渲染图片
                if (!this._imgData[item.id]) {
                    this._imgData[item.id] = await this.getimg(item.src, canvas);
                }
                ctx.drawImage(this._imgData[item.id], item.x, item.y, item.width, item.height);
                if (item.selected) {
                    this.drawSelection(ctx, canvas, item.x, item.y, item.width, item.height);
                }
            } else if (type === 'text') { // 渲染文字
                if (item.fillStyle) ctx.fillStyle = item.fillStyle
                if (item.font) ctx.font = item.font + 'px Arial'
                ctx.fillText(item.text, item.x, item.y);
                var textMetrics = ctx.measureText(item.text);
                const findIdx = canvasData.texts.findIndex(t => t.id === item.id)
                canvasData.texts[findIdx].width = parseInt(textMetrics.width);
                canvasData.texts[findIdx].height = parseInt(ctx.font);
                canvasData.texts[findIdx].initWidth = parseInt(textMetrics.width);
                canvasData.texts[findIdx].initHeight = parseInt(ctx.font);
                if (item.selected) {
                    this.drawSelection(ctx, canvas, item.x, item.y - item.height, item.width, item.height);
                }
            }
            ctx.restore(); // 恢复之前的绘图状态
        }
    },
    // 判断触摸点是否在图片上
    isTouchInsideImage(touchX, touchY) {
        selectedImageIndex = -1
        const haveSelectTextIdx = canvasData.texts.findIndex(item => item.selected)
        const haveSelectImageIdx = canvasData.images.findIndex(item => item.selected)
        // 1：文字有选中，2：图片有选中，3：都没有选中
        const selectType = haveSelectTextIdx > -1 ? {
                fillType: 'text',
                datas: canvasData.texts,
                idx: haveSelectTextIdx
            } :
            haveSelectImageIdx > -1 ? {
                fillType: 'image',
                datas: canvasData.images,
                idx: haveSelectImageIdx
            } : {
                fillType: 'none',
                idx: -1
            }
        const selectIconRes = this.selectIcon(touchX, touchY, selectType)
        if (selectIconRes) return true
        const textRes = this.checkTouchInfo(touchX, touchY, canvasData.texts, 'text')
        if (textRes) return true
        const imageRes = this.checkTouchInfo(touchX, touchY, canvasData.images, 'image')
        if (imageRes) return true
    },
    selectIcon(touchX, touchY, selectType) {
        if (selectType.fillType === 'none') return false // 没有选中直接返回fase
        if (selectType.datas.length === 0) return false
        fillType = selectType.fillType; // 修改全局fillType
        const data = selectType.datas[selectType.idx]
        const centerX = data.x + data.width / 2
        const centerY = data.y + data.height / 2
        const delTouchVal = data.rotate ? utils.rotatePoint(data.x, data.y, centerX, centerY, data.rotate) : {
            x: data.x,
            y: data.y
        }
        const dragTouchVal = data.rotate ? utils.rotatePoint(data.x + data.width, data.y + data.height, centerX, centerY, data.rotate) : {
            x: data.x + data.width,
            y: data.y + data.height
        }
        const delTouchX = delTouchVal.x
        const delTouchY = selectType.fillType === 'image' ? delTouchVal.y : delTouchVal.y - data.height
        const dragTouchX = dragTouchVal.x
        const dragTouchY = selectType.fillType === 'image' ? dragTouchVal.y : dragTouchVal.y - data.height
        if (
            touchX >= delTouchX - 15 &&
            touchX <= delTouchX + 15 &&
            touchY >= delTouchY - 15 &&
            touchY <= delTouchY + 15
        ) {
            selectedImageIndex = selectType.idx
            action = 'del'
            delete this._imgData[selectType.datas[selectType.idx].id] // 删除数据对应的图片缓存
            selectType.datas.splice(selectType.idx, 1) // 删除数据
            // 删除按钮被点击
            console.log("Clicked delete button");
            return true
        } else if (
            touchX >= dragTouchX - 15 &&
            touchX <= dragTouchX + 15 &&
            touchY >= dragTouchY - 15 &&
            touchY <= dragTouchY + 15
        ) {
            selectedImageIndex = selectType.idx
            action = 'resize'
            // 缩放按钮被点击
            console.log("Clicked resize button");
            return true
        }
        fillType = ''; // 没有选中修改全局为空
        return false
    },
    checkTouchInfo(touchX, touchY, datas, type) {
        let selectIdx = -1 // 被选中的images索引号
        let selectLevel = 0; // 渲染层级,值越大最上显示
        let isChecked = false // 是否选中
        if (datas.length === 0) return isChecked
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            if (maxLevel < data.level) maxLevel = data.level
            const thisDataY = type === 'text' ? data.y - data.height : data.y
            if (
                touchX >= data.x &&
                touchX <= data.x + data.width &&
                touchY >= thisDataY &&
                touchY <= thisDataY + data.height
            ) {
                action = 'move'
                // 有种情况:用来当两个元素重叠在一起时，优先选择level高的
                if (selectIdx === -1 || (selectIdx > -1 && selectLevel < data.level)) {
                    selectIdx = i
                    selectLevel = data.level
                }
            } else {
                fillType = ''
                isChecked = false
                if (data.selected) {
                    // 仅当之前已选中时才设置为未选中状态
                    data.selected = false;
                }
            }
        }
        if (selectIdx > -1) {
            fillType = type
            const newData = type === 'image' ? canvasData.images : canvasData.texts
            if (!newData[selectIdx].selected) {
                // 仅当之前未选中时才设置为选中状态
                newData[selectIdx].selected = true;
                newData[selectIdx].level = maxLevel + 1
                isChecked = true;
            }
            selectedImageIndex = selectIdx;
            if (type === 'image') {
                canvasData.texts.forEach(item => item.selected = false)
            } else {
                canvasData.images.forEach(item => item.selected = false)
            }

        }
        return isChecked
    },
    start(e) {
        isDragging = false
        const {
            x,
            y
        } = e.changedTouches[0]
        this.isTouchInsideImage(x, y)
        if (selectedImageIndex !== -1) {
            selectTime = 5
            isDragging = true;
            lastTouchX = x;
            lastTouchY = y;
        }
    },
    end(e) {
        isDragging = false;
    },
    move(e) {
        if (isDragging && selectedImageIndex !== -1) {
            selectTime = 5
            const {
                x,
                y
            } = e.changedTouches[0];
            const datas = fillType === 'image' ? canvasData.images : canvasData.texts
            const data = datas[selectedImageIndex];
            const dx = x - lastTouchX;
            const dy = y - lastTouchY;
            if (action === 'resize') {
                const centerX = data.x + data.width / 2;
                const centerY = data.y + data.height / 2;
                const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
                if (fillType === 'image') {
                    const initialDistance = Math.sqrt(Math.pow(lastTouchX - centerX, 2) + Math.pow(lastTouchY - centerY, 2));
                    const currentDistance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                    const scaleFactor = currentDistance / initialDistance;

                    // Set maximum and minimum scale factors
                    const maxScaleFactor = 2;
                    const minScaleFactor = 0.5;
                    let newWidth = data.width * scaleFactor;
                    let newHeight = data.height * scaleFactor;
                    if (newWidth > data.initWidth * maxScaleFactor) {
                        newWidth = data.initWidth * maxScaleFactor
                    }
                    if (newHeight > data.initHeight * maxScaleFactor) {
                        newHeight = data.initHeight * maxScaleFactor
                    }
                    if (newWidth < data.initWidth * minScaleFactor) {
                        newWidth = data.initWidth * minScaleFactor
                    }
                    if (newHeight < data.initHeight * minScaleFactor) {
                        newHeight = data.initHeight * minScaleFactor
                    }
                    data.width = newWidth
                    data.height = newHeight
                    data.rotate += angle - data.rotate - 30; // -30是补尝值
                } else {
                    data.rotate += angle - data.rotate
                }
            }
            if (action === 'move') {
                data.x += dx;
                data.y += dy;
            }

            lastTouchX = x;
            lastTouchY = y;
        }
    },
    // 绘制选中框到Canvas
    async drawSelection(ctx, canvas, x, y, width, height) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        this._icon.delImg = this._icon.delImg || await this.getimg('./icon/close.png', canvas);
        ctx.drawImage(this._icon.delImg, x - 15, y - 15, 30, 30);
        this._icon.dragImg = this._icon.dragImg || await this.getimg('./icon/scale.png', canvas);
        ctx.drawImage(this._icon.dragImg, x + width - 15, y + height - 15, 30, 30);
    },
    async getimg(src, canvas) {
        return new Promise((resolve, reject) => {
            let img = canvas.createImage();
            img.onload = () => {
                resolve(img)
            }
            img.src = src
        })
    },
    // 下面的按钮点击的方法
    addImage() {
        canvasData.images.forEach(item => item.selected = false)
        canvasData.texts.forEach(item => item.selected = false)
        canvasData.images.push({
            x: 100,
            y: 200,
            initWidth: 100,
            initHeight: 100,
            width: 100,
            height: 100,
            src: './ico.png',
            selected: true,
            rotate: 0,
            level: maxLevel + 1,
            id: utils.generateUUID()
        })
    },
    addBackground() {
        canvasData.background = 'yellow'
    },
    addText() {
        selectTime = 5
        canvasData.images.forEach(item => item.selected = false)
        canvasData.texts.forEach(item => item.selected = false)
        canvasData.texts.push({
            x: 100,
            y: 260,
            font: 30,
            fillStyle: "red",
            text: 'hello word',
            selected: true,
            rotate: 0,
            level: maxLevel + 1,
            id: utils.generateUUID()
        })
    },
    clearRect() {
        selectTime = 5
        canvasData.images = []
        canvasData.texts = []
        canvasData.background = ''
        this._imgData = {}
    }
})