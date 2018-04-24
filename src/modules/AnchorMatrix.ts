import { Anchor } from "./Anchor";

export class AnchorMatrix {
  private _anchors: Anchor[] = [];
  private anchorMatrix: Anchor[][] = [];
  private static readonly anchorOpposites = [
    [{ row: 2, col: 2},{ row: 2, col: 1},{ row: 2, col: 0}],
    [{ row: 1, col: 1},{ row: 1, col: 0}],
    [{ row: 0, col: 2},{ row: 0, col: 1},{ row: 0, col: 0}]
  ];
  private static readonly anchorOriginOpposites = [
    [{ row: 2, col: 2},{ row: 2, col: 0},{ row: 2, col: 0}],
    [{ row: 0, col: 2},{ row: 0, col: 0}],
    [{ row: 0, col: 2},{ row: 0, col: 0},{ row: 0, col: 0}]
  ];

  set anchors(anchors: Anchor[]) {
    this._anchors = anchors;
    this.anchorMatrix = this.build(this._anchors);
    this.addAnchorHandles();
  }

  public getAnchorMatrix() {
    return this.anchorMatrix;
  }

  public getCollidingAnchor(x: number, y: number): Anchor|false {
    let collidingAnchor: Anchor|false = false;
    this.anchorMatrix.forEach((anchorRow: Anchor[], row: number) => {
      anchorRow.forEach((anchor: Anchor, pos: number) => {
        if (
          x >= (anchor.x - anchor.size) && 
          x <= (anchor.x + (anchor.size * 2)) &&
          y >= (anchor.y - anchor.size) &&
          y <= (anchor.y + (anchor.size * 2))
        ) {
          collidingAnchor = anchor;
        }
      });
    });

    return collidingAnchor;
  }

  public getOppositeAnchor(anchor: Anchor): Anchor {
    let oppositeAnchor = AnchorMatrix.anchorOpposites[anchor.row][anchor.col];
    return this.anchorMatrix[oppositeAnchor.row][oppositeAnchor.col];
  }

  public getOppositeOriginAnchor(anchor: Anchor): Anchor {
    let oppositeAnchor = AnchorMatrix.anchorOriginOpposites[anchor.row][anchor.col];
    return this.anchorMatrix[oppositeAnchor.row][oppositeAnchor.col];
  }

  public addAnchorHandles() {
    let cursors = [
      "nwse-resize",
      "row-resize",
      "nesw-resize",
      "col-resize",
      "col-resize",
      "nesw-resize",
      "row-resize",
      "nwse-resize"
    ];

    this.anchorMatrix.forEach((anchorRow, row: number) => {
      anchorRow.forEach((anchor, col: number) => {
        let direction = <string> cursors.shift();
        this.anchorMatrix[row][col].setCursor(direction);
        this.anchorMatrix[row][col].setPosition(row, col);
      });
    });
  }

  private build(anchors: Anchor[]): Anchor[][] {
    // Extract anchor positions from array.
    let topLeft = anchors.reduce((acc, val) => (val.x <= acc.x && val.y <= acc.y) ? val : acc, anchors[0]);
    let topRight = anchors.reduce((acc, val) => (val.x >= acc.x && val.y <= acc.y) ? val : acc, anchors[0]);
    let bottomRight = anchors.reduce((acc, val) => (val.x >= acc.x && val.y >= acc.y) ? val : acc, anchors[0]);
    let bottomLeft = anchors.reduce((acc, val) => (val.x <= acc.x && val.y >= acc.y) ? val : acc, anchors[0]);    
    let topMiddle = anchors.reduce((acc, val) => (val.x == ((topRight.x + topLeft.x) / 2) && val.y == topLeft.y) ? val : acc, anchors[0]);
    let bottomMiddle = anchors.reduce((acc, val) => (val.x == ((bottomRight.x + bottomLeft.x) / 2) && val.y == bottomLeft.y) ? val : acc, anchors[0]);
    let rightMiddle = anchors.reduce((acc, val) => (val.x == topRight.x && val.y == (bottomRight.y + topRight.y) / 2) ? val : acc, anchors[0]);
    let leftMiddle = anchors.reduce((acc, val) => (val.x == topLeft.x && val.y == (bottomRight.y + topRight.y) / 2) ? val : acc, anchors[0]);

    // Build a matrix of anchors.
    return [
      [topLeft,topMiddle,topRight],
      [leftMiddle,rightMiddle],
      [bottomLeft,bottomMiddle,bottomRight]    
    ];
  }
}