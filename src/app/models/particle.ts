const enum INFO {
  PARTICLE_ROTATE_VELOCITY_MIN = 0.03,
  PARTICLE_ROTATE_VELOCITY_MAX = 0.02, // actual max = min + current i.e., max = 0.03 + 0.02 = 0.05
  PARTICLE_DISTANCE_FROM_CENTER_MIN = 70,
  PARTICLE_DISTANCE_FROM_CENTER_MAX = 50 // actual max = min + current i.e., max = 70 + 50 = 120
}

export class Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  radians = Math.random() * Math.PI * 2; // 2 pi rad(0,1)
  velocity =
    Math.random() * INFO.PARTICLE_ROTATE_VELOCITY_MIN +
    INFO.PARTICLE_ROTATE_VELOCITY_MAX;
  distanceFromCenter =
    Math.random() * INFO.PARTICLE_DISTANCE_FROM_CENTER_MIN +
    INFO.PARTICLE_DISTANCE_FROM_CENTER_MAX;
  lastPoint: { x: number; y: number };
  lastMouse: { x: number; y: number };
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.lastMouse = { x: x, y: y };
    this.radius = radius;
    this.color = color;
  }
}
