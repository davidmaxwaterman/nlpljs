(function () {
  // frames around image-item elements inside an image-card;
  // NB the first item in this object will be the default if
  // no other frame is suitable
  var FRAMES = [
    { name: 'small_square', rows: 2, cols: 2, ratio: 1 },
    { name: 'large_square', rows: 4, cols: 4, ratio: 1 },
    { name: 'portrait', cols: 2, rows: 4, ratio: 0.5 },
    { name: 'landscape1', cols: 4, rows: 2, ratio: 2 },
    { name: 'landscape2', cols: 4, rows: 3, ratio: 1.333333 }
  ];

  var FrameChooser = function (colWidth, rowHeight) {
    this.colWidth = colWidth;
    this.rowHeight = rowHeight;
  };

  /**
   * Convenience function to get a frame by name (inefficient).
   *
   * @param String frameName Name of frame to retrieve.
   *
   * @returns null if named frame is not found
   */
  FrameChooser.prototype.getFrameByName = function (frameName) {
    for (var key in FRAMES) {
      if (FRAMES.hasOwnProperty(key)) {
        if (FRAMES[key].name === frameName) {
          return FRAMES[key];
        }
      }
    }

    return null;
  };

  /**
   * Choose a frame from FRAMES for imageItem; the frame with the
   * closest ratio which is shorter than the image is preferred;
   * the closeness of the size of the frame is used as a tie-breaker
   * if two candidate frames have the same ratio and are shorter
   * than the image.
   *
   * @param Object imageItem Image item to choose a frame for;
   * must have width, height and ratio properties
   * (e.g. image-item elements satisfy this)
   *
   * @returns an item from FrameChooser.FRAMES
   */
  FrameChooser.prototype.choose = function (imageItem) {
    // best so far
    var nearestRatio;
    var nearestSize;

    // chosen frame so far
    var chosenFrame;

    var candidateFrame;
    var candidateFrameWidth;
    var candidateFrameHeight;
    var betterCandidate;
    var ratioDiff;
    var sizeDiff;
    var heightDiff;
    var widthDiff;

    // the image must be the same height or taller than the frame
    // for the frame to be a candidate
    var heightGreater;

    for (var i = 0; i < FRAMES.length; i++) {
      candidateFrame = FRAMES[i];
      candidateFrameWidth = candidateFrame.cols * this.colWidth;
      candidateFrameHeight = candidateFrame.rows * this.rowHeight;

      ratioDiff = Math.abs(candidateFrame.ratio - imageItem.ratio);

      widthDiff = Math.abs(candidateFrameWidth - imageItem.width);
      heightDiff = Math.abs(candidateFrameHeight - imageItem.height);
      sizeDiff = widthDiff + heightDiff;
      heightGreaterOrEqual = (imageItem.height >= candidateFrameHeight);

      betterCandidate = !chosenFrame ||
                        (ratioDiff < nearestRatio && heightGreaterOrEqual) ||
                        (ratioDiff === nearestRatio && sizeDiff < nearestSize
                         && heightGreaterOrEqual);

      if (betterCandidate) {
        chosenFrame = candidateFrame;
        nearestRatio = ratioDiff;
        nearestSize = sizeDiff;
      }
    }

    return chosenFrame;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrameChooser;
  }
  else {
    window.FrameChooser = FrameChooser;
  }
})();
