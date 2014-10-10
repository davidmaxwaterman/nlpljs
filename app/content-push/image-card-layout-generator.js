(function () {
  var EMPTY = 0;
  var FULL = 1;

  /*
  a grid data structure is used throughout, which is an array like:

  [
    [EMPTY, FULL, EMPTY, FULL],
    [FULL, FULL, EMPTY, FULL],
    ...
  ]

  each element is a row; and each element in a row is a column
  */

  // grid: array representation of a grid
  // width: number of cells in the row
  var nextRow = 0;
  var addEmptyRow = function (grid, width) {
    var row = [];

    for (var i = 0; i < width; i++) {
      row.push(EMPTY);
    }

    grid.push(row);

    return grid;
  };

  // returns true if arr1 and arr2 contain the same elements
  var same = function (arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }

    return true;
  };

  // return the elements which are common to all arrays passed as arguments;
  // e.g. intersect([ [ 3, 4 ] ], [ [ 2, 3 ], [ 3, 4 ] ], [ [ 3, 4 ], [ 4, 5 ] ])
  // returns [ [ 3, 4 ] ]
  // arrays: an array of arrays, as exemplified above
  var intersect = function (arrays) {
    var head = arrays[0];
    var tail = arrays.slice(1);

    // the memo is the array of common elements so far
    return _.reduce(tail, function (memo, arr) {
      var newMemo = [];

      _.each(memo, function (memoItem) {
        _.each(arr, function (arrItem) {
          if (same(memoItem, arrItem)) {
            newMemo.push(arrItem);
          }
        });
      });

      return newMemo;
    }, head);
  };

  // find all sequences in <arr> of length <length> whose elements
  // return true when passed to fn, e.g.
  // var fn = function (elt) { return elt === EMPTY; }
  // findSequences([FULL, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, FULL, EMPTY, EMPTY, EMPTY], fn, 3)
  // should return [ [1, 2, 3], [2, 3, 4], [3, 4, 5], [7, 8, 9] ]
  // (i.e. all sub-arrays of length 3 where all the elements === EMPTY)
  var findSequences = function (arr, fn, length) {
    // final sequences of length <length>
    var sequences = [];

    var completeSequences = function (seq) {
      return seq.length === length;
    };

    var incompleteSequences = function (seq) {
      return seq.length < length;
    };

    // sequences currently in progress
    var inProgress = [];

    arr.forEach(function (item, index) {
      item = arr[index];

      if (fn(item)) {
        // start a new sequence
        inProgress.push([]);

        // append this item to all existing sequences
        _.each(inProgress, function (seq) {
          seq.push({index: index, item: item});
        });
      }
      else {
        // remove all sequences from inProgress
        inProgress = [];
      }

      // add all sequences of correct length to output sequences
      sequences = sequences.concat(_.remove(inProgress, completeSequences));
    });

    return sequences;
  };

  // find all continuous sequences of EMPTY cells in row
  // with length <width>
  var findColumnSequences = function (row, width) {
    return findSequences(row, function (item) { return !item; }, width);
  };

  // find a sequence of row numbers in <grid> with the same length as
  // <height>; each row included must have at least one EMPTY cell;
  // this provides candidate groups of rows which can be tested for
  // EMPTY sequences of columns
  var findRowSequences = function (grid, height) {
    return findSequences(grid, function (row) {
      var emptyCells = _.select(row, function (cell) {
        return !cell;
      });

      return !!emptyCells.length;
    }, height);
  };

  /*
  output:

  [
    { rows: [ 2, 3, 4 ], columns: [ 2, 3 ] },
    { rows: [ 2, 3, 4 ], columns: [ 3, 4 ] },
    { rows: [ 3, 4, 5 ], columns: [ 3, 4 ] },
    { rows: [ 7, 8, 9 ], columns: [ 0, 1 ] }
    { rows: [ 8, 9, 10 ], columns: [ 0, 1 ] }
  ]
  */
  var findSpaces = function (grid, width, height) {
    // first get row sequences for height; these are continuous groups
    // of rows which may contain the empty cells we want
    var rowSequences = findRowSequences(grid, height);

    // this contains all possible row+column combinations which could
    // fit width x height
    var candidates = [];

    // for each row sequence, get the column sequences for each of its rows
    for (var i = 0; i < rowSequences.length; i++) {
      var rowSequence = _.map(rowSequences[i], function (item) {
        return item.index;
      });

      var columnSequencesByRow = {};

      for (var j = 0; j < rowSequence.length; j++) {
        var rowNum = rowSequence[j];
        var row = grid[rowNum];
        var columnSequencesForRow = findColumnSequences(row, width);
        columnSequencesByRow[rowNum] = _.map(columnSequencesForRow, function (item) {
          return _.map(item, function (subitem) {
            return subitem.index;
          });
        });
      }

      // sequences of columns common across all of the rows
      var commonColumnSequences = intersect(_.values(columnSequencesByRow));

      // data structure looks like this:
      // { rows: [ '0', '1', '2' ], columns: [ [ 3, 4 ], [ 4, 5 ] ] }
      // meaning "(columns 3 and 4) or (columns 4 and 5) in rows 0, 1 and
      // 2 provide enough space to fit width x height"
      _.each(commonColumnSequences, function (seq) {
        candidates.push({
          rows: _.keys(columnSequencesByRow),
          columns: seq
        });
      });
    }

    return candidates;
  };

  // Fill the cells in the grid which are occupied by <shape>
  // shape: one item from the array which is output by findSpaces;
  // contains "rows" and "columns" properties which describe the rows
  // it occupies and the columns on each of those rows
  var fillCells = function (grid, shape) {
    var rowsToFill = shape.rows;
    var columnsToFill = shape.columns;

    _.each(rowsToFill, function (row) {
      _.each(columnsToFill, function (col) {
        grid[row][col] = FULL;
      });
    });

    return grid;
  };

  /*
  Find a packing for <shapes> in a grid with max width <width>;
  rows of width <width> are added to the grid if a shape won't fit
  into the grid's current rows.

  shapes: array of shapes with form {width: w, height: h};
  width and height are expressed in number of columns and number of
  rows respectively

  returns a layout object like this:

  {
    grid: <grid with FULL/EMPTY cells>,
    placements: [
      {shape: <shape to place>, position: {rows: [], columns: []}}
    ]
  }

  position describes the rows, and the columns in those rows, which the
  shape will occupy
  */
  var findLayout = function (shapes, gridWidth, grid, placements) {
    grid = grid || [];
    placements = placements || [];

    var shape;
    var possiblePositions;
    for (var i = 0; i < shapes.length; i++) {
      shape = shapes[i];
      possiblePositions = findSpaces(grid, shape.width, shape.height);

      if (!possiblePositions.length) {
        // shape can't fit into the grid as is, so add a row and try again
        grid = addEmptyRow(grid, gridWidth);
        var layout = findLayout([shapes[i]], gridWidth, grid, placements);
        grid = layout.grid;
        placements = layout.placements;
      }
      else {
        // found one or more positions, so fill the grid using the first one
        // and continue with the remaining shapes;
        // NB this assumes that the first position found, which will
        // be the closest to the top-left corner, is the best
        grid = fillCells(grid, possiblePositions[0]);
        placements.push({shape: shape, position: possiblePositions[0]});
      }
    }

    return {
      grid: grid,
      placements: placements
    };
  };

  var LayoutGenerator = function () {};
  LayoutGenerator.prototype.generate = findLayout;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutGenerator;
  }
  else {
    window.LayoutGenerator = LayoutGenerator;
  }
})();