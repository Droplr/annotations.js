//
//  annotations.js
//
//  By Taqi Mustafa for Droplr (http://droplr.com).
//  Copyright (c) 2016 Droplr. All rights reserved.
//

/**
 * @function
 * @ignore
 */
var slice = Array.prototype.slice,
  emptyFunction = function() { },
  IS_DONTENUM_BUGGY = (function() {
    for (var p in { toString: 1 }) {
      if (p === 'toString') {
        return false;
      }
    }
    return true;
  })(),
  addMethods = function(klass, source, parent) {
    for (var property in source) {
      if (property in klass.prototype &&
      typeof klass.prototype[property] === 'function' &&
      (source[property] + '').indexOf('callSuper') > -1) {
        klass.prototype[property] = (function(property) {
          return function() {
            var superclass = this.constructor.superclass;
            this.constructor.superclass = parent;
            var returnValue = source[property].apply(this, arguments);
            this.constructor.superclass = superclass;
            if (property !== 'initialize') {
              return returnValue;
            }
          };
        })(property);
      }
      else {
        klass.prototype[property] = source[property];
      }
      if (IS_DONTENUM_BUGGY) {
        if (source.toString !== Object.prototype.toString) {
          klass.prototype.toString = source.toString;
        }
        if (source.valueOf !== Object.prototype.valueOf) {
          klass.prototype.valueOf = source.valueOf;
        }
      }
    }
  };
/**
 * @function
 * @ignore
 */
function Subclass(){}
/**
 * @function
 * @ignore
 */
function callSuper(methodName) {
  var fn = this.constructor.superclass.prototype[methodName];
  return (arguments.length > 1)
  ? fn.apply(this, slice.call(arguments, 1))
  : fn.call(this);
}
/**
 * @function
 * @ignore
 */
function createClass() {
  var parent = null,
      properties = slice.call(arguments, 0);

  if (typeof properties[0] === 'function') {
    parent = properties.shift();
  }
  function klass() {
    this.initialize.apply(this, arguments);
  }

  klass.superclass = parent;
  klass.subclasses = [ ];

  if (parent) {
    Subclass.prototype = parent.prototype;
    klass.prototype = new Subclass();
    parent.subclasses.push(klass);
  }
  for (var i = 0, length = properties.length; i < length; i++) {
    addMethods(klass, properties[i], parent);
  }
  if (!klass.prototype.initialize) {
    klass.prototype.initialize = emptyFunction;
  }
  klass.prototype.constructor = klass;
  klass.prototype.callSuper = callSuper;
  return klass;
}

/**
 * 
 * fabric.Textbox.prototype._renderText
 * 
 * Extended to reverse order of stroke and filling, to allow for more pleasing
 * stroke.
 * 
 * @see    http://stackoverflow.com/questions/26639132/canvas-fabricjs-separate-stroke-from-text-edge
 * @access private
 * @return void
 */
fabric.Text.prototype._renderText = function(ctx) {
  this._renderTextFill(ctx);
  this._renderTextStroke(ctx);
  this._renderTextFill(ctx);
};

/**
 * Creates a new Annotation Layer.
 * @class
 */
