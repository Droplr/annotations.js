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
      strokeLineCap: 'round',
    });

    this.options.layer.canvas.isDrawingMode = false;

    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  setFillColor(color) {
    this.options.fillColor = color;
  }

  delete() {
    this.options.layer.canvas.remove(this.line);
  }

  onMouseDown(o) {
    this.isMouseDown = true;
    this.mouseStartPosition = this.options.layer.canvas.getPointer(o.e);

    this.line.set({
      x1: this.mouseStartPosition.x,
      y1: this.mouseStartPosition.y,
      x2: this.mouseStartPosition.x,
      y2: this.mouseStartPosition.y,
    }).setCoords();

    this.options.layer.canvas.add(this.line);
  }

  onMouseMove(o) {
    if (!this.isMouseDown) return;
    this.mousePosition = this.options.layer.canvas.getPointer(o.e);

    this.line.set({
      x2: this.mousePosition.x,
      y2: this.mousePosition.y,
    }).setCoords();

    this.options.layer.canvas.renderAll();
  }

  onMouseUp() {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    this.options.layer.canvas.setActiveObject(this.line);
    this.options.layer.canvas.trigger('object:modified', {target: this.line});
  }
}

export default Line;
