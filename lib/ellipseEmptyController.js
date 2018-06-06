import { fabric } from 'fabric';

class EllipseEmpty {
  constructor(options = {}) {
    this.mouseStartPosition = null;
    this.mousePosition = null;
    this.isMouseDown = false;
    this.options = options;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;
    this.options.borderColor = this.options.borderColor || '#000';

    this.ellipse = new fabric.Ellipse({
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
    this.ellipse.remove();
  }

  _onMouseDown(layer, o) {
    this.isMouseDown = true;
    this.mouseStartPosition = layer.canvas.getPointer(o.e);
    this.ellipse.set({
      left: this.mouseStartPosition.x,
      top: this.mouseStartPosition.y,
    });
    layer.canvas.add(this.ellipse);
    layer.canvas.renderAll();
  }

  _onMouseMove(layer, o) {
    if (!this.isMouseDown) return;

    this.mousePosition = layer.canvas.getPointer(o.e);

    this.ellipse.set({
      rx: Math.abs(this.mouseStartPosition.x - this.mousePosition.x)/2,
      ry: Math.abs(this.mouseStartPosition.y - this.mousePosition.y)/2,
    });

    if (this.mouseStartPosition.x > this.mousePosition.x) {
      this.ellipse.set({
        left: this.mousePosition.x,
      });
    }

    if (this.mouseStartPosition.y > this.mousePosition.y) {
      this.ellipse.set({
        top: this.mousePosition.y,
      });
    }

    layer.canvas.renderAll();
  }

  _onMouseUp(layer) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    this.ellipse.setCoords();
    layer.canvas.setActiveObject(this.ellipse);
    layer.canvas.renderAll();
  }

  _onScaling() {
    const { width, height, scaleX, scaleY } = this.ellipse;

    this.ellipse.set({
      width,
      height,
      rx: width * scaleX / 2,
      ry: height * scaleY / 2,
      scaleX: 1,
      scaleY: 1,
    });
  }
}

export default EllipseEmpty;
