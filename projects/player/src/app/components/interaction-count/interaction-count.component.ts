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
import {
  DragDropModule, CdkDragDrop, CdkDragEnd, moveItemInArray, transferArrayItem, CdkDrag
} from '@angular/cdk/drag-drop';

import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { IconButtonTypeEnum, InteractionCountParams, SelectionOption } from '../../models/unit-definition';
import { StandardIconComponent } from '../../shared/standard-icon/standard-icon.component';

@Component({
  selector: 'stars-interaction-count',
  templateUrl: './interaction-count.component.html',
  styleUrls: ['./interaction-count.component.scss'],
  imports: [StandardIconComponent, DragDropModule]
})
export class InteractionCountComponent extends InteractionComponentDirective implements AfterViewInit, OnDestroy {
  localParameters!: InteractionCountParams;

  /** expose options as a signal for template */
  readonly optionsSignal = signal<SelectionOption[]>([]);

  /** Drag & drop data sources */
  private idCounter = 0;
  readonly tensSourceSignal = signal<CountItem[]>([]);
  readonly onesSourceSignal = signal<CountItem[]>([]);
  /** Image panel split into two halves: upper for TENS, lower for ONES */
  readonly imageTensSignal = signal<CountItem[]>([]);
  readonly imageOnesSignal = signal<CountItem[]>([]);

  /** Suppress click right after a drag starts to avoid accidental toggles */
  private suppressClick = false;
  /** Tracks whether the current drag sequence ended with a valid CDK drop */
  private dropOccurred = false;
  /** Tracks items whose wrapper→image animation was initiated in handleDrop to avoid double-handling in onDragEnded */
  private readonly dropAnimatingIds = new Set<number>();

  /** Image panel and wrappers element refs */
  @ViewChild('imagePanel', { static: false }) imagePanelRef?: ElementRef<HTMLElement>;
  @ViewChild('tensWrapper', { static: false }) tensWrapperRef?: ElementRef<HTMLElement>;
  @ViewChild('onesWrapper', { static: false }) onesWrapperRef?: ElementRef<HTMLElement>;
  @ViewChild('imageUpperHalf', { static: false }) imageUpperHalfRef?: ElementRef<HTMLElement>;
  @ViewChild('imageLowerHalf', { static: false }) imageLowerHalfRef?: ElementRef<HTMLElement>;

  /** Per-item transform map */
  readonly itemTransforms: Record<number, string> = {};

  /** Pre-calculated landing transforms (computed up-front, reused on click) */
  private tensLandingTransforms: string[] = [];
  private tensLandingTargets: { x: number; y: number }[] = [];
  private onesLandingTransforms: string[] = [];
  private onesLandingTargets: { x: number; y: number }[] = [];

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

  /** Enter predicates to ensure items return only to their initial wrapper */
  // eslint-disable-next-line class-methods-use-this
  readonly tensEnterPredicate = (drag: CdkDrag<CountItem>): boolean => {
    const data = drag?.data as CountItem | undefined;
    return !!data && data.icon === 'TENS';
  };

  // eslint-disable-next-line class-methods-use-this
  readonly onesEnterPredicate = (drag: CdkDrag<CountItem>): boolean => {
    const data = drag?.data as CountItem | undefined;
    return !!data && data.icon === 'ONES';
  };

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionCountParams;
      this.localParameters = this.createDefaultParameters();
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'COUNT';
        this.localParameters.text = parameters.text || '';
        this.localParameters.imageSource = parameters.imageSource || '';
        this.localParameters.imagePosition = parameters.imagePosition || 'TOP';
        this.localParameters.options = parameters.options || [];
        this.optionsSignal.set(this.localParameters.options);

