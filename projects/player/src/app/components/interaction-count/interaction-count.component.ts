import {
  Component,
  effect,
  signal,
  computed
} from '@angular/core';
import {
  DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList, CdkDrag
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
export class InteractionCountComponent extends InteractionComponentDirective {
  localParameters!: InteractionCountParams;

  // expose options as a signal for template
  readonly optionsSignal = signal<SelectionOption[]>([]);

  // Drag & drop data sources
  private idCounter = 0;
  readonly tensSourceSignal = signal<CountItem[]>([]);
  readonly onesSourceSignal = signal<CountItem[]>([]);
  // Image panel split into two halves: upper for TENS, lower for ONES
  readonly imageTensSignal = signal<CountItem[]>([]);
  readonly imageOnesSignal = signal<CountItem[]>([]);

  /** Suppress click right after a drag starts to avoid accidental toggles */
  private suppressClick = false;
  /** Tracks whether the current drag sequence ended with a valid CDK drop */
  private dropOccurred = false;

  // Enter predicates to ensure items return only to their initial wrapper
  // eslint-disable-next-line class-methods-use-this
  readonly tensEnterPredicate = (drag: CdkDrag<CountItem>, _drop: CdkDropList<CountItem[]>): boolean => {
    const data = drag?.data as CountItem | undefined;
    return !!data && data.icon === 'TENS';
  };

  // eslint-disable-next-line class-methods-use-this
  readonly onesEnterPredicate = (drag: CdkDrag<CountItem>, _drop: CdkDropList<CountItem[]>): boolean => {
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
        const tens = hasTens ? Array.from({ length: 50 }, () => this.makeItem('TENS')) : [];
        const ones = hasOnes ? Array.from({ length: 50 }, () => this.makeItem('ONES')) : [];
        this.tensSourceSignal.set(tens);
        this.onesSourceSignal.set(ones);
        this.imageTensSignal.set([]);
        this.imageOnesSignal.set([]);

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

  /** Image-panel counts for TENS and ONES (derived) */
  readonly imageTensCount = computed(() => this.imageTensSignal().length);
  readonly imageOnesCount = computed(() => this.imageOnesSignal().length);

  // Caps for maximum allowed items in the image panel
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
   * Always clone a new item into image panel (wrappers are infinite sources)
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
        const item = event.item.data as CountItem;
        this.addFromWrapperToImage(item);
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

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionCountParams {
    return {
      variableId: 'COUNT',
      text: '',
      imagePosition: 'TOP',
      options: []
    };
  }

  /** Mark that a drag has started to suppress immediate click */
  // eslint-disable-next-line class-methods-use-this
  onDragStarted(): void {
    this.suppressClick = true;
    this.dropOccurred = false;
  }

  /** Clear click suppression shortly after drag end */
  // eslint-disable-next-line class-methods-use-this
  onDragEnded(_event: any, item?: CountItem, context?: 'tens' | 'ones' | 'imageTens' | 'imageOnes'): void {
    // Use a timeout so the click from the drag end does not fire
    setTimeout(() => { this.suppressClick = false; }, 0);

    if (this.dropOccurred) return;

    if (!item || !context) return;

    // If dragged from wrappers and released => add to image panel half
    // If dragged from image panel and released => move back to its wrapper
    if (context === 'tens') {
      if (item.icon === 'TENS') this.addFromWrapperToImage(item);
      return;
    }
    if (context === 'ones') {
      if (item.icon === 'ONES') this.addFromWrapperToImage(item);
      return;
    }
    if (context === 'imageTens') {
      if (item.icon === 'TENS') this.moveItemBetween(this.imageTensSignal, this.tensSourceSignal, item);
      return;
    }
    if (context === 'imageOnes') {
      if (item.icon === 'ONES') this.moveItemBetween(this.imageOnesSignal, this.onesSourceSignal, item);
    }
  }

  /** Click handler to toggle item between its wrapper and image panel */
  onItemClick(item: CountItem, context: 'tens' | 'ones' | 'imageTens' | 'imageOnes'): void {
    if (this.suppressClick) return;

    if (item.icon === 'TENS') {
      if (context === 'tens') {
        // add from tensSource => imageTens (respect min-one-in-wrapper & repeat)
        this.addFromWrapperToImage(item);
      } else if (context === 'imageTens') {
        // move back from imageTens => tensSource
        this.moveItemBetween(this.imageTensSignal, this.tensSourceSignal, item);
      }
      return;
    }

    if (item.icon === 'ONES') {
      if (context === 'ones') {
        // add from onesSource => imageOnes (respect min-one-in-wrapper & repeat)
        this.addFromWrapperToImage(item);
      } else if (context === 'imageOnes') {
        // move back from imageOnes => onesSource
        this.moveItemBetween(this.imageOnesSignal, this.onesSourceSignal, item);
      }
    }
  }

  /** Utility to move a specific item between two signal arrays */
  // eslint-disable-next-line class-methods-use-this
  private moveItemBetween(fromSig: { (): CountItem[]; set: (v: CountItem[]) => void },
                          toSig: { (): CountItem[]; set: (v: CountItem[]) => void },
                          item: CountItem): void {
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
}

type CountItem = { icon: IconButtonTypeEnum; id: number };
