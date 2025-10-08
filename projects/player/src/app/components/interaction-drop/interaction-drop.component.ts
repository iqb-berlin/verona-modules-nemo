import {
  Component,
  signal,
  effect,
  ElementRef,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  Renderer2
} from '@angular/core';

import { StarsResponse } from '../../services/responses.service';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionDropParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';
import {
  calculateButtonCenter,
  getDropLandingTranslate,
  extractCoordinates
} from '../../shared/utils/interaction-drop.util';

/**
 * Interactive drop component that allows users to drag and drop buttons to specific positions.
 * Supports both click and drag interactions with visual animations.
 */
@Component({
  selector: 'stars-interaction-drop',
  templateUrl: './interaction-drop.component.html',
  imports: [StandardButtonComponent],
  styleUrls: ['./interaction-drop.component.scss']
})
export class InteractionDropComponent extends InteractionComponentDirective implements OnDestroy {
  /** Local parameters for the drop interaction */
  localParameters!: InteractionDropParams;

  /** Currently selected button index (-1 means no selection) */
  selectedValue = signal<number>(-1);

  /** Controls whether CSS transitions are disabled (for instant position changes) */
  disabledTransition = signal<boolean>(false);

  /** Whether a drag operation is currently in progress */
  private isDragging = signal<boolean>(false);

  /** Starting X coordinate when drag began */
  private dragStartX = 0;

  /** Starting Y coordinate when drag began */
  private dragStartY = 0;

  /** Pointer ID for tracking multi-touch scenarios */
  private lastPointerId: number | null = null;

  /** Minimum pixel movement required to initiate a drag operation */
  private readonly DRAG_THRESHOLD_PX = 6;

  /** X coordinate where pointer/mouse was initially pressed */
  private downX = 0;

  /** Y coordinate where pointer/mouse was initially pressed */
  private downY = 0;

  /** Whether drag detection is armed (set on pointer down) */
  private dragArmed = false;

  /** Index of the button that was initially pressed */
  private activeIndex: number | null = null;

  /** Whether the current position is from a drag settlement (vs click animation) */
  private isDragSettled = signal<boolean>(false);

  /** Current X offset during drag operation */
  dragX = signal<number>(0);

  /** Current Y offset during drag operation */
  dragY = signal<number>(0);

  /** Stored transform string for settled drag position */
  private settledTransform = signal<string | null>(null);

  /** Array to store cleanup functions for event listeners */
  private removeListenerFn: (() => void)[] = [];

  /** Reference to the container element for attaching event listeners */
  @ViewChild('dropContainer', { static: true }) dropContainerRef!: ElementRef<HTMLElement>;

  /** Reference to the image element for coordinate calculations */
  @ViewChild('imageElement', { static: false }) imageRef!: ElementRef<HTMLImageElement>;

  constructor(private renderer: Renderer2) {
    super();
    effect(() => {
      const parameters = this.parameters() as InteractionDropParams;

      this.localParameters = InteractionDropComponent.createDefaultParameters();

      if (parameters) {
        this.localParameters.options = parameters.options || [];
        this.localParameters.variableId = parameters.variableId || 'DROP';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.text = parameters.text || '';
        this.localParameters.imagePosition = parameters.imagePosition || 'BOTTOM'; // Default to BOTTOM
        this.localParameters.imageLandingXY = parameters.imageLandingXY || '';
        this.responses.emit([{
          id: this.localParameters.variableId,
          status: 'DISPLAYED',
          value: 0,
          relevantForResponsesProgress: false
        }]);
      }

      this.resetSelection();
    });
  }

  // ngAfterViewInit(): void {
  //   const root = this.dropContainerRef.nativeElement;
  //   if (window.PointerEvent) {
  //     this.removeListenerFn.push(
  //       // Pointer events dominate on modern browsers
  //       // this.renderer.listen(root, 'pointerdown', this.onPointerDown)
  //     );
  //   } else {
  //     this.removeListenerFn.push(
  //       // Fallback for browsers without pointer event support
  //       this.renderer.listen(root, 'mousedown', this.onMouseDown),
  //       this.renderer.listen(root, 'touchstart', this.onTouchStart)
  //     );
  //   }
  // }

  ngOnDestroy(): void {
    this.removeListenerFn.forEach(fn => fn());
  }

  /**
   * Resets all component state to initial values
   */
  private resetSelection(): void {
    // Disable transitions for instant reset
    this.disabledTransition.set(true);
    this.selectedValue.set(-1);
    this.isDragging.set(false);
    this.dragX.set(0);
    this.dragY.set(0);
    this.settledTransform.set(null);
    this.isDragSettled.set(false);

    // Re-enable transitions after a delay
    setTimeout(() => this.disabledTransition.set(false), 500);
  }

