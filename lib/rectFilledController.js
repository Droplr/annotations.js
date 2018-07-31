import { fabric } from 'fabric';

class RectFilled {
  constructor(options = {}) {
    this.mouseStartPosition = null;
    this.mousePosition = null;
    this.isMouseDown = false;
    this.options = options;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;
    this.options.fillColor = this.options.fillColor || '#000';

    this.rect = new fabric.Rect({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      strokeWidth: 5 * this.options.scale,
      stroke: this.options.fillColor,
      fill: this.options.fillColor,
      noScaleCache: false,
      transparentCorners: false,
      cornerSize: 20,
    });

    this.options.layer.canvas.isDrawingMode = false;

    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onScaling = this.onScaling.bind(this);
  }

  setFillColor(color) {
    this.options.fillColor = color;
  }

  delete() {
    this.options.layer.canvas.remove(this.rect);
  }

  onMouseDown(o) {
    this.isMouseDown = true;
    this.mouseStartPosition = this.options.layer.canvas.getPointer(o.e);
    this.rect.set({
      left: this.mouseStartPosition.x,
      top: this.mouseStartPosition.y,
    });
    this.options.layer.canvas.add(this.rect);
  }

  onMouseMove(o) {
    if (!this.isMouseDown) return;
    this.mousePosition = this.options.layer.canvas.getPointer(o.e);
    this.rect.set({
      width: Math.abs(this.mousePosition.x - this.mouseStartPosition.x),
      height: Math.abs(this.mousePosition.y - this.mouseStartPosition.y),
    });

    if (this.mouseStartPosition.x > this.mousePosition.x) {
      this.rect.set({
        left: this.mousePosition.x,
      });
    }

    if (this.mouseStartPosition.y > this.mousePosition.y) {
      this.rect.set({
        top: this.mousePosition.y,
      });
    }

    this.options.layer.canvas.renderAll();
  }

  onMouseUp() {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    this.rect.setCoords();

    this.rect.on('scaling', (o) => {
      this.onScaling(o);
    });

    this.options.layer.canvas.setActiveObject(this.rect);
    this.options.layer.canvas.trigger('object:modified', {target: this.rect});
  }

  onScaling() {
    this.rect.set({
      width: this.rect.width * this.rect.scaleX,
      height: this.rect.height * this.rect.scaleY,
      scaleX: 1,
      scaleY: 1,
    });
  }
}

export default RectFilled;
