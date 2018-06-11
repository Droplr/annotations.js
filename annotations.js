import AnnotationLayer from './lib/annotationLayer';
import Arrow from './lib/arrowController';
import RectEmpty from './lib/rectEmptyController';
import EllipseEmpty from './lib/ellipseEmptyController';
import Line from './lib/lineController';
import Pencil from './lib/pencilController';
import Highlight from './lib/highlightController';
import Blur from './lib/blurController';
import Text from './lib/textController';

// Reverse order of stroke and filling, to allow for more pleasing stroke.
fabric.Text.prototype._renderText = function(ctx) {
  this._renderTextFill(ctx);
  this._renderTextStroke(ctx);
  this._renderTextFill(ctx);
};

module.exports = {
  AnnotationLayer,
  ArrowControl: Arrow,
  LineControl: Line,
  SquareControl: RectEmpty,
  OvalControl: EllipseEmpty,
  PencilControl: Pencil,
  HighlightControl: Highlight,
  BlurControl: Blur,
  TextControl: Text,
};
