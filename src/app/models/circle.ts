export class Circle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  minRadius: number;
  color: string;

  constructor(
    x: number,
    y: number,
    dx: number,
    dy: number,
    radius: number,
    color: string
  ) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
    this.minRadius = radius;
    this.color = color;
  }
}