AnnotationLayer = createClass({
  /**
  * A variable in the AnnotationLayer, represent canvas of AnnotationLayer.
  * @type {Object}
  */
  canvas: null,
  /**
  * A variable in the AnnotationLayer, represent canvas of AnnotationLayer.
  */
  activeControl : null,
  selectedObject : null,
  tempCanvas : new fabric.Canvas(document.createElement('canvas')),
  options : null,
  initialize : function(options){
    options || (options = {});
    this.options = options;
    var _canvas  = this.canvas;
    var _this    = this;
    if (options.element) {
      this.canvas = _canvas = new fabric.Canvas(options.element,{selection:false});
      _canvas.perPixelTargetFind = true;
      _canvas.uniScaleTransform = true;
      this._onCanvasEvents();
    }
    if (options.image) {
      this.canvasImage = options.image;
      _canvas.setBackgroundImage(options.image,
        function(){
            _canvas.setBackgroundImage(_canvas.backgroundImage, function(){
              _canvas.renderAll();
              console.log("Background scale: " + _canvas.backgroundImage.scaleX + " " + _canvas.backgroundImage.scaleY);
              var _w = _canvas.backgroundImage.width;
              var _h = _canvas.backgroundImage.height;


              _canvas.setWidth(_w).setHeight(_h);
              _this.tempCanvas.setWidth(_w).setHeight(_h);

              options.element.style.width = _w / (options.imagePixelRatio || window.devicePixelRatio) + 'px';
              options.element.style.height = _h / (options.imagePixelRatio || window.devicePixelRatio) + 'px';
              document.querySelectorAll('.upper-canvas, .canvas-container').forEach(function(el) {
                el.style.width = _w / (options.imagePixelRatio || window.devicePixelRatio) + 'px';
                el.style.height = _h / (options.imagePixelRatio || window.devicePixelRatio) + 'px';
              })

              var ImageObj1 = new Image();
              ImageObj1.onload = function() {
                  image1 = new fabric.Image(ImageObj1);
                  image1.src = options.image;
                  image1.set({
                      top:0,
                      left:0,
                      width:_w,
                      height:_h
                  });
                  image1.filters.push(new fabric.Image.filters.Pixelate({blocksize:parseInt(5 * window.devicePixelRatio)}));
                  image1.applyFilters(function(){
                      _this.tempCanvas.setBackgroundImage(image1);
                      _this.tempCanvas.renderAll();

                  });
              };
              ImageObj1.src = options.image;
            }, {
              scaleX   : 1.0,
              scaleY   : 1.0
            });

          }
        );
      }
    },
    _onCanvasEvents: function(){
      if(this.canvas){
        var that = this;
        this.canvas.on('mouse:down', function(o){
          if(that.selectedObject){
            return;          
          }
          if(that.activeControl){
            console.log('activeControl mouse:down')
            
            // We create a new version of our active control on mouse down
            if(that.activeControl instanceof ArrowControl){
              that.activeControl = new ArrowControl(that.activeControl._opts);
            }
            if(that.activeControl instanceof SquareControl){
              that.activeControl = new SquareControl(that.activeControl._opts);
            }
            if(that.activeControl instanceof OvalControl){
              that.activeControl = new OvalControl(that.activeControl._opts);
            }
            if(that.activeControl instanceof PencilControl){
              that.activeControl = new PencilControl(that.activeControl._opts);
            }
            if(that.activeControl instanceof TextControl){
              that.activeControl = new TextControl(that.activeControl._opts);
            }
            that.activeControl._onMouseDown(that,o);
          }
        });

        this.canvas.on('mouse:move', function(o){
          if(that.selectedObject && that.selectedObject._onMouseMove){
            that.selectedObject._onMouseMove(that,o);
          }
          else if(that.activeControl){
            that.activeControl._onMouseMove(that,o);
          }
        });

        this.canvas.on('mouse:up', function(o){
          console.log('mouse:up %j', that.selectedObject)
          
          if(that.selectedObject && that.selectedObject.text) {
            // Don't trigger mouse up if we've got a text object
            return;
          }
          if(that.selectedObject && that.selectedObject._onMouseUp){
            that.selectedObject._onMouseUp(that,o);
          }
          else if(that.activeControl){
            that.activeControl._onMouseUp(that,o);
          }
        });

        this.canvas.on('object:scaling', function(o){
          if(that.selectedObject){
	          if(that.selectedObject._onScaling){
	            that.selectedObject._onScaling(that,o);
	          }
          }
          else if(that.activeControl){
            if(that.activeControl._onScaling){
              that.activeControl._onScaling(that,o);
            }
          }
        });

        this.canvas.on('object:moving', function(o){
          if(that.selectedObject){
            if(that.selectedObject._onMoving){
              that.selectedObject._onMoving(that,o);
            }
          }
          else if(that.activeControl){
            if(that.activeControl._onMoving){
                that.activeControl._onMoving(that,o);
            }
          }
        });

        this.canvas.on('object:selected', function(o){
          console.log('object:selected %j', o.target)
          that.selectedObject = o.target;
        });

        this.canvas.on('selection:cleared', function(o){
          that.selectedObject = null;
        });
      };
    },
    reset: function(){
      this.canvas.clear();
      this.canvas.renderAll();
    },
    set: function(o){
      if(this.selectedObject){
        if(this.selectedObject.set){
            this.selectedObject.set(o);
        }
      }
      else if(this.activeControl){
        if(this.activeControl.set){
            this.activeControl.set(o);
        }
      }
    },
    get: function(o){
      if(this.selectedObject){
        if(this.selectedObject.get){
            return this.selectedObject.get(o);
        }
      }
      else if(this.activeControl){
        if(this.activeControl.get){
            return this.activeControl.get(o);
        }
      }
    },
    delete: function(){
      if(this.selectedObject) {
        if(this.selectedObject.arrow) this.selectedObject.arrow.remove();
        if(this.selectedObject.circle) this.selectedObject.circle.remove();
        
        var object = this.canvas.getActiveObject();
        object.remove();
      } else {
        this.activeControl.delete();
      }
      this.canvas.renderAll();
    },
    getCanvas: function(){
      return this.canvas;
    },
    imageData: function(options){
      return this.canvas.toJSON(options || []);
    },
    imageDataURL: function(type){
      var option={
        format: 'png'
      }
      if (type == 'jpg'){
        option = {
          format: 'jpg',
          quality: 1
        }
      }
      return this.canvas.toDataURL(option);
    },
    _startDrawing: function(options){
      this.canvas.isDrawingMode = true;
      if(options.fillColor){
        this.canvas.freeDrawingBrush.color = options.fillColor;
      }
      if(options.size){
        this.canvas.freeDrawingBrush.width = options.size || 5;
      }
      if(options.shadowWidth){
        this.canvas.freeDrawingBrush.shadow = {blur : options.shadowWidth};
      }
      if(options.shadowColor){
        this.canvas.freeDrawingBrush.shadow = {color : options.shadowColor};
      }
    },
    _stopDrawing: function(){
      this.canvas.isDrawingMode = false;
    }
});

