/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */
import mxConstants from './mxConstants';
import mxPoint from "./mxPoint";
import mxPolyline from "../shape/mxPolyline";

/**
 * Class: mxGuide
 *
 * Implements the alignment of selection cells to other cells in the graph.
 *
 * Constructor: mxGuide
 *
 * Constructs a new guide object.
 */
class mxGuide {
  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph> instance.
   */
  graph = null;

  /**
   * Variable: states
   *
   * Contains the <mxCellStates> that are used for alignment.
   */
  states = null;

  /**
   * Variable: horizontal
   *
   * Specifies if horizontal guides are enabled. Default is true.
   */
  horizontal = true;

  /**
   * Variable: vertical
   *
   * Specifies if vertical guides are enabled. Default is true.
   */
  vertical = true;

  /**
   * Variable: guideX
   *
   * Holds the <mxShape> for the horizontal guide.
   */
  guideX = null;

  /**
   * Variable: guideY
   *
   * Holds the <mxShape> for the vertical guide.
   */
  guideY = null;

  /**
   * Variable: rounded
   *
   * Specifies if rounded coordinates should be used. Default is false.
   */
  rounded = false;

  /**
   * Variable: tolerance
   *
   * Default tolerance in px if grid is disabled. Default is 2.
   */
  tolerance = 2;

  constructor(graph, states) {
    this.graph = graph;
    this.setStates(states);
  }

  /**
   * Function: setStates
   *
   * Sets the <mxCellStates> that should be used for alignment.
   */
  setStates(states) {
    this.states = states;
  }

  /**
   * Function: isEnabledForEvent
   *
   * Returns true if the guide should be enabled for the given native event. This
   * implementation always returns true.
   */
  isEnabledForEvent(evt) {
    return true;
  }

  /**
   * Function: getGuideTolerance
   *
   * Returns the tolerance for the guides. Default value is gridSize / 2.
   */
  getGuideTolerance(gridEnabled) {
    return gridEnabled && this.graph.gridEnabled
      ? this.graph.gridSize / 2
      : this.tolerance;
  }

  /**
   * Function: createGuideShape
   *
   * Returns the mxShape to be used for painting the respective guide. This
   * implementation returns a new, dashed and crisp <mxPolyline> using
   * <mxConstants.GUIDE_COLOR> and <mxConstants.GUIDE_STROKEWIDTH> as the format.
   *
   * Parameters:
   *
   * horizontal - Boolean that specifies which guide should be created.
   */
  createGuideShape(horizontal) {
    const guide = new mxPolyline(
      [],
      mxConstants.GUIDE_COLOR,
      mxConstants.GUIDE_STROKEWIDTH
    );
    guide.isDashed = true;

    return guide;
  }

  /**
   * Function: isStateIgnored
   *
   * Returns true if the given state should be ignored.
   */
  isStateIgnored(state) {
    return false;
  }

