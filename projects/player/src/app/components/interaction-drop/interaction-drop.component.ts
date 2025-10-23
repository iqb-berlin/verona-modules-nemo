import {
  Component,
  signal,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import {
  CdkDrag, CdkDragEnd, CdkDragStart
} from '@angular/cdk/drag-drop';
import { StarsResponse } from '../../services/responses.service';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { InteractionDropParams } from '../../models/unit-definition';
import { StandardButtonComponent } from '../../shared/standard-button/standard-button.component';
import {
  calculateButtonCenter, getDropLandingArgs,
  getDropLandingTranslate
} from '../../shared/utils/interaction-drop.util';

/**
 * Interactive drop component that allows users to drag and drop buttons to specific positions.
 * Supports both click and drag interactions with visual animations.
 */
@Component({
  selector: 'stars-interaction-drop',
  templateUrl: './interaction-drop.component.html',
  imports: [StandardButtonComponent, CdkDrag],
  styleUrls: ['./interaction-drop.component.scss']
})
export class InteractionDropComponent extends InteractionComponentDirective implements AfterViewInit, OnDestroy {
  /** Local parameters for the drop interaction */
  localParameters!: InteractionDropParams;

  /** Currently selected button index (-1 means no selection) */
  selectedValue = signal<number>(-1);

  /** Index currently being dragged; null when none */
  draggingIndex = signal<number | null>(null);

  /** Stored transform string for settled drag position */
  private settledTransform = signal<string | null>(null);

  /** Pre-calculated transform values mapped by button index */
  private preCalculatedTransforms = signal<Record<number, string>>({});

  /** Current settled button's index */
  private settledButtonIndex = signal<number | null>(null);

  /** Current transform values for each button */
  buttonTransforms = signal<Record<number, string>>({});

  /** Set of button indices that should have transitions disabled */
  private transitionDisabledButtons = signal<Set<number>>(new Set());

  /** Tracks if the current drag started from a previously settled position */
  private lastDragWasFromSettled = false;

  /** Reference to the container element for attaching event listeners */
  @ViewChild('dropContainer', { static: true }) dropContainerRef!: ElementRef<HTMLElement>;

  /** Reference to the image element for coordinate calculations */
  @ViewChild('imageElement', { static: false }) imageRef!: ElementRef<HTMLImageElement>;

  /** Tracks if view init completed */
  private viewInited = false;

  /** Resize observer to recalc when image/container size changes */
  private resizeObserver: ResizeObserver | undefined;

  /** Debounce timer for recalculation */
  private recalcTimer: any;

  /** Window resize listener reference for cleanup */
  private windowResizeHandler: (() => void) | undefined;

  constructor() {
    super();
    effect(() => {
      this.resetSelection();

      const parameters = this.parameters() as InteractionDropParams;

      this.localParameters = InteractionDropComponent.createDefaultParameters();

      if (parameters) {
        this.localParameters.options = parameters.options || [];
        this.localParameters.variableId = parameters.variableId || 'DROP';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.text = parameters.text || '';
        this.localParameters.imagePosition = parameters.imagePosition || 'BOTTOM'; // Default to BOTTOM
        this.localParameters.imageLandingXY = parameters.imageLandingXY || '';

        if (this.viewInited) {
          this.scheduleRecalcAfterLayout();
        }

        this.responses.emit([
          {
            id: this.localParameters.variableId,
            status: 'DISPLAYED',
            value: 0,
            relevantForResponsesProgress: false
          }
        ]);
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewInited = true;
    const img = this.imageRef?.nativeElement;
    const schedule = () => this.scheduleRecalcAfterLayout();

    this.windowResizeHandler = () => schedule();
    window.addEventListener('resize', this.windowResizeHandler);

    if (!img) {
      setTimeout(schedule);
      return;
    }

    if (img.complete && img.naturalWidth !== 0) {
      schedule();
    } else if ((img as HTMLImageElement).decode) {
      (img as HTMLImageElement).decode().then(() => {
        schedule();
      }).catch(() => {
        const done = () => {
          try { img.removeEventListener('load', done); } catch { /* noop */ }
          try { img.removeEventListener('error', done); } catch { /* noop */ }
          schedule();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    } else {
      const done = () => {
        try { img.removeEventListener('load', done); } catch { /* noop */ }
        try { img.removeEventListener('error', done); } catch { /* noop */ }
        schedule();
      };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleRecalcAfterLayout();
      });
      const targets: Element[] = [];
      if (this.dropContainerRef?.nativeElement) targets.push(this.dropContainerRef.nativeElement);
      if (this.imageRef?.nativeElement) targets.push(this.imageRef.nativeElement);
      targets.forEach(t => this.resizeObserver!.observe(t));
    }
  }

  private scheduleRecalcAfterLayout(): void {
    if (this.recalcTimer) {
      clearTimeout(this.recalcTimer);
      this.recalcTimer = undefined;
    }
    this.recalcTimer = setTimeout(() => {
      this.calculateAndMarkReady();
    }, 0);
  }

  private calculateAndMarkReady(): void {
    const img = this.imageRef?.nativeElement;
    const container = this.dropContainerRef?.nativeElement;
    if (!img || !container) return;
    const imgRect = img.getBoundingClientRect?.();
    if (!imgRect || imgRect.width === 0 || imgRect.height === 0) {
      this.scheduleRecalcAfterLayout();
      return;
    }

    this.calculateButtonTransformValues();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      try { this.resizeObserver.disconnect(); } catch { /* noop */ }
      this.resizeObserver = undefined;
    }
    if (this.recalcTimer) {
      try { clearTimeout(this.recalcTimer); } catch { /* noop */ }
      this.recalcTimer = undefined;
    }
    if (this.windowResizeHandler) {
      try { window.removeEventListener('resize', this.windowResizeHandler); } catch { /* noop */ }
      this.windowResizeHandler = undefined;
    }
  }

  /** Returns the free-drag position for the given index, derived from buttonTransforms */
  freeDragPositionFor(index: number): { x: number; y: number } {
    const transform = this.buttonTransforms()[index] ?? '';
    return this.parseTranslate(transform);
  }

  onDragStarted(event: CdkDragStart, index: number): void {
    this.draggingIndex.set(index);
    // Disable transitions for the dragging button so it keeps up with the pointer
    this.addTransitionDisabled(index);

    this.selectedValue.set(index);
    const currentSettled = this.settledButtonIndex();

    // If there's a different settled button, return it to origin
    if (currentSettled !== null && currentSettled !== index) {
      // Ensure transitions are enabled for the button being sent back
      this.removeTransitionDisabled(currentSettled);
      this.updateButtonTransform(currentSettled, '');
      // Clear settled indicators
      this.settledButtonIndex.set(null);
      this.settledTransform.set(null);
    }

    this.lastDragWasFromSettled = false;
    if (currentSettled !== null && currentSettled === index && this.settledTransform()) {
      this.lastDragWasFromSettled = true;
    }

    // Disable transitions for the dragging button so it keeps up with the pointer
    this.addTransitionDisabled(index);
  }

  onDragReleased(index: number): void {
    this.removeTransitionDisabled(index);
  }

  onDragEnded(event: CdkDragEnd, index: number): void {
    if (this.selectedValue() !== index) return;
    this.draggingIndex.set(null);
    const transforms = this.preCalculatedTransforms();
    const shouldReturnToOrigin = (this.settledButtonIndex() === index && !!this.settledTransform()) && this.lastDragWasFromSettled;
    const targetTransform = shouldReturnToOrigin ? '' : (transforms[index] ?? '');
    const freePos = (event?.source as CdkDrag)?.getFreeDragPosition?.() ?? { x: 0, y: 0 };
    const droppedTransform = `translate(${(freePos?.x ?? 0)}px, ${(freePos?.y ?? 0)}px)`;
    this.updateButtonTransform(index, droppedTransform);
    this.animateFromDroppedToTarget(index, targetTransform);
    this.lastDragWasFromSettled = false;
  }

  private animateFromDroppedToTarget(index: number, targetTransform: string): void {
    const isReturningToOrigin = targetTransform === '';
    this.removeTransitionDisabled(index);
    this.updateButtonTransform(index, targetTransform);

    if (isReturningToOrigin) {
      this.settledTransform.set(null);
      this.settledButtonIndex.set(null);
      this.selectedValue.set(-1);
    } else {
      this.settledTransform.set(targetTransform);
      this.settledButtonIndex.set(index);
    }
    this.emitSelectionResponse();
  }

  /**
   * Resets all component state to initial values
   */
  private resetSelection(): void {
    this.selectedValue.set(-1);
    this.settledTransform.set(null);
    this.preCalculatedTransforms.set({});
    this.settledButtonIndex.set(null);

    const count = this.localParameters?.options?.length ?? 0;
    const transforms: Record<number, string> = {};
    const disabled = new Set<number>();
    for (let i = 0; i < count; i++) {
      transforms[i] = '';
      disabled.add(i);
    }
    this.buttonTransforms.set(transforms);
    this.transitionDisabledButtons.set(disabled);

    setTimeout(() => {
      this.transitionDisabledButtons.set(new Set());
    }, 0);

    this.draggingIndex.set(null);
  }

  /**
   * Helper to parse translate(x, y) string from a CSS transform value
   * @param transform - The CSS transform string to parse (e.g., "translate(10px, 20px)")
   * @returns An object containing the x and y coordinates in pixels
   */
  // eslint-disable-next-line class-methods-use-this
  private parseTranslate(transform: string | undefined | null): { x: number, y: number } {
    if (!transform) return { x: 0, y: 0 };
    const match = /translate\(([-\d.]+)px?,\s*([-\d.]+)px?\)/.exec(transform);
    if (match) {
      return { x: parseFloat(match[1] ?? '0'), y: parseFloat(match[2] ?? '0') };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Pre-calculates transform values for all buttons when the component is initialized
   */
  calculateButtonTransformValues(): void {
    if (!this.imageRef?.nativeElement || !this.dropContainerRef?.nativeElement) {
      return;
    }
    const transforms: Record<number, string> = {};
    const totalButtons = this.localParameters.options.length;
    const containerElement = this.dropContainerRef.nativeElement;
    const imgElement = this.imageRef.nativeElement;

    for (let index = 0; index < totalButtons; index++) {
      const { currentButtonCenter, containerCenter } = calculateButtonCenter(totalButtons, index);

      if (this.localParameters.imageLandingXY !== '') {
        const buttonElement =
          this.dropContainerRef.nativeElement.querySelector(`[data-cy="drop-animate-wrapper-${index}"]`) as HTMLElement;
        if (buttonElement) {
          const {
            buttonCenterX, imgWidth, imgHeight, imageTop, imageLeft, buttonCenterY
          } = getDropLandingArgs(imgElement, buttonElement, containerElement);

          const { xPx, yPx } = getDropLandingTranslate(
            this.localParameters.imageLandingXY,
            buttonCenterX,
            imgWidth,
            imgHeight,
            imageLeft,
            imageTop,
            buttonCenterY
          );
          transforms[index] = `translate(${xPx}, ${yPx})`;
        }
      } else {
        const baseOffsetX = containerCenter - currentButtonCenter;
        const transformY = this.localParameters.imagePosition === 'TOP' ? '-280px' : '280px';
        transforms[index] = `translate(${baseOffsetX}px, ${transformY})`;
      }
    }

    this.preCalculatedTransforms.set(transforms);
  }

  /**
   * Handles button click events (when not dragging)
   * @param index - Index of the clicked button
   */
  onButtonClick(index: number): void {
    const currentSettled = this.settledButtonIndex();

    if (currentSettled === index) {
      this.updateButtonTransform(index, '');
      this.settledButtonIndex.set(null);
      this.settledTransform.set(null);
      this.selectedValue.set(-1);
    } else {
      if (currentSettled !== null) {
        this.updateButtonTransform(currentSettled, '');
      }

      this.toggleButtonSelection(index);

      const transforms = this.preCalculatedTransforms();
      const transformValue = transforms[index];
      if (transformValue) {
        this.updateButtonTransform(index, transformValue);
        this.settledTransform.set(transformValue);
        this.settledButtonIndex.set(index);
      }
    }

    this.emitSelectionResponse();
  }

  /**
   * Updates the transform for a specific button
   */
  private updateButtonTransform(index: number, transform: string): void {
    // Normalize empty transform to a stable origin value so tests can assert translate3d(0, 0, 0)
    const normalized = (transform && transform.trim().length > 0)
      ? transform
      : 'translate3d(0px, 0px, 0px)';
    this.buttonTransforms.update(transforms => ({
      ...transforms,
      [index]: normalized
    }));
  }

  /**
   * Determines if transitions should be disabled for a specific button
   */
  shouldDisableTransition(index: number): boolean {
    return this.transitionDisabledButtons().has(index);
  }

  /**
   * Adds a button to the transition-disabled set
   */
  private addTransitionDisabled(index: number): void {
    this.transitionDisabledButtons.update(set => new Set([...set, index]));
  }

  /**
   * Removes a button from the transition-disabled set
   */
  private removeTransitionDisabled(index: number): void {
    this.transitionDisabledButtons.update(set => {
      const newSet = new Set(set);
      newSet.delete(index);
      return newSet;
    });
  }

  /**
   * Toggles button selection (radio button behavior)
   */
  private toggleButtonSelection(index: number): void {
    const isCurrentlySelected = this.selectedValue() === index;
    this.selectedValue.set(isCurrentlySelected ? -1 : index);
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
