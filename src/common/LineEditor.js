var isOnLinePoint = function (point1, point2, mouseX, mouseY, diff) {
    var x1 = point1.x
    var y1 = point1.y
    var x2 = point2.x
    var y2 = point2.y

    if (Math.abs(x1 - mouseX) <= diff && Math.abs(y1 - mouseY) <= diff) {
        return 1
    }
    if (Math.abs(x2 - mouseX) <= diff && Math.abs(y2 - mouseY) <= diff) {
        return 2
    }
    return false
}

var isOnTheLine = function (point1, point2, mouseX, mouseY, errorRange) {
    var x1 = point1.x
    var y1 = point1.y
    var x2 = point2.x
    var y2 = point2.y

    if (x1 < mouseX && x2 < mouseX
        || x1 > mouseX && x2 > mouseX
        || y1 < mouseY && y2 < mouseY
        || y1 > mouseY && y2 > mouseY
    ) {
        return false;
    }
    if (x1 !== x2) {
        var ratio = (y1 - y2) / (x1 - x2)
        var base = y1 - ratio * x1
        var baseY = mouseX * ratio + base
        var diff = mouseY - baseY
        if (Math.abs(diff) < Math.max(Math.abs(ratio), errorRange)) {
            return true
        }
    } else if (Math.abs(x1 - mouseX) <= errorRange && mouseY >= Math.min(y1, y2) && mouseY <= Math.max(y1, y2)) {
        return true
    }
    return false
}

class LineEditor {
    constructor (options) {
        this.canvas = options.canvas
        this.ctx = this.canvas.getContext('2d')
        this.lines = []
        this.tempLines = []
        this.updateHanlder = options.updateHanlder || function () {}
        this.changeMap = {}
        this.lineWidth = options.lineWidth || 3
        this.errorRange = options.errorRange || 2
        this.mouseDown = false
        this.hoverColor = options.hoverColor || 'red'
        this.drawColor = options.drawColor || 'green'
        this.stackOperations = []
    }