  /**
   * Function: move
   *
   * Moves the <bounds> by the given <mxPoint> and returnt the snapped point.
   */
  move(bounds, delta, gridEnabled, clone) {
    if (
      this.states != null &&
      (this.horizontal || this.vertical) &&
      bounds != null &&
      delta != null
    ) {
      const { scale } = this.graph.getView();
      const tt = this.getGuideTolerance(gridEnabled) * scale;
      const b = bounds.clone();
      b.x += delta.x;
      b.y += delta.y;
      let overrideX = false;
      let stateX = null;
      let valueX = null;
      let overrideY = false;
      let stateY = null;
      let valueY = null;
      let ttX = tt;
      let ttY = tt;
      const left = b.x;
      const right = b.x + b.width;
      const center = b.getCenterX();
      const top = b.y;
      const bottom = b.y + b.height;
      const middle = b.getCenterY();

      // Snaps the left, center and right to the given x-coordinate
      function snapX(x, state, centerAlign) {
        let override = false;

        if (centerAlign && Math.abs(x - center) < ttX) {
          delta.x = x - bounds.getCenterX();
          ttX = Math.abs(x - center);
          override = true;
        } else if (!centerAlign) {
          if (Math.abs(x - left) < ttX) {
            delta.x = x - bounds.x;
            ttX = Math.abs(x - left);
            override = true;
          } else if (Math.abs(x - right) < ttX) {
            delta.x = x - bounds.x - bounds.width;
            ttX = Math.abs(x - right);
            override = true;
          }
        }

        if (override) {
          stateX = state;
          valueX = x;

          if (this.guideX == null) {
            this.guideX = this.createGuideShape(true);

            // Makes sure to use SVG shapes in order to implement
            // event-transparency on the background area of the rectangle since
            // HTML shapes do not let mouseevents through even when transparent
            this.guideX.dialect = mxConstants.DIALECT_SVG;
            this.guideX.pointerEvents = false;
            this.guideX.init(this.graph.getView().getOverlayPane());
          }
        }

        overrideX = overrideX || override;
      }

      // Snaps the top, middle or bottom to the given y-coordinate
      function snapY(y, state, centerAlign) {
        let override = false;

        if (centerAlign && Math.abs(y - middle) < ttY) {
          delta.y = y - bounds.getCenterY();
          ttY = Math.abs(y - middle);
          override = true;
        } else if (!centerAlign) {
          if (Math.abs(y - top) < ttY) {
            delta.y = y - bounds.y;
            ttY = Math.abs(y - top);
            override = true;
          } else if (Math.abs(y - bottom) < ttY) {
            delta.y = y - bounds.y - bounds.height;
            ttY = Math.abs(y - bottom);
            override = true;
          }
        }

        if (override) {
          stateY = state;
          valueY = y;

          if (this.guideY == null) {
            this.guideY = this.createGuideShape(false);

            // Makes sure to use SVG shapes in order to implement
            // event-transparency on the background area of the rectangle since
            // HTML shapes do not let mouseevents through even when transparent
            this.guideY.dialect = mxConstants.DIALECT_SVG;
            this.guideY.pointerEvents = false;
            this.guideY.init(this.graph.getView().getOverlayPane());
          }
        }

        overrideY = overrideY || override;
      }

      for (let i = 0; i < this.states.length; i += 1) {
        const state = this.states[i];

        if (state != null && !this.isStateIgnored(state)) {
          // Align x
          if (this.horizontal) {
            snapX.call(this, state.getCenterX(), state, true);
            snapX.call(this, state.x, state, false);
            snapX.call(this, state.x + state.width, state, false);

            // Aligns left and right of shape to center of page
            if (state.cell == null) {
              snapX.call(this, state.getCenterX(), state, false);
            }
          }

          // Align y
          if (this.vertical) {
            snapY.call(this, state.getCenterY(), state, true);
            snapY.call(this, state.y, state, false);
            snapY.call(this, state.y + state.height, state, false);

            // Aligns left and right of shape to center of page
            if (state.cell == null) {
              snapY.call(this, state.getCenterY(), state, false);
            }
          }
        }
      }

      // Moves cells to the raster if not aligned
      this.graph.snapDelta(delta, bounds, !gridEnabled, overrideX, overrideY);
      delta = this.getDelta(bounds, stateX, delta.x, stateY, delta.y);

      // Redraws the guides
      const c = this.graph.container;

      if (!overrideX && this.guideX != null) {
        this.guideX.node.style.visibility = 'hidden';
      } else if (this.guideX != null) {
        let minY = null;
        let maxY = null;

        if (stateX != null && bounds != null) {
          minY = Math.min(bounds.y + delta.y - this.graph.panDy, stateX.y);
          maxY = Math.max(
            bounds.y + bounds.height + delta.y - this.graph.panDy,
            stateX.y + stateX.height
          );
        }

        if (minY != null && maxY != null) {
          this.guideX.points = [
            new mxPoint(valueX, minY),
            new mxPoint(valueX, maxY),
          ];
        } else {
          this.guideX.points = [
            new mxPoint(valueX, -this.graph.panDy),
            new mxPoint(valueX, c.scrollHeight - 3 - this.graph.panDy),
          ];
        }

        this.guideX.stroke = this.getGuideColor(stateX, true);
        this.guideX.node.style.visibility = 'visible';
        this.guideX.redraw();
      }

      if (!overrideY && this.guideY != null) {
        this.guideY.node.style.visibility = 'hidden';
      } else if (this.guideY != null) {
        let minX = null;
        let maxX = null;

        if (stateY != null && bounds != null) {
          minX = Math.min(bounds.x + delta.x - this.graph.panDx, stateY.x);
          maxX = Math.max(
            bounds.x + bounds.width + delta.x - this.graph.panDx,
            stateY.x + stateY.width
          );
        }

        if (minX != null && maxX != null) {
          this.guideY.points = [
            new mxPoint(minX, valueY),
            new mxPoint(maxX, valueY),
          ];
        } else {
          this.guideY.points = [
            new mxPoint(-this.graph.panDx, valueY),
            new mxPoint(c.scrollWidth - 3 - this.graph.panDx, valueY),
          ];
        }

        this.guideY.stroke = this.getGuideColor(stateY, false);
        this.guideY.node.style.visibility = 'visible';
        this.guideY.redraw();
      }
    }

    return delta;
  }

  /**
   * Function: getDelta
   *
   * Rounds to pixels for virtual states (eg. page guides)
   */
  getDelta(bounds, stateX, dx, stateY, dy) {
    const s = this.graph.view.scale;

    if (this.rounded || (stateX != null && stateX.cell == null)) {
      dx = Math.round((bounds.x + dx) / s) * s - bounds.x;
    }

    if (this.rounded || (stateY != null && stateY.cell == null)) {
      dy = Math.round((bounds.y + dy) / s) * s - bounds.y;
    }

    return new mxPoint(dx, dy);
  }

  /**
   * Function: getGuideColor
   *
   * Returns the color for the given state.
   */
  getGuideColor(state, horizontal) {
    return mxConstants.GUIDE_COLOR;
  }

  /**
   * Function: hide
   *
   * Hides all current guides.
   */
  hide() {
    this.setVisible(false);
  }

  /**
   * Function: setVisible
   *
   * Shows or hides the current guides.
   */
  setVisible(visible) {
    if (this.guideX != null) {
      this.guideX.node.style.visibility = visible ? 'visible' : 'hidden';
    }

    if (this.guideY != null) {
      this.guideY.node.style.visibility = visible ? 'visible' : 'hidden';
    }
  }

  /**
   * Function: destroy
   *
   * Destroys all resources that this object uses.
   */
  destroy() {
    if (this.guideX != null) {
      this.guideX.destroy();
      this.guideX = null;
    }

    if (this.guideY != null) {
      this.guideY.destroy();
      this.guideY = null;
    }
  }
}

export default mxGuide;
