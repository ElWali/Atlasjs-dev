import { Evented } from './atlas-core.js';
import { getPosition, setPosition } from './atlas-dom.js';
import { requestAnimFrame, cancelAnimFrame } from './atlas-utils.js';

export var PosAnimation = Evented.extend({
  run: function (el, newPos, duration, easeLinearity) {
    this.stop();
    this._el = el;
    this._inProgress = true;
    this._duration = duration || 0.25;
    this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);
    this._startPos = getPosition(el);
    this._offset = newPos.subtract(this._startPos);
    this._startTime = +new Date();
    this.fire('start');
    this._animate();
  },

  stop: function () {
    if (!this._inProgress) { return; }
    this._step(true);
    this._complete();
  },

  _animate: function () {
    this._animId = requestAnimFrame(this._animate, this);
    this._step();
  },

  _step: function (round) {
    var elapsed = (+new Date()) - this._startTime,
        duration = this._duration * 1000;
    if (elapsed < duration) {
      this._runFrame(this._easeOut(elapsed / duration), round);
    } else {
      this._runFrame(1);
      this._complete();
    }
  },

  _runFrame: function (progress, round) {
    var pos = this._startPos.add(this._offset.multiplyBy(progress));
    if (round) {
      pos._round();
    }
    setPosition(this._el, pos);
    this.fire('step');
  },

  _complete: function () {
    cancelAnimFrame(this._animId);
    this._inProgress = false;
    this.fire('end');
  },

  _easeOut: function (t) {
    return 1 - Math.pow(1 - t, this._easeOutPower);
  }
});