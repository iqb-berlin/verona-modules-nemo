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
import { IconButtonTypeEnum, InteractionPlaceValueParams, SelectionOption } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-place-value',
  templateUrl: './interaction-place-value.component.html',
  styleUrls: ['./interaction-place-value.component.scss']
})
export class InteractionPlaceValueComponent extends InteractionComponentDirective implements AfterViewInit, OnDestroy {
  localParameters!: InteractionPlaceValueParams;

  /** expose options as a signal for template */
  readonly optionsSignal = signal<SelectionOption[]>([]);

  /** Drag & drop data sources */
  private idCounter = 0;
  readonly tensSourceSignal = signal<CountItem[]>([]);
  readonly onesSourceSignal = signal<CountItem[]>([]);
  /** Image panel split into two halves: upper for TENS, lower for ONES */
  readonly imageTensSignal = signal<CountItem[]>([]);
  readonly imageOnesSignal = signal<CountItem[]>([]);

  /** Image panel and wrappers element refs */
  @ViewChild('iconsUpperPanel', { static: false }) iconsUpperPanel?: ElementRef<HTMLElement>;

  /** Per-item transform map */
  readonly itemTransforms: Record<number, string> = {};

  /** Track selected items */
  readonly selectedItems: Set<number> = new Set<number>();

  /** Check if an item is selected */
  isSelected(id: number): boolean {
    return this.selectedItems.has(id);
  }

  /** Computed height for icons upper panel based on numberOfRows */
  readonly upperPanelHeight = computed(() => {
    const numberOfRows = this.localParameters?.numberOfRows || 5;
    return (58 * numberOfRows) + (2 * 8) + 'px'; // 58px per row + 8px margin top and bottom
  });

  /** Computed arrays for tens and ones icons based on maxTens and maxOnes */
  readonly tensArray = computed(() => {
    const maxTens = this.localParameters?.maxTens || 10;
    return Array.from({ length: maxTens }, (_, index) => ({ id: index, icon: 'TENS' as IconButtonTypeEnum }));
  });

  readonly onesArray = computed(() => {
    const maxOnes = this.localParameters?.maxOnes || 10;
    return Array.from({ length: maxOnes }, (_, index) => ({ id: index, icon: 'ONES' as IconButtonTypeEnum }));
  });

  /** Pre-calculated landing transforms (computed up-front, reused on click) */
  private tensLandingTransforms: string[] = [];
  private tensLandingTargets: { x: number; y: number }[] = [];
  private onesLandingTransforms: string[] = [];
  private onesLandingTargets: { x: number; y: number }[] = [];

  /** Caps for maximum allowed items in the image panel */
  private maxTens = 3;
  private maxOnes = 20;

  /** Animation control for click/drag animations: reactive map of animating item ids */
  private readonly animatingFlags = signal<Record<number, true>>({});
  /** keep in sync with CSS/inline transition (interaction-drop uses 1s ease-in-out) */
  private static readonly CLICK_ANIMATION_MS = 1000;

  /** Resize handling (recalculate transforms on layout changes) */
  private resizeObserver: ResizeObserver | undefined;
  private windowResizeHandler: (() => void) | undefined;

  /** Helper: next landing index for TENS stacking in upper half */
  private get nextTensIndex(): number { return this.imageTensSignal().length; }

  /** After adding the clone into image panel, let it use natural  */
  private snapNewImageItemToLanding(newId: number): void {
    delete this.itemTransforms[newId];
  }

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionPlaceValueParams;
      this.localParameters = this.createDefaultParameters();
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'COUNT';
        this.localParameters.value = parameters.value || 0;
        this.localParameters.numberOfRows = parameters.numberOfRows || 5;
        this.localParameters.maxTens = parameters.maxTens || 10;
        this.localParameters.maxOnes = parameters.maxOnes || 10;

