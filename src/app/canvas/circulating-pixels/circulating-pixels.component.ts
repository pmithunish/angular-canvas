import {
  Component,
  OnInit,
  Inject,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';

import { WINDOW, WindowRef } from './../../services/window.service';
import { ScrollService } from './../../services/scroll.service';
import { Subscription } from 'rxjs';
import { Color } from './../../models/color';
import { Mouse } from './../../models/mouse';

const DEFAULT_COLOR_PALETTE: Array<Color> = [
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

interface HeightParam {
  windowHeight: number;
  heightPercentage: number;
}

interface WidthParam {
  windowWidth: number;
  widthPercentage: number;
  xPadding: number;
}

interface OffsetXParam {
  windowWidth: number;
  offsetPercentage: number;
  xPadding: number;
}

interface OffsetYParam {
  windowHeight: number;
  offsetPercentage?: number;
  yPadding?: number;
  basePageMargin?: number;
  baseHeading?: number;
}

const enum CANVAS {
  // Values of below enum doesn't change when screen type changes
  // Since these don't change the program can directly use these values
  BASE_PAGE_MARGIN = 60,
  BASE_HEADING = 33 + 24,
  CARD_PADDING_Y = 48,
  CARD_OFFSET_PERCENTAGE_Y = 0.4,
  HEIGHT_PERCENTAGE = 0.4,

  // Values of below enum is chosen according to screen types
  // one of below values is assigned to var -> cardPaddingX at a given time
  DEFAULT_CARD_PADDING_X = 48,
  SMALL_CARD_PADDING_X = 36,

  // one of below values is assigned to var -> widthPercentage at a given time
  DEFAULT_WIDTH_PERCENTAGE = 0.7,
  SMALL_WIDTH_PERCENTAGE = 0.95,

  // one of below values is assigned to var -> cardOffsetPercentageX at a given time
  DEFAULT_CARD_OFFSET_PERCENTAGE_X = 0.15,
  SMALL_CARD_OFFSET_PERCENTAGE_X = 0.025
}

@Component({
  selector: 'app-circulating-pixels',
  templateUrl: './circulating-pixels.component.html',
  styleUrls: ['./circulating-pixels.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CirculatingDotsComponent implements OnInit, OnDestroy {
  @ViewChild('mycanvas') canvasRef: ElementRef;
  colorPalette;
  ctx: CanvasRenderingContext2D;
  particles: Array<Particle> = [];
  mouse: Mouse;
  scrollY = 0;
  scrollSubscription: Subscription;
  cardPaddingX: number = CANVAS.DEFAULT_CARD_PADDING_X;
  widthPercentage: number = CANVAS.DEFAULT_WIDTH_PERCENTAGE;
  cardOffsetPercentageX: number = CANVAS.DEFAULT_CARD_OFFSET_PERCENTAGE_X;
  constructor(
    @Inject(WINDOW) private window: Window,
    private ngZone: NgZone,
    private scrollService: ScrollService
  ) {}

  ngOnDestroy() {
    this.colorPalette = null;
    this.ctx = null;
    this.particles = null;
    this.mouse = null;
    this.scrollY = null;
    this.scrollSubscription !== undefined
      ? this.scrollSubscription.unsubscribe()
      : (this.scrollSubscription = undefined);
    this.cardPaddingX = undefined;
    this.widthPercentage = undefined;
    this.cardOffsetPercentageX = undefined;
  }

  ngOnInit() {
    this.scrollSubscription = this.scrollService.scrollY.subscribe(val => {
      this.scrollY = val;
    });

    // setting the initial canvas width and height
    this.setCanvasDefaults().then(() => {
      this.setWidthHeight();

      this.ctx = this.canvasRef.nativeElement.getContext('2d');

      if (this.colorPalette === undefined) {
        this.colorPalette = DEFAULT_COLOR_PALETTE;
      }

      // Setting the spawn position to center of the canvas
      this.mouse = {
        x: this.canvasRef.nativeElement.width / 2,
        y: this.canvasRef.nativeElement.height / 2
      };

      // Initalize the particles array so that the painting process can start
      this.particlesInit();

      // run the initial paint outside the ngZone
      this.ngZone.runOutsideAngular(() => this.paint());
    });
  }

  @HostListener('mousemove', ['$event'])
  onmousemove(event) {
    this.mouse.x =
      event.x -
      this.offsetX({
        windowWidth: this.window.innerWidth,
        offsetPercentage: this.cardOffsetPercentageX,
        xPadding: this.cardPaddingX
      });
    this.mouse.y =
      event.y -
      this.offsetY({ windowHeight: this.window.innerHeight }) +
      this.scrollY;
  }

  @HostListener('window:resize')
  onresize() {
    this.setCanvasDefaults().then(() => {
      this.setWidthHeight();
      this.particlesInit();
    });
  }

  setCanvasDefaults() {
    return new Promise(resolve => {
      if (this.window.innerWidth <= 768) {
        this.widthPercentage = CANVAS.SMALL_WIDTH_PERCENTAGE;
        this.cardOffsetPercentageX = CANVAS.SMALL_CARD_OFFSET_PERCENTAGE_X;
        this.cardPaddingX = CANVAS.SMALL_CARD_PADDING_X;
        resolve();
      } else {
        this.widthPercentage = CANVAS.DEFAULT_WIDTH_PERCENTAGE;
        this.cardOffsetPercentageX = CANVAS.DEFAULT_CARD_OFFSET_PERCENTAGE_X;
        this.cardPaddingX = CANVAS.DEFAULT_CARD_PADDING_X;
        resolve();
      }
    });
  }

  setWidthHeight() {
    this.canvasRef.nativeElement.width = this.width({
      windowWidth: this.window.innerWidth,
      widthPercentage: this.widthPercentage,
      xPadding: this.cardPaddingX
    });
    this.canvasRef.nativeElement.height = this.height({
      windowHeight: this.window.innerHeight,
      heightPercentage: CANVAS.HEIGHT_PERCENTAGE
    });
  }

  height(param: HeightParam): number {
    return param.windowHeight * param.heightPercentage;
  }

  width(param: WidthParam): number {
    return param.windowWidth * param.widthPercentage - param.xPadding;
  }

  offsetY(param: OffsetYParam): number {
    param.basePageMargin = param.basePageMargin || CANVAS.BASE_PAGE_MARGIN;
    param.baseHeading = param.baseHeading || CANVAS.BASE_HEADING;
    param.offsetPercentage =
      param.offsetPercentage || CANVAS.CARD_OFFSET_PERCENTAGE_Y;
    param.yPadding = param.yPadding || CANVAS.CARD_PADDING_Y;
    return (
      param.windowHeight * param.offsetPercentage +
      param.basePageMargin +
      param.baseHeading +
      param.yPadding / 2
    );
  }

  offsetX(param: OffsetXParam): number {
    return param.windowWidth * param.offsetPercentage + param.xPadding / 2;
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
          this.colorPalette[
            Math.floor(Math.random() * this.colorPalette.length)
          ].fgColor
        )
      );
    }
  }

  private paint() {
    requestAnimationFrame(() => this.paint());

    this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
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
