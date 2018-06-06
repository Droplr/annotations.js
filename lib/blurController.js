import { fabric } from 'fabric';

class Blur {
  constructor(options = {}) {
    this.mouseStartPosition = null;
    this.mousePosition = null;
    this.isMouseDown = false;
    this.options = options;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;
    this.options.borderColor = this.options.borderColor || '#000';
    this.options.borderWidth = this.options.borderWidth || 5;

    this.blur = new fabric.Rect({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      strokeWidth: this.options.borderWidth * this.options.scale,
      stroke: this.options.borderColor,
      fill: 'transparent',
      noScaleCache: false,
      transparentCorners: false,
      cornerSize: 30,
    });

    this.blur.setControlVisible('mtr', false);
    this.blur.setControlVisible('mt', false);
    this.blur.setControlVisible('ml', false);
    this.blur.setControlVisible('mr', false);
    this.blur.setControlVisible('mb', false);

    this.options.layer.canvas.isDrawingMode = false;

    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onScaling = this._onScaling.bind(this);
    this._onMoving = this._onMoving.bind(this);
  }

  setFillColor(color) {
    this.options.borderColor = color;
  }

  delete() {
    this.options.layer.canvas.remove(this.blur);
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

    layer.canvas.renderAll();
  }

  _onMouseUp(layer, o) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;

    this.mousePosition = layer.canvas.getPointer(o.e);
    this.blur.setCoords();
    layer.canvas.setActiveObject(this.blur);

    const base64 = layer.tempCanvas.toDataURL({
      format: 'jpeg',
      left: this.blur.left,
      top: this.blur.top,
      width: this.blur.witdh,
      height: this.blur.height,
    });

    layer.canvas.remove(this.blur);

    const ImageObj = new Image();
    ImageObj.loaded = true;
    ImageObj.onload = () => {
      if (ImageObj.loaded) {
        const img = new fabric.Image(ImageObj);
        img.original_object = ImageObj;
        img.set({
          left: this.blur.left,
          top: this.blur.top,
        });
        ImageObj.loaded = false;

        this.blur = img;
        this.blur.setControlVisible('mtr', false);
        this.blur.setControlVisible('mt', false);
        this.blur.setControlVisible('ml', false);
        this.blur.setControlVisible('mr', false);
        this.blur.setControlVisible('mb', false);

        layer.canvas.add(this.blur).renderAll();
        layer.canvas.setActiveObject(this.blur).sendToBack(this.blur).renderAll();
      }
    };
    ImageObj.src = base64;

    layer.canvas.setActiveObject(this.blur);
  }

  _onScaling(layer, o) {
    if (!o) return;
    this.mousePosition = layer.canvas.getPointer(o.e);

    const base64 = layer.tempCanvas.toDataURL({
      format: 'jpeg',
      left: o.target.left+2,
      top: o.target.top+2,
      width: o.target.getWidth(),
      height: o.target.getHeight(),
    });
    this.blur.original_object.src = base64;
  }

  _onMoving(layer, o) {
    if (!o) return;
    this.mousePosition = layer.canvas.getPointer(o.e);

    const base64 = layer.tempCanvas.toDataURL({
      format: 'jpeg',
      left: o.target.left+2,
      top: o.target.top+2,
      width: o.target.getWidth(),
      height: o.target.getHeight(),
    });
    this.blur.original_object.src = base64;
  }
}

export default Blur;
