import { fabric } from 'fabric';

class RectEmpty {
  constructor(options = {}) {
    this.mouseStartPosition = null;
    this.mousePosition = null;
    this.isMouseDown = false;
    this.options = options;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;
    this.options.borderColor = this.options.borderColor || '#000';

    this.rect = new fabric.Rect({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      strokeWidth: 5 * this.options.scale,
      stroke: this.options.borderColor,
      fill: 'transparent',
      noScaleCache: false,
      transparentCorners: false,
      cornerSize: 30,
    });

    this.options.layer.canvas.isDrawingMode = false;

    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onScaling = this._onScaling.bind(this);
  }

  setFillColor(color) {
    this.options.borderColor = color;
  }

  delete() {
    this.options.layer.canvas.remove(this.rect);
  }

  _onMouseDown(layer, o) {
    this.isMouseDown = true;
    this.mouseStartPosition = layer.canvas.getPointer(o.e);
    this.rect.set({
      left: this.mouseStartPosition.x,
      top: this.mouseStartPosition.y,
    });
    layer.canvas.add(this.rect);
  }

  _onMouseMove(layer, o) {
    if (!this.isMouseDown) return;
    this.mousePosition = layer.canvas.getPointer(o.e);
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

    layer.canvas.renderAll();
  }

  _onMouseUp(layer) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    this.rect.setCoords();
    layer.canvas.setActiveObject(this.rect);
  }

  _onScaling() {
    this.rect.set({
      width: this.rect.width * this.rect.scaleX,
      height: this.rect.height * this.rect.scaleY,
      scaleX: 1,
      scaleY: 1,
    });
  }
}

export default RectEmpty;
