import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
  NgZone,
  HostListener,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';

import { WINDOW } from './../../services/window.service';

import { Circle } from './../../models/circle';
import { Color } from './../../models/color';
import { ScrollService } from './../../services/scroll.service';
import { Subscription } from 'rxjs';
import { Mouse } from '../../models/mouse';

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
  START_X = 0,
  START_Y = 0,

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

const enum INFO {
  MAX_SMALL_SIZE = 768,
  RADIUS_MIN = 4,
  RADIUS_MAX = 2, // actual max = max + min i.e., max = 4 + 2 = 6
  MAX_RADIUS = 50,
  CIRCLES_SIZE = 500,
  CIRCLE_PLOT_CLOCKWISE = 1,
  RADIUS_INCREMENT = 1,
  RADIUS_DECREMENT = 1,
  POSITIVE_RANGE_FROM_MOUSE = 50,
  NEGATIVE_RANGE_FROM_MOUSE = -50,
  CIRCLE_START_RADIAN = 0,
  CIRCLE_END_RADIAN = 2, // should be multiplied with Math.PI to get the actual radian
  VELOCITY_X_RANGE = 0.5, // actual range will be -x to x
  VELOCITY_Y_RANGE = 0.5, // actual range will be -x to x
  SCROLL_Y_INITIAL = 0
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
  ctx: CanvasRenderingContext2D;
  circles: Array<Circle> = [];
  mouse: Mouse = { x: undefined, y: undefined };
  scrollY: number = INFO.SCROLL_Y_INITIAL;
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
    this.colorPalette = undefined;
    this.ctx = undefined;
    this.circles = undefined;
    this.mouse = undefined;
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
    this.mouse.y = event.y - this.offsetY({}) + this.scrollY;
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
      if (this.window.innerWidth <= INFO.MAX_SMALL_SIZE) {
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
    param.yPadding = param.yPadding || CANVAS.CARD_PADDING_Y;
    return param.basePageMargin + param.baseHeading + param.yPadding / 2;
  }

  offsetX(param: OffsetXParam): number {
    return param.windowWidth * param.offsetPercentage + param.xPadding / 2;
  }

  diameter(radius: number) {
    return 2 * radius;
  }

  private circlesInit() {
    for (let i = 0; i < INFO.CIRCLES_SIZE; i++) {
      const radius = Math.random() * INFO.RADIUS_MIN + INFO.RADIUS_MAX;
      const xStart = this.canvasRef.nativeElement.width - this.diameter(radius);
      const xEnd = radius;
      const yStart =
        this.canvasRef.nativeElement.height - this.diameter(radius);
      const yEnd = radius;
      const x = Math.random() * xStart + xEnd;
      const y = Math.random() * yStart + yEnd;
      const dx = Math.random() - INFO.VELOCITY_X_RANGE;
      const dy = Math.random() - INFO.VELOCITY_Y_RANGE;
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
      CANVAS.START_X,
      CANVAS.START_Y,
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
      INFO.CIRCLE_START_RADIAN * Math.PI,
      INFO.CIRCLE_END_RADIAN * Math.PI,
      INFO.CIRCLE_PLOT_CLOCKWISE ? true : false
    );
    this.ctx.fillStyle = circle.color;
    this.ctx.fill();
  }

  private update(circle: Circle) {
    if (
      circle.x + circle.radius > this.canvasRef.nativeElement.width ||
      circle.x - circle.radius < CANVAS.START_X
    ) {
      circle.dx = -circle.dx;
    }
    if (
      circle.y + circle.radius > this.canvasRef.nativeElement.height ||
      circle.y - circle.radius < CANVAS.START_Y
    ) {
      circle.dy = -circle.dy;
    }
    circle.x += circle.dx;
    circle.y += circle.dy;
    if (
      this.mouse.y - circle.y < INFO.POSITIVE_RANGE_FROM_MOUSE &&
      this.mouse.x - circle.x < INFO.POSITIVE_RANGE_FROM_MOUSE &&
      this.mouse.x - circle.x > INFO.NEGATIVE_RANGE_FROM_MOUSE &&
      this.mouse.y - circle.y > INFO.NEGATIVE_RANGE_FROM_MOUSE
    ) {
      if (circle.radius < INFO.MAX_RADIUS) {
        circle.radius += INFO.RADIUS_INCREMENT;
      }
    } else if (circle.radius > circle.minRadius) {
      circle.radius -= INFO.RADIUS_DECREMENT;
    }

    this.draw(circle);
  }
}
