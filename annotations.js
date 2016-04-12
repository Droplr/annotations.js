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

function Subclass(){}

function callSuper(methodName) {
	var fn = this.constructor.superclass.prototype[methodName];
	return (arguments.length > 1)
	? fn.apply(this, slice.call(arguments, 1))
	: fn.call(this);
}
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

AnnotationLayer = createClass({
	canvas: null,
	activeControl : null,
    initialize : function(options){
    	options || (options = {});
    	var _canvas = this.canvas;
		if (options.element) {
			var el = $(options.element);
			this.canvas = _canvas = new fabric.Canvas(el[0],{selection:false});
            this.canvas.perPixelTargetFind = true;
			this._onCanvasEvents();
		}
		if (options.image) {
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
    			if(that.activeControl){
    				that.activeControl._onMouseDown(that,o);
    			}
    		});
    		this.canvas.on('mouse:move', function(o){
    			if(that.activeControl){
    				that.activeControl._onMouseMove(that,o);
    			}
    		});
    		this.canvas.on('mouse:up', function(o){
    			if(that.activeControl){
    				that.activeControl._onMouseUp(that,o);
    			}
    		});
            this.canvas.on('object:scaling', function(o){
                if(that.activeControl && that.activeControl._onScaling){
                    that.activeControl._onScaling(that,o);
                }
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
    imageData: function(){
        return this.canvas.toJSON(['original_left','original_top','original_scaleX','original_scaleY','currentHeight', 'currentWidth', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'lockUniScaling', 'id', 'class', 'name', 'hasControls', 'target', 'src', 'background_canvas','gradient_type','gradient_valu','ttext','tcolor','tcurve','tbottom','theight','toffset','clip_url','object','maskurl','originalsrc','crop_left','crop_top','crop_height','crop_width','original_src','thumb_src','finalcanvassrc','original_maskurl','gradient','original_svg_src','original_img_src','actual_src','current_src','reset_src','textDecoration','fontStyle','fontWeight','scaleX','scaleY','gradienttype','shadowcheck','strokecheck','index','scalevalue','gradientTypeValue']);
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
    }
});

ArrowControl = createClass(AnnotationLayer, {
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
            uniScaleTransform: false
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
        that.activeControl.set({
            isNew   : false
        });
        that.activeControl._object.setCoords();
        that.canvas.setActiveObject(that.activeControl.getObject());
        that.canvas.renderAll();
    }
});
SquareControl = createClass(AnnotationLayer, {
	_object:null,
	_mouseDownPosition:null,
	_isMouseDown:false,
    initialize : function(options){
    	options || (options = {});
    	this._object = new fabric.Rect({
    		top 		:0,
    		left 		:0,
    		isNew 		:true,
    		width 		:0,
    		height 		:0,
    		strokeWidth :5,
    		stroke 		:'red',
    		fill 		:'transparent',
    		uniScaleTransform: false
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
OvalControl = createClass(AnnotationLayer, {
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    initialize : function(options){
        options || (options = {});
        this._object = new fabric.Circle({
            top         :0,
            left        :0,
            isNew       :true,
            width       :0,
            height      :0,
            radius      :0,
            strokeWidth :5,
            stroke      :'red',
            fill        :'transparent'
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
            radius: Math.abs((this._mouseDownPosition.x - pointer.x))/2
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
    }
});
PencilControl = createClass(AnnotationLayer, {
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    initialize : function(options){
        options || (options = {});
        console.log(this, this.constructor.superclass.prototype.getCanvas());
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
        
    }
});
BlurControl = createClass(AnnotationLayer,{
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
            fill        :'transparent'
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
        that.activeControl.set({
            isNew   : false
        });
        that.activeControl._object.setCoords();
        that.canvas.setActiveObject(that.activeControl.getObject());
        that.canvas.renderAll();
    }
});
TextControl = createClass(AnnotationLayer,{
    _object:null,
    _mouseDownPosition:null,
    _isMouseDown:false,
    initialize : function(options){
        options || (options = {});
        this._object = new fabric.IText('', {
            top         :0,
            left        :0,
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
        that.canvas.renderAll();
    }
});
