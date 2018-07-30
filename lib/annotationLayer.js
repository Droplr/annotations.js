import { fabric } from 'fabric';
import Arrow from './arrowController';
import RectEmpty from './rectEmptyController';
import RectFilled from './rectFilledController';
import EllipseEmpty from './ellipseEmptyController';
import EllipseFilled from './ellipseFilledController';
import Line from './lineController';
import Pencil from './pencilController';
import Highlight from './highlightController';
import Blur from './blurController';
import Text from './textController';
import Emoji from './emojiController';

class AnnotationLayer {
  constructor(options = {}) {
    this.options = options;
    this.activeControl = null;
    this.selectedObject = null;
    this.updateComponent = null;
    this.setCanvasLoadingState = null;

    // Canvas history manipulation
    this.history = {
      state: [],
      currentStateIndex: 0,
      undoAvailable: false,
      redoAvailable: false,
      undoFinished: true,
      redoFinished: true,
    };

    const { element, imageUrl, imagePixelRatio = 1.0 } = this.options;

    if (!element || !imageUrl) throw new Error('"element" and "image" must be specified');

    this.blurCanvas = new fabric.Canvas(document.createElement('canvas'));
    this.canvas = new fabric.Canvas(element, { selection: false });
    this.canvas.perPixelTargetFind = true;
    this.canvas.uniScaleTransform = true;
    this.onCanvasEvents();

    /**
     * Canvas history state functions binding
     * @function initCanvasHistoryState() must be bind before image init
     */
    this.initCanvasHistoryState = this.initCanvasHistoryState.bind(this);
    this.updateCanvasState = this.updateCanvasState.bind(this);
    this.redoAction = this.redoAction.bind(this);
    this.undoAction = this.undoAction.bind(this);

    fabric.Image.fromURL(imageUrl, (img) => {
      this.imageWidth = img.width;
      this.imageHeight = img.height;

      this.calculateSize();

      this.canvas.setBackgroundImage(
        imageUrl,
        () => {this.canvas.renderAll();},
        {
          originX: 'center',
          originY: 'center',
          top: this.canvas.height / 2,
          left: this.canvas.width / 2,
          scaleX: 1.0,
          scaleY: 1.0,
        }
      );

      fabric.Image.fromURL(imageUrl, (img) => {
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
              scaleX: 1.0,
              scaleY: 1.0,
            }
          );

          // Add rendered canvas to history state to be used as base
          this.initCanvasHistoryState();
          if (this.setCanvasLoadingState) this.setCanvasLoadingState(false);
        },
        { crossOrigin: 'Anonymous' }
      );
      },
      { crossOrigin: 'Anonymous' }
    );

    this.onCanvasEvents = this.onCanvasEvents.bind(this);
    this.delete = this.delete.bind(this);
    this.calculateSize = this.calculateSize.bind(this);
    this.handleKeypress = this.handleKeypress.bind(this);
    this.findEdgePoints = this.findEdgePoints.bind(this);

    document.addEventListener('keydown', this.handleKeypress, false);
    window.addEventListener('resize', this.calculateSize, false);
  }

  onCanvasEvents() {
    if (!this.canvas) return;

    this.canvas.on('object:added', (o) => {
      this.updateCanvasState()
    });

    this.canvas.on('object:modified', (o) => {
      this.updateCanvasState();
    });

    this.canvas.on('mouse:down', (o) => {
      // Disable selection if drawing object.
      if (this.canvas.getActiveObjects().length > 0) {
        this.canvas.selection = true;
      } else {
        this.canvas.selection = false;
      }

      // Don't draw new object if shift key is being pressed.
      if (o.e.shiftKey) return;

      // Don't draw new object if existing object has been selected.
      if (this.selectedObject) return;

      // Don't draw new object if no tool was selected.
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
      if (this.activeControl instanceof RectFilled) {
        this.activeControl = new RectFilled(this.activeControl.options);
      }
      if (this.activeControl instanceof EllipseEmpty) {
        this.activeControl = new EllipseEmpty(this.activeControl.options);
      }
      if (this.activeControl instanceof EllipseFilled) {
        this.activeControl = new EllipseFilled(this.activeControl.options);
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
      if (this.activeControl instanceof Emoji) {
        return;
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

    this.canvas.on('selection:created', (o) => {
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

  initCanvasHistoryState() {
    const jsonData = this.canvas.toJSON();
    const canvasAsJson = JSON.stringify(jsonData);
    this.history.state.push(canvasAsJson);
  }

  updateCanvasState() {
    if (!this.history.undoFinished || !this.history.redoFinished) return;

    const jsonData = this.canvas.toJSON();
    const canvasAsJson = JSON.stringify(jsonData);

    if (this.history.currentStateIndex < this.history.state.length - 1) {
      const indexToBeInserted = this.history.currentStateIndex + 1;
      const numberOfElementsToRetain = indexToBeInserted + 1;

      this.history.state[indexToBeInserted] = canvasAsJson;
      this.history.state = this.history.state.splice(0, numberOfElementsToRetain);
      this.history.redoAvailable = true;
    } else {
      this.history.state.push(canvasAsJson);
      this.history.undoAvailable = true;
    }

    // Set current state index
    this.history.currentStateIndex = this.history.state.length - 1;

    // Set Undo availability status
    if (this.history.currentStateIndex > 0 && this.history.state.length > 1) {
      this.history.undoAvailable = true;
    } else {
      this.history.undoAvailable = false;
    }

    // Set Redo availability status
    this.history.redoAvailable = false;

    // Update component if needed
    if (this.updateComponent) this.updateComponent();
  }

  undoAction() {
    // If processing undo action - don't run the script
    if (!this.history.undoFinished || !this.history.undoAvailable) return;

    if (this.history.currentStateIndex === 0) {
      this.history.undoAvailable = false;

      // Update component if needed
      if (this.updateComponent) this.updateComponent();
    }

    if (this.history.currentStateIndex > 0) {
      this.history.undoFinished = false;
      this.history.currentStateIndex -= 1;

      this.canvas.loadFromJSON(
        this.history.state[this.history.currentStateIndex],
        () => {
          this.canvas.renderAll();
          this.history.undoFinished = true;
          this.history.redoAvailable = true;

          // Update component if needed
          if (this.updateComponent) this.updateComponent();
        }
      );
    }
  }

  redoAction() {
    if (!this.history.redoFinished || !this.history.redoAvailable) return;

    this.history.redoFinished = false;
    this.history.currentStateIndex += 1;

    this.canvas.loadFromJSON(
      this.history.state[this.history.currentStateIndex],
      () => {
      this.canvas.renderAll();
      this.history.redoFinished = true;

      if (this.history.currentStateIndex + 1 === this.history.state.length) {
        this.history.redoAvailable = false;
      }
      this.history.undoAvailable = true;

      // Update component if needed
      if (this.updateComponent) this.updateComponent();
    });
  }

  /*
  *   calculateSize()
  *
  * This method sets the proper size for canvas and canvas'es wrapper.
  */
  calculateSize() {
    /*
    * Set the width and the height of the canvas and blurCanvas equal to
    * the original drop image. Set the dimensions to 2500x2500 if the original
    * drop image is smaller.
    */

    const isMobile = document.documentElement.clientWidth < 968;
    const maxCanvasWidth = isMobile ? 1000 : 2500;

    const width = this.imageWidth > maxCanvasWidth ? this.imageWidth : maxCanvasWidth;
    const height = this.imageHeight > maxCanvasWidth ? this.imageHeight : maxCanvasWidth;

    this.canvas.setWidth(width).setHeight(height);
    this.blurCanvas.setWidth(width).setHeight(height);

    const { innerWidth, innerHeight } = window;
    const editorWrapper = document.getElementById('editor-wrapper');
    const canvasContainer = document.querySelector('.canvas-container');

    // If drop image pixel density is set and not equal 1, scale the canvas container.
    if (this.options.imagePixelRatio) {
      canvasContainer.style.transform = `scale(${1 / this.options.imagePixelRatio})`;
    }

    /*
    * If window width is bigger than scaled drop image + 20px margin
    * set the wrapper width to 100%. Else make the wrapper width equal to
    * image width + 20px margin.
    */
    if (innerWidth >= ((this.imageWidth / this.options.imagePixelRatio) + 20)) {
      editorWrapper.style.width = '100%';
    } else if (innerWidth < ((this.imageWidth / this.options.imagePixelRatio) + 20)) {
      editorWrapper.style.width = `${(this.imageWidth / this.options.imagePixelRatio) + 20}px`;
    }

    /*
    * If window height minus header height (80px) is bigger than
    * scaled drop image + 20px margin set the wrapper height to 100%.
    * Else make the wrapper height equal to image height + 20px margin.
    */
    if ((innerHeight - 80) >= ((this.imageHeight / this.options.imagePixelRatio) + 20)) {
      editorWrapper.style.height = `calc(100% - 80px${isMobile ? ' - 50px' : ''})`;
    } else if ((innerHeight - 80) < ((this.imageHeight / this.options.imagePixelRatio) + 20)) {
      editorWrapper.style.height = `${(this.imageHeight / this.options.imagePixelRatio) + 20}px`;
    }
  }

  /*
  *   findEdgePoints()
  *
  * This method will check if there are any annotations outside of the drop image
  * and return an object with 'top', 'left', 'width' and 'height' of the
  * rectangle that we want to crop and upload as the new drop.
  */
  findEdgePoints() {
    const backgroundImage = this.canvas.backgroundImage;
    // Set default edge points equal to the drop image.
    const edgePoints = {
      top: backgroundImage.top - (backgroundImage.height * backgroundImage.scaleY / 2),
      left: backgroundImage.left - (backgroundImage.width * backgroundImage.scaleX / 2),
      width: backgroundImage.width * backgroundImage.scaleX,
      height: backgroundImage.height * backgroundImage.scaleY,
    }
    // Get the number of elements we drew.
    const size = this.canvas.size();
    let item;

    /*
    * Loop through every drawn element and check if the element was drawn
    * outside of the drop image. If so, recalculate edge points so we won't
    * crop those element while saving new drop.
    * If there is an element outside of the drop image add additional 30px margin.
    */
    for (let i = 0; i < size; i++) {
      item = this.canvas.item(i);
      let { top, left, width, height, fragment } = item;

      if (fragment !== 'arrow') {
        if (item.originX === 'center') {
          left = item.left - (item.width / 2);
        }

        if (item.originY === 'center') {
          top = item.top - (item.height / 2);
        }

        if (top < edgePoints.top) {
          let diff = edgePoints.top - top;
          edgePoints.top = top - 30;
          edgePoints.height = edgePoints.height + diff + 30;
        }
        if (left < edgePoints.left) {
          let diff = edgePoints.left - left;
          edgePoints.left = left - 30;
          edgePoints.width = edgePoints.width + diff + 30;
        }
        if (top + height > edgePoints.top + edgePoints.height) {
          let diff = (top + height) - (edgePoints.top + edgePoints.height);
          edgePoints.height = edgePoints.height + diff + 30;
        }
        if (left + width > edgePoints.left + edgePoints.width) {
          let diff = (left + width) - (edgePoints.left + edgePoints.width);
          edgePoints.width = edgePoints.width + diff + 30;
        }
      }
    }

    return edgePoints;
  }

  handleKeypress(e) {
    // Detect hotkeys for Undo and Redo canvas history using keyboard
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 90) {
      if (e.shiftKey) {
        // Redo: CMD/CTRL + SHIFT + Z
        this.redoAction();
      } else {
        // Undo CMD/CTRL + Z
        this.undoAction();
      }
    }

    if (e.keyCode === 46 || e.keyCode === 8) {
      return this.delete();
    }
    return null;
  }
}

export default AnnotationLayer;