    init () {
        const me = this
        const canvas = me.canvas
        const canvasOffset = canvas.getBoundingClientRect()
        const offsetX = canvasOffset.left
        const offsetY = canvasOffset.top
        const lines = me.lines
        const errorRange = me.errorRange
        let startX
        let startY
        let mouseX
        let mouseY
        me.ctx.lineWidth = me.lineWidth
        me.ctx.lineCap = 'round'
        let pointDiffRange = errorRange + me.lineWidth

        canvas.onmousedown = function (e) {
            e.stopPropagation()
            e.preventDefault()
            me.mouseDown = true
            mouseX = e.clientX - offsetX
            mouseY = e.clientY - offsetY
            for (let i = 0; i < lines.length; i++) {
                let obj = lines[i]
                obj.dragponit = isOnLinePoint({
                    x: obj.x1,
                    y: obj.y1
                }, {
                    x: obj.x2,
                    y: obj.y2
                }, mouseX, mouseY, pointDiffRange)
                obj.dragline = isOnTheLine({
                    x: obj.x1,
                    y: obj.y1
                }, {
                    x: obj.x2,
                    y: obj.y2
                }, mouseX, mouseY, errorRange)
                obj.selected = obj.dragponit || obj.dragline || false
            }
            startX = mouseX
            startY = mouseY
            me.drawLines()
        }
        canvas.onmousemove = function (e) {
            e.stopPropagation()
            e.preventDefault()
            canvas.style.cursor = ''
            mouseX = e.clientX - offsetX
            mouseY = e.clientY - offsetY
            let hasHovered = false
            for (let i = 0; i < lines.length; i++) {
                let obj = lines[i]
                if (isOnTheLine({
                    x: obj.x1,
                    y: obj.y1
                }, {
                    x: obj.x2,
                    y: obj.y2
                }, mouseX, mouseY, errorRange)) {
                    canvas.style.cursor = 'move'
                    obj.hovered = true
                    hasHovered = true
                } else {
                    obj.hovered = false
                }
            }
            if (me.mouseDown) {
                me.tempLines.length = 0
                let isDrag = false
                for (let i = 0; i < me.lines.length; i++) {
                    let obj = me.lines[i]
                    if (obj.dragponit) {
                        if (obj.dragponit === 1) {
                            me.tempLines.push(JSON.parse(JSON.stringify({x1: mouseX, y1: mouseY, x2: obj.x2,y2: obj.y2, selected: true})))
                        } else {
                            me.tempLines.push(JSON.parse(JSON.stringify({x1: mouseX, y1: mouseY, x2: obj.x2,y2: obj.y2, selected: true})))
                        }
                        isDrag = true
                    } else if (obj.dragline) {
                        me.tempLines.push(JSON.parse(JSON.stringify({x1: obj.x1 + (mouseX - startX),y1:obj.y1 + (mouseY - startY),x2:obj.x2 + (mouseX - startX),y2:obj.y2 + (mouseY - startY), selected: true})))
                        isDrag = true
                    }
                }
                if (!isDrag) {
                    me.tempLines.push(JSON.parse(JSON.stringify({x1:startX,y1:startY,x2:mouseX,y2:mouseY})))
                }
            }
            if (hasHovered || me.tempLines.length) {
                me.drawLines()
                me.tempLines.length = 0
            }
        }
        canvas.onmouseup = function (e) {
            e.stopPropagation()
            e.preventDefault()
            if (me.mouseDown) {
                let isDrag = false
                for (let i = 0; i< me.lines.length; i++) {
                    let obj = me.lines[i]
                    let lineObj
                    if (obj.dragponit) {
                        if (obj.dragponit === 1) {
                            lineObj = {x1: mouseX, y1: mouseY, x2: obj.x2,y2: obj.y2, selected: true}
                            lines[i] = lineObj
                        } else {
                            lineObj = {x1: obj.x1, y1: obj.y1, x2: mouseX,y2: mouseY, selected: true}
                            lines[i] = lineObj
                        }
                        isDrag = true
                    } else if (obj.dragline) {
                        lineObj = {x1: obj.x1 + (mouseX - startX),y1:obj.y1 + (mouseY - startY),x2:obj.x2 + (mouseX - startX),y2:obj.y2 + (mouseY - startY), selected: true}
                        lines[i] = lineObj
                        isDrag = true
                    }
                    if (lineObj) {
                        try {
                            let before = JSON.parse(JSON.stringify(obj))
                            let after = JSON.parse(JSON.stringify(lineObj))
                            me.updateHanlder(before, after, i)
                            me.changeMap[i] = {
                                before: before,
                                after: after
                            }
                        } catch (e) {
                            console.log(e)
                        }
                    }
                }
                if (!isDrag && !(Math.abs(startX - mouseX) <= 10 * errorRange && Math.abs(startY - mouseY) <= 10 * errorRange)) {
                    me.lines.push({x1:startX,y1:startY,x2:mouseX,y2:mouseY})
                }
                // me.stackOperations.push(JSON.parse(JSON.stringify(me.lines)))
                me.drawLines()
            }
            me.mouseDown = false
        }
    }

    drawLines () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        for (var i = 0; i < this.lines.length; i++) {
            this.drawLine(this.lines[i])
        }
        for (var i = 0; i < this.tempLines.length; i++) {
            this.drawLine(this.tempLines[i])
        }
    }

    drawLine (line) {
        if (line.removed) {
            return
        }
        let ctx = this.ctx
        ctx.beginPath()
        if (line.hovered) {
            ctx.strokeStyle = this.hoverColor
        } else {
            ctx.strokeStyle = this.drawColor
        }
        ctx.setLineDash([])
        if (line.dragponit || line.dragline) {
            ctx.setLineDash([this.lineWidth * 4, this.lineWidth * 3])
        }
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.stroke()
        if (line.selected) {
            ctx.beginPath()
            if (line.hovered) {
                ctx.fillStyle = this.hoverColor
            } else {
                ctx.fillStyle = this.drawColor
            }
            ctx.arc(line.x1, line.y1, this.lineWidth * 2, 0, 2 * Math.PI)
            ctx.arc(line.x2, line.y2, this.lineWidth * 2, 0, 2 * Math.PI)
            ctx.fill()
        }
    }

    removeSelectedLines () {
        for (let i = 0; i< this.lines.length; i++) {
            let line = this.lines[i]
            if (line.selected) {
                line.removed = true
            }
        }
        this.drawLines()
    }

    getChangeLines () {
        return this.changeMap
    }

    // goBack () {
    //     let lines = this.stackOperations.pop()
    //     this.lines.length = lines && lines.length || 0
    //     this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    //     if (lines) {
    //         for (let i = 0; i< lines.length; i++) {
    //             this.drawLine(lines[i])
    //         }
    //     }
    // }
}

export default LineEditor