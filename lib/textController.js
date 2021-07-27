import { fabric } from 'fabric';

class Text {
  constructor(options = {}) {
    this.mouseStartPosition = null;
    this.isMouseDown = false;
    this.options = options;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;
    this.options.fillColor = this.options.fillColor || '#333';
    this.options.fontSize = this.options.fontSize || 48;
    this.options.fontFamily = this.options.fontFamily || 'Helvetica';
    this.options.fontWeight = this.options.fontWeight || 'bold';
    this.options.borderWidth = this.options.borderWidth || 10;
    this.options.borderColor = this.options.borderColor || '#FFF';

    this.text = new fabric.IText('', {
      top: 0,
      left: 0,
      padding: 1,
      fill: this.options.fillColor,
      fontSize: this.options.fontSize * this.options.scale,
      fontFamily: this.options.fontFamily,
      fontWeight: this.options.fontWeight,
      stroke: this.options.fillColor.toLowerCase().includes('#fff') ? '#484646' : this.options.borderColor,
      strokeWidth: this.options.borderWidth,
      strokeLineJoin: 'round',
      noScaleCache: false,
    });

    if (this.options.shadowWidth || this.options.shadowColor) {
      this.text.setShadow({
        color: this.options.shadowColor || '#000',
        blur: (this.options.shadowWidth || 0) * this.options.scale,
        offsetX: 0,
        offsetY: 0,
      });
    }

    this.text.setControlVisible('mtr', false);
    this.text.setControlVisible('mt', false);
    this.text.setControlVisible('ml', false);
    this.text.setControlVisible('mr', false);
    this.text.setControlVisible('mb', false);
    this.text.setControlVisible('tl', false);
    this.text.setControlVisible('tr', false);
    this.text.setControlVisible('br', false);
    this.text.setControlVisible('bl', false);

    this.options.layer.canvas.isDrawingMode = false;

    this.setFontSize = this.setFontSize.bind(this);
    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  setFontSize(fontSize) {
    this.options.fontSize = fontSize;
  }

  setFillColor(color) {
    this.options.fillColor = color;
  }

  delete() {
    this.options.layer.canvas.remove(this.text);
  }

  onMouseUp(o) {
    this.mouseStartPosition = this.options.layer.canvas.getPointer(o.e);

    this.text.set({
      left: this.mouseStartPosition.x,
      top: this.mouseStartPosition.y,
    });
    this.text.setCoords();
    this.options.layer.canvas.add(this.text);
    this.options.layer.canvas.setActiveObject(this.text);
    this.text.enterEditing();
    this.options.layer.canvas.renderAll();
  }
}

export default Text;
