import { fabric } from 'fabric';

class Highlight {
  constructor(options = {}) {
    this.options = options;
    this.options.size = this.options.size || 28;
    this.hexRegExp = /^#[0-9A-F]{6}$/i;
    this.rgbRegExp = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/i;
    this.fillColorRgb = null;

    if (this.options.fillColor) {
      this.setFillColor(this.options.fillColor);
    } else {
      this.options.fillColor = 'rgba(57, 232, 39, 0.3)';
    }

    this.options.layer.canvas.isDrawingMode = true;
    this.options.layer.canvas.freeDrawingBrush.color = this.options.fillColor;
    this.options.layer.canvas.freeDrawingBrush.width = this.options.size;

    this.setFillColor = this.setFillColor.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.hexToRgb = this.hexToRgb.bind(this);
  }

  setFillColor(color) {
    // If fillColor is HEX = convert to RGBA
    if (this.hexRegExp.test(color)) {
      this.fillColorRgb = this.hexToRgb(color);
      this.fillColorRgb = `${this.fillColorRgb.r}, ${this.fillColorRgb.g}, ${this.fillColorRgb.b}`;

      this.options.fillColor = `rgba(${this.fillColorRgb}, 0.3)`;
      this.options.layer.canvas.freeDrawingBrush.color = `rgba(${this.fillColorRgb}, 0.3)`;
    } else if (this.rgbRegExp.test(color)) {
      // If fillColor is RGB = convert to RGBA
      const colors = this.rgbRegExp.exec(color);

      this.options.fillColor = `rgba(${colors[1]}, ${colors[2]}, ${colors[3]}, 0.3)`;
      this.options.layer.canvas.freeDrawingBrush.color = `rgba(${colors[1]}, ${colors[2]}, ${colors[3]}, 0.3)`;
    } else {
      this.options.fillColor = color;
      this.options.layer.canvas.freeDrawingBrush.color = color;
    }
  }

  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  }

  onMouseUp() {
    const size = this.options.layer.canvas.size();
    const obj = this.options.layer.canvas.item(size - 1);

    obj.setControlVisible('mtr', false);
    obj.setControlVisible('mt', false);
    obj.setControlVisible('ml', false);
    obj.setControlVisible('mr', false);
    obj.setControlVisible('mb', false);
    obj.setControlVisible('bl', false);
    obj.setControlVisible('br', false);
    obj.setControlVisible('tl', false);
    obj.setControlVisible('tr', false);

    this.options.layer.canvas.setActiveObject(obj);
  }
}

export default Highlight;