        const hasTens = !!this.optionsSignal().find(o => o.icon === 'TENS');
        const hasOnes = !!this.optionsSignal().find(o => o.icon === 'ONES');
        const tens = hasTens ? Array.from({ length: 2 }, () => this.makeItem('TENS')) : [];
        const ones = hasOnes ? Array.from({ length: 2 }, () => this.makeItem('ONES')) : [];
        this.tensSourceSignal.set(tens);
        this.onesSourceSignal.set(ones);
        this.imageTensSignal.set([]);
        this.imageOnesSignal.set([]);

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
      this.calculateLandingTransforms(); // pre-calculate landing transforms like interaction-drop
    }, 100);

    // Observe layout changes to recompute pre-calculated transforms
    const toObserve: Element[] = [];
    if (this.imagePanelRef?.nativeElement) toObserve.push(this.imagePanelRef.nativeElement);
    if (this.imageUpperHalfRef?.nativeElement) toObserve.push(this.imageUpperHalfRef.nativeElement);
    if (this.imageLowerHalfRef?.nativeElement) toObserve.push(this.imageLowerHalfRef.nativeElement);
    if (this.tensWrapperRef?.nativeElement) toObserve.push(this.tensWrapperRef.nativeElement);
    if (this.onesWrapperRef?.nativeElement) toObserve.push(this.onesWrapperRef.nativeElement);

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

  /** Compute and cache landing transforms for TENS (per index) and ONES (single) up-front */
  private calculateLandingTransforms(): void {
    const upper = this.imageUpperHalfRef?.nativeElement;
    const lower = this.imageLowerHalfRef?.nativeElement;
    const tensWrap = this.tensWrapperRef?.nativeElement;
    const onesWrap = this.onesWrapperRef?.nativeElement;
    if (!upper || !lower || !tensWrap || !onesWrap) return;

    // Find sample items in wrappers to determine origin centers and item sizes
    const tensSample = tensWrap.querySelector('.icon-item') as HTMLElement | null;
    const onesSample = onesWrap.querySelector('.icon-item') as HTMLElement | null;
    if (!tensSample || !onesSample) return;

    const upperRect = upper.getBoundingClientRect();
    const lowerRect = lower.getBoundingClientRect();
    const tensRect = tensSample.getBoundingClientRect();
    const onesRect = onesSample.getBoundingClientRect();

    // Account for the absolute positioning offset (top: 8px, left: 8px)
    const wrapperOffsetX = 8;
    const wrapperOffsetY = 8;

    // Get the screen position of absolutely positioned elements including the absolute offset
    const tensOriginX = tensRect.left + tensRect.width / 2;
    const tensOriginY = tensRect.top + tensRect.height / 2;
    const onesOriginX = onesRect.left + onesRect.width / 2;
    const onesOriginY = onesRect.top + onesRect.height / 2;

    // TENS: stack from upper-left, using smaller gaps to fit properly
    const max = InteractionCountComponent.MAX_TENS;
    const itemW = tensRect.width;
    const itemH = tensRect.height;
    const transforms: string[] = [];
    const targets: { x: number; y: number }[] = [];

    for (let i = 0; i < max; i += 1) {
      const verticalSpacing = 8; // margin-bottom from CSS
      const targetX = upperRect.left + wrapperOffsetX + (itemW / 2);
      const targetY = upperRect.top + wrapperOffsetY + i * (itemH + verticalSpacing) + (itemH / 2);

      const dx = targetX - tensOriginX;
      const dy = targetY - tensOriginY;
      transforms[i] = `translate(${dx}px, ${dy}px)`;
      targets[i] = { x: targetX, y: targetY };
    }
    this.tensLandingTransforms = transforms;
    this.tensLandingTargets = targets;

    // ONES: calculate transforms for stacking side by side in lower half
    const onesMax = InteractionCountComponent.MAX_ONES;
    const onesW = onesRect.width;
    const onesH = onesRect.height;
    const onesTransforms: string[] = [];
    const onesTargets: { x: number; y: number }[] = [];

    const itemSpacing = 8; // margin-right from CSS
    const availableWidth = lowerRect.width - wrapperOffsetX * 2;
    const itemsPerRow = Math.floor(availableWidth / (onesW + itemSpacing));

    for (let i = 0; i < onesMax; i += 1) {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      const colOffset = col * (onesW + itemSpacing);
      const rowOffset = row * (onesH + itemSpacing); // margin-bottom spacing
      const targetX = lowerRect.left + wrapperOffsetX + colOffset + (onesW / 2);
      const targetY = lowerRect.top + wrapperOffsetY + rowOffset + (onesH / 2);

      const dx = targetX - onesOriginX;
      const dy = targetY - onesOriginY;
      onesTransforms[i] = `translate(${dx}px, ${dy}px)`;
      onesTargets[i] = { x: targetX, y: targetY };
    }
    this.onesLandingTransforms = onesTransforms;
    this.onesLandingTargets = onesTargets;
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

  /** Caps for maximum allowed items in the image panel */
  private static readonly MAX_TENS = 3;
  private static readonly MAX_ONES = 20;

  readonly tensCapReached = computed(() => this.imageTensCount() >= InteractionCountComponent.MAX_TENS);
  readonly onesCapReached = computed(() => this.imageOnesCount() >= InteractionCountComponent.MAX_ONES);
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

  /** Handle drag-and-drop events */
  // eslint-disable-next-line class-methods-use-this
  handleDrop(event: CdkDragDrop<CountItem[]>) {
    this.dropOccurred = true;
    console.log('[handleDrop] drop detected', {
      prevLen: event.previousContainer.data?.length,
      currLen: event.container.data?.length
    });
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Determine if this is a wrapper => image move for TENS or ONES
      const prevData = event.previousContainer.data;
      const currData = event.container.data;

      const isPrevTensWrapper = prevData === this.tensSourceSignal();
      const isPrevOnesWrapper = prevData === this.onesSourceSignal();
      const isCurrTensImage = currData === this.imageTensSignal();
      const isCurrOnesImage = currData === this.imageOnesSignal();

      const movingWrapperToImage =
        (isPrevTensWrapper && isCurrTensImage) ||
        (isPrevOnesWrapper && isCurrOnesImage);

      if (movingWrapperToImage) {
        // Start smooth animation immediately here (CDK event ordering may fire dragEnd before dropped)
        const draggedItem = event.item?.data as CountItem | undefined;
        if (!draggedItem) {
          console.warn('[handleDrop] movingWrapperToImage but no dragged item data');
          return;
        }
        const freePos = (event.item as unknown as CdkDrag)?.getFreeDragPosition?.() ?? { x: 0, y: 0 };
        const dragPosition = { x: freePos.x ?? 0, y: freePos.y ?? 0 };
        console.log('[handleDrop] wrapper→image animation start', draggedItem, 'from', dragPosition);
        this.dropAnimatingIds.add(draggedItem.id);
        this.animateDragToImagePanelSmooth(draggedItem, draggedItem.icon, dragPosition);
        // Clear the helper flag after the animation window
        setTimeout(() => {
          this.dropAnimatingIds.delete(draggedItem.id);
        }, InteractionCountComponent.CLICK_ANIMATION_MS + 50);
        // Do not transfer items here – image panel receives a clone after animation
        this.dropOccurred = false; // consumed
        return;
      }

      // Otherwise, perform the normal transfer
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  /** Mark that a drag has started to suppress immediate click */
  onDragStarted(item: CountItem): void {
    console.log('onDragStarted for item:', item.id, 'currently animating:', this.isAnimating(item.id));
    this.suppressClick = true;
    this.dropOccurred = false;
    // Ensure item is not in animatingIds during drag (enables no-transition class)
    this.setAnimating(item.id, false);
  }

  /** Re-enable transitions when drag is released */
  // eslint-disable-next-line class-methods-use-this
  onDragReleased(item: CountItem): void {
    console.log('onDragReleased for item:', item.id, 'currently animating:', this.isAnimating(item.id));
    // Remove from animatingIds to prepare for animation - do I need this?
  }

  /** Clear click suppression shortly after drag end */
  onDragEnded(event: CdkDragEnd, item?: CountItem, context?: 'tens' | 'ones' | 'imageTens' | 'imageOnes'): void {
    console.log('onDragEnded, this.dropOccurred is', this.dropOccurred);
    // Use a timeout so the click from the drag end does not fire
    setTimeout(() => { this.suppressClick = false; }, 0);

    if (!item || !context) return;

    // If handleDrop already initiated an animation for this item, bail out to avoid double-handling
    if (this.dropAnimatingIds.has(item.id)) {
      console.log('onDragEnded ignored because animation is running from handleDrop for item', item.id);
      this.dropOccurred = false;
      return;
    }

    // Get the actual free drag position
    const freePos = (event?.source as CdkDrag)?.getFreeDragPosition?.() ?? { x: 0, y: 0 };
    const dragPosition = { x: freePos.x ?? 0, y: freePos.y ?? 0 };

    // Check if this was a valid drop or just a drag-and-release
    if (this.dropOccurred) {
      // this.dropOccurred is always false so it doesnt render beloe lines
      // FIX THIS!
      console.log('onDragEnded, valid drop occurred FOR TENS, context:', context, 'item:', item.id, 'currently animating:', this.isAnimating(item.id));
      // For wrapper -> image valid drops, run smooth animation instead of instant jump
      if (context === 'tens' && item.icon === 'TENS') {
        this.animateDragToImagePanelSmooth(item, 'TENS', dragPosition);
        this.dropOccurred = false;
        return;
      }
      if (context === 'ones' && item.icon === 'ONES') {
        console.log('onDragEnded, valid drop occurred FOR ONES, context:', context, 'item:', item.id, 'currently animating:', this.isAnimating(item.id));
        this.animateDragToImagePanelSmooth(item, 'ONES', dragPosition);
        this.dropOccurred = false;
        return;
      }
      console.log('onDragEnded, no valid drop occurred, context:', context, 'item:', item.id, 'currently animating:', this.isAnimating(item.id));
      this.dropOccurred = false;
      return;
    }

    // If item was dragged and released without a valid drop, animate to target
    if (context === 'tens') {
      if (item.icon === 'TENS') this.animateDragToImagePanelSmooth(item, 'TENS', dragPosition);
      return;
    }
    if (context === 'ones') {
      if (item.icon === 'ONES') this.animateDragToImagePanelSmooth(item, 'ONES', dragPosition);
      return;
    }
    // If dragged from image panel and released => animate back to wrapper
    if (context === 'imageTens') {
      if (item.icon === 'TENS') {
        this.animateItemBackToWrapperSmooth(item, 'TENS', this.imageTensSignal, this.tensSourceSignal, dragPosition);
      }
      return;
    }
    if (context === 'imageOnes') {
      if (item.icon === 'ONES') {
        this.animateItemBackToWrapperSmooth(item, 'ONES', this.imageOnesSignal, this.onesSourceSignal, dragPosition);
      }
    }
  }

  /** Click handler to toggle item between its wrapper and image panel */
  onItemClick(item: CountItem, context: 'tens' | 'ones' | 'imageTens' | 'imageOnes'): void {
    if (this.suppressClick) return;
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
        }, InteractionCountComponent.CLICK_ANIMATION_MS);
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
        }, InteractionCountComponent.CLICK_ANIMATION_MS);
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
    }, InteractionCountComponent.CLICK_ANIMATION_MS);
  }

  /** Animate item smoothly from drag position to image panel target */
  private animateDragToImagePanelSmooth(
    item: CountItem,
    icon: IconButtonTypeEnum,
    dragDistance: { x: number; y: number }
  ): void {
    // Check capacity before starting animation
    if (!this.canAdd(icon)) return;

    // Get the next available index for positioning
    const idx = icon === 'TENS' ? this.nextTensIndex : this.imageOnesCount();
    const transforms = icon === 'TENS' ? this.tensLandingTransforms : this.onesLandingTransforms;
    const targets = icon === 'TENS' ? this.tensLandingTargets : this.onesLandingTargets;

    if (!transforms[idx] || !targets[idx]) {
      this.calculateLandingTransforms();
      setTimeout(() => this.animateDragToImagePanelSmooth(item, icon, dragDistance), 10);
      return;
    }

    const targetTransform = transforms[idx];
    const targetPosition = targets[idx];
    if (!targetTransform || !targetPosition) {
      this.addFromWrapperToImage(item);
      return;
    }

    console.log('animateDragToImagePanelSmooth=================, target transform is', targetTransform, 'target position is', targetPosition, 'transformed item is', item, 'currently animating?', this.isAnimating(item.id));
    // If there was drag distance, calculate the remaining distance from current dragged position to target
    if (dragDistance.x !== 0 || dragDistance.y !== 0) {
      console.log('animateDRagToIMagePanelSmooth, there was drag distance, start from the dropped position and animate smoothly to target:', targetTransform, 'animated item is', item, 'currently animating?', this.isAnimating(item.id));
      // Set the current dropped position first (without transition - not in animatingIds yet)
      this.itemTransforms[item.id] = `translate(${dragDistance.x}px, ${dragDistance.y}px)`;

      // Use double requestAnimationFrame to ensure:
      //  1) The dropped position without transition is painted
      //  2) The animating class is applied and recognized by the browser
      //  3) Then apply the target transform to trigger CSS transition
      requestAnimationFrame(() => {
        console.log('inside request animation frame=============');
        this.setAnimating(item.id, true);
        requestAnimationFrame(() => {
          this.itemTransforms[item.id] = targetTransform;

          // After animation completes, add new item to image panel and clean up
          setTimeout(() => {
            this.addFromWrapperToImage(item);
            delete this.itemTransforms[item.id];
            this.setAnimating(item.id, false);
          }, InteractionCountComponent.CLICK_ANIMATION_MS);
        });
      });
    } else {
      console.log('animateDRagToIMagePanelSmooth, no drag distance, animate directly to target:', targetTransform, 'animated item is', item, 'currently animating?', this.isAnimating(item.id));
      // No drag distance, animate directly to target
      this.setAnimating(item.id, true);
      this.itemTransforms[item.id] = targetTransform;

      setTimeout(() => {
        this.addFromWrapperToImage(item);
        delete this.itemTransforms[item.id];
        this.setAnimating(item.id, false);
      }, InteractionCountComponent.CLICK_ANIMATION_MS);
    }
  }

  /** Animate item smoothly back to wrapper from drag position */
  private animateItemBackToWrapperSmooth(
    item: CountItem,
    icon: IconButtonTypeEnum,
    fromSig: { (): CountItem[]; set: (v: CountItem[]) => void },
    toSig: { (): CountItem[]; set: (v: CountItem[]) => void },
    dragDistance: { x: number; y: number }
  ): void {
    // Calculate reverse transform from current image panel position to wrapper position
    const reverseTransform = this.calculateReverseTransform(item, icon);
    if (!reverseTransform) {
      this.moveItemBetween(fromSig, toSig, item);
      return;
    }

    // If there was drag distance, calculate the remaining distance from current dragged position to wrapper
    if (dragDistance.x !== 0 || dragDistance.y !== 0) {
      console.log('animateItemBackToWrapperSmooth, there was drag distance:', dragDistance, 'target:', reverseTransform, 'currently animating#?', this.isAnimating(item.id));
      // Set the current dropped position first (without transition - not in animatingIds yet)
      this.itemTransforms[item.id] = `translate(${dragDistance.x}px, ${dragDistance.y}px)`;

      // Use requestAnimationFrame to ensure the dropped position is rendered before animating
      requestAnimationFrame(() => {
        console.log('inside request animation frame=============');
        // Now enable transition and apply target transform (matching interaction-drop pattern)
        this.setAnimating(item.id, true);
        this.itemTransforms[item.id] = reverseTransform;

        // After animation completes, move item and clean up
        setTimeout(() => {
          this.moveItemBetween(fromSig, toSig, item);
          delete this.itemTransforms[item.id];
          this.setAnimating(item.id, false);
        }, InteractionCountComponent.CLICK_ANIMATION_MS);
      });
    } else {
      // No drag distance, animate directly to wrapper
      this.setAnimating(item.id, true);
      this.itemTransforms[item.id] = reverseTransform;

      setTimeout(() => {
        this.moveItemBetween(fromSig, toSig, item);
        delete this.itemTransforms[item.id];
        this.setAnimating(item.id, false);
      }, InteractionCountComponent.CLICK_ANIMATION_MS);
    }
  }

  /** Calculate reverse transform from image panel item to wrapper position */
  private calculateReverseTransform(item: CountItem, icon: IconButtonTypeEnum): string | null {
    const wrapper = icon === 'TENS' ?
      this.tensWrapperRef?.nativeElement :
      this.onesWrapperRef?.nativeElement;

    if (!wrapper) return null;

    const wrapperSample = wrapper.querySelector('.icon-item') as HTMLElement | null;
    if (!wrapperSample) return null;

    const wrapperRect = wrapperSample.getBoundingClientRect();

    if (icon === 'TENS') {
      // TENS items are stacked vertically in upper half
      const imageItems = this.imageTensSignal();
      const itemIndex = imageItems.findIndex(imageItem => imageItem.id === item.id);

      if (itemIndex === -1) return null;

      const upper = this.imageUpperHalfRef?.nativeElement;
      if (!upper) return null;

      const upperRect = upper.getBoundingClientRect();
      const wrapperOffsetX = 8;
      const wrapperOffsetY = 8;
      const verticalSpacing = 8;
      const itemH = 58;
      const itemW = 652;

      const currentX = upperRect.left + wrapperOffsetX + (itemW / 2);
      const currentY = upperRect.top + wrapperOffsetY + itemIndex * (itemH + verticalSpacing) + (itemH / 2);

      const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
      const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;

      const dx = wrapperCenterX - currentX;
      const dy = wrapperCenterY - currentY;
      console.log('REVERSE TRANSFORM for TENS, item is', item, 'transform is', `translate(${dx}px, ${dy}px)`);
      return `translate(${dx}px, ${dy}px)`;
    }

    // ONES items logic
    const imageItems = this.imageOnesSignal();
    const itemIndex = imageItems.findIndex(imageItem => imageItem.id === item.id);

    if (itemIndex === -1) return null;

    const lower = this.imageLowerHalfRef?.nativeElement;
    if (!lower) return null;

    const lowerRect = lower.getBoundingClientRect();
    const wrapperOffsetX = 8;
    const wrapperOffsetY = 8;
    const itemSpacing = 8;
    const itemW = 55;
    const itemH = 55;

    const availableWidth = lowerRect.width - wrapperOffsetX * 2;
    const itemsPerRow = Math.floor(availableWidth / (itemW + itemSpacing));
    const row = Math.floor(itemIndex / itemsPerRow);
    const col = itemIndex % itemsPerRow;

    const colOffset = col * (itemW + itemSpacing);
    const rowOffset = row * (itemH + itemSpacing);
    const currentX = lowerRect.left + wrapperOffsetX + colOffset + (itemW / 2);
    const currentY = lowerRect.top + wrapperOffsetY + rowOffset + (itemH / 2);

    const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
    const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;

    const dx = wrapperCenterX - currentX;
    const dy = wrapperCenterY - currentY;

    console.log('REVERSE TRANSFORM for ONES, item is', item, 'transform is', `translate(${dx}px, ${dy}px)`, 'currecntly animating?', this.isAnimating(item.id));
    return `translate(${dx}px, ${dy}px)`;
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
  private createDefaultParameters(): InteractionCountParams {
    return {
      variableId: 'COUNT',
      text: '',
      imagePosition: 'TOP',
      options: []
    };
  }
}

type CountItem = { icon: IconButtonTypeEnum; id: number };
