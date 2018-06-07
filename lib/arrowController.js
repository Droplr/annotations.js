import { fabric } from 'fabric';

class Arrow {
  constructor(options = {}) {
    this.mousePosition = null;
    this.isMouseDown = false;
    this.options = options;
    this.options.scale = this.options.scale || window.devicePixelRatio || 1;
    this.options.fillColor = this.options.fillColor || '#000';

    this.line = new fabric.Line([0, 0, 0, 0], {
      stroke: this.options.fillColor,
      selectable: true,
      strokeWidth: 5 * this.options.scale,
      hasBorders: false,
      hasControls: false,
      originX: 'center',
      originY: 'center',
      lockScalingX: true,
      lockScalingY: true,
    });

    const arrow1x = 'M19.1412487,17.3015598,C20.3832712,18.8569144,22.6509933,19.1109202,24.2063479,17.8688978,C25.7617024,16.6268753,26.0157083,14.3591532,24.7736859,12.8037986,L15.8777839,1.6636764,C14.4349891,-0.143100466,11.6881414,-0.143100466,10.2453467,1.6636764,L1.34944467,12.8037986,C0.107422219,14.3591532,0.361428094,16.6268753,1.91678267,17.8688978,C3.47213724,19.1109202,5.73985938,18.8569144,6.98188183,17.3015598,L13.0615653,9.68811975,L19.1412487,17.3015598,Z';
    const arrow15x = 'M28.4310904,25.7980428 C30.2941241,28.1310747 33.6957073,28.5120835 36.0287392,26.6490498 C38.361771,24.7860161 38.7427798,21.3844329 36.8797462,19.0514011 L23.5358931,2.34121772 C21.371701,-0.368947574 17.2514295,-0.368947574 15.0872374,2.34121772 L1.74338437,19.0514011 C-0.119649306,21.3844329 0.261359505,24.7860161 2.59439137,26.6490498 C4.92742323,28.5120835 8.32900644,28.1310747 10.1920401,25.7980428 L19.3115653,14.3778828 L28.4310904,25.7980428,Z';
    const arrow2x = 'M37.7209321,34.2945258,C40.204977,37.405235,44.7404213,37.9132467,47.8511305,35.4292018,C50.9618396,32.9451569,51.4698514,28.4097127,48.9858065,25.2990035,L31.1940024,3.01875905,C28.3084129,-0.594794683,22.8147176,-0.594794683,19.9291281,3.01875905,L2.13732407,25.2990035,C-0.346720831,28.4097127,0.161290917,32.9451569,3.27200007,35.4292018,C6.38270922,37.9132467,10.9181535,37.405235,13.4021984,34.2945258,L25.5615653,19.0676458,L37.7209321,34.2945258,Z';
    const arrow3x = 'M56.3006156,51.2874919,C60.0266829,55.9535556,66.8298494,56.7155732,71.4959131,52.9895059,C76.1619768,49.2634385,76.9239944,42.4602721,73.1979271,37.7942084,L46.510221,4.3738417,C42.1818367,-1.0464889,33.9412938,-1.0464889,29.6129095,4.3738417,L2.92520347,37.7942084,C-0.800863882,42.4602721,-0.0388462596,49.2634385,4.62721746,52.9895059,C9.29328119,56.7155732,16.0964476,55.9535556,19.822515,51.2874919,L38.0615653,28.4471718,L56.3006156,51.2874919,Z';
    const arrow4x = 'M74.880299,68.2804579,C79.8483888,74.5018762,88.9192774,75.5178997,95.1406957,70.5498099,C101.362114,65.5817201,102.378137,56.5108316,97.4100477,50.2894133,L61.8264396,5.72892435,C56.0552606,-1.49818312,45.06787,-1.49818312,39.2966909,5.72892435,L3.71308287,50.2894133,C-1.25500693,56.5108316,-0.238983436,65.5817201,5.98243486,70.5498099,C12.2038532,75.5178997,21.2747417,74.5018762,26.2428315,68.2804579,L50.5615653,37.8266978,L74.880299,68.2804579,Z';
    let arrowPath = arrow1x;

    switch (this.options.scale) {
      case 1.5:
        arrowPath = arrow15x;
        break;
      case 2.0:
        arrowPath = arrow2x;
        break;
      case 3.0:
        arrowPath = arrow3x;
        break;
      case 4.0:
        arrowPath = arrow4x;
        break;
      default:
        arrowPath = arrow1x;
        break;
    }

    this.arrow = new fabric.Path(arrowPath, {
      originX: 'center',
      originY: 'center',
      hasBorders: false,
      hasControls: false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      angle: -45,
      width: 20 * this.options.scale,
      height: 20 * this.options.scale,
      fill: this.options.fillColor,
      className: this,
    });

    this.line.delete = () => this.delete();
    this.arrow.delete = () => this.delete();

    this.options.layer.canvas.isDrawingMode = false;

    this.setFillColor = this.setFillColor.bind(this);
    this.delete = this.delete.bind(this);
    this.moveEnd = this.moveEnd.bind(this);
    this.moveLine = this.moveLine.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  setFillColor(color) {
    this.options.fillColor = color;
  }

  delete() {
    this.options.layer.canvas.remove(this.line);
    this.options.layer.canvas.remove(this.arrow);
  }

  static calcArrowAngle(x1, y1, x2, y2) {
    let angle = 0;

    const x = (x2 - x1);
    const y = (y2 - y1);

    if (x === 0) {
      angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
    } else if (y === 0) {
      angle = (x > 0) ? 0 : Math.PI;
    } else {
      angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
    }

    return (angle * 180 / Math.PI) - 90;
  }

  moveEnd() {
    this.line.set({
      x2: this.arrow.left,
      y2: this.arrow.top,
    });
    this.line._setWidthHeight();
    this.line.setCoords();

    this.arrow.set('angle', Arrow.calcArrowAngle(this.line.x2, this.line.y2, this.line.x1, this.line.y1));
  }

  moveLine() {
    const oldCenterX = (this.line.x1 + this.line.x2) / 2;
    const oldCenterY = (this.line.y1 + this.line.y2) / 2;
    const deltaX = this.line.left - oldCenterX;
    const deltaY = this.line.top - oldCenterY;

    this.arrow.set({
      left: this.line.x2 + deltaX,
      top: this.line.y2 + deltaY,
    }).setCoords();

    this.line.set({
      x1: this.line.x1 + deltaX,
      y1: this.line.y1 + deltaY,
      x2: this.line.x2 + deltaX,
      y2: this.line.y2 + deltaY,
    });

    this.line.set({
      left: (this.line.x1 + this.line.x2) / 2,
      top: (this.line.y1 + this.line.y2) / 2,
    });
  }

  onMouseDown(o) {
    this.isMouseDown = true;
    this.mousePosition = this.options.layer.canvas.getPointer(o.e);
    this.line.set({
      x1: this.mousePosition.x,
      y1: this.mousePosition.y,
      x2: this.mousePosition.x,
      y2: this.mousePosition.y,
    }).setCoords();

    this.arrow.set({
      left: this.line.x2,
      top: this.line.y2,
      angle: 0,
    }).setCoords();

    this.options.layer.canvas.add(this.line, this.arrow);
  }

  onMouseMove(o) {
    if (!this.isMouseDown) return;

    this.mousePosition = this.options.layer.canvas.getPointer(o.e);

    this.line.set({
      x2: this.mousePosition.x,
      y2: this.mousePosition.y,
    }).setCoords();

    this.arrow.set({
      left: this.line.x2,
      top: this.line.y2,
      angle: Arrow.calcArrowAngle(this.line.x2, this.line.y2, this.line.x1, this.line.y1),
    }).setCoords();

    this.options.layer.canvas.renderAll();
  }

  onMouseUp() {
    if (!this.isMouseDown) return;

    this.isMouseDown = false;

    this.arrow.on('moving', () => {
      this.moveEnd();
    });

    this.line.on('moving', () => {
      this.moveLine();
    });

    this.options.layer.canvas.setActiveObject(this.line);
  }
}

export default Arrow;
