import { fabric } from 'fabric';

class Pencil {
  constructor(options = {}) {
    this.options = options;
    this.options.size = this.options.size || 5;
    this.options.fillColor = this.options.fillColor || '#000';

    this.options.layer.canvas.isDrawingMode = true;
    this.options.layer.canvas.freeDrawingBrush.color = this.options.fillColor;
    this.options.layer.canvas.freeDrawingBrush.width = this.options.size;

    this.setFillColor = this.setFillColor.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  setFillColor(color) {
    this.options.fillColor = color;
  }

  _onMouseUp(layer) {
    const size = layer.canvas.size();
    const obj = layer.canvas.item(size - 1);

    obj.setControlVisible('mtr', false);
    obj.setControlVisible('mt', false);
    obj.setControlVisible('ml', false);
    obj.setControlVisible('mr', false);
    obj.setControlVisible('mb', false);
    obj.setControlVisible('bl', false);
    obj.setControlVisible('br', false);
    obj.setControlVisible('tl', false);
    obj.setControlVisible('tr', false);

    this.options.layer.canvas.isDrawingMode = false;
  }
}

export default Pencil;
