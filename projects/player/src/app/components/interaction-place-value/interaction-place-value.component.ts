import {
  Component,
  effect,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { IconButtonTypeEnum, InteractionPlaceValueParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-place-value',
  templateUrl: './interaction-place-value.component.html',
  styleUrls: ['./interaction-place-value.component.scss']
})
export class InteractionPlaceValueComponent extends InteractionComponentDirective implements AfterViewInit, OnDestroy {
  localParameters!: InteractionPlaceValueParams;
  private idCounter = 0;

  // Ones icon and Tens icon dimensions
  private readonly tensItemHeight = 58;
  private readonly tensItemWidth = 58;
  private readonly onesItemHeight = 58;
  private readonly onesItemWidth = 58;
  private readonly padding = 5;
  private readonly panelWidth = 665 + (2 * this.padding);
  private readonly panelPadding = 2 * this.padding;

  /** Image panel for TENS and ONES */
  readonly imageTensSignal = signal<CountItem[]>([]);
  readonly imageOnesSignal = signal<CountItem[]>([]);

  /** Image panel and wrappers element refs */
  @ViewChild('iconsUpperPanel', { static: false }) iconsUpperPanel?: ElementRef<HTMLElement>;
  @ViewChild('tensWrapper', { static: false }) tensWrapper?: ElementRef<HTMLElement>;
  @ViewChild('onesWrapper', { static: false }) onesWrapper?: ElementRef<HTMLElement>;

  /** Pre-calculated transform values */
  private tensToUpperTransforms: string[] = [];
  private onesToUpperTransforms: string[] = [];
  private tensFromUpperTransforms: string[] = [];
  private onesFromUpperTransforms: string[] = [];

  /** Window resize handler reference for cleanup */
  private resizeHandler?: (() => void) | undefined;

  /** Per-item transform map */
  readonly itemTransforms: Record<number, string> = {};

  /** Track selected items */
  readonly selectedItems: Set<number> = new Set<number>();

  /** Check if an item is selected */
  isSelected(id: number): boolean {
    return this.selectedItems.has(id);
  }

  /** Computed arrays for tens and ones icons - always show exactly one clickable item per wrapper */
  readonly tensArray = computed(() => [{ id: 999000, icon: 'TENS' as IconButtonTypeEnum }]);

  readonly onesArray = computed(() => [{ id: 999001, icon: 'ONES' as IconButtonTypeEnum }]);

  /** Animation control for click/drag animations: reactive map of animating item ids */
  private readonly animatingFlags = signal<Record<number, true>>({});
  /** keep in sync with CSS/inline transition (interaction-drop uses 1s ease-in-out) */
  private static readonly CLICK_ANIMATION_MS = 1000;

  /** Total number of rows in the upper panel */
  numberOfRows: number = 5;

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionPlaceValueParams;
      this.localParameters = this.createDefaultParameters();
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'COUNT';
        this.localParameters.value = parameters.value || 0;
        this.localParameters.numberOfRows = parameters.numberOfRows || 5;
        this.numberOfRows = this.localParameters.numberOfRows;

        // Schedule transform calculation after view initialization
        setTimeout(() => {
          this.calculateLandingTransforms();
          this.recalculateStackingPositions();
        }, 200);

