import Arrow from './lib/arrowController';
import RectEmpty from './lib/rectEmptyController';
import EllipseEmpty from './lib/ellipseEmptyController';
import Line from './lib/lineController';
import Pencil from './lib/pencilController';
import Blur from './lib/blurController';
import Text from './lib/textController';

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
          if(that.activeControl instanceof Text){
            that.activeControl = new Text(that.activeControl.options);
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

        // Don't trigger mouse up if we've got a text object
        if (that.selectedObject && that.selectedObject.fontFamily) return;

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
    const activeObject = this.canvas.getActiveObject();

    // Don't remove the text object while editing it.
    if (activeObject.isEditing) return;

    if (activeObject) {
      if (activeObject.delete) {
        activeObject.delete();
      } else {
        this.canvas.remove(activeObject);
      }
    } else if (this.selectedObject && this.selectedObject.delete) {
      this.selectedObject.delete();
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

module.exports = {
AnnotationLayer,
ArrowControl: Arrow,
LineControl: Line,
SquareControl: RectEmpty,
OvalControl: EllipseEmpty,
PencilControl: Pencil,
BlurControl: Blur,
TextControl: Text,
}
