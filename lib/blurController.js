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
      cornerSize: 20,
    });
    this.blur.setControlVisible('mtr', false);

    this.options.layer.canvas.isDrawingMode = false;

    this.delete = this.delete.bind(this);
    this.createBlur = this.createBlur.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onScaling = this.onScaling.bind(this);
    this.onMoving = this.onMoving.bind(this);
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

    const getBase64FromUrl = async (url) => {
      const data = await fetch(url);
      const blob = await data.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = () => {
          const base64data = reader.result;   
          resolve(base64data);
        }
      });
    }

    getBase64FromUrl(this.options.blurPath + '/assets/images/blur2.png').then((res)=>{
      fabric.util.loadImage(res || base64, (img) => {
        this.blur.setPatternFill({
          source: img,
          repeat: 'repeat',
        });
        this.blur.setCoords();
        this.options.layer.canvas.renderAll();
      });
    })
  }

  onMouseDown(o) {
    this.isMouseDown = true;
    this.mouseStartPosition = this.options.layer.canvas.getPointer(o.e);
    this.blur.set({
      left: this.mouseStartPosition.x,
      top: this.mouseStartPosition.y,
    });
    this.options.layer.canvas.add(this.blur);
    this.options.layer.canvas.renderAll();
  }

  onMouseMove(o) {
    if (!this.isMouseDown) return;

    this.mousePosition = this.options.layer.canvas.getPointer(o.e);
    this.blur.set({
      width: Math.abs(this.mousePosition.x - this.mouseStartPosition.x),
      height: Math.abs(this.mousePosition.y - this.mouseStartPosition.y),
    });

    if (this.mouseStartPosition.x > this.mousePosition.x) {
      this.blur.set({
        left: this.mousePosition.x,
      });
    }

    if (this.mouseStartPosition.y > this.mousePosition.y) {
      this.blur.set({
        top: this.mousePosition.y,
      });
    }

    this.createBlur();
  }

  onMouseUp(o) {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    this.mousePosition = this.options.layer.canvas.getPointer(o.e);
    this.createBlur();

    this.blur.on('moving', (o) => {
      this.onMoving(o);
    });

    this.blur.on('scaling', (o) => {
      this.onScaling(o);
    });

    this.options.layer.canvas.setActiveObject(this.blur);
    this.options.layer.canvas.sendToBack(this.blur);
  }

  onScaling() {
    this.blur.set({
      width: this.blur.width * this.blur.scaleX,
      height: this.blur.height * this.blur.scaleY,
      scaleX: 1,
      scaleY: 1,
      flipY: false,
      flipX: false,
    });

    this.createBlur();
  }

  onMoving() {
    this.createBlur();
  }
}

export default Blur;
