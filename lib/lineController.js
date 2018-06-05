import { fabric } from 'fabric';

class Line {
  constructor(options = {}) {
    this.mouseStartPosition = null;
    this.mousePosition = null;
    this.isMouseDown = false;
    this.options = options;
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
      className   : this,
      strokeLineCap: 'round',
    });

    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  setFillColor(color) {
    this.options.fillColor = color;
  }

  delete() {
    this.line.remove();
  }

  _onMouseDown(layer, o) {
    this.isMouseDown = true;
    this.mouseStartPosition = layer.canvas.getPointer(o.e);

    this.line.set({
      x1: this.mouseStartPosition.x,
      y1: this.mouseStartPosition.y,
      x2: this.mouseStartPosition.x,
      y2: this.mouseStartPosition.y,
    }).setCoords();

    layer.canvas.add(this.line);
  }

  _onMouseMove(layer, o) {
    if (!this.isMouseDown) return;
    this.mousePosition = layer.canvas.getPointer(o.e);

    this.line.set({
      x2: this.mousePosition.x,
      y2: this.mousePosition.y,
    }).setCoords();

    layer.canvas.renderAll();
  }

  _onMouseUp() {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
  }
}

export default Line;
