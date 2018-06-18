import { fabric } from 'fabric';

class Text {
  constructor(options = {}) {
    this.options = options;
    this.emojiAdded = false;
    this.options.fontSize = this.options.fontSize || 48;

    if (!this.emojiAdded) {
      this.text = new fabric.Text(this.options.icon, {
        fontSize: 100,
        textAlign: 'center',
      });

      this.text.set({
        left: 100,
        top: 100,
        transparentCorners: false,
      });

      this.text.hasControls = true;

      this.text.setCoords();
      this.options.layer.canvas.add(this.text);
      this.options.layer.canvas.setActiveObject(this.text);
      this.options.layer.canvas.renderAll();
      this.emojiAdded = true;
    }

    this.delete = this.delete.bind(this);
  }

  delete() {
    this.options.layer.canvas.remove(this.text);
  }
}

export default Text;
