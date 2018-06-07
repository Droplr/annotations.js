import { fabric } from 'fabric';
import Arrow from './arrowController';
import RectEmpty from './rectEmptyController';
import EllipseEmpty from './ellipseEmptyController';
import Line from './lineController';
import Pencil from './pencilController';
import Blur from './blurController';
import Text from './textController';

class AnnotationLayer {
  constructor(options = {}) {
    this.options = options;
    this.activeControl = null;
    this.selectedObject = null;
    this.canvas = null;
    this.blurCanvas = new fabric.Canvas(document.createElement('canvas'));

    if (this.options.element) {
      this.canvas = new fabric.Canvas(this.options.element, { selection: false });
      this.canvas.perPixelTargetFind = true;
      this.canvas.uniScaleTransform = true;
      this.onCanvasEvents();
    }

    if (this.options.image) {
      this.canvas.setBackgroundImage(this.options.image, () => {
        this.canvas.renderAll();
        this.calculateSize();

        fabric.Image.fromURL(this.options.image, (img) => {
          img.filters.push(new fabric.Image.filters.Pixelate({
            blocksize: parseInt(8 * window.devicePixelRatio),
          }));
          img.applyFilters();
          this.blurCanvas.setBackgroundImage(img);
          this.blurCanvas.renderAll();
        });
      },
      {
        scaleX: 1.0,
        scaleY: 1.0,
      });
    }

    this.onCanvasEvents = this.onCanvasEvents.bind(this);
    this.delete = this.delete.bind(this);
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
      if (this.activeControl instanceof Blur) {
        this.activeControl = new Blur(this.activeControl.options);
      }
      if (this.activeControl instanceof Text) {
        this.activeControl = new Text(this.activeControl.options);
      }

      if (this.activeControl._onMouseDown) {
        this.activeControl._onMouseDown(this, o);
      }
    });

    this.canvas.on('mouse:move', (o) => {
      if (this.selectedObject && this.selectedObject._onMouseMove) {
        this.selectedObject._onMouseMove(this, o);
      } else if (this.activeControl && this.activeControl._onMouseMove) {
        this.activeControl._onMouseMove(this, o);
      }
    });

    this.canvas.on('mouse:up', (o) => {
      // Don't trigger mouse up if we've got a text object.
      if (this.selectedObject && this.selectedObject.fontFamily) return;

      if (this.selectedObject && this.selectedObject._onMouseUp) {
        this.selectedObject._onMouseUp(this, o);
      } else if (this.activeControl && this.activeControl._onMouseUp) {
        this.activeControl._onMouseUp(this, o);
      }
    });

    this.canvas.on('object:scaling', (o) => {
      if (this.selectedObject && this.selectedObject._onScaling) {
        this.selectedObject._onScaling(this, o);
      } else if (this.activeControl && this.activeControl._onScaling) {
        this.activeControl._onScaling(this, o);
      }
    });

    this.canvas.on('object:moving', (o) => {
      if (this.selectedObject && this.selectedObject._onMoving) {
        this.selectedObject._onMoving(this, o);
      } else if (this.activeControl && this.activeControl._onMoving) {
        this.activeControl._onMoving(this, o);
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
    const { width, height } = this.canvas.backgroundImage;

    this.canvas.setWidth(width).setHeight(height);
    this.blurCanvas.setWidth(width).setHeight(height);
    this.options.element.style.width = `${width / (this.options.imagePixelRatio || window.devicePixelRatio)}px`;
    this.options.element.style.height = `${height / (this.options.imagePixelRatio || window.devicePixelRatio)}px`;

    document.querySelectorAll('.upper-canvas, .canvas-container, #edit-image').forEach((el) => {
      el.style.width = `${width / (this.options.imagePixelRatio || window.devicePixelRatio)}px`;
      el.style.height = `${height / (this.options.imagePixelRatio || window.devicePixelRatio)}px`;
    });
  }
}

export default AnnotationLayer;
