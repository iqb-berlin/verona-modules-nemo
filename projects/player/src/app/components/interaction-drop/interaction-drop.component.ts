import {
  Component,
  signal,
  effect,
  ElementRef,
  OnDestroy,
  ViewChild,
  AfterViewInit
} from '@angular/core';

import { StarsResponse } from '../../services/responses.service';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionDropParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';
import {
  calculateButtonCenter,
  getDropLandingTranslate
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
export class InteractionDropComponent extends InteractionComponentDirective implements OnDestroy, AfterViewInit {
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

  /** Reference to the container element for attaching event listeners */
  @ViewChild('dropContainer', { static: true }) dropContainerRef!: ElementRef<HTMLElement>;

  constructor() {
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

  ngAfterViewInit(): void {
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.removeGlobalEventListeners();
  }

  /**
   * Sets up event listeners based on browser capabilities
   */
  private setupEventListeners(): void {
    const root = this.dropContainerRef?.nativeElement;
    if (!root) return;

    if (window.PointerEvent) {
      // Modern browsers with Pointer Events API
      root.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    } else {
      // Fallback for older browsers
      root.addEventListener('mousedown', this.onMouseDown, { passive: true });
      root.addEventListener('touchstart', this.onTouchStart, { passive: true });
    }
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
  private onPointerDown = (event: PointerEvent): void => {
    const { wrapper, index } = this.getWrapperAndIndex(event.target);
    if (!wrapper || index === null) return;

    this.initiateDragDetection(index, event.clientX, event.clientY, event.pointerId);
    this.addPointerEventListeners();
  };

  /**
   * Handles pointer move events during drag operation
   */
  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragArmed || this.lastPointerId !== event.pointerId) return;

    this.handleDragMovement(event.clientX, event.clientY, event);
  };

  /**
   * Handles pointer up events to complete drag or click operation
   */
  private onPointerUp = (): void => {
    const wasDragging = this.isDragging();
    this.finalizeDragOperation(wasDragging);
    this.removePointerEventListeners();
  };

  private onMouseDown = (event: MouseEvent): void => {
    const { wrapper, index } = this.getWrapperAndIndex(event.target);
    if (!wrapper || index === null) return;

    this.initiateDragDetection(index, event.clientX, event.clientY);
    this.addMouseEventListeners();
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.dragArmed) return;

    this.handleDragMovement(event.clientX, event.clientY, event);
  };

  private onMouseUp = (): void => {
    const wasDragging = this.isDragging();
    this.finalizeDragOperation(wasDragging);
    this.removeMouseEventListeners();
  };

  private onTouchStart = (event: TouchEvent): void => {
    const touch = event.touches[0];
    if (!touch) return;

    const { wrapper, index } = this.getWrapperAndIndex(event.target);
    if (!wrapper || index === null) return;

    this.initiateDragDetection(index, touch.clientX, touch.clientY);
    this.addTouchEventListeners();
  };

  private onTouchMove = (event: TouchEvent): void => {
    if (!this.dragArmed || this.activeIndex === null) return;

    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - this.downX;
    const deltaY = touch.clientY - this.downY;

    if (this.shouldStartDrag(deltaX, deltaY)) {
      this.startDragOperation(touch.clientX, touch.clientY);
      event.preventDefault();
    }

    if (this.isDragging()) {
      this.updateDragPosition(touch.clientX, touch.clientY);
    }
  };

  private onTouchEnd = (): void => {
    const wasDragging = this.isDragging();
    this.finalizeDragOperation(wasDragging);
    this.removeTouchEventListeners();
  };

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
      const { xPx, yPx } = getDropLandingTranslate(this.localParameters.imageLandingXY, currentButtonCenter);
      this.settledTransform.set(`translate(${xPx}, ${yPx})`);
    } else {
      // Fallback to simple up/down movement based on image position
      const baseOffsetX = containerCenter - currentButtonCenter;
      const transformY = this.localParameters.imagePosition === 'TOP' ? '-280px' : '280px';
      this.settledTransform.set(`translate(${baseOffsetX}px, ${transformY})`);
    }

    this.isDragSettled.set(true);
  }

  private addPointerEventListeners(): void {
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('pointercancel', this.onPointerUp, { passive: true });
  }

  private removePointerEventListeners(): void {
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  private addMouseEventListeners(): void {
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('mouseup', this.onMouseUp, { passive: true });
  }

  private removeMouseEventListeners(): void {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  private addTouchEventListeners(): void {
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
  }

  private removeTouchEventListeners(): void {
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchcancel', this.onTouchEnd);
  }

  private removeGlobalEventListeners(): void {
    this.removePointerEventListeners();
    this.removeMouseEventListeners();
    this.removeTouchEventListeners();
  }

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
      const { xPx, yPx } = getDropLandingTranslate(this.localParameters.imageLandingXY, currentButtonCenter);
      return `translate(${xPx}, ${yPx})`;
    }

    // Fallback positioning
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