  /**
   * Gets the index of a wrapper element among its siblings
   */
  private static getIndexFromWrapper(element: HTMLElement | null): number | null {
    if (!element?.parentElement) return null;

    const wrappers = Array.from(element.parentElement.querySelectorAll('[data-cy="drop-animate-wrapper"]'));
    const index = wrappers.indexOf(element);
    return index >= 0 ? index : null;
  }

  /**
   * Finds the drop wrapper element from an event target by traversing up the DOM tree
   */
  private findWrapperFromEvent(target: EventTarget | null): HTMLElement | null {
    if (!target) return null;
    let element: HTMLElement | null = target as HTMLElement;
    while (element && element !== this.dropContainerRef.nativeElement) {
      if (element.getAttribute('data-cy') === 'drop-animate-wrapper') {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  /**
   * Handles pointer down events
   */
  // private onPointerDown = (event: PointerEvent): void => {
  //   console.log('ON POINTER DOWN...');
  //   const coords = extractCoordinates(event);
  //
  //   if (coords) {
  //     const { wrapper, index } = this.getWrapperAndIndex(event.target);
  //     if (!wrapper || index === null) return;
  //
  //     this.initiateDragDetection(index, coords.x, coords.y, event.pointerId);
  //     this.addPointerEventListeners();
  //   }
  // };

  /**
   * Handles pointer move events during drag operation
   */
  // private onPointerMove = (event: PointerEvent): void => {
  //   if (!this.dragArmed) return;
  //   console.log('ON POINTER move...');
  //   this.handleDragMovement(event.clientX, event.clientY, event);
  // };

  /**
   * Handles pointer up events to finalize drag operations
   * or clean up after pointer interactions
   */
  // private onPointerUp = (): void => {
  //   const wasDragging = this.isDragging();
  //   console.log('ON POINTER UP...');
  //   this.finalizeDragOperation(wasDragging);
  // };

  /**
   * Handles mouse down events to initiate drag detection
   * Fallback for browsers without pointer event support
   */
  // private onMouseDown = (event: MouseEvent): void => {
  //   const { wrapper, index } = this.getWrapperAndIndex(event.target);
  //   if (!wrapper || index === null) return;
  //
  //   this.initiateDragDetection(index, event.clientX, event.clientY);
  //   this.addMouseEventListeners();
  //   event.preventDefault();
  // };

  /**
   * Handles mouse move events during drag operation
   * Only processes movement if drag detection is armed
   */
  // private onMouseMove = (event: MouseEvent): void => {
  //   if (!this.dragArmed) return;
  //
  //   this.handleDragMovement(event.clientX, event.clientY, event);
  // };

  /**
   * Handles mouse up events to complete or cancel drag operation
   * Cleans up mouse event listeners and finalizes interaction
   */
  // private onMouseUp = (): void => {
  //   const wasDragging = this.isDragging();
  //   this.finalizeDragOperation(wasDragging);
  // };

  /**
   * Handles touch start events to initiate drag detection
   * Uses first touch point for single-finger interactions
   */
  // private onTouchStart = (event: TouchEvent): void => {
  //   const touch = event.touches[0];
  //   if (!touch) return;
  //
  //   const { wrapper, index } = this.getWrapperAndIndex(event.target);
  //   if (!wrapper || index === null) return;
  //
  //   this.initiateDragDetection(index, touch.clientX, touch.clientY);
  //   this.addTouchEventListeners();
  //   event.preventDefault();
  // };

  /**
   * Handles touch move events with drag threshold detection
   * Starts drag operation when movement exceeds threshold, then tracks position
   */
  // private onTouchMove = (event: TouchEvent): void => {
  //   if (!this.dragArmed || this.activeIndex === null) return;
  //
  //   const touch = event.touches[0];
  //   if (!touch) return;
  //
  //   const deltaX = touch.clientX - this.downX;
  //   const deltaY = touch.clientY - this.downY;
  //
  //   if (this.shouldStartDrag(deltaX, deltaY)) {
  //     this.startDragOperation(touch.clientX, touch.clientY);
  //     event.preventDefault();
  //   }
  //
  //   if (this.isDragging()) {
  //     this.updateDragPosition(touch.clientX, touch.clientY);
  //   }
  // };


  /**
   * Handles touch end events to complete or cancel drag operation
   * Cleans up touch event listeners and finalizes interaction
   */
  // private onTouchEnd = (): void => {
  //   const wasDragging = this.isDragging();
  //   this.finalizeDragOperation(wasDragging);
  // };

  /**
   * Helper to get wrapper element and its index from event target
   */
  private getWrapperAndIndex(target: EventTarget | null): { wrapper: HTMLElement | null; index: number | null } {
    const wrapper = this.findWrapperFromEvent(target);
    const index = InteractionDropComponent.getIndexFromWrapper(wrapper);
    return { wrapper, index };
  }

  /**
   * Initiates drag detection state
   */
  private initiateDragDetection(index: number, x: number, y: number, pointerId?: number): void {
    this.activeIndex = index;
    this.downX = x;
    this.downY = y;
    this.dragArmed = true;
    this.lastPointerId = pointerId || null;
  }

  /**
   * Determines if movement threshold has been exceeded to start dragging
   */
  private shouldStartDrag(deltaX: number, deltaY: number): boolean {
    return !this.isDragging() && Math.hypot(deltaX, deltaY) >= this.DRAG_THRESHOLD_PX;
  }

  /**
   * Handles common drag logic for both pointer and mouse events
   */
  private handleDragMovement(clientX: number, clientY: number, event: Event): void {
    const deltaX = clientX - this.downX;
    const deltaY = clientY - this.downY;

    if (this.shouldStartDrag(deltaX, deltaY)) {
      this.startDragOperation(clientX, clientY);
      event.preventDefault();
    }

    if (this.isDragging()) {
      this.updateDragPosition(clientX, clientY);
    }
  }

  /**
   * Starts the actual drag operation
   */
  private startDragOperation(clientX: number, clientY: number): void {
    this.selectedValue.set(this.activeIndex!);
    this.settledTransform.set(null);
    this.disabledTransition.set(true);
    this.isDragging.set(true);
    this.dragStartX = this.downX;
    this.dragStartY = this.downY;
  }

  /**
   * Updates drag position during drag operation
   */
  private updateDragPosition(clientX: number, clientY: number): void {
    this.dragX.set(clientX - this.dragStartX);
    this.dragY.set(clientY - this.dragStartY);
  }

  /**
   * Finalizes drag operation and cleans up state
   */
  private finalizeDragOperation(wasDragging: boolean): void {
    this.dragArmed = false;
    this.lastPointerId = null;

    if (wasDragging) {
      this.settleDragPosition();
      this.isDragging.set(false);
      setTimeout(() => this.disabledTransition.set(false));
    }

    this.activeIndex = null;
  }

  /**
   * Calculates and stores the final position where the dragged button should settle
   */
  private settleDragPosition(): void {
    const selectedIndex = this.selectedValue();
    if (selectedIndex === -1) return;

    const totalButtons = this.localParameters.options.length;
    const { currentButtonCenter, containerCenter } = calculateButtonCenter(totalButtons, selectedIndex);

    if (this.localParameters.imageLandingXY !== '') {
      // Use specific landing coordinates if provided
      const imgElement = this.imageRef.nativeElement;
      // Get the button's current Y position
      const buttonElements = this.dropContainerRef.nativeElement.querySelectorAll('[data-cy="drop-animate-wrapper"]');
      const buttonElement = buttonElements[selectedIndex] as HTMLElement;
      const buttonY = buttonElement.offsetTop + buttonElement.offsetHeight / 2;

      console.log(`Selected button Y: ${buttonY}, IMage,${imgElement} , Image top: ${imgElement.offsetTop}, Image height: ${imgElement.height}`)

      const { xPx, yPx } = getDropLandingTranslate(
        this.localParameters.imageLandingXY,
        currentButtonCenter,
        imgElement.width,
        imgElement.height,
        imgElement.offsetLeft,
        imgElement.offsetTop,
        buttonY
      );
      this.settledTransform.set(`translate(${xPx}, ${yPx})`);
    } else {
      // Fallback to simple up/down movement based on image position
      const baseOffsetX = containerCenter - currentButtonCenter;
      const transformY = this.localParameters.imagePosition === 'TOP' ? '-280px' : '280px';
      this.settledTransform.set(`translate(${baseOffsetX}px, ${transformY})`);
    }

    this.isDragSettled.set(true);
  }

  // private addPointerEventListeners(): void {
  //   this.removeListenerFn.push(
  //     this.renderer.listen('window', 'pointermove', this.onPointerMove),
  //     this.renderer.listen('window', 'pointerup', this.onPointerUp),
  //     this.renderer.listen('window', 'pointercancel', this.onPointerUp)
  //   );
  // }

  // private addMouseEventListeners(): void {
  //   this.removeListenerFn.push(
  //     this.renderer.listen('window', 'mousemove', this.onMouseMove),
  //     this.renderer.listen('window', 'mouseup', this.onMouseUp)
  //   );
  // }
  //
  // private addTouchEventListeners(): void {
  //   this.removeListenerFn.push(
  //     this.renderer.listen('window', 'touchmove', this.onTouchMove),
  //     this.renderer.listen('window', 'touchend', this.onTouchEnd),
  //     this.renderer.listen('window', 'touchcancel', this.onTouchEnd)
  //   );
  // }

  /**
   * Calculates the CSS transform style for animating button position
   * @param index - The button index to calculate style for
   * @returns CSS transform string
   */
  animateStyle(index: number): string {
    // Only animate the selected button or during drag
    if (this.selectedValue() !== index && !this.isDragging()) {
      return '';
    }

    // During active drag, follow pointer position
    if (this.isDragging()) {
      return `translate(${this.dragX()}px, ${this.dragY()}px)`;
    }

    // Use settled position from drag if available
    const settledTransform = this.settledTransform();
    if (settledTransform && this.isDragSettled()) {
      return settledTransform;
    }

    // Calculate position for click animation or normal selection
    return this.calculateAnimationPosition(index);
  }

  /**
   * Handles button click events (when not dragging)
   * @param index - Index of the clicked button
   */
  onButtonClick(index: number): void {
    // Ignore clicks during or immediately after dragging
    if (this.isDragging() || (this.activeIndex === index && !this.dragArmed)) {
      return;
    }

    console.log('DROP ONCLICK....');
    this.toggleButtonSelection(index);
    this.clearDragState();
    this.emitSelectionResponse();
  }

  /**
   * Calculates animation position for click or normal selection
   */
  private calculateAnimationPosition(index: number): string {
    const totalButtons = this.localParameters.options.length;
    const { currentButtonCenter, containerCenter } = calculateButtonCenter(totalButtons, index);

    if (this.localParameters.imageLandingXY !== '') {
      const imgElement = this.imageRef.nativeElement;
      const buttonElements = this.dropContainerRef.nativeElement.querySelectorAll('[data-cy="drop-animate-wrapper"]');
      const buttonElement = buttonElements[index] as HTMLElement;

      // Get actual button center position relative to the container
      const buttonRect = buttonElement.getBoundingClientRect();
      const containerRect = this.dropContainerRef.nativeElement.getBoundingClientRect();
      const buttonCenterX = buttonRect.left - containerRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top - containerRect.top + buttonRect.height / 2;

      // Get image position relative to the container
      const imgRect = imgElement.getBoundingClientRect();
      const imageLeft = imgRect.left - containerRect.left;
      const imageTop = imgRect.top - containerRect.top;

      const { xPx, yPx } = getDropLandingTranslate(
        this.localParameters.imageLandingXY,
        buttonCenterX, // Pass actual button center position
        imgRect.width,
        imgRect.height,
        imageLeft,
        imageTop,
        buttonCenterY // Pass actual button center Y position
      );
      return `translate(${xPx}, ${yPx})`;
    }

    // Fallback to simple up/down movement based on image position when no landing coordinates are provided
    const baseOffsetX = containerCenter - currentButtonCenter;
    const transformY = this.localParameters.imagePosition === 'TOP' ? '-280px' : '280px';
    return `translate(${baseOffsetX}px, ${transformY})`;
  }

  /**
   * Toggles button selection (radio button behavior)
   */
  private toggleButtonSelection(index: number): void {
    const isCurrentlySelected = this.selectedValue() === index;
    this.selectedValue.set(isCurrentlySelected ? -1 : index);
  }

  /**
   * Clears all drag-related state
   */
  private clearDragState(): void {
    this.isDragging.set(false);
    this.dragX.set(0);
    this.dragY.set(0);
    this.settledTransform.set(null);
    this.isDragSettled.set(false);
  }

  /**
   * Emits response for selection change
   */
  private emitSelectionResponse(): void {
    const response: StarsResponse = {
      id: this.localParameters.variableId,
      status: 'VALUE_CHANGED',
      value: this.selectedValue() + 1,
      relevantForResponsesProgress: true
    };
    this.responses.emit([response]);
  }

  /**
   * Creates default parameters object
   */
  private static createDefaultParameters(): InteractionDropParams {
    return {
      variableId: 'DROP',
      options: [],
      imageSource: '',
      imagePosition: 'BOTTOM',
      imageLandingXY: '',
      text: ''
    };
  }
}
