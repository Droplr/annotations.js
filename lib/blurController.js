import { fabric } from 'fabric';

class Blur {
  constructor(options = {}) {
    this.mouseStartPosition = null;
    this.mousePosition = null;
    this.isMouseDown = false;
    this.options = options;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;

    this.blur = new fabric.Rect({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      fill: 'transparent',
      noScaleCache: false,
      transparentCorners: false,
      cornerSize: 30,
    });
    this.blur.setControlVisible('mtr', false);

    this.options.layer.canvas.isDrawingMode = false;

    this.delete = this.delete.bind(this);
    this.createBlur = this.createBlur.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onScaling = this._onScaling.bind(this);
    this._onMoving = this._onMoving.bind(this);
  }

  delete() {
    this.options.layer.canvas.remove(this.blur);
  }

  createBlur() {
    const { left, top, width, height } = this.blur;
    const base64 = this.options.layer.blurCanvas.toDataURL({
      format: 'jpeg',
      left,
      top,
      width,
      height,
    });

    fabric.util.loadImage(base64, (img) => {
      this.blur.setPatternFill({
        source: img,
        repeat: 'no-repeat',
      });
      this.blur.setCoords();
      this.options.layer.canvas.renderAll();
    });
  }

  _onMouseDown(layer, o) {
    this.isMouseDown = true;
    this.mouseStartPosition = layer.canvas.getPointer(o.e);
    this.blur.set({
      left: this.mouseStartPosition.x,
      top: this.mouseStartPosition.y,
    });
    layer.canvas.add(this.blur);
    layer.canvas.renderAll();
  }

  _onMouseMove(layer, o) {
    if (!this.isMouseDown) return;

    this.mousePosition = layer.canvas.getPointer(o.e);
    this.blur.set({
      width: Math.abs(this.mousePosition.x - this.mouseStartPosition.x),
      height: Math.abs(this.mousePosition.y - this.mouseStartPosition.y),
    });

    if(this.mouseStartPosition.x > this.mousePosition.x){
      this.blur.set({
        left: this.mousePosition.x,
      });
    }

    if(this.mouseStartPosition.y > this.mousePosition.y){
      this.blur.set({
        top: this.mousePosition.y,
      });
    }

    this.createBlur();
  }

  _onMouseUp(layer, o) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    this.mousePosition = layer.canvas.getPointer(o.e);
    this.createBlur();
    layer.canvas.setActiveObject(this.blur);
  }

  _onScaling() {
    this.blur.set({
      width: this.blur.width * this.blur.scaleX,
      height: this.blur.height * this.blur.scaleY,
      scaleX: 1,
      scaleY: 1,
    });

    this.createBlur();
  }

  _onMoving() {
    this.createBlur();
  }
}

export default Blur;