ArrowControl = createClass({
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    _firstOne:true,
    _line:true,
    _circle:true,
    _arrow:true,
    _opts : false,
    initialize : function(options){
      options || (options = {});

      var scale = options.scale || window.devicePixelRatio;
      console.log("Scale %s", scale)
      
      this._opts = options;
      this._line = new fabric.Line([0,0,0,0], {
          stroke: options.fillColor || '#000',
          selectable: true,
          strokeWidth: 5 * scale,
          hasBorders: false,
          hasControls: false,
          originX: 'center',
          originY: 'center',
          lockScalingX: true,
          lockScalingY: true,
          inNew   : true,
          className   : this
      });
      this._line.parentObject = this;
      var centerX = (this._line.x1 + this._line.x2) / 2,
          centerY = (this._line.y1 + this._line.y2) / 2;
      deltaX = this._line.left - centerX,
      deltaY = this._line.top - centerY;

      var arrow1x = 'M19.1412487,17.3015598,C20.3832712,18.8569144,22.6509933,19.1109202,24.2063479,17.8688978,C25.7617024,16.6268753,26.0157083,14.3591532,24.7736859,12.8037986,L15.8777839,1.6636764,C14.4349891,-0.143100466,11.6881414,-0.143100466,10.2453467,1.6636764,L1.34944467,12.8037986,C0.107422219,14.3591532,0.361428094,16.6268753,1.91678267,17.8688978,C3.47213724,19.1109202,5.73985938,18.8569144,6.98188183,17.3015598,L13.0615653,9.68811975,L19.1412487,17.3015598,Z';
      var arrow15x = 'M28.4310904,25.7980428 C30.2941241,28.1310747 33.6957073,28.5120835 36.0287392,26.6490498 C38.361771,24.7860161 38.7427798,21.3844329 36.8797462,19.0514011 L23.5358931,2.34121772 C21.371701,-0.368947574 17.2514295,-0.368947574 15.0872374,2.34121772 L1.74338437,19.0514011 C-0.119649306,21.3844329 0.261359505,24.7860161 2.59439137,26.6490498 C4.92742323,28.5120835 8.32900644,28.1310747 10.1920401,25.7980428 L19.3115653,14.3778828 L28.4310904,25.7980428,Z';
      var arrow2x = 'M37.7209321,34.2945258,C40.204977,37.405235,44.7404213,37.9132467,47.8511305,35.4292018,C50.9618396,32.9451569,51.4698514,28.4097127,48.9858065,25.2990035,L31.1940024,3.01875905,C28.3084129,-0.594794683,22.8147176,-0.594794683,19.9291281,3.01875905,L2.13732407,25.2990035,C-0.346720831,28.4097127,0.161290917,32.9451569,3.27200007,35.4292018,C6.38270922,37.9132467,10.9181535,37.405235,13.4021984,34.2945258,L25.5615653,19.0676458,L37.7209321,34.2945258,Z';
      var arrow3x = 'M56.3006156,51.2874919,C60.0266829,55.9535556,66.8298494,56.7155732,71.4959131,52.9895059,C76.1619768,49.2634385,76.9239944,42.4602721,73.1979271,37.7942084,L46.510221,4.3738417,C42.1818367,-1.0464889,33.9412938,-1.0464889,29.6129095,4.3738417,L2.92520347,37.7942084,C-0.800863882,42.4602721,-0.0388462596,49.2634385,4.62721746,52.9895059,C9.29328119,56.7155732,16.0964476,55.9535556,19.822515,51.2874919,L38.0615653,28.4471718,L56.3006156,51.2874919,Z';
      var arrow4x = 'M74.880299,68.2804579,C79.8483888,74.5018762,88.9192774,75.5178997,95.1406957,70.5498099,C101.362114,65.5817201,102.378137,56.5108316,97.4100477,50.2894133,L61.8264396,5.72892435,C56.0552606,-1.49818312,45.06787,-1.49818312,39.2966909,5.72892435,L3.71308287,50.2894133,C-1.25500693,56.5108316,-0.238983436,65.5817201,5.98243486,70.5498099,C12.2038532,75.5178997,21.2747417,74.5018762,26.2428315,68.2804579,L50.5615653,37.8266978,L74.880299,68.2804579,Z';
      var arrowPath = arrow1x;
      switch(scale) {
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

      this._arrow = new fabric.Path(
        arrowPath,
        {  
          left: this._line.get('x2') + deltaX,
          top: this._line.get('y2') + deltaY,
          originX: 'center',
          originY: 'center',
          hasBorders: false,
          hasControls: false,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          pointType: 'arrow_start',
          angle: -45,
          width: 20 * scale,
          height: 20 * scale,
          fill: options.fillColor || '#000',
          className   : this
        }
      )   
      this._arrow.parentObject = this;   
      this._arrow.line = this._line;

      this._circle = new fabric.Circle({
          left: this._line.get('x1') + deltaX,
          top: this._line.get('y1') + deltaY,
          radius: 5 * scale,
          stroke: options.fillColor || '#000',
          strokeWidth: 3 * scale,
          originX: 'center',
          originY: 'center',
          hasBorders: false,
          hasControls: false,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          pointType: 'arrow_end',
          fill: options.fillColor || '#000',
          className   : this
      });
      this._circle.parentObject = this;         
      this._circle.line = this._line;
      this._line.customType = this._arrow.customType = this._circle.customType = 'arrow';
      this._line.circle = this._arrow.circle = this._circle;
      this._line.arrow = this._circle.arrow = this._arrow;
    },
    set: function(p){
      this._object.set(p);
    },
    get: function(p){
      return this._object.get(p);
    },
    getObject: function(){
      return this._object;
    },
    delete: function(obj){
      this._line.remove();
      this._circle.remove();
      this._arrow.remove();
    },
    _calcArrowAngle: function(x1, y1, x2, y2) {
      var angle = 0,x, y;

      x = (x2 - x1);
      y = (y2 - y1);

      if (x === 0) {
        angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
      } else if (y === 0) {
        angle = (x > 0) ? 0 : Math.PI;
      } else {
        angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
      }

      return (angle * 180 / Math.PI);
    },
    _moveEnd: function(obj) {
      var p = obj,x1, y1, x2, y2;

      if (obj.pointType === 'arrow_end') {
        obj.line.set('x1', obj.get('left'));
        obj.line.set('y1', obj.get('top'));
      } else {
        obj.line.set('x2', obj.get('left'));
        obj.line.set('y2', obj.get('top'));
      }
      obj.line._setWidthHeight();

      x1 = obj.line.get('x1');
      y1 = obj.line.get('y1');
      x2 = obj.line.get('x2');
      y2 = obj.line.get('y2');
      angle = this._calcArrowAngle(x1, y1, x2, y2);

      if (obj.pointType === 'arrow_end') {
        obj.arrow.set('angle', angle + 90);
      } else {
        obj.set('angle', angle + 90);
      }
      obj.line.setCoords();
    },
    _moveLine: function(obj){
      var oldCenterX = (obj.x1 + obj.x2) / 2,
          oldCenterY = (obj.y1 + obj.y2) / 2,
          deltaX = obj.left - oldCenterX,
          deltaY = obj.top - oldCenterY;

      obj.arrow.set({
        'left': obj.x2 + deltaX,
        'top': obj.y2 + deltaY
      }).setCoords();

      obj.circle.set({
        'left': obj.x1 + deltaX,
        'top': obj.y1 + deltaY
      }).setCoords();

      obj.set({
        'x1': obj.x1 + deltaX,
        'y1': obj.y1 + deltaY,
        'x2': obj.x2 + deltaX,
        'y2': obj.y2 + deltaY
      });

      obj.set({
        'left': (obj.x1 + obj.x2) / 2,
        'top': (obj.y1 + obj.y2) / 2
      });
    },
    _onMouseDown: function(that,o){
      if(!this._line.inNew) return;
      this._isMouseDown=true;
      this._mouseDownPosition = that.canvas.getPointer(o.e);
      this._line.set({
          'x1'  : Math.abs(this._mouseDownPosition.x),
          'y1'  : Math.abs(this._mouseDownPosition.y),
          'x2'  : Math.abs(this._mouseDownPosition.x),
          'y2'  : Math.abs(this._mouseDownPosition.y)
      }).setCoords();
      var oldCenterX = (this._line.x1 + this._line.x2) / 2,
          oldCenterY = (this._line.y1 + this._line.y2) / 2,
          deltaX = this._line.left - oldCenterX,
          deltaY = this._line.top - oldCenterY,
          angle = this._calcArrowAngle(this._line.x2, this._line.y2, this._line.x1, this._line.y1);

      this._line.arrow.set({
          'left': this._line.x2 + deltaX,
          'top': this._line.y2 + deltaY,
          'angle': angle - 90
      }).setCoords();    

      this._line.circle.set({
          'left': this._line.x1 + deltaX,
          'top': this._line.y1 + deltaY
      }).setCoords();
      that.canvas.add(this._line, this._arrow, this._circle);
      this._line.inNew=false;
    },
    _onMouseMove: function(that,o){
      if(!this._isMouseDown)return;
      var pointer = that.canvas.getPointer(o.e);
      this._line.set({
          'x2'  : Math.abs(pointer.x),
          'y2'  : Math.abs(pointer.y)
      }).setCoords();

      var oldCenterX = (this._line.x1 + this._line.x2) / 2,
          oldCenterY = (this._line.y1 + this._line.y2) / 2,
          deltaX = this._line.left - oldCenterX,
          deltaY = this._line.top - oldCenterY,
          angle = this._calcArrowAngle(this._line.x2, this._line.y2, this._line.x1, this._line.y1);

      this._line.arrow.set({
          'left': this._line.x2 + deltaX,
          'top': this._line.y2 + deltaY,
          'angle': angle - 90
      }).setCoords();

      this._line.circle.set({
          'left': this._line.x1 + deltaX,
          'top': this._line.y1 + deltaY
      }).setCoords();
      that.canvas.renderAll();
    },
    _onMouseUp: function(that,o){
      if(!this._isMouseDown)return;
      this._firstOne=this._isMouseDown=false;
      var _this = this;
      this._line.arrow.on('moving', function () {
          _this._moveEnd(_this._line.arrow);
          that.canvas.renderAll();
      });
      this._line.circle.on('moving', function () {
          _this._moveEnd(_this._line.circle);
          that.canvas.renderAll();
      });
      this._line.on('moving', function () {
          _this._moveLine(_this._line);
      });
      console.log(this._firstOne);
    }
});

SquareControl = createClass({
  _object:null,
  _mouseDownPosition:null,
  _isMouseDown:false,
  _opts : false,
    initialize : function(options){
      options || (options = {});

      var scale = options.scale || window.devicePixelRatio;

      this._opts = options;
      this._object = new fabric.Rect({
          top         :0,
          left        :0,
          isNew       :true,
          width       :0,
          height      :0,
          strokeWidth :5 * scale,
          stroke      :'red',
          fill        :'transparent',
          className   : this
      });
      this._object.setControlVisible('mtr', false);
      this._object.setControlVisible('mt', false);
      this._object.setControlVisible('ml', false);
      this._object.setControlVisible('mr', false);
      this._object.setControlVisible('mb', false);
      if(options.fillColor){
        this._object.set({
          fill   : options.fillColor
        });
      }
      if(options.borderWidth){
        this._object.set({
          strokeWidth   : options.borderWidth * scale
        });
      }
      if(options.borderColor){
        this._object.set({
          stroke   : options.borderColor
        });
      }
      if(options.layer && options.layer._stopDrawing){
          options.layer._stopDrawing();
          options.layer.canvas.discardActiveObject();
      }
    },
    set: function(p){
      this._object.set(p);
    },
    get: function(p){
      return this._object.get(p);
    },
    delete: function(){
      this._object.remove();
    },
    getObject: function(){
      return this._object;
    },
    _onMouseDown: function(that,o){
      if(!that.activeControl.get('isNew'))return;
      this._isMouseDown=true;
      this._mouseDownPosition = that.canvas.getPointer(o.e);
      that.activeControl.set({
        left   : this._mouseDownPosition.x,
        top   : this._mouseDownPosition.y
      });
      that.canvas.add(that.activeControl.getObject());
      that.canvas.renderAll();
    },
    _onMouseMove: function(that,o){
      if(!this._isMouseDown)return;
      var pointer = that.canvas.getPointer(o.e);
      that.activeControl.set({
        width   : Math.abs(pointer.x - this._mouseDownPosition.x),
        height   : Math.abs(pointer.y - this._mouseDownPosition.y)
      });
      if(this._mouseDownPosition.x > pointer.x){
        that.activeControl.set({
          left: Math.abs(pointer.x)
        });
      }
      if(this._mouseDownPosition.y > pointer.y){
        that.activeControl.set({
          top: Math.abs(pointer.y)
        });
      }
      that.canvas.renderAll();
    },
    _onMouseUp: function(that,o){
      if(!this._isMouseDown)return;
      this._isMouseDown=false;
      that.activeControl.set({
        isNew   : false
      });
      that.activeControl._object.setCoords();
      console.log(that.activeControl.getObject());
      that.canvas.setActiveObject(that.activeControl.getObject());
      that.canvas.renderAll();
    },
    _onScaling: function(that,o){
      if(!o)return;
      var _w = o.target.width  * o.target.scaleX;
      var _h = o.target.height * o.target.scaleY;
      o.target.set({
        width   : _w,
        height  : _h,
        scaleX  : 1,
        scaleY  : 1
      });
    }
});

OvalControl = createClass({
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    _opts:false,
    initialize : function(options){
      options || (options = {});

      var scale = options.scale || window.devicePixelRatio;

      this._opts = options;
      this._object = new fabric.Ellipse({
          top         :0,
          left        :0,
          isNew       :true,
          width       :0,
          height      :0,
          strokeWidth :5 * scale,
          stroke      :'red',
          fill        :'transparent',
          className   : this
      });
      this._object.setControlVisible('mtr', false);
      this._object.setControlVisible('tr', false);
      this._object.setControlVisible('br', false);
      this._object.setControlVisible('bl', false);
      this._object.setControlVisible('tl', false);
      if(options.fillColor){
        this._object.set({
          fill   : options.fillColor
        });
      }
      if(options.borderWidth){
        this._object.set({
          strokeWidth   : options.borderWidth * scale
        });
      }
      if(options.borderColor){
        this._object.set({
          stroke   : options.borderColor
        });
      }
      if(options.layer && options.layer._stopDrawing){
        options.layer._stopDrawing();
      }
    },
    set: function(p){
      this._object.set(p);
    },
    get: function(p){
      return this._object.get(p);
    },
    getObject: function(){
      return this._object;
    },
    delete: function(){
    this._object.remove();
    },
    _onMouseDown: function(that,o){
      if(!that.activeControl.get('isNew'))return;
      this._isMouseDown=true;
      this._mouseDownPosition = that.canvas.getPointer(o.e);
      that.activeControl.set({
        left    : this._mouseDownPosition.x,
        top     : this._mouseDownPosition.y
      });
      that.canvas.add(that.activeControl.getObject());
      that.canvas.renderAll();
    },
    _onMouseMove: function(that,o){
      if(!this._isMouseDown)return;
      var pointer = that.canvas.getPointer(o.e);
      that.activeControl.set({
        rx: Math.abs(this._mouseDownPosition.x - pointer.x)/2,
        ry: Math.abs(this._mouseDownPosition.y - pointer.y)/2
      });
      if(this._mouseDownPosition.x > pointer.x){
        that.activeControl.set({
          left: Math.abs(pointer.x)
        });
      }
      if(this._mouseDownPosition.y > pointer.y){
        that.activeControl.set({
          top: Math.abs(pointer.y)
        });
      }
      that.canvas.renderAll();
    },
    _onMouseUp: function(that,o){
      if(!this._isMouseDown)return;
      this._isMouseDown=false;
      that.activeControl.set({
        isNew   : false
      });
      that.activeControl._object.setCoords();
      that.canvas.setActiveObject(that.activeControl.getObject());
      that.canvas.renderAll();
    },
    _onScaling: function(that,o){
      console.log(that, o)
      if(!o)return;
      var _width  = o.target.width;
      var _height = o.target.height;
      var _w      = _width  * o.target.scaleX;
      var _h      = _height * o.target.scaleY;
      o.target.set({
        width   : _width,
        height  : _height,
        rx      : _w/2,
        ry      : _h/2,
        scaleX  : 1,
        scaleY  : 1
      });
    }
});

PencilControl = createClass({
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    _option:null,
    _opts:false,
    initialize : function(options){
      options || (options = {});

      this._opts = options;
      if(options.layer && options.layer._startDrawing){
        options.layer._startDrawing(options);
      }
    },
    set: function(p){
      this._object.set(p);
    },
    get: function(p){
      return this._object.get(p);
    },
    getObject: function(){
      return this._object;
    },
    delete: function(){
      this._object.remove();
    },
    _onMouseDown: function(that,o){
      that.canvas.isDrawingMode = true;
    },
    _onMouseMove: function(that,o){

    },
    _onMouseUp: function(that,o){
      var size    = that.canvas.size();
          obj     = that.canvas.item(size-1);
      obj.setControlVisible('mtr', false);
      obj.setControlVisible('mt', false);
      obj.setControlVisible('ml', false);
      obj.setControlVisible('mr', false);
      obj.setControlVisible('mb', false);
      obj.setControlVisible('bl', false);
      obj.setControlVisible('br', false);
      obj.setControlVisible('tl', false);
      obj.setControlVisible('tr', false);
    }
});

BlurControl = createClass({
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    _tempCanvas:null,
    initialize : function(options){
      options || (options = {});
      
      var scale = options.scale || window.devicePixelRatio;

      this._object = new fabric.Rect({
          top         :0,
          left        :0,
          isNew       :true,
          width       :0,
          height      :0,
          strokeWidth :5,
          stroke      :'red',
          fill        :'transparent'
      });
      this._object.setControlVisible('mtr', false);
      this._object.setControlVisible('mt', false);
      this._object.setControlVisible('ml', false);
      this._object.setControlVisible('mr', false);
      this._object.setControlVisible('mb', false);
      if(options.layer && options.layer._stopDrawing){
          options.layer._stopDrawing();
      }
      if(options.fillColor){
          this._object.set({
              fill   : options.fillColor
          });
      }
      if(options.borderWidth){
          this._object.set({
              strokeWidth   : options.borderWidth * scale
          });
      }
      if(options.borderColor){
          this._object.set({
              stroke   : options.borderColor
          });
      }
    },
    set: function(p){
      this._object.set(p);
    },
    get: function(p){
      return this._object.get(p);
    },
    getObject: function(){
      return this._object;
    },
    _onMouseDown: function(that,o){
      if(!that.activeControl.get('isNew'))return;
      this._isMouseDown=true;
      this._mouseDownPosition = that.canvas.getPointer(o.e);
      that.activeControl.set({
          left    : this._mouseDownPosition.x,
          top     : this._mouseDownPosition.y
      });
      that.canvas.add(that.activeControl.getObject());
      that.canvas.renderAll();
    },
    _onMouseMove: function(that,o){
      if(!this._isMouseDown)return;
      var pointer = that.canvas.getPointer(o.e);
      that.activeControl.set({
        width   : Math.abs(pointer.x - this._mouseDownPosition.x),
        height  : Math.abs(pointer.y - this._mouseDownPosition.y)
      });
      if(this._mouseDownPosition.x > pointer.x){
        that.activeControl.set({
          left: Math.abs(pointer.x)
        });
      }
      if(this._mouseDownPosition.y > pointer.y){
        that.activeControl.set({
          top: Math.abs(pointer.y)
        });
      }
      that.canvas.renderAll();
    },
    _onMouseUp: function(that,o){
      if(!this._isMouseDown)return;
      this._isMouseDown=false;
      var _mouse = that.canvas.getPointer(o.e),
          _this = this,
          object_left = that.activeControl._object.left || _this._mouseDownPosition.x,
          object_top = that.activeControl._object.top || _this._mouseDownPosition.y;
      that.activeControl.set({
        isNew   : false
      });
      that.activeControl._object.setCoords();
      that.canvas.setActiveObject(that.activeControl.getObject());

      var base64 = that.tempCanvas.toDataURL({
          format  : 'jpeg',
          left    : object_left,
          top     : object_top,
          width   : that.activeControl._object.getWidth(),
          height  : that.activeControl._object.getHeight(),
      });
      that.canvas.remove(that.activeControl._object);
      var ImageObj = new Image();
      ImageObj.loaded = true;
      ImageObj.onload = function() {
        if(ImageObj.loaded){
          img = new fabric.Image(ImageObj);
          img.original_object = ImageObj;
          ImageObj.loaded = false;
          _this._object = img.set({left: object_left, top: object_top,className   : _this});
          _this._object.setControlVisible('mtr', false);
          _this._object.setControlVisible('mt', false);
          _this._object.setControlVisible('ml', false);
          _this._object.setControlVisible('mr', false);
          _this._object.setControlVisible('mb', false);
          that.canvas.add(_this._object).renderAll();
          that.canvas.setActiveObject(_this._object).sendToBack(_this._object).renderAll();
        }
      }
      ImageObj.src = base64;
    },
    _onScaling: function(that,o){
      if(!o)return;
      var _mouse = that.canvas.getPointer(o.e),
          _this = this;
      var base64 = that.tempCanvas.toDataURL({
          format  : 'jpeg',
          left    : o.target.left+2,
          top     : o.target.top+2,
          width   : o.target.getWidth(),
          height  : o.target.getHeight()
      });
      that.activeControl._object.original_object.src = base64;
    },
    _onMoving: function(that,o){
      if(!o)return;
      var _mouse = that.canvas.getPointer(o.e),
          _this = this, _temp;
      var base64 = that.tempCanvas.toDataURL({
          format  : 'jpeg',
          left    : o.target.left+2,
          top     : o.target.top+2,
          width   : o.target.getWidth(),
          height  : o.target.getHeight()
      });
      that.canvas.getActiveObject().original_object.src = base64;
    }
});

TextControl = createClass({
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    _opts : false,
    initialize : function(options){
        options || (options = {});

        var scale = options.scale || window.devicePixelRatio;

        this._opts = options;
        this._object = new fabric.IText('', {
            top         :0,
            left        :0,
            padding     :1,
            isNew       :true,
            fill        :'#333'
        });
        this._object.setControlVisible('mtr', false);
        this._object.setControlVisible('mt', false);
        this._object.setControlVisible('ml', false);
        this._object.setControlVisible('mr', false);
        this._object.setControlVisible('mb', false);
        this._object.setControlVisible('tl', false);
        this._object.setControlVisible('tr', false);
        this._object.setControlVisible('br', false);
        this._object.setControlVisible('bl', false);
        if(options.layer && options.layer._stopDrawing){
          options.layer._stopDrawing();
        }
        if(options.fillColor){
          this._object.set({
            fill   : options.fillColor
          });
        }
        if(options.fontSize){
          this._object.set({
            fontSize   : options.fontSize * scale
          });
        }
        if(options.fontFamily){
          this._object.set({
            fontFamily   : options.fontFamily
          });
        }
        if(options.shadowWidth || options.shadowColor){
          this._object.setShadow({
            color   : options.shadowColor   || '#999',
            blur    : (options.shadowWidth   || 0) * scale,
            offsetX   : 0,
            offsetY   : 0
          });
        }
        if(options.borderWidth || options.borderColor){
          this._object.set({
            stroke   : options.borderColor,
            strokeWidth   : options.borderWidth * scale,
            strokeLineJoin: 'round'
          });
        }
    },
    set: function(p){
      this._object.set(p);
    },
    get: function(p){
      return this._object.get(p);
    },
    getObject: function(){
      return this._object;
    },
    delete: function(){
      this._object.remove();
    },
    _onMouseDown: function(that,o){
    },
    _onMouseMove: function(that,o){
    },
    _onMouseUp: function(that,o){
      if(!that.activeControl.get('isNew'))return;
      this._mouseDownPosition = that.canvas.getPointer(o.e);
      that.activeControl.set({
        left    : this._mouseDownPosition.x,
        isNew   : false,
        top     : this._mouseDownPosition.y
      });
      that.activeControl._object.setCoords();
      that.canvas.add(that.activeControl.getObject());
      that.canvas.setActiveObject(that.activeControl.getObject());
      that.activeControl._object.enterEditing();
      console.log(that.activeControl._object)
      that.canvas.renderAll();
    }
});

module.exports = {
  AnnotationLayer,
  ArrowControl,
  SquareControl,
  OvalControl,
  PencilControl,
  BlurControl,
  TextControl
}
