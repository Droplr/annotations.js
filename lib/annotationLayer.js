import { fabric } from 'fabric';
import Arrow from './arrowController';
import RectEmpty from './rectEmptyController';
import EllipseEmpty from './ellipseEmptyController';
import Line from './lineController';
import Pencil from './pencilController';
import Highlight from './highlightController';
import Blur from './blurController';
import Text from './textController';

class AnnotationLayer {
  constructor(options = {}) {
    this.options = options;
    this.activeControl = null;
    this.selectedObject = null;

    const { element, image, imagePixelRatio = 1.0 } = this.options;

    if (!element || !image) throw new Error('"element" and "image" must be specified');

    this.blurCanvas = new fabric.Canvas(document.createElement('canvas'));
    this.canvas = new fabric.Canvas(element, { selection: false });
    this.canvas.perPixelTargetFind = true;
    this.canvas.uniScaleTransform = true;
    this.onCanvasEvents();
    this.calculateSize();

    this.canvas.setBackgroundImage(
      image,
      () => {this.canvas.renderAll();},
      {
        originX: 'center',
        originY: 'center',
        top: this.canvas.height / 2,
        left: this.canvas.width / 2,
        scaleX: 1.0 / imagePixelRatio,
        scaleY: 1.0 / imagePixelRatio,
      }
    );

    fabric.Image.fromURL(image, (img) => {
      img.filters.push(new fabric.Image.filters.Pixelate({
        blocksize: parseInt(8 * window.devicePixelRatio),
      }));
      img.applyFilters();
      this.blurCanvas.setBackgroundImage(
        img,
        () => {this.canvas.renderAll();},
        {
          originX: 'center',
          originY: 'center',
          top: this.canvas.height / 2,
          left: this.canvas.width / 2,
          scaleX: 1.0 / imagePixelRatio,
          scaleY: 1.0 / imagePixelRatio,
        }
      );
    });

    this.onCanvasEvents = this.onCanvasEvents.bind(this);
    this.delete = this.delete.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.handleKeypress = this.handleKeypress.bind(this);

    document.addEventListener('keydown', this.handleKeypress, false);
    // window.addEventListener('resize', this.updateDimensions, false);
    // setTimeout(this.updateDimensions, 100);
  }

  onCanvasEvents() {
    if (!this.canvas) return;

    this.canvas.on('mouse:down', (o) => {
      if (this.selectedObject) return;

      if (!this.activeControl) return;

      // We create a new version of our active control on mouse down.
      if (this.activeControl instanceof Arrow) {
        this.activeControl = new Arrow(this.activeControl.options);
      }
      if (this.activeControl instanceof Line) {
        this.activeControl = new Line(this.activeControl.options);
      }
      if (this.activeControl instanceof RectEmpty) {
        this.activeControl = new RectEmpty(this.activeControl.options);
      }
      if (this.activeControl instanceof EllipseEmpty) {
        this.activeControl = new EllipseEmpty(this.activeControl.options);
      }
      if (this.activeControl instanceof Pencil) {
        this.activeControl = new Pencil(this.activeControl.options);
      }
      if (this.activeControl instanceof Highlight) {
        this.activeControl = new Highlight(this.activeControl.options);
      }
      if (this.activeControl instanceof Blur) {
        this.activeControl = new Blur(this.activeControl.options);
      }
      if (this.activeControl instanceof Text) {
        this.activeControl = new Text(this.activeControl.options);
      }

      if (this.activeControl.onMouseDown) {
        this.activeControl.onMouseDown(o);
      }
    });

    this.canvas.on('mouse:move', (o) => {
      if (this.selectedObject && this.selectedObject.onMouseMove) {
        this.selectedObject.onMouseMove(o);
      } else if (this.activeControl && this.activeControl.onMouseMove) {
        this.activeControl.onMouseMove(o);
      }
    });

    this.canvas.on('mouse:up', (o) => {
      // Don't trigger mouse up if we've got a text object.
      if (this.selectedObject && this.selectedObject.fontFamily) return;

      if (this.selectedObject && this.selectedObject.onMouseUp) {
        this.selectedObject.onMouseUp(o);
      } else if (this.activeControl && this.activeControl.onMouseUp) {
        this.activeControl.onMouseUp(o);
      }
    });

    this.canvas.on('object:scaling', (o) => {
      if (this.selectedObject && this.selectedObject.onScaling) {
        this.selectedObject.onScaling(o);
      }
    });

    this.canvas.on('object:moving', (o) => {
      if (this.selectedObject && this.selectedObject.onMoving) {
        this.selectedObject.onMoving(o);
      }
    });

    this.canvas.on('object:selected', (o) => {
      this.selectedObject = o.target;
    });

    this.canvas.on('selection:cleared', (o) => {
      this.selectedObject = null;
    });
  }

  delete() {
    const activeObject = this.canvas.getActiveObject();

    if (activeObject) {
      // Don't remove the text object while editing it.
      if (activeObject.isEditing) return;

      if (activeObject.delete) {
        activeObject.delete();
      } else {
        this.canvas.remove(activeObject);
      }
    } else if (this.selectedObject && this.selectedObject.delete) {
      this.selectedObject.delete();
    }

    this.canvas.renderAll();
  }

  imageDataURL(type) {
    const options = { format: 'png' };
    if (type === 'jpg') {
      options.format = 'jpg';
      options.quality = 1;
    }
    const dataUrl = this.canvas.toDataURL(options);
    this.calculateSize();
    return dataUrl;
  }

  calculateSize() {
    const { clientWidth, clientHeight } = this.canvas.wrapperEl.parentElement;
    const width = clientWidth;
    const height = clientHeight;

    this.canvas.setWidth(clientWidth).setHeight(clientHeight);
    this.blurCanvas.setWidth(clientWidth).setHeight(clientHeight);
    this.options.element.style.width = clientWidth;
    this.options.element.style.height = clientHeight;

    const nodeList = document.querySelectorAll('.upper-canvas, .canvas-container, #editor');
    for (let i = 0; i < nodeList.length; i++) {
      nodeList[i].style.width = clientWidth;
      nodeList[i].style.height = clientHeight;
    }
  }

  updateDimensions() {
    const canvasContainer = document.querySelector('.canvas-container');
    const editorWrapper = document.getElementById('editor-wrapper');
    const wrapperHeight = editorWrapper.clientHeight;
    const canvasHeight = canvasContainer.clientHeight;
    const wrapperWidth = editorWrapper.clientWidth;
    const canvasWidth = document.getElementById('editor').clientWidth;

    const ws = wrapperWidth / canvasWidth;
    const hs = wrapperHeight / canvasHeight;

    const scale = Math.min(ws, hs);

    canvasContainer.classList.add('ready');

    if (wrapperHeight > canvasHeight && wrapperWidth > canvasWidth) {
      canvasContainer.style.transform = 'none';
      canvasContainer.style.transformOriginX = 'inherit';
      canvasContainer.classList.remove('scaled');
    } else {
      canvasContainer.style.transform = `scale(${scale})`;
      canvasContainer.style.transformOriginX = ws < hs ? '0' : 'inherit';
      canvasContainer.classList.add('scaled');
    }
  }

  handleKeypress(e) {
    if (e.keyCode === 46 || e.keyCode === 8) {
      return this.delete();
    }
    return null;
  }
}

export default AnnotationLayer;
