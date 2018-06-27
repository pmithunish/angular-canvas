import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
  NgZone,
  HostListener,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
  Output,
  EventEmitter
} from '@angular/core';

import { WINDOW, WindowRef } from './../../services/window.service';

import { Circle } from './../../models/circle';
import { Color } from './../../models/color';
import { ScrollService } from './../../services/scroll.service';
import { Subscription } from 'rxjs';

const DEFAULT_COLOR_PALETTE: Array<Color> = [
  { fgColor: `rgba(255,138,128,0.5)` }, // Red
  { fgColor: `rgba(255,128,171,0.5)` }, // Pink
  { fgColor: `rgba(234,128,252,0.5)` }, // Purple
  { fgColor: `rgba(179,136,255,0.5)` }, // Deep purple
  { fgColor: `rgba(140,158,255,0.5)` }, // Indigo
  { fgColor: `rgba(130,177,255,0.5)` }, // Blue
  { fgColor: `rgba(128,216,255,0.5)` }, // Light blue
  { fgColor: `rgba(132,255,255,0.5)` }, // Cyan
  { fgColor: `rgba(167,255,235,0.5)` } // Teal
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
  selector: 'app-floating-dots',
  templateUrl: './floating-dots.component.html',
  styleUrls: ['./floating-dots.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingDotsComponent implements OnInit, OnDestroy {
  @ViewChild('mycanvas') canvasRef: ElementRef;
  colorPalette: Array<Color>;
  randomOpacityStart = 0.5;
  randomOpacityEnd = 0.5; // actual end = end + start i.e., end = 0.5 + 0.5 = 1
  radiusStart = 4;
  radiusEnd = 2; // actual end = 4 + 2 = 6;
  ctx: CanvasRenderingContext2D;
  circles: Array<Circle> = [];
  mouse: { x: number; y: number } = { x: undefined, y: undefined };
  maxRadius = 50;
  // navbarWidthPercent = 0.0416; // navbarWidth = 4.16/100 = 0.0416
  avoidSpawnAtLeftAndRight = 2; // when multiplied by the radius of the circle and subtracted
  // from the canvas width gives a number which then can be used
  // to guess the x cordinate of center of the circle avoiding left
  // and right columns of the canvas
  avoidSpawnAtTopAndBottom = 2; // when multiplied by the radius of the circle and subtracted
  // from the canvas height gives a number which then can be used
  // to guess the y cordinate of center of the circle avoiding top
  // and bottom rows of the canvas
  totalCircles = 500; // total number of circles to be drawn on canvas
  xVelocityRange = 0.5; // when subtracted from Math.random() => gives a random number between -0.5 to 0.5
  yVelocityRange = 0.5; // when subtracted from Math.random() => gives a random number between -0.5 to 0.5
  circleStartingRadian = 0; // circle drawing should start from this angle
  circleEndingRadian = 2 * Math.PI; // circle drawing should end at this angle
  circleClockWise = true; // circle drawing should be clockwise if set to true otherwise anticlockwise
  canvasStartX = 0; // starting x coordinate of canvas
  canvasStartY = 0; // starting y coordinate of canvas
  radiusIncrement = 1; // radius should increment by this factor
  radiusDecrement = 1; // radius should decrement by this factor
  positiveRangeFromMouse = 50;
  negativeRangeFromMouse = -50;
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
    this.canvasRef = undefined;
    this.randomOpacityStart = undefined;
    this.randomOpacityEnd = undefined;
    this.radiusStart = undefined;
    this.radiusEnd = undefined;
    this.colorPalette = undefined;
    this.ctx = undefined;
    this.circles = undefined;
    this.mouse = undefined;
    this.maxRadius = undefined;
    this.avoidSpawnAtLeftAndRight = undefined;
    this.avoidSpawnAtTopAndBottom = undefined;
    this.totalCircles = undefined;
    this.xVelocityRange = undefined;
    this.yVelocityRange = undefined;
    this.circleStartingRadian = undefined;
    this.circleEndingRadian = undefined;
    this.circleClockWise = undefined;
    this.canvasStartX = undefined;
    this.canvasStartY = undefined;
    this.radiusIncrement = undefined;
    this.radiusDecrement = undefined;
    this.positiveRangeFromMouse = undefined;
    this.negativeRangeFromMouse = undefined;
    this.scrollY = undefined;
    this.scrollSubscription !== undefined
      ? this.scrollSubscription.unsubscribe()
      : (this.scrollSubscription = undefined);
    this.cardPaddingX = undefined;
    this.widthPercentage = undefined;
    this.cardOffsetPercentageX = undefined;
  }

  ngOnInit() {
    this.scrollSubscription = this.scrollService.scrollY.subscribe(
      val => (this.scrollY = val)
    );
    // setting the initial canvas width and height
    this.setCanvasDefaults().then(() => {
      this.setWidthHeight();

      this.ctx = this.canvasRef.nativeElement.getContext('2d');

      if (this.colorPalette === undefined) {
        this.colorPalette = DEFAULT_COLOR_PALETTE;
      }
      this.circlesInit();
      this.onresize();
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
      this.circlesInit();
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
      // param.windowHeight * param.offsetPercentage +
      param.basePageMargin + param.baseHeading + param.yPadding / 2
    );
  }

  offsetX(param: OffsetXParam): number {
    return param.windowWidth * param.offsetPercentage + param.xPadding / 2;
  }

  private circlesInit() {
    for (let i = 0; i < this.totalCircles; i++) {
      const radius = Math.random() * this.radiusStart + this.radiusEnd;
      const xStart =
        this.canvasRef.nativeElement.width -
        radius * this.avoidSpawnAtLeftAndRight;
      const xEnd = radius;
      const yStart =
        this.canvasRef.nativeElement.height -
        radius * this.avoidSpawnAtTopAndBottom;
      const yEnd = radius;
      const x = Math.random() * xStart + xEnd;
      const y = Math.random() * yStart + yEnd;
      const dx = Math.random() - this.xVelocityRange;
      const dy = Math.random() - this.yVelocityRange;
      const randomIndexOfColor = Math.floor(
        Math.random() * this.colorPalette.length
      );
      const color = this.colorPalette[randomIndexOfColor].fgColor;
      this.circles[i] = new Circle(x, y, dx, dy, radius, color);
    }
  }

  private paint() {
    requestAnimationFrame(() => this.paint());
    if (this.ctx === undefined) {
      return;
    }
    this.ctx.clearRect(
      this.canvasStartX,
      this.canvasStartY,
      this.canvasRef.nativeElement.width,
      this.canvasRef.nativeElement.height
    );
    this.circles.forEach(circle => {
      this.update(circle);
    });
  }

  private draw(circle: Circle) {
    this.ctx.beginPath();
    this.ctx.arc(
      circle.x,
      circle.y,
      circle.radius,
      this.circleStartingRadian,
      this.circleEndingRadian,
      this.circleClockWise
    );
    this.ctx.fillStyle = circle.color;
    this.ctx.fill();
  }

  private update(circle: Circle) {
    if (
      circle.x + circle.radius > this.canvasRef.nativeElement.width ||
      circle.x - circle.radius < this.canvasStartX
    ) {
      circle.dx = -circle.dx;
    }
    if (
      circle.y + circle.radius > this.canvasRef.nativeElement.height ||
      circle.y - circle.radius < this.canvasStartY
    ) {
      circle.dy = -circle.dy;
    }
    circle.x += circle.dx;
    circle.y += circle.dy;
    if (
      this.mouse.y - circle.y < this.positiveRangeFromMouse &&
      this.mouse.x - circle.x < this.positiveRangeFromMouse &&
      this.mouse.x - circle.x > this.negativeRangeFromMouse &&
      this.mouse.y - circle.y > this.negativeRangeFromMouse
    ) {
      if (circle.radius < this.maxRadius) {
        circle.radius += this.radiusIncrement;
      }
    } else if (circle.radius > circle.minRadius) {
      circle.radius -= this.radiusDecrement;
    }

    this.draw(circle);
  }
}
