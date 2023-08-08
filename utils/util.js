var md5 = require('./md5')
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
module.exports = {
  generateUUID() {
    const res = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    return md5.hexMD5(res)
  },
  rotatePoint(x, y, centerX, centerY, angle) {
    const radians = (angle * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)

    const dx = x - centerX
    const dy = y - centerY

    const rotatedX = centerX + dx * cos - dy * sin
    const rotatedY = centerY + dx * sin + dy * cos

    return {
      x: rotatedX,
      y: rotatedY
    }
  }
}
