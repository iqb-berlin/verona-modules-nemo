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
export class InteractionDropComponent extends InteractionComponentDirective implements OnDestroy {
  /** Local parameters for the drop interaction */
  localParameters!: InteractionDropParams;

  /** Currently selected button index (-1 means no selection) */
  selectedValue = signal<number>(-1);

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

  /** Current settled button's index */
  private settledButtonIndex = signal<number | null>(null);

  /** Current transform values for each button */
  buttonTransforms = signal<Record<number, string>>({});

  /** Set of button indices that should have transitions disabled */
  private transitionDisabledButtons = signal<Set<number>>(new Set());

  /** Reference to the container element for attaching event listeners */
  @ViewChild('dropContainer', { static: true }) dropContainerRef!: ElementRef<HTMLElement>;

  /** Reference to the image element for coordinate calculations */
  @ViewChild('imageElement', { static: false }) imageRef!: ElementRef<HTMLImageElement>;

  constructor(private renderer: Renderer2) {
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

        this.responses.emit([{
          id: this.localParameters.variableId,
          status: 'DISPLAYED',
          value: 0,
          relevantForResponsesProgress: false
        }]);
      }
      setTimeout(() => {
        this.calculateButtonTransformValues();
        this.resetAllButtonTransforms();
      }, 0);
    });
  }

  ngOnDestroy(): void {
    this.resetSelection();
  }

  onDragStarted(event: CdkDragStart, index: number): void {
    this.selectedValue.set(index);
    this.isDragging.set(true);
    const currentSettled = this.settledButtonIndex();

    // If there's a different settled button, return it to origin
    if (currentSettled !== null && currentSettled !== index) {
      this.updateButtonTransform(currentSettled, '');
      this.settledButtonIndex.set(null);
      this.settledTransform.set(null);
    }

    // Disable transitions for the dragging button
    this.addTransitionDisabled(index);
  }

  onDragMoved(event: CdkDragMove, index: number): void {
    if (this.selectedValue() !== index) return;

    this.dragX.set(event.distance.x);
    this.dragY.set(event.distance.y);

    // Calculate drag transform
    let baseX = 0;
    let baseY = 0;

    // If this button was previously settled, start from settled position
    if (this.settledButtonIndex() === index && this.settledTransform()) {
      const { x, y } = this.parseTranslate(this.settledTransform());
      baseX = x;
      baseY = y;
    }

    const dragTransform = `translate(${baseX + event.distance.x}px, ${baseY + event.distance.y}px)`;
    this.updateButtonTransform(index, dragTransform);
  }

  onDragEnded(event: CdkDragEnd, index: number): void {
    if (this.selectedValue() !== index) return;

    // Restore pointer events
    event.source.element.nativeElement.style.pointerEvents = 'auto';

    this.isDragging.set(false);
    this.dragX.set(0);
    this.dragY.set(0);

    // Re-enable transitions for smooth settling
    this.removeTransitionDisabled(index);

    // If already settled, return to origin
    if (this.settledButtonIndex() === index) {
      this.updateButtonTransform(index, '');
      this.settledButtonIndex.set(null);
      this.settledTransform.set(null);
      this.selectedValue.set(-1);
    } else {
      // Move to target position
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
   * Resets all button transforms to origin position
   */
  private resetAllButtonTransforms(): void {
    const buttonCount = this.localParameters.options.length;
    const transforms: Record<number, string> = {};

    for (let i = 0; i < buttonCount; i++) {
      transforms[i] = '';
    }

    this.buttonTransforms.set(transforms);
  }

  /**
   * Resets all component state to initial values
   */
  private resetSelection(): void {
    // Clear all states
    this.selectedValue.set(-1);
    this.isDragging.set(false);
    this.dragX.set(0);
    this.dragY.set(0);
    this.settledTransform.set(null);
    this.preCalculatedTransforms.set({});
    this.settledButtonIndex.set(null);
    this.buttonTransforms.set({});
    this.transitionDisabledButtons.set(new Set());
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
  private calculateButtonTransformValues(): Record<number, string> {
    if (!this.imageRef?.nativeElement || !this.dropContainerRef?.nativeElement) {
      return {};
    }

    const transforms: Record<number, string> = {};
    const totalButtons = this.localParameters.options.length;
    const containerElement = this.dropContainerRef.nativeElement;
    for (let index = 0; index < totalButtons; index++) {
      const { currentButtonCenter, containerCenter } = calculateButtonCenter(totalButtons, index);

      if (this.localParameters.imageLandingXY !== '') {
        const imgElement = this.imageRef.nativeElement;

        const buttonElement = this.dropContainerRef.nativeElement.querySelector(`[data-cy="drop-animate-wrapper-${index}"]`) as HTMLElement;

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
   * Handles button click events (when not dragging)
   * @param index - Index of the clicked button
   */
  onButtonClick(index: number): void {
    if (this.isDragging()) return;

    const currentSettled = this.settledButtonIndex();

    // If clicking the currently settled button, return it to origin
    if (currentSettled === index) {
      this.updateButtonTransform(index, '');
      this.settledButtonIndex.set(null);
      this.settledTransform.set(null);
      this.selectedValue.set(-1);
    } else {
      // If there's a different settled button, return it to origin
      if (currentSettled !== null) {
        this.updateButtonTransform(currentSettled, '');
      }

      this.toggleButtonSelection(index);

      // Move new button to target
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
    this.buttonTransforms.update(transforms => ({
      ...transforms,
      [index]: transform
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
