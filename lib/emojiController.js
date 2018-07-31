import { fabric } from 'fabric';

class Emoji {
  constructor(options = {}) {
    this.options = options;
    this.position = null;
    this.options.fontSize = this.options.fontSize || 72;
    const emoji = this.options.icon;

    this.emoji = new fabric.IText(emoji, {
      fontSize: this.options.fontSize,
      textAlign: 'center',
      lockUniScaling: true,
    });

    const position = this.getPosition();

    this.emoji.set({
      left: position.x,
      top: position.y,
      transparentCorners: false,
      originX: 'center',
      originY: 'center',
    });

    this.emoji.hasControls = true;

    this.emoji.setCoords();
    this.options.layer.canvas.add(this.emoji);
    this.options.layer.canvas.setActiveObject(this.emoji);
    this.options.layer.canvas.renderAll();

    this.delete = this.delete.bind(this);
    this.getPosition = this.getPosition.bind(this);
  }

  getPosition() {
    const layerEdgePoints = this.options.layer.findEdgePoints();
    const { width, height } = this.options.layer.canvas.backgroundImage;

    return {
      x: Math.floor(Math.random() * (width - this.options.fontSize)) + layerEdgePoints.left,
      y: Math.floor(Math.random() * (height - this.options.fontSize)) + layerEdgePoints.top,
    }
  }

  delete() {
    this.options.layer.canvas.remove(this.emoji);
  }
}

export default Emoji;