        // Calculate landing transforms after view updates
        setTimeout(() => {
          this.calculateLandingTransforms();
        }, 100);

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
        id: this.localParameters?.variableId || 'COUNT',
        status: 'VALUE_CHANGED',
        value: `TENS=${tens};ONES=${ones}`,
        relevantForResponsesProgress: true
      }]);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.calculateLandingTransforms(); // pre-calculate landing transforms
    }, 100);

    // Observe layout changes to recompute pre-calculated transforms
    const toObserve: Element[] = [];
    if (this.iconsUpperPanel?.nativeElement) toObserve.push(this.iconsUpperPanel.nativeElement);

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        setTimeout(() => this.calculateLandingTransforms(), 0);
      });
      toObserve.forEach(el => {
        try { this.resizeObserver!.observe(el); } catch { /* noop */ }
      });
    }

    this.windowResizeHandler = () => setTimeout(() => this.calculateLandingTransforms(), 0);
    try { window.addEventListener('resize', this.windowResizeHandler); } catch { /* noop */ }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      try {
        this.resizeObserver.disconnect();
      } catch {
        /* noop */
      }
      this.resizeObserver = undefined;
    }
    if (this.windowResizeHandler) {
      try {
        window.removeEventListener('resize', this.windowResizeHandler);
      } catch {
        /* noop */
      }
      this.windowResizeHandler = undefined;
    }
  }

  /** Compute and cache landing transforms for TENS and ONES up-front */
  private calculateLandingTransforms(): void {
    // Transform calculations will be handled when needed during interactions
    this.tensLandingTransforms = [];
    this.tensLandingTargets = [];
    this.onesLandingTransforms = [];
    this.onesLandingTargets = [];
  }

  /** Helper: get counts and signals by icon */
  private getContextByIcon(icon: IconButtonTypeEnum): {
    sourceSig: { (): CountItem[]; set: (v: CountItem[]) => void };
    imageSig: { (): CountItem[]; set: (v: CountItem[]) => void };
  } {
    if (icon === 'TENS') {
      return { sourceSig: this.tensSourceSignal, imageSig: this.imageTensSignal };
    }
    return { sourceSig: this.onesSourceSignal, imageSig: this.imageOnesSignal };
  }

  /** Image-panel counts for TENS and ONES */
  readonly imageTensCount = computed(() => this.imageTensSignal().length);
  readonly imageOnesCount = computed(() => this.imageOnesSignal().length);

  readonly tensCapReached = computed(() => this.imageTensCount() >= (this.localParameters?.maxTens || 10));
  readonly onesCapReached = computed(() => this.imageOnesCount() >= (this.localParameters?.maxOnes || 10));
  readonly allCapsReached = computed(() => this.tensCapReached() && this.onesCapReached());

  private canAdd(icon: IconButtonTypeEnum): boolean {
    if (this.allCapsReached()) return false;
    if (icon === 'TENS') return !this.tensCapReached();
    return !this.onesCapReached();
  }

  /**
   * Never remove the very last item from the wrapper (at least 1 stays)
   * Always clone a new item into image panel
   */
  private addFromWrapperToImage(item: CountItem): void {
    const icon = item.icon;
    if (!this.canAdd(icon)) return;
    const { imageSig } = this.getContextByIcon(icon);

    // Always clone into image (create a new item)
    const newImage = imageSig().slice();
    newImage.push(this.makeItem(icon));
    imageSig.set(newImage);
  }

  /** Create a CountItem with a unique ID */
  private makeItem(icon: IconButtonTypeEnum): CountItem {
    this.idCounter += 1;
    return { icon, id: this.idCounter };
  }

  /** Click handler to toggle item between its wrapper and image panel */
  onItemClick(item: CountItem, context: 'tens' | 'ones' | 'imageTens' | 'imageOnes'): void {
    // Prevent double-scheduling while an item is animating
    if (this.isAnimating(item.id)) return;

    if (item.icon === 'TENS') {
      if (context === 'tens') {
        // Check capacity before starting animation
        if (!this.canAdd('TENS')) return;
        // Use pre-calculated landing transform and target for current index
        const idx = this.nextTensIndex;
        if (!this.tensLandingTransforms[idx] || !this.tensLandingTargets[idx]) {
          this.calculateLandingTransforms();
          // Wait for calculation to complete
          setTimeout(() => this.onItemClick(item, context), 10);
          return;
        }
        const landing = this.tensLandingTransforms[idx];
        const target = this.tensLandingTargets[idx];
        if (!landing || !target) return;

        console.log('ONCLICK. transform for tens, transform value is', landing, 'transformed item is', item, 'currently animating?', this.isAnimating(item.id));

        // Set animating state and apply transform immediately
        this.setAnimating(item.id, true);
        this.itemTransforms[item.id] = landing;

        // After animation completes, add a new image item and snap it to the same landing position
        setTimeout(() => {
          // Create the clone first so we know its ID
          const newItem = this.makeItem('TENS');
          const newImage = this.imageTensSignal().slice();
          newImage.push(newItem);
          this.imageTensSignal.set(newImage);

          // Clear any transforms on the new image item
          this.snapNewImageItemToLanding(newItem.id);

          // Reset wrapper visuals
          delete this.itemTransforms[item.id];
          this.setAnimating(item.id, false);
        }, InteractionPlaceValueComponent.CLICK_ANIMATION_MS);
      } else if (context === 'imageTens') {
        // Animate back from imageTens => tensSource
        this.animateItemBackToWrapper(item, 'TENS', this.imageTensSignal, this.tensSourceSignal);
      }
      return;
    }

    if (item.icon === 'ONES') {
      if (context === 'ones') {
        // Check capacity before starting animation
        if (!this.canAdd('ONES')) return;
        // Use pre-calculated landing transform for the next ONES position
        const idx = this.imageOnesCount(); // Next index for ONES
        if (!this.onesLandingTransforms[idx] || !this.onesLandingTargets[idx]) {
          this.calculateLandingTransforms();
          // Wait for calculation to complete
          setTimeout(() => this.onItemClick(item, context), 10);
          return;
        }
        const landing = this.onesLandingTransforms[idx];
        const target = this.onesLandingTargets[idx];
        if (!landing || !target) return;
        console.log('ONCLICK. transform for ONEs', landing, 'transformed item is', item, 'currently animating?', this.isAnimating(item.id));
        // Set animating state and apply transform immediately
        this.setAnimating(item.id, true);
        this.itemTransforms[item.id] = landing;

        setTimeout(() => {
          const newItem = this.makeItem('ONES');
          const newImage = this.imageOnesSignal().slice();
          newImage.push(newItem);
          this.imageOnesSignal.set(newImage);

          // Clear any transforms on the new image item
          this.snapNewImageItemToLanding(newItem.id);

          delete this.itemTransforms[item.id];
          this.setAnimating(item.id, false);
        }, InteractionPlaceValueComponent.CLICK_ANIMATION_MS);
      } else if (context === 'imageOnes') {
        // Animate back from imageOnes => onesSource
        this.animateItemBackToWrapper(item, 'ONES', this.imageOnesSignal, this.onesSourceSignal);
      }
    }
  }

  /** Animate item from image panel back to its wrapper with transform translate */
  private animateItemBackToWrapper(
    item: CountItem,
    icon: IconButtonTypeEnum,
    fromSig: { (): CountItem[]; set: (v: CountItem[]) => void },
    toSig: { (): CountItem[]; set: (v: CountItem[]) => void }
  ): void {
    // Calculate reverse transform from current image panel position to wrapper position
    const reverseTransform = this.calculateReverseTransform(item, icon);
    if (!reverseTransform) {
      // Fallback to immediate move if transform calculation fails
      this.moveItemBetween(fromSig, toSig, item);
      return;
    }

    // Start animation
    this.setAnimating(item.id, true);
    this.itemTransforms[item.id] = reverseTransform;

    // After animation completes, move item and clean up
    setTimeout(() => {
      this.moveItemBetween(fromSig, toSig, item);
      delete this.itemTransforms[item.id];
      this.setAnimating(item.id, false);
    }, InteractionPlaceValueComponent.CLICK_ANIMATION_MS);
  }

  /** Calculate reverse transform from image panel item to wrapper position */
  // eslint-disable-next-line class-methods-use-this
  private calculateReverseTransform(item: CountItem, icon: IconButtonTypeEnum): string | null {
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

  /** Utility to move a specific item between two signal arrays */
  // eslint-disable-next-line class-methods-use-this
  private moveItemBetween(
    fromSig: { (): CountItem[]; set: (v: CountItem[]) => void },
    toSig: { (): CountItem[]; set: (v: CountItem[]) => void },
    item: CountItem
  ): void {
    const from = fromSig();
    const index = from.findIndex(i => i.id === item.id);
    if (index === -1) return;
    const newFrom = from.slice();
    const removed = newFrom[index];
    if (!removed) return;
    newFrom.splice(index, 1);
    const newTo = toSig().slice();
    newTo.push(removed);
    fromSig.set(newFrom);
    toSig.set(newTo);
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
