import Arrow from './lib/arrowController';
import RectEmpty from './lib/rectEmptyController';
import EllipseEmpty from './lib/ellipseEmptyController';
import Line from './lib/lineController';
import Pencil from './lib/pencilController';

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
var AnnotationLayer = createClass({
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
          _this._calculateSize();

          var _w = _canvas.backgroundImage.width;
          var _h = _canvas.backgroundImage.height;

          var ImageObj1 = new Image();
          ImageObj1.onload = function() {
            var image1 = new fabric.Image(ImageObj1);
            image1.src = options.image;
            image1.set({
                top:0,
                left:0,
                width:_w,
                height:_h
            });
            image1.filters.push(new fabric.Image.filters.Pixelate({blocksize:parseInt(5 * window.devicePixelRatio)}));
            image1.applyFilters();
            _this.tempCanvas.setBackgroundImage(image1.filters);
            _this.tempCanvas.renderAll();
          };
          ImageObj1.src = options.image;
        },
        {
          scaleX: 1.0,
          scaleY: 1.0
        });
      });
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
          if(that.activeControl instanceof Arrow){
            that.activeControl = new Arrow(that.activeControl.options);
          }
          if(that.activeControl instanceof Line){
            that.activeControl = new Line(that.activeControl.options);
          }
          if(that.activeControl instanceof RectEmpty){
            that.activeControl = new RectEmpty(that.activeControl.options);
          }
          if(that.activeControl instanceof EllipseEmpty){
            that.activeControl = new EllipseEmpty(that.activeControl.options);
          }
          if(that.activeControl instanceof Pencil){
            that.activeControl = new Pencil(that.activeControl.options);
          }
          if(that.activeControl instanceof TextControl){
            that.activeControl = new TextControl(that.activeControl._opts);
          }

          if (that.activeControl._onMouseDown) {
            that.activeControl._onMouseDown(that, o);
          }
        }
      });

      this.canvas.on('mouse:move', function(o) {
        if (that.selectedObject && that.selectedObject._onMouseMove) {
          that.selectedObject._onMouseMove(that, o);
        } else if (that.activeControl && that.activeControl._onMouseMove) {
          that.activeControl._onMouseMove(that, o);
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
        if (that.selectedObject && that.selectedObject._onScaling) {
          that.selectedObject._onScaling(that,o);
        } else if (that.activeControl && that.activeControl._onScaling) {
          that.activeControl._onScaling(that,o);
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
      if (this.selectedObject.delete) {
        this.selectedObject.delete();
      } else {
        var object = this.canvas.getActiveObject();
        object.remove();
      }
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
    var dataUrl = this.canvas.toDataURL(option);
    this._calculateSize();
    return dataUrl;
  },
  _calculateSize: function() {
    var _w = this.canvas.backgroundImage.width;
    var _h = this.canvas.backgroundImage.height;

    this.canvas.setWidth(_w).setHeight(_h);
    this.tempCanvas.setWidth(_w).setHeight(_h);
    this.options.element.style.width = _w / (this.options.imagePixelRatio || window.devicePixelRatio) + 'px';
    this.options.element.style.height = _h / (this.options.imagePixelRatio || window.devicePixelRatio) + 'px';

    document.querySelectorAll('.upper-canvas, .canvas-container, #edit-image').forEach(function(el) {
      el.style.width = _w / (this.options.imagePixelRatio || window.devicePixelRatio) + 'px';
      el.style.height = _h / (this.options.imagePixelRatio || window.devicePixelRatio) + 'px';
    }.bind(this))
  }
});

var BlurControl = createClass({
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

    options.layer.canvas.isDrawingMode = false;

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
  setFillColor: function(color) {
    this._opts.fillColor = color;
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
        width   : that.activeControl._object.witdh,
        height  : that.activeControl._object.height,
    });
    that.canvas.remove(that.activeControl._object);
    var ImageObj = new Image();
    ImageObj.loaded = true;
    ImageObj.onload = function() {
      if(ImageObj.loaded){
        var img = new fabric.Image(ImageObj);
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

var TextControl = createClass({
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

      options.layer.canvas.isDrawingMode = false;

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
      if(options.fontWeight){
        this._object.set({
          fontWeight   : options.fontWeight
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
  setFillColor: function(color) {
    this._opts.fillColor = color;
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
ArrowControl: Arrow,
LineControl: Line,
SquareControl: RectEmpty,
OvalControl: EllipseEmpty,
PencilControl: Pencil,
BlurControl,
TextControl
}
