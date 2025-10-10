import {
  Component,
  signal,
  effect,
  ElementRef,
  ViewChild,
  Renderer2,
  OnDestroy
} from '@angular/core';
import {
  CdkDrag, CdkDragEnd, CdkDragMove, CdkDragStart
} from '@angular/cdk/drag-drop';
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
  imports: [StandardButtonComponent, CdkDrag],
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

  /** Current X offset during drag operation */
  dragX = signal<number>(0);

  /** Current Y offset during drag operation */
  dragY = signal<number>(0);

  /** Stored transform string for settled drag position */
  private settledTransform = signal<string | null>(null);

  /** Pre-calculated transform values mapped by button index */
  private preCalculatedTransforms = signal<Record<number, string>>({});

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

        this.resetSelection();

        this.responses.emit([{
          id: this.localParameters.variableId,
          status: 'DISPLAYED',
          value: 0,
          relevantForResponsesProgress: false
        }]);
      }
      setTimeout(() => {
        this.calculateButtonTransformValues();
      }, 0);
    });
  }

  ngOnDestroy(): void {
    this.resetSelection();
  }

  onDragStarted(event: CdkDragStart, index: number): void {
    this.selectedValue.set(index);
    this.isDragging.set(true);
    this.disabledTransition.set(true);
  }

  onDragMoved(event: CdkDragMove, index: number): void {
    if (this.selectedValue() === index) {
      this.dragX.set(event.distance.x);
      this.dragY.set(event.distance.y);
    }
  }

  onDragEnded(event: CdkDragEnd, index: number): void {
    this.selectedValue.set(index);
    this.disabledTransition.set(false);
    this.isDragging.set(false);

    const transforms = this.preCalculatedTransforms();
    const transformValue = transforms[index];
    if (transformValue) {
      this.settledTransform.set(transformValue);
    }
    this.emitSelectionResponse();
  }

  /**
   * Resets all component state to initial values
   */
  private resetSelection(): void {
    // Clear all state
    this.selectedValue.set(-1);
    this.isDragging.set(false);
    this.dragX.set(0);
    this.dragY.set(0);
    this.settledTransform.set(null);
    this.preCalculatedTransforms.set({});

    // Disable transitions to prevent animation during reset
    this.disabledTransition.set(true);

    // Re-enable transitions after a brief delay to allow DOM to update
    setTimeout(() => {
      this.disabledTransition.set(false);
    }, 50);
  }

  /**
   * Pre-calculates transform values for all buttons when component is initialized
   */
  private calculateButtonTransformValues(): Record<number, string> {
    if (!this.imageRef?.nativeElement || !this.dropContainerRef?.nativeElement) {
      return {};
    }

    const transforms: Record<number, string> = {};
    const totalButtons = this.localParameters.options.length;
    const buttonElements = this.dropContainerRef.nativeElement.querySelectorAll('[data-cy="drop-animate-wrapper"]');

    for (let index = 0; index < totalButtons; index++) {
      const { currentButtonCenter, containerCenter } = calculateButtonCenter(totalButtons, index);

      if (this.localParameters.imageLandingXY !== '') {
        const imgElement = this.imageRef.nativeElement;
        const buttonElement = buttonElements[index] as HTMLElement;

        const buttonCenterX = buttonElement.offsetLeft + buttonElement.offsetWidth / 2;
        const buttonCenterY = buttonElement.offsetTop + buttonElement.offsetHeight / 2;

        const imgRect = imgElement.getBoundingClientRect();
        const containerRect = this.dropContainerRef.nativeElement.getBoundingClientRect();
        const imageLeft = imgRect.left - containerRect.left;
        const imageTop = imgRect.top - containerRect.top;

        const { xPx, yPx } = getDropLandingTranslate(
          this.localParameters.imageLandingXY,
          buttonCenterX,
          imgRect.width,
          imgRect.height,
          imageLeft,
          imageTop,
          buttonCenterY
        );

        transforms[index] = `translate(${xPx}, ${yPx})`;
      } else {
        const baseOffsetX = containerCenter - currentButtonCenter;
        const transformY = this.localParameters.imagePosition === 'TOP' ? '-280px' : '280px';
        transforms[index] = `translate(${baseOffsetX}px, ${transformY})`;
      }
    }

    this.preCalculatedTransforms.set(transforms);
    return transforms;
  }

  /**
   * Calculates the CSS transform style for animating button position
   * @param index - The button index to calculate style for
   * @returns CSS transform string
   */
  animateStyle(index: number): string {
    // Only animate the selected button or during drag
    if (this.selectedValue() !== index) {
      return '';
    }

    // During active drag, follow pointer position
    if (this.isDragging() && this.selectedValue() === index) {
      return `translate(${this.dragX()}px, ${this.dragY()}px)`;
    }

    // Use settled position from drag if available
    const settledTransform = this.settledTransform();
    if (settledTransform) {
      return settledTransform;
    }

    // Use pre-calculated transforms without triggering recalculation
    const transforms = this.preCalculatedTransforms();
    return transforms[index] || '';
  }

  /**
   * Handles button click events (when not dragging)
   * @param index - Index of the clicked button
   */
  onButtonClick(index: number): void {
    if (this.isDragging()) return;

    this.disabledTransition.set(false);
    this.toggleButtonSelection(index);

    const transforms = this.preCalculatedTransforms();
    const transformValue = transforms[index];
    if (transformValue) {
      this.settledTransform.set(transformValue);
    }

    this.emitSelectionResponse();
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
