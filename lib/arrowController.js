import { fabric } from 'fabric';

class Arrow {
  constructor(options = {}) {
    this.mousePosition = null;
    this.isMouseDown = false;
    this.isDrawing = false;
    this.options = options;
    this.group = null;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;
    this.options.fillColor = this.options.fillColor || '#000';

    this.line = new fabric.Line([0, 0, 0, 0], {
      stroke: this.options.fillColor,
      selectable: true,
      strokeWidth: 5 * this.options.scale,
      hasBorders: false,
      hasControls: false,
      originX: 'center',
      originY: 'center',
      lockScalingX: true,
      lockScalingY: true,
      fragment: 'arrow',
    });

    this.arrow = new fabric.Triangle({
      originX: 'center',
      originY: 'center',
      hasBorders: false,
      hasControls: false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      angle: -45,
      width: 20 * this.options.scale,
      height: 20 * this.options.scale,
      fill: this.options.fillColor,
      fragment: 'arrow',
    });

    this.line.delete = () => this.delete();
    this.arrow.delete = () => this.delete();

    this.options.layer.canvas.isDrawingMode = false;

    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this.moveEnd = this.moveEnd.bind(this);
    this.moveLine = this.moveLine.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  setFillColor(color) {
    this.options.fillColor = color;
  }

  delete() {
    this.options.layer.canvas.remove(this.line);
    this.options.layer.canvas.remove(this.arrow);
    this.options.layer.canvas.remove(this.group);
  }

  static calcArrowAngle(x1, y1, x2, y2) {
    let angle = 0;

    const x = (x2 - x1);
    const y = (y2 - y1);

    if (x === 0) {
      angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
    } else if (y === 0) {
      angle = (x > 0) ? 0 : Math.PI;
    } else {
      angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
    }

    return (angle * 180 / Math.PI) - 90;
  }

  moveEnd() {
    this.line.set({
      x2: this.arrow.left,
      y2: this.arrow.top,
    });
    this.line._setWidthHeight();
    this.line.setCoords();

    this.arrow.set('angle', Arrow.calcArrowAngle(this.line.x2, this.line.y2, this.line.x1, this.line.y1));
  }

  moveLine() {
    const oldCenterX = (this.line.x1 + this.line.x2) / 2;
    const oldCenterY = (this.line.y1 + this.line.y2) / 2;
    const deltaX = this.line.left - oldCenterX;
    const deltaY = this.line.top - oldCenterY;

    this.arrow.set({
      left: this.line.x2 + deltaX,
      top: this.line.y2 + deltaY,
    }).setCoords();

    this.line.set({
      x1: this.line.x1 + deltaX,
      y1: this.line.y1 + deltaY,
      x2: this.line.x2 + deltaX,
      y2: this.line.y2 + deltaY,
    });

    this.line.set({
      left: (this.line.x1 + this.line.x2) / 2,
      top: (this.line.y1 + this.line.y2) / 2,
    });
  }

  onMouseDown(o) {
    this.isMouseDown = true;
    this.mousePosition = this.options.layer.canvas.getPointer(o.e);
    this.line.set({
      x1: this.mousePosition.x,
      y1: this.mousePosition.y,
      x2: this.mousePosition.x,
      y2: this.mousePosition.y,
    }).setCoords();

    this.arrow.set({
      left: this.mousePosition.x,
      top: this.mousePosition.y,
    }).setCoords();
  }

  onMouseMove(o) {
    if (!this.isMouseDown) return;
    this.mousePosition = this.options.layer.canvas.getPointer(o.e);

    this.line.set({
      x2: this.mousePosition.x,
      y2: this.mousePosition.y,
    }).setCoords();

    this.arrow.set({
      left: this.line.x2,
      top: this.line.y2,
      angle: Arrow.calcArrowAngle(this.line.x2, this.line.y2, this.line.x1, this.line.y1),
    }).setCoords();

    if (!this.isDrawing) {
      this.options.layer.canvas.add(this.line, this.arrow);
      this.isDrawing = true;
    }

    this.options.layer.canvas.renderAll();
  }

  onMouseUp() {
    if (!this.isMouseDown) return;

    this.isMouseDown = false;

    this.arrow.on('moving', (o) => {
      this.moveEnd(o);
    });

    this.line.on('moving', (o) => {
      this.moveLine(o);
    });

    this.group = new fabric.Group([this.line, this.arrow], {
      hasBorders: false,
      hasControls: false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
    });
    this.group.delete = () => this.delete();
    this.options.layer.canvas.add(this.group);
    this.options.layer.canvas.setActiveObject(this.line);
  }
}

export default Arrow;
