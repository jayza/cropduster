export class Anchor {
  public x: number;
  public y: number;
  public size: number = 5;
  public row: number = 0;
  public col: number = 0;
  public cursor: string = 'auto';

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public setCursor(cursor: string) {
    this.cursor = cursor;
  }

  public setPosition(row: number, col: number) {
    this.row = row;
    this.col = col;
  }
}