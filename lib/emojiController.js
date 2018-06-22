import { fabric } from 'fabric';

class Emoji {
  constructor(options = {}) {
    this.options = options;
    this.emojiAdded = false;
    this.position = null;
    this.options.fontSize = this.options.fontSize || 48;
    const emoji = String.fromCodePoint(parseInt(this.options.iconCode.substr(2), 16));

    if (!this.emojiAdded) {
      this.emoji = new fabric.Text(emoji, {
        fontSize: 100,
        textAlign: 'center',
      });

      const position = this.getPosition();

      this.emoji.set({
        left: position.x,
        top: position.y,
        transparentCorners: false,
      });

      this.emoji.hasControls = true;

      this.emoji.setCoords();
      this.options.layer.canvas.add(this.emoji);
      this.options.layer.canvas.setActiveObject(this.emoji);
      this.options.layer.canvas.renderAll();
      this.emojiAdded = true;
    }

    this.delete = this.delete.bind(this);
    this.getPosition = this.getPosition.bind(this);
  }

  getPosition() {
    const { width, height } = this.options.layer.canvas.backgroundImage;

    return {
      x: Math.floor(Math.random() * (width - this.options.fontSize)),
      y: Math.floor(Math.random() * (height - this.options.fontSize))
    }
  }

  delete() {
    this.options.layer.canvas.remove(this.emoji);
  }
}

export default Emoji;
