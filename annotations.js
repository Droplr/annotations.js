import AnnotationLayer from './lib/annotationLayer';
import Arrow from './lib/arrowController';
import RectEmpty from './lib/rectEmptyController';
import RectFilled from './lib/rectFilledController';
import EllipseEmpty from './lib/ellipseEmptyController';
import EllipseFilled from './lib/ellipseFilledController';
import Line from './lib/lineController';
import Pencil from './lib/pencilController';
import Highlight from './lib/highlightController';
import Blur from './lib/blurController';
import Text from './lib/textController';
import Emoji from './lib/emojiController';
import emojis from './lib/emojis';

// Reverse order of stroke and filling, to allow for more pleasing stroke.
fabric.Text.prototype._renderText = function(ctx) {
  this._renderTextFill(ctx);
  this._renderTextStroke(ctx);
  this._renderTextFill(ctx);
};
// Set default transform corners size and remove their transparency.
fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerSize = 20;

export default {
  AnnotationLayer,
  ArrowControl: Arrow,
  LineControl: Line,
  SquareControl: RectEmpty,
  SquareFilledControl: RectFilled,
  OvalControl: EllipseEmpty,
  OvalFilledControl: EllipseFilled,
  PencilControl: Pencil,
  HighlightControl: Highlight,
  BlurControl: Blur,
  TextControl: Text,
  EmojiControl: Emoji,
  emojis,
};
