const gameConf = require('./game-conf');
const grid = require('./game-grid');
const indexOfArray = require('../../lib/util').indexOfArray;

const selection = (function () {
    var colors = gameConf.colors,
        colorToFill = (other = false) => {
            return other ? colors.otherSelection : colors.thisSelection;
        },
        colorCursor = colors.cursor,
        colorBackground = colors.background,
        defSingleDiv = gameConf.htmlElements.defSingleDiv,
        thisSelection = {
            isClear: true,
            clueInd: -1,
            squares: []
        },
        cursor = {
            ind: -1,
            isCertain: true
        },
        otherSelection = {
            clueInd: -1,
            squares: []
        },
        clues = {},
        socket = {},
        getSelectionSquares = (ind) => {
            var isAcross = clues[ind].isAcross,
                len = clues[ind].len,
                firstPos = clues[ind].pos,
                squares = [];

            for (var i = 0; i < len; i++) {
                // Add only square positions that are not
                // in other player's selection
                var possiblePos = [
                    firstPos[0] + (isAcross ? 0 : i),
                    firstPos[1] + (isAcross ? i : 0)
                ];
                if (!otherSelection.squares.length ||
                    indexOfArray(possiblePos.toString(), otherSelection.squares) === -1) {
                    squares.push([firstPos[0] + (isAcross ? 0 : i), firstPos[1] + (isAcross ? i : 0)]);
                }
            }
            return squares;
        },
        drawSelection = (squares, color) => {
            grid.drawSelection({
                squares,
                color
            });
        },
        setCursor = (ind = cursor.ind, isCertain = true, color = colorCursor) => {
            cursor = {
                ind,
                isCertain
            };
            grid.drawCursor({
                pos: thisSelection.squares[cursor.ind],
                isCertain: cursor.isCertain,
                color: color
            });
        },
        getCluesIndicesFromCursorPos = (sqPos) => {
            var cluesIndices = [];
            clues.forEach(function (clue, clueInd) {
                var rowsMod = clue.isAcross ? 0 : clue.len;
                var colsMod = clue.isAcross ? clue.len : 0;
                if (sqPos[0] >= clue.pos[0] && sqPos[1] >= clue.pos[1] &&
                    sqPos[0] <= clue.pos[0] + rowsMod &&
                    sqPos[1] <= clue.pos[1] + colsMod) {
                    cluesIndices.push(clueInd);
                }
            });
            return cluesIndices;
        },
        computeClueIndToUse = (indices, sqPos) => {
            var clueInd = thisSelection.clueInd,
                indOtherClueInd = indices.indexOf(otherSelection.clueInd),
                newInd;

            // Can't click on other player's selection
            if (otherSelection.squares.length &&
                indexOfArray(sqPos.toString(), otherSelection.squares) !== -1) {
                return -1;
            }

            // If square pos corresponds to only one clue ,
            // return the clue index
            if (indices.length === 1) {
                return indices[0];
            }

            // If square pos corresponds to two clues
            // and one is being written by other player
            // return the free clue index
            if (indOtherClueInd !== -1) {
                return indOtherClueInd ? indices[0] : indices[1];
            }

            // Choose which clue index to return
            newInd = clues[indices[0]].isAcross ? indices[0] : indices[1]; // select 'Across'
            if (clueInd !== -1) {
                if (clueInd === indices[0] ||
                    clueInd === indices[1]) {
                    if (!clues[clueInd].isAcross) {
                        newInd = clues[indices[0]].isAcross ? indices[1] :
                            indices[0]; // select 'Down'
                    }
                    if (thisSelection.squares[cursor.ind][0] === sqPos[0] &&
                        thisSelection.squares[cursor.ind][1] === sqPos[1]) {
                        newInd = clues[clueInd].isAcross ? indices[1] :
                            indices[0];
                    }
                }
            }
            return newInd;
        },


        stub = {
            init(c, s) {
                clues = c.clues;
                socket = s;
                return this;
            },
            set(ind) {
                // Don't select other player's selection
                if (otherSelection.clueInd !== -1 &&
                    otherSelection.clueInd === ind) {
                    return false;
                }
                if (ind >= 0 && ind < clues.length) {
                    thisSelection.squares = getSelectionSquares(ind);
                    if (thisSelection.squares) {
                        thisSelection.isClear = false;
                        thisSelection.clueInd = ind;
                        drawSelection(thisSelection.squares, colorToFill());
                        setCursor(0);
                        defSingleDiv.innerHTML = clues[ind].def;
                        return true;
                    }
                }
                return false;
            },
            setBySqPos(sqPos) {
                var cluesIndices = getCluesIndicesFromCursorPos(sqPos),
                    ind = computeClueIndToUse(cluesIndices, sqPos);

                if (ind >= 0 && ind < clues.length) {
                    thisSelection.squares = getSelectionSquares(ind);
                    if (thisSelection.squares) {
                        thisSelection.isClear = false;
                        thisSelection.clueInd = ind;
                        drawSelection(thisSelection.squares, colorToFill());
                        setCursor(indexOfArray(sqPos.toString(), thisSelection.squares));
                        defSingleDiv.innerHTML = clues[thisSelection.clueInd].def;
                        return true;
                    }
                }
                return false;
            },
            setOther(ind, squares) {
                if (ind >= 0 && ind < clues.length) {
                    otherSelection.clueInd = ind;
                    otherSelection.squares = squares;
                    drawSelection(squares, colorToFill(true));
                }
                return this;
            },
            clear() {
                setCursor(undefined, undefined, colorBackground); // clear cursor
                drawSelection(thisSelection.squares, colorBackground);
                thisSelection.isClear = true;
                defSingleDiv.innerHTML = '&nbsp;';
                return this;
            },
            clearOther() {
                if (otherSelection !== -1) {
                    drawSelection(otherSelection.squares, colorBackground);
                    otherSelection.clueInd = -1;
                    otherSelection.squares = [];
                }
                return this;
            },
            moveCursor(direction = "forward") {
                var selectionLength = thisSelection.squares.length;

                if (direction === 'backwards') {
                    if (cursor.ind) {
                        cursor.ind -= 1;
                    }
                } else {
                    if (cursor.ind !== selectionLength - 1) {
                        cursor.ind += 1;
                    }
                }
                setCursor(cursor.ind, cursor.isCertain);
                return this;
            },
            toggleCursor() {
                setCursor(undefined, !cursor.isCertain);
                return this;
            },
            getCursor() {
                return cursor;
            },
            getSquares() {
                return thisSelection.squares;
            },
            emit() {
                var ind = -1,
                    squares = [];
                if (!thisSelection.isClear) {
                    ind = thisSelection.clueInd;
                    squares = thisSelection.squares;
                }
                socket.emit('selection to other', {
                    ind,
                    squares
                });
                return this;
            }

        };

    return stub;
}());

module.exports = selection;
