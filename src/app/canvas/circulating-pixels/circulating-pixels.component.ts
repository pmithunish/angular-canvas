import {
  Component,
  OnInit,
  Inject,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
  HostListener
} from '@angular/core';

import { WINDOW, WindowRef } from './../../services/window.service';
import { ScrollService } from './../../services/scroll.service';
import { Subscription } from 'rxjs';
// import { Color } from '@my-component/rvd-canvas';

@Component({
  selector: 'app-circulating-pixels',
  templateUrl: './circulating-pixels.component.html',
  styleUrls: ['./circulating-pixels.component.scss']
})
export class CirculatingDotsComponent implements OnInit, OnDestroy {
  @ViewChild('mycanvas') canvasRef: ElementRef;
  colorPallete: Array<Color> = [
    { fgColor: `rgba(255,138,128,1)` }, // Red
    { fgColor: `rgba(255,128,171,1)` }, // Pink
    { fgColor: `rgba(234,128,252,1)` }, // Purple
    { fgColor: `rgba(179,136,255,1)` }, // Deep purple
    { fgColor: `rgba(140,158,255,1)` }, // Indigo
    { fgColor: `rgba(130,177,255,1)` }, // Blue
    { fgColor: `rgba(128,216,255,1)` }, // Light blue
    { fgColor: `rgba(132,255,255,1)` }, // Cyan
    { fgColor: `rgba(167,255,235,1)` } // Teal
  ];
  ctx: CanvasRenderingContext2D;
  particles: Array<Particle> = [];
  mouse: { x: number; y: number };
  scrollY = 0;
  scrollSubscription: Subscription;
  constructor(
    @Inject(WINDOW) private window: Window,
    private ngZone: NgZone,
    private scrollService: ScrollService
  ) {}

  ngOnInit() {
    this.scrollSubscription = this.scrollService.scrollY.subscribe(val => {
      this.scrollY = val;
    });
    // setting the initial canvas width and height
    this.canvasRef.nativeElement.width = this.window.innerWidth * 0.7 - 48;
    this.canvasRef.nativeElement.height = this.window.innerHeight * 0.4;
    this.ctx = this.canvasRef.nativeElement.getContext('2d');

    this.mouse = {
      x: this.canvasRef.nativeElement.width / 2,
      y: this.canvasRef.nativeElement.height / 2
    };

    // Initalize the particles array so that the painting process can start
    this.particlesInit();

    // run the initial paint outside the ngZone
    this.ngZone.runOutsideAngular(() => this.paint());
  }

  @HostListener('mousemove', ['$event'])
  onmousemove(event) {
    this.mouse.x = event.x - this.window.innerWidth * 0.15 - 24;
    this.mouse.y =
      event.y - 60 - 24 - 76 - this.window.innerHeight * 0.4 + this.scrollY;
  }

  @HostListener('window:resize')
  onresize() {
    this.particlesInit();
  }

  private particlesInit() {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      const radius = Math.random() * 2 + 1;
      this.particles.push(
        new Particle(
          this.canvasRef.nativeElement.width / 2,
          this.canvasRef.nativeElement.height / 2,
          radius,
          this.colorPallete[
            Math.floor(Math.random() * this.colorPallete.length)
          ].fgColor
        )
      );
    }
  }

  private paint() {
    requestAnimationFrame(() => this.paint());

    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.ctx.fillRect(
      0,
      0,
      this.canvasRef.nativeElement.width,
      this.canvasRef.nativeElement.height
    );
    this.particles.forEach(particle => {
      this.update(particle);
    });
  }

  private draw(particle: Particle) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = particle.color;
    this.ctx.lineWidth = particle.radius;
    this.ctx.moveTo(particle.lastPoint.x, particle.lastPoint.y);
    this.ctx.lineTo(particle.x, particle.y);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  private update(particle: Particle) {
    particle.lastPoint = { x: particle.x, y: particle.y };
    particle.lastMouse.x += (this.mouse.x - particle.lastMouse.x) * 0.05;
    particle.lastMouse.y += (this.mouse.y - particle.lastMouse.y) * 0.05;
    particle.radians += particle.velocity;
    particle.x =
      particle.lastMouse.x +
      Math.cos(particle.radians) * particle.distanceFromCenter;
    particle.y =
      particle.lastMouse.y +
      Math.sin(particle.radians) * particle.distanceFromCenter;
    this.draw(particle);
  }

  ngOnDestroy() {
    this.colorPallete = null;
    this.ctx = null;
    this.particles = null;
    this.mouse = null;
  }
}

export class Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  radians = Math.random() * Math.PI * 2;
  velocity = Math.random() * 0.03 + 0.02;
  distanceFromCenter = Math.random() * 70 + 50;
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

interface Color {
  fgColor: string;
}
