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
    options : null,
    initialize : function(options){
    	options || (options = {});
        this.options = options;
    	var _canvas = this.canvas;
		if (options.element) {
			var el = $(options.element);
			this.canvas = _canvas = new fabric.Canvas(el[0],{selection:false});
            _canvas.perPixelTargetFind = true;
            _canvas.uniScaleTransform = true;
			this._onCanvasEvents();
		}
		if (options.image) {
            this.canvasImage = options.image;
			_canvas.setBackgroundImage(options.image,
				function(){
					if(options.scale){
						_canvas.setBackgroundImage(_canvas.backgroundImage, function(){
                            _canvas.renderAll();
                            var _w = _canvas.backgroundImage.width * _canvas.backgroundImage.scaleX;
                            var _h = _canvas.backgroundImage.height * _canvas.backgroundImage.scaleY;
                            _canvas.setWidth(_w).setHeight(_h);
                        }, {
							scaleX 	: options.scale,
							scaleY 	: options.scale
						});
					}
				}
			);
		}
    },
    _onCanvasEvents: function(){
    	if(this.canvas){
    		var that = this;
    		this.canvas.on('mouse:down', function(o){
    			if(that.selectedObject){
                    that.selectedObject._onMouseDown(that,o);
    			}
                else if(that.activeControl){
                    that.activeControl._onMouseDown(that,o);
                }
    		});
    		this.canvas.on('mouse:move', function(o){
                if(that.selectedObject){
                    that.selectedObject._onMouseMove(that,o);
                }
                else if(that.activeControl){
                    that.activeControl._onMouseMove(that,o);
                }
    		});
    		this.canvas.on('mouse:up', function(o){
                if(that.selectedObject){
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
                if(o.target.className){
                    that.selectedObject = o.target.className.__proto__;
                }
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
    delete: function(){
        var object = this.canvas.getActiveObject();
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
    initialize : function(options){
        options || (options = {});
        this._line = new fabric.Line([0,0,0,0], {
            stroke: options.fillColor || '#000',
            selectable: true,
            strokeWidth: '2',
            hasBorders: false,
            hasControls: false,
            originX: 'center',
            originY: 'center',
            lockScalingX: true,
            lockScalingY: true,
            inNew   : true,
            className   : this
        });
        var centerX = (this._line.x1 + this._line.x2) / 2,
            centerY = (this._line.y1 + this._line.y2) / 2;
        deltaX = this._line.left - centerX,
        deltaY = this._line.top - centerY;

        this._arrow = new fabric.Triangle({
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
            width: 20,
            height: 20,
            fill: options.fillColor || '#000',
            className   : this
        });
        this._arrow.line = this._line;

        this._circle = new fabric.Circle({
            left: this._line.get('x1') + deltaX,
            top: this._line.get('y1') + deltaY,
            radius: 3,
            stroke: options.fillColor || '#000',
            strokeWidth: 3,
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
        if(!this._line.inNew)return;
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
    initialize : function(options){
        options || (options = {});
        this._object = new fabric.Rect({
            top         :0,
            left        :0,
            isNew       :true,
            width       :0,
            height      :0,
            strokeWidth :5,
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
                strokeWidth   : options.borderWidth
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
    getObject: function(){
    	return this._object;
    },
    _onMouseDown: function(that,o){
    	if(!that.activeControl.get('isNew'))return;
    	this._isMouseDown=true;
    	this._mouseDownPosition = that.canvas.getPointer(o.e);
    	that.activeControl.set({
    		left 	: this._mouseDownPosition.x,
    		top 	: this._mouseDownPosition.y
    	});
    	that.canvas.add(that.activeControl.getObject());
    	that.canvas.renderAll();
    },
    _onMouseMove: function(that,o){
    	if(!this._isMouseDown)return;
    	var pointer = that.canvas.getPointer(o.e);
    	that.activeControl.set({
    		width 	: Math.abs(pointer.x - this._mouseDownPosition.x),
    		height 	: Math.abs(pointer.y - this._mouseDownPosition.y)
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
    		isNew 	: false
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
    initialize : function(options){
        options || (options = {});
        this._object = new fabric.Ellipse({
            top         :0,
            left        :0,
            isNew       :true,
            width       :0,
            height      :0,
            strokeWidth :5,
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
                strokeWidth   : options.borderWidth
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
    initialize : function(options){
        options || (options = {});
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
                strokeWidth   : options.borderWidth
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
        that.canvas.renderAll();
    },
    _onMouseUp: function(that,o){
        if(!this._isMouseDown)return;
        this._isMouseDown=false;
        var _mouse = that.canvas.getPointer(o.e),
            _this = this;
        that.activeControl.set({
            isNew   : false
        });
        that.activeControl._object.setCoords();
        that.canvas.setActiveObject(that.activeControl.getObject());

        this._tempCanvas = new fabric.Canvas(document.createElement('canvas'));
        this._tempCanvas.setBackgroundImage(that.options.image,
            function(){
                if(that.options.scale){
                    _this._tempCanvas.setBackgroundImage(_this._tempCanvas.backgroundImage, function(){
                        _this._tempCanvas.renderAll();
                        var _w = _this._tempCanvas.backgroundImage.width * _this._tempCanvas.backgroundImage.scaleX;
                        var _h = _this._tempCanvas.backgroundImage.height * _this._tempCanvas.backgroundImage.scaleY;
                        _this._tempCanvas.setWidth(_w).setHeight(_h);
                        var base64 = _this._tempCanvas.toDataURL({
                            format  : 'jpeg',
                            left    : _this._mouseDownPosition.x,
                            top     : _this._mouseDownPosition.y,
                            width   : that.activeControl._object.width,
                            height  : that.activeControl._object.height,
                        });
                        fabric.Image.fromURL(base64, function(img) {
                            that.canvas.remove(that.activeControl._object);
                            _this._object = img.set({left: _this._mouseDownPosition.x, top: _this._mouseDownPosition.y,className   : _this});

                            _this._object.setControlVisible('mtr', false);
                            _this._object.setControlVisible('mt', false);
                            _this._object.setControlVisible('ml', false);
                            _this._object.setControlVisible('mr', false);
                            _this._object.setControlVisible('mb', false);
                            _this._object.filters.push(new fabric.Image.filters.Pixelate({blocksize:parseInt(4 * that.options.scale)}));
                            _this._object.applyFilters(that.canvas.renderAll.bind(that.canvas));
                            that.canvas.add(_this._object).renderAll();
                            that.canvas.setActiveObject(_this._object).sendToBack(_this._object);
                            _this._tempCanvas.remove();
                        });
                    }, {
                        scaleX  : that.options.scale,
                        scaleY  : that.options.scale
                    });
                }
            }
        );
        that.canvas.renderAll();
    },
    _onScaling: function(that,o){
        if(!o)return;
        var _mouse = that.canvas.getPointer(o.e),
            _this = this;
        var base64 = _this._tempCanvas.toDataURL({
            format  : 'jpeg',
            left    : o.target.left,
            top     : o.target.top,
            width   : o.target.width*o.target.scaleX,
            height  : o.target.height*o.target.scaleY,
        });
        fabric.Image.fromURL(base64, function(img) {
            that.canvas.remove(that.activeControl._object);
            _this._object = img.set({left: o.target.left, top: o.target.top,className   : _this});

            _this._object.setControlVisible('mtr', false);
            _this._object.setControlVisible('mt', false);
            _this._object.setControlVisible('ml', false);
            _this._object.setControlVisible('mr', false);
            _this._object.setControlVisible('mb', false);
            _this._object.filters.push(new fabric.Image.filters.Pixelate({blocksize:parseInt(4 * that.options.scale)}));
            _this._object.applyFilters(that.canvas.renderAll.bind(that.canvas));
            that.canvas.add(_this._object).renderAll();
            that.canvas.setActiveObject(_this._object);
            that.canvas.renderAll();
        });
    },
    _onMoving: function(that,o){
        if(!o)return;
        var _mouse = that.canvas.getPointer(o.e),
            _this = this;
        console.log(that.activeControl);
        var base64 = that.activeControl._tempCanvas.toDataURL({
            format  : 'jpeg',
            left    : o.target.left,
            top     : o.target.top,
            width   : o.target.width*o.target.scaleX,
            height  : o.target.height*o.target.scaleY,
        });
        fabric.Image.fromURL(base64, function(img) {
            that.canvas.remove(that.activeControl._object);
            _this._object = img.set({left: o.target.left, top: o.target.top,className   : _this});

            _this._object.setControlVisible('mtr', false);
            _this._object.setControlVisible('mt', false);
            _this._object.setControlVisible('ml', false);
            _this._object.setControlVisible('mr', false);
            _this._object.setControlVisible('mb', false);
            _this._object.filters.push(new fabric.Image.filters.Pixelate({blocksize:parseInt(4 * that.options.scale)}));
            _this._object.applyFilters(that.canvas.renderAll.bind(that.canvas));
            that.canvas.add(_this._object).renderAll();
            that.canvas.setActiveObject(_this._object);
            that.canvas.renderAll();
        });
    }
});
TextControl = createClass({
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    initialize : function(options){
        options || (options = {});
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
                fontSize   : options.fontSize
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
                blur    : options.shadowWidth   || 0,
                offsetX   : 0,
                offsetY   : 0
            });
        }
        if(options.borderWidth || options.borderColor){
            this._object.set({
                stroke   : options.borderColor,
                strokeWidth   : options.borderWidth
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