        // Emit displayed response
        this.responses.emit([{
          id: this.localParameters.variableId,
          status: 'DISPLAYED',
          value: '',
          relevantForResponsesProgress: false
        }]);
      }
    });

    // Emit VALUE_CHANGED whenever the image-panel counts change
    effect(() => {
      const tens = this.imageTensCount();
      const ones = this.imageOnesCount();
      this.responses.emit([{
        id: this.localParameters?.variableId || 'PLACE_VALUE',
        status: 'VALUE_CHANGED',
        value: (tens * 10) + ones,
        relevantForResponsesProgress: true
      },
      {
        id: 'PLACE_VALUE_TENS',
        status: 'VALUE_CHANGED',
        value: tens,
        relevantForResponsesProgress: true
      }]);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.calculateLandingTransforms(); // pre-calculate landing transforms
    }, 100);

    // Recalculate transforms on window resize
    this.resizeHandler = () => {
      setTimeout(() => this.calculateLandingTransforms(), 100);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  /** Computed height for icons upper panel based on numberOfRows */
  getUpperPanelHeight = computed(() => ((this.tensItemHeight + 8) * this.numberOfRows) + (2 * 8));

  /** Compute and cache landing transforms for TENS and ONES up-front */
  private calculateLandingTransforms(): void {
    if (!this.iconsUpperPanel || !this.tensWrapper || !this.onesWrapper) {
      return;
    }

    const upperPanel = this.iconsUpperPanel.nativeElement;
    const tensWrapper = this.tensWrapper.nativeElement;
    const onesWrapper = this.onesWrapper.nativeElement;

    const upperRect = upperPanel.getBoundingClientRect();
    const tensRect = tensWrapper.getBoundingClientRect();
    const onesRect = onesWrapper.getBoundingClientRect();

    // Clear previous calculations
    this.tensToUpperTransforms = [];
    this.onesToUpperTransforms = [];
    this.tensFromUpperTransforms = [];
    this.onesFromUpperTransforms = [];

    const maxItems = Math.max(this.maxTensInUpperPanel(), this.maxOnesInUpperPanel());

    for (let i = 0; i < maxItems; i++) {
      // Calculate stacking position - tens stack vertically, ones stack horizontally
      const currentTensCount = this.imageTensCount();

      // TENS: Stack vertically from the top (upper left corner)
      const tensTargetX = upperRect.left + this.padding;
      const tensTargetY = upperRect.top + this.padding + (i * (this.onesItemHeight + this.padding));
      const tensDeltaX = tensTargetX - (tensRect.left + 8);
      const tensDeltaY = tensTargetY - (tensRect.top + 8);
      this.tensToUpperTransforms[i] = `translate(${tensDeltaX}px, ${tensDeltaY}px)`;
      this.tensFromUpperTransforms[i] = `translate(${-tensDeltaX}px, ${-tensDeltaY}px)`;

      // ONES: Arrange in rows below the tens stack
      const tensStackHeight = currentTensCount > 0 ? currentTensCount * (this.onesItemHeight + this.padding) + this.padding : 0;

      // Calculate position in ones grid
      const availableWidth = this.panelWidth - (2 * this.padding);
      const onesPerRow = Math.floor(availableWidth / (this.onesItemHeight + this.padding));
      const row = Math.floor(i / onesPerRow);
      const col = i % onesPerRow;

      const onesTargetX = upperRect.left + this.padding + (col * (this.onesItemHeight + this.padding));
      const onesTargetY = upperRect.top + this.padding + tensStackHeight + (row * (this.onesItemHeight + this.padding));
      const onesDeltaX = onesTargetX - (onesRect.left + this.padding);
      const onesDeltaY = onesTargetY - (onesRect.top + this.padding);
      this.onesToUpperTransforms[i] = `translate(${onesDeltaX}px, ${onesDeltaY}px)`;
      this.onesFromUpperTransforms[i] = `translate(${-onesDeltaX}px, ${-onesDeltaY}px)`;
    }
  }

  /** Recalculate transforms when items are added/removed */
  private recalculateStackingPositions(): void {
    const tensItems = this.imageTensSignal();
    const onesItems = this.imageOnesSignal();

    // Position TENS items - they stack vertically with 8px padding between each
    tensItems.forEach((item, index) => {
      const yOffset = index * (this.tensItemHeight + this.padding);
      this.itemTransforms[item.id] = `translate(0px, ${yOffset}px)`;
    });

    // Position ONES items - they arrange in rows, below all TENS items
    const tensStackHeight = tensItems.length > 0 ?
      tensItems.length * (this.tensItemHeight + this.padding) + this.padding : 0; // Height of tens stack + extra this.padding

    // Calculate how many ones can fit per row
    const availableWidth = this.panelWidth - (2 * this.padding); // Subtract panel this.padding
    const onesPerRow = Math.floor(availableWidth / (this.tensItemHeight + this.padding));

    onesItems.forEach((item, index) => {
      const row = Math.floor(index / onesPerRow);
      const col = index % onesPerRow;
      const xOffset = col * (this.tensItemHeight + this.padding);
      const yOffset = tensStackHeight + (row * (this.tensItemHeight + this.padding));
      this.itemTransforms[item.id] = `translate(${xOffset}px, ${yOffset}px)`;
    });
  }

  /** Image-panel counts for TENS and ONES */
  readonly imageTensCount = computed(() => this.imageTensSignal().length);
  readonly imageOnesCount = computed(() => this.imageOnesSignal().length);

  /** Calculate maximum tens items that can fit considering current ones items */
  readonly maxTensInUpperPanel = computed(() => {
    const numberOfRows = this.localParameters?.numberOfRows || 5;
    const panelHeight = (this.tensItemHeight * numberOfRows) + (2 * this.padding); // Total height available
    const currentOnes = this.imageOnesCount();

    // Calculate height occupied by ones items
    let onesHeight = 0;
    if (currentOnes > 0) {
      // Ones take up space in rows
      const availableWidth = this.getUpperPanelHeight() - (2 * this.padding); // Subtract panel this.padding
      const onesPerRow = Math.floor(availableWidth / (this.tensItemHeight + this.padding));
      const onesRows = Math.ceil(currentOnes / onesPerRow);
      onesHeight = onesRows * (this.tensItemHeight + this.padding);
    }

    // Calculate remaining height for tens
    const availableHeightForTens = panelHeight - (2 * 8) - onesHeight; // Subtract panel this.padding and ones height
    return Math.max(0, Math.floor(availableHeightForTens / (this.tensItemHeight + this.padding)));
  });

  /** Calculate maximum ones items that can fit considering current tens items and panel dimensions */
  readonly maxOnesInUpperPanel = computed(() => {
    const currentTens = this.imageTensCount();

    // Calculate height occupied by tens items
    const tensHeight = currentTens * (this.onesItemWidth + this.padding);

    // Calculate remaining height for ones
    const availableHeightForOnes = this.getUpperPanelHeight() - (2 * 8) - tensHeight;

    // Calculate how many ones can fit horizontally per row
    const availableWidth = this.panelWidth - (2 * 8); // Subtract panel padding
    const onesPerRow = Math.floor(availableWidth / (this.onesItemWidth + this.padding));

    // Calculate how many rows of ones can fit
    const maxOnesRows = Math.max(0, Math.floor(availableHeightForOnes / (this.onesItemWidth + this.padding)));

    // Total ones that can fit = ones per row * number of rows
    return Math.max(0, onesPerRow * maxOnesRows);
  });

  /** Check if tens wrapper should be disabled */
  readonly tensWrapperDisabled = computed(() => {
    const currentTens = this.imageTensCount();
    const maxTens = this.maxTensInUpperPanel();
    // Disable tens wrapper if the vertical capacity is reached
    return currentTens >= maxTens;
  });

  /** Check if ones wrapper should be disabled */
  readonly onesWrapperDisabled = computed(() => {
    const currentOnes = this.imageOnesCount();
    const maxOnes = this.maxOnesInUpperPanel();

    // Disable ones wrapper if the capacity is reached
    return currentOnes >= maxOnes;
  });

  /** Create a CountItem with a unique ID */
  private makeItem(icon: IconButtonTypeEnum): CountItem {
    this.idCounter += 1;
    return { icon, id: this.idCounter };
  }

  /** Click handler to move items from wrappers to upper panel and vice versa */
  onItemClick(item: CountItem, context: 'tens' | 'ones' | 'imageTens' | 'imageOnes'): void {

    console.log('UPPER PANEL HEIGHT:', this.getUpperPanelHeight());
    // Prevent double-scheduling while an item is animating
    if (this.isAnimating(item.id)) return;

    if (item.icon === 'TENS') {
      if (context === 'tens') {
        const idx = this.imageTensCount();

        // Recalculate transforms to account for current state
        this.calculateLandingTransforms();

        // Ensure transforms are calculated
        if (!this.tensToUpperTransforms[idx]) {
          return;
        }

        // Set animating state on the wrapper item
        this.setAnimating(item.id, true);

        // Animate the wrapper item to the upper panel position
        this.itemTransforms[item.id] = this.tensToUpperTransforms[idx];

        // After animation completes, create the upper panel item and reset wrapper
        setTimeout(() => {
          // Create the new item in the upper panel
          const newUpperItem = this.makeItem('TENS');
          const newImageTens = this.imageTensSignal().slice();
          newImageTens.push(newUpperItem);
          this.imageTensSignal.set(newImageTens);

          // Reset the wrapper item transform and animation state
          delete this.itemTransforms[item.id];
          this.setAnimating(item.id, false);

          // Position the new upper panel item correctly
          this.recalculateStackingPositions();
        }, InteractionPlaceValueComponent.CLICK_ANIMATION_MS);
      } else if (context === 'imageTens') {
        // Remove item from upper panel with animation
        this.animateItemRemoval(item, 'TENS', this.imageTensSignal);
      }
      return;
    }

    if (item.icon === 'ONES') {
      if (context === 'ones') {
        const idx = this.imageOnesCount();

        // Recalculate transforms to account for current state
        this.calculateLandingTransforms();

        // Ensure transforms are calculated
        if (!this.onesToUpperTransforms[idx]) {
          return;
        }

        // Set animating state on the wrapper item
        this.setAnimating(item.id, true);

        // Animate the wrapper item to the upper panel position
        this.itemTransforms[item.id] = this.onesToUpperTransforms[idx];

        // After animation completes, create the upper panel item and reset wrapper
        setTimeout(() => {
          // Create the new item in the upper panel
          const newUpperItem = this.makeItem('ONES');
          const newImageOnes = this.imageOnesSignal().slice();
          newImageOnes.push(newUpperItem);
          this.imageOnesSignal.set(newImageOnes);

          // Reset the wrapper item transform and animation state
          delete this.itemTransforms[item.id];
          this.setAnimating(item.id, false);

          // Position the new upper panel item correctly
          this.recalculateStackingPositions();
        }, InteractionPlaceValueComponent.CLICK_ANIMATION_MS);
      } else if (context === 'imageOnes') {
        // Remove item from upper panel with animation
        this.animateItemRemoval(item, 'ONES', this.imageOnesSignal);
      }
    }
  }

  /** Animate item removal from upper panel */
  private animateItemRemoval(
    item: CountItem,
    icon: IconButtonTypeEnum,
    fromSig: { (): CountItem[]; set: (v: CountItem[]) => void }
  ): void {
    // Get the item's current transform from its stacked position
    const currentTransform = this.itemTransforms[item.id] || 'translate(0px, 0px)';

    // Calculate reverse transform to animate item away
    const reverseTransform = this.calculateReverseTransformFromCurrentPosition(item, icon, currentTransform);

    // Start animation
    this.setAnimating(item.id, true);
    this.itemTransforms[item.id] = reverseTransform;

    // After animation completes, remove item and clean up
    setTimeout(() => {
      delete this.itemTransforms[item.id];
      this.setAnimating(item.id, false);
      // Recalculate positions for remaining items
      this.recalculateStackingPositions();
    }, InteractionPlaceValueComponent.CLICK_ANIMATION_MS);
  }

  /** Calculate reverse transform from item's current visual position accounting for existing transforms */
  private calculateReverseTransformFromCurrentPosition(
    item: CountItem,
    icon: IconButtonTypeEnum,
    currentTransform: string
  ): string | null {
    if (!this.iconsUpperPanel || !this.tensWrapper || !this.onesWrapper) {
      return null;
    }

    // Parse current transform to get current visual offset
    const transformMatch = currentTransform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
    const currentX = transformMatch ? parseFloat(transformMatch[1]) : 0;
    const currentY = transformMatch ? parseFloat(transformMatch[2]) : 0;

    const upperPanel = this.iconsUpperPanel.nativeElement;
    const upperRect = upperPanel.getBoundingClientRect();

    if (icon === 'TENS') {
      const tensWrapper = this.tensWrapper.nativeElement;
      const tensRect = tensWrapper.getBoundingClientRect();

      // Calculate current visual position (base position + current transform)
      const currentVisualX = upperRect.left + 8 + currentX;
      const currentVisualY = upperRect.top + 8 + currentY;

      // Calculate target wrapper position
      const targetX = tensRect.left + 8;
      const targetY = tensRect.top + 8;

      // Calculate delta from current visual position to wrapper
      const deltaX = targetX - currentVisualX;
      const deltaY = targetY - currentVisualY;

      return `translate(${currentX + deltaX}px, ${currentY + deltaY}px)`;
    }

    if (icon === 'ONES') {
      const onesWrapper = this.onesWrapper.nativeElement;
      const onesRect = onesWrapper.getBoundingClientRect();

      // Calculate current visual position (base position + current transform)
      const currentVisualX = upperRect.left + 8 + currentX;
      const currentVisualY = upperRect.top + 8 + currentY;

      // Calculate target wrapper position
      const targetX = onesRect.left + 8;
      const targetY = onesRect.top + 8;

      // Calculate delta from current visual position to wrapper
      const deltaX = targetX - currentVisualX;
      const deltaY = targetY - currentVisualY;

      return `translate(${currentX + deltaX}px, ${currentY + deltaY}px)`;
    }

    return null;
  }

  // Template helper for animation state
  isAnimating(id: number): boolean {
    return !!this.animatingFlags()[id];
  }

  /** Reactive helper to set/clear animating state */
  private setAnimating(id: number, on: boolean): void {
    const curr = this.animatingFlags();
    if (on) {
      if (curr[id]) return; // no change
      this.animatingFlags.set({ ...curr, [id]: true });
    } else {
      if (!curr[id]) return; // no change
      const next = { ...curr };
      delete next[id];
      this.animatingFlags.set(next);
    }
  }

  /** Utility to remove a specific item from a signal array */
  // eslint-disable-next-line class-methods-use-this
  // private removeItemFromSignal(
  //   fromSig: { (): CountItem[]; set: (v: CountItem[]) => void },
  //   item: CountItem
  // ): void {
  //   const from = fromSig();
  //   const index = from.findIndex(i => i.id === item.id);
  //   if (index === -1) return;
  //   const newFrom = from.slice();
  //   newFrom.splice(index, 1);
  //   fromSig.set(newFrom);
  // }

  ngOnDestroy(): void {
    // Clean up pre-calculated transform arrays
    this.tensToUpperTransforms = [];
    this.onesToUpperTransforms = [];
    this.tensFromUpperTransforms = [];
    this.onesFromUpperTransforms = [];

    // Clear any remaining item transforms
    Object.keys(this.itemTransforms).forEach(key => {
      delete this.itemTransforms[+key];
    });

    // Remove window resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionPlaceValueParams {
    return {
      variableId: 'PLACE_VALUE',
      value: 0,
      numberOfRows: 5,
      maxTens: 10,
      maxOnes: 10
    };
  }
}

type CountItem = { icon: IconButtonTypeEnum; id: number };
