import {
  Component, computed, effect, ElementRef, HostListener, signal, ViewChild
} from '@angular/core';
import { Response } from '@iqbspecs/response/response.interface';
import { InteractionComponentDirective } from '../../directives/interaction-component.directive';
import { IconButtonTypeEnum, InteractionPlaceValueParams } from '../../models/unit-definition';

@Component({
  selector: 'stars-interaction-place-value',
  templateUrl: './interaction-place-value.component.html',
  styleUrls: ['./interaction-place-value.component.scss']
})
export class InteractionPlaceValueComponent extends InteractionComponentDirective {
  localParameters!: InteractionPlaceValueParams;
  /** Boolean to track if the former state has been restored from response. */
  private hasRestoredFromFormerState = false;
  /** Global sequence counter stamped on items when first added to the upper panel. */
  private addedSeqCounter = 0;
  /** Used to sort items for layout so that visual order reflects the order items were first added (FIFO). */
  private readonly addedSequence = new Map<number, number>();

  /** Stable slot assignment so already placed items never move when new items are added. */
  private readonly tensSlotIndex = new Map<number, number>();
  private readonly onesSlotIndex = new Map<number, number>();
  private nextTensSlot = 0;
  private nextOnesSlot = 0;

  // Ones icon and Tens icon dimensions
  private readonly tensItemHeight = 50;
  private readonly onesItemHeight = 50;
  private readonly onesItemWidth = 50;
  private readonly padding = 8;
  private readonly panelPadding = 2 * this.padding;
  private readonly panelWidth = 680 + this.panelPadding;

  /** Upper-panel items */
  readonly tensCountAtTheTopPanel = signal<CountItem[]>([]);
  readonly onesCountAtTheTopPanel = signal<CountItem[]>([]);

  /** Image panel (up) and icon wrappers (down) element refs */
  @ViewChild('iconsUpperPanel', { static: false }) iconsUpperPanel?: ElementRef<HTMLElement>;
  @ViewChild('tensWrapper', { static: false }) tensWrapper?: ElementRef<HTMLElement>;
  @ViewChild('onesWrapper', { static: false }) onesWrapper?: ElementRef<HTMLElement>;

  /** Per-item transform map */
  readonly itemTransforms: Record<number, string> = {};

  /** Transient selection: ids currently in the middle of a user-triggered move/animation */
  private readonly selectionAnimatingIds: Set<number> = new Set<number>();

  /** Check if an item should display the selected (active) SVG */
  isSelected(id: number): boolean {
    return this.selectionAnimatingIds.has(id);
  }

  /** Whether an item (by id) currently belongs to the upper panel (either tens or ones list). */
  inUpperPanel(id: number): boolean {
    return this.tensCountAtTheTopPanel().some(i => i.id === id) ||
      this.onesCountAtTheTopPanel().some(i => i.id === id);
  }

  /** Tens wrapper shows exactly maxNumberOfTens + 1 items stacked on top of each other. */
  readonly tensArray = computed(() => {
    const tCount = (this.maxNumberOfTens ?? 0) + 1;
    // Tens ids start from 1 and go up to tCount
    return Array.from({ length: tCount }, (_, i) => ({
      id: i + 1,
      icon: 'TENS' as IconButtonTypeEnum
    }));
  });

  /** Ones wrapper shows exactly maxNumberOfOnes + 1 items stacked on top of each other. */
  readonly onesArray = computed(() => {
    const oCount = (this.maxNumberOfOnes ?? 0) + 1;
    const tCount = (this.maxNumberOfTens ?? 0) + 1;
    // Ones ids continue after tens to keep all ids unique, still starting overall from 1
    return Array.from({ length: oCount }, (_, i) => ({
      id: tCount + i + 1,
      icon: 'ONES' as IconButtonTypeEnum
    }));
  });

  /** Animation control for click/drag animations: reactive map of animating item ids */
  private readonly animatingFlags = signal<Record<number, true>>({});
  /** keep in sync with CSS transition */
  private static readonly CLICK_ANIMATION_MS = 500;
  /** Extra vertical gap between tens icons while stacked in the upper panel (in px) */
  private static readonly VERTICAL_GAP_PX = 12;

  /** Request a layout update. Marked as true if a layout update was requested but not yet executed. */
  private layoutUpdateRequested = false;
  /** Mark as true if a layout update was rescheduled due to a pending one. */
  private layoutUpdateReschedule = false;

  /** Check whether a specific item (by id) is currently marked as animating. */
  isAnimating(id: number): boolean {
    // Ensure a strict boolean is returned even if the index is undefined
    return this.animatingFlags()[id] ?? false;
  }

  // Recompute transforms on window resize so items adapt to new geometry
  @HostListener('window:resize')
  onWindowResize(): void {
    // Recalculate on resize in the next animation frame and animate smoothly
    this.scheduleLayoutUpdate();
  }

  /** Total number of rows in the upper panel */
  getUpperPanelHeight = computed(() => (
    (this.tensItemHeight * this.numberOfRows) +
    (InteractionPlaceValueComponent.VERTICAL_GAP_PX * Math.max(0, this.numberOfRows - 1)) +
    (2 * this.padding)
  ));

  numberOfRows: number = 5;
  /** Maximum number of tens and ones  */
  maxNumberOfTens: number = 3;
  maxNumberOfOnes: number = 20;

  constructor() {
    super();

    effect(() => {
      const parameters = this.parameters() as InteractionPlaceValueParams;
      this.localParameters = this.createDefaultParameters();
      this.hasRestoredFromFormerState = false;
      if (parameters) {
        this.localParameters.variableId = parameters.variableId || 'PLACE_VALUE';
        this.localParameters.value = parameters.value || 0;
        this.localParameters.numberOfRows = parameters.numberOfRows || 5;
        this.numberOfRows = this.localParameters.numberOfRows;
        this.localParameters.maxNumberOfTens = parameters.maxNumberOfTens || 3;
        this.maxNumberOfTens = this.localParameters.maxNumberOfTens;
        this.localParameters.maxNumberOfOnes = parameters.maxNumberOfOnes || 20;
        this.maxNumberOfOnes = this.localParameters.maxNumberOfOnes;

        // Restore from former state once, if available; otherwise emit DISPLAYED
        if (!this.hasRestoredFromFormerState) {
          const formerStateResponses: Response[] = (parameters as any).formerState || [];
          if (Array.isArray(formerStateResponses) && formerStateResponses.length > 0) {
            const found = formerStateResponses.find(r => r.id === this.localParameters.variableId);
            if (found && (found.value !== undefined && found.value !== null && `${found.value}` !== '')) {
              this.restoreFromFormerState(found);
              this.hasRestoredFromFormerState = true;
              return;
            }
          }
          // No former state
          this.responses.emit([{
            id: this.localParameters.variableId,
            status: 'DISPLAYED',
            value: '',
            relevantForResponsesProgress: false
          }]);
          this.hasRestoredFromFormerState = true;
        }
      }
    });

    // Emit VALUE_CHANGED whenever the image-panel counts change
    effect(() => {
      const tensCount = this.tensCountAtTheTopPanel().length;
      const onesCount = this.onesCountAtTheTopPanel().length;
      this.responses.emit([
        {
          id: this.localParameters?.variableId || 'PLACE_VALUE',
          status: 'VALUE_CHANGED',
          value: (tensCount * 10) + onesCount,
          relevantForResponsesProgress: true
        },
        {
          id: 'PLACE_VALUE_TENS',
          status: 'VALUE_CHANGED',
          value: tensCount,
          relevantForResponsesProgress: true
        }
      ]);
    });

    // Always recalculate transforms when the upper-panel membership changes
    // (additions or removals of tens/ones).
    effect(() => {
      // Read signals to establish dependencies for this effect.
      // eslint-disable-next-line no-void
      void this.tensCountAtTheTopPanel();
      // eslint-disable-next-line no-void
      void this.onesCountAtTheTopPanel();
      // Recompute positions for all without marking everything as animating
      this.scheduleLayoutUpdate();
    });
  }

  /** Check if tens wrapper should be disabled */
  readonly tensWrapperDisabled = computed(() => {
    const currentTens = this.tensCountAtTheTopPanel().length;
    const maxTensInPanel = this.maxNumberOfTens;
    // Disable tens wrapper if we've reached the upper panel capacity OR absolute maximum
    return currentTens >= Math.min(this.maxNumberOfTens, maxTensInPanel);
  });

  /** Check if ones wrapper should be disabled */
  readonly onesWrapperDisabled = computed(() => {
    const currentOnes = this.onesCountAtTheTopPanel().length;
    const maxOnesInPanel = this.maxNumberOfOnes;
    // Disable ones wrapper if we've reached the upper panel capacity OR absolute maximum
    return currentOnes >= Math.min(this.maxNumberOfOnes, maxOnesInPanel);
  });

  /** Onclick handler */
  onItemClick(source: 'ones' | 'tens', item?: CountItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // If no specific item provided, select the next available candidate from the wrapper stack
    const chosen: CountItem | undefined = item ?? this.pickNextCandidate(source);
    if (!chosen) return;

    const movedId = chosen.id;
    if (source === 'tens') {
      const alreadyInPanel = this.tensCountAtTheTopPanel().some(i => i.id === chosen.id);
      // Guard adds when disabled; allow removals regardless of disabled state
      if (!alreadyInPanel && this.tensWrapperDisabled()) return;
      if (!alreadyInPanel) {
        // remember insertion order for stable FIFO rendering
        if (!this.addedSequence.has(chosen.id)) {
          this.addedSeqCounter += 1;
          this.addedSequence.set(chosen.id, this.addedSeqCounter);
        }
        // Assign a stable vertical slot for tens
        if (!this.tensSlotIndex.has(chosen.id)) {
          this.tensSlotIndex.set(chosen.id, this.nextTensSlot);
          this.nextTensSlot += 1;
        }
        this.tensCountAtTheTopPanel.set([...this.tensCountAtTheTopPanel(), chosen]);
      } else {
        // Already in panel → remove (return to wrapper)
        const remaining = this.tensCountAtTheTopPanel().filter(i => i.id !== chosen.id);
        this.tensCountAtTheTopPanel.set(remaining);
        delete this.itemTransforms[chosen.id];
      }
    } else {
      const alreadyInPanel = this.onesCountAtTheTopPanel().some(i => i.id === chosen.id);
      if (!alreadyInPanel && this.onesWrapperDisabled()) return;
      if (!alreadyInPanel) {
        if (!this.addedSequence.has(chosen.id)) {
          this.addedSeqCounter += 1;
          this.addedSequence.set(chosen.id, this.addedSeqCounter);
        }
        if (!this.onesSlotIndex.has(chosen.id)) {
          this.onesSlotIndex.set(chosen.id, this.nextOnesSlot);
          this.nextOnesSlot += 1;
        }
        this.onesCountAtTheTopPanel.set([...this.onesCountAtTheTopPanel(), chosen]);
      } else {
        const remaining = this.onesCountAtTheTopPanel().filter(i => i.id !== chosen.id);
        this.onesCountAtTheTopPanel.set(remaining);
        delete this.itemTransforms[chosen.id];
      }
    }

    // Recompute layout transforms.
    this.scheduleLayoutUpdate([movedId]);
  }

  /**
   * Pick the next available stacked icon from a wrapper when the wrapper itself is clicked.
   * Respects disabled state and capacity and never returns an id that is already present in the upper panel.
   */
  private pickNextCandidate(source: 'ones' | 'tens'): CountItem | undefined {
    if (source === 'tens') {
      if (this.tensWrapperDisabled()) return undefined;
      const all = this.tensArray();
      const used = new Set(this.tensCountAtTheTopPanel().map(i => i.id));
      for (let i = all.length - 1; i >= 0; i -= 1) {
        const candidate = all[i];
        if (candidate && !used.has(candidate.id)) return candidate;
      }
      return undefined;
    }
    // ones
    if (this.onesWrapperDisabled()) return undefined;
    const all = this.onesArray();
    const used = new Set(this.onesCountAtTheTopPanel().map(i => i.id));
    for (let i = all.length - 1; i >= 0; i -= 1) {
      const candidate = all[i];
      if (candidate && !used.has(candidate.id)) return candidate;
    }
    return undefined;
  }

  /** Calculate and cache current transforms for all items in the upper panel */
  private recomputeUpperPanelTransforms(): void {
    const panelEl = this.iconsUpperPanel?.nativeElement;
    const tensWrapEl = this.tensWrapper?.nativeElement;
    const onesWrapEl = this.onesWrapper?.nativeElement;
    if (!panelEl || !tensWrapEl || !onesWrapEl) return;

    const padding = this.padding;
    const rowH = this.onesItemHeight;
    const colW = this.onesItemWidth;
    const panelPadding = this.panelPadding;

    // Measure viewport positions to compute deltas from wrappers to the upper panel
    const panelRect = panelEl.getBoundingClientRect();
    const tensRect = tensWrapEl.getBoundingClientRect();
    const onesRect = onesWrapEl.getBoundingClientRect();

    const deltaXTensToPanel = panelRect.left - tensRect.left;
    const deltaYTensToPanel = panelRect.top - tensRect.top;
    const deltaXOnesToPanel = panelRect.left - onesRect.left;
    const deltaYOnesToPanel = panelRect.top - onesRect.top;

    // Current items in the upper panel
    // eslint-disable-next-line max-len
    const tens = [...this.tensCountAtTheTopPanel()].sort((a, b) => (this.addedSequence.get(a.id) ?? 0) - (this.addedSequence.get(b.id) ?? 0)
    );

    // eslint-disable-next-line max-len
    const ones = [...this.onesCountAtTheTopPanel()].sort((a, b) => (this.addedSequence.get(a.id) ?? 0) - (this.addedSequence.get(b.id) ?? 0)
    );

    // Base translate for the first tens item so it lands at the upper panel's top-left (with padding)
    const baseXTens = deltaXTensToPanel + padding + (padding + padding / 2); // extra 12px padding for tens X
    const baseYTens = deltaYTensToPanel + padding;
    const tensGapY = InteractionPlaceValueComponent.VERTICAL_GAP_PX;
    tens.forEach((tensIcon, slot) => {
      const x = baseXTens;
      const y = baseYTens + (slot * (rowH + tensGapY));
      // Always (re)calculate transforms to reflect current layout
      this.itemTransforms[tensIcon.id] = `translate(${x}px, ${y}px)`;
    });

    // Ones: align horizontally next to each other — X increases by (icon width + 2*8px padding) per slot,
    const baseXOnes = deltaXOnesToPanel + padding + (padding + padding / 2); // extra 12px padding for tens X
    const baseYOnes = deltaYOnesToPanel + padding;
    const tensRows = tens.length; // ones should be visually under all tens items

    // Each next ones item should advance by icon width + 2*8px padding (16px total) horizontally
    const onesWidthWithPadding = colW + panelPadding; // 50 + 16 = 66px per column

    // Calculate how many ones can fit per row using the component's panelWidth
    // Usable width is the inner panel width minus our custom left base offset and right padding
    const panelInnerWidth = this.panelWidth - panelPadding;
    const baseLeftInset = padding + (padding + padding / 2);
    const usableWidth = Math.max(0, panelInnerWidth - baseLeftInset - padding);
    // Calculate how many ones icon can fit in a row
    const onesPerRow = Math.max(1, Math.floor((usableWidth - colW) / onesWidthWithPadding) + 1);

    ones.forEach((oneIcon, slot) => {
      const row = Math.floor(slot / onesPerRow);
      const col = slot % onesPerRow;
      const x = baseXOnes + (col * onesWidthWithPadding);
      // Ones start below all tens rows, including the extra vertical gap between tens rows,
      // and also use the same vertical gap between their own rows
      const y = baseYOnes + (tensRows * (rowH + tensGapY)) + (row * (rowH + tensGapY));
      // Always (re)calculate transforms; ones move down when tens grow or wrap when row fills
      this.itemTransforms[oneIcon.id] = `translate(${x}px, ${y}px)`;
    });
  }

  /** Restores the upper panel selection (tens and ones) from a former-state response. */
  private restoreFromFormerState(response: Response): void {
    // Parse numeric value from response
    const numeric = typeof response.value === 'string' ? parseInt(response.value, 10) : Number(response.value);
    const total = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;

    // Determine desired tens and ones within configured caps
    const desiredTens = Math.min(this.maxNumberOfTens, Math.floor(total / 10));
    const desiredOnes = Math.min(this.maxNumberOfOnes, total % 10);

    // Reset internal state
    this.addedSeqCounter = 0;
    this.addedSequence.clear();
    this.tensSlotIndex.clear();
    this.onesSlotIndex.clear();
    this.nextTensSlot = 0;
    this.nextOnesSlot = 0;
    // Clear transforms
    Object.keys(this.itemTransforms).forEach(k => { delete this.itemTransforms[Number(k)]; });

    // Build new tens and ones arrays using the highest available stacked ids (top of wrapper)
    const tensAll = this.tensArray();
    const onesAll = this.onesArray();

    const newTens: CountItem[] = [];
    for (let i = tensAll.length - 1; i >= 0 && newTens.length < desiredTens; i -= 1) {
      const it = tensAll[i];
      if (!it) continue;
      this.addedSeqCounter += 1;
      this.addedSequence.set(it.id, this.addedSeqCounter);
      this.tensSlotIndex.set(it.id, this.nextTensSlot);
      this.nextTensSlot += 1;
      newTens.push(it);
    }

    const newOnes: CountItem[] = [];
    for (let i = onesAll.length - 1; i >= 0 && newOnes.length < desiredOnes; i -= 1) {
      const it = onesAll[i];
      if (!it) continue;
      this.addedSeqCounter += 1;
      this.addedSequence.set(it.id, this.addedSeqCounter);
      this.onesSlotIndex.set(it.id, this.nextOnesSlot);
      this.nextOnesSlot += 1;
      newOnes.push(it);
    }

    // Apply restored arrays
    this.tensCountAtTheTopPanel.set(newTens);
    this.onesCountAtTheTopPanel.set(newOnes);

    // Recalculate layout without extra animation flags
    this.scheduleLayoutUpdate();
  }

  private scheduleLayoutUpdate(idsToAnimate?: number[]): void {
    // Coalesce multiple calls: if an update is already requested, mark as reschedule and exit.
    if (this.layoutUpdateRequested) {
      this.layoutUpdateReschedule = true;
      return;
    }
    this.layoutUpdateRequested = true;
    setTimeout(() => {
      // Mark only the explicitly moved ids as animating and selected
      const ids = Array.isArray(idsToAnimate) ? idsToAnimate : [];
      if (ids.length > 0) {
        ids.forEach(id => {
          this.selectionAnimatingIds.add(id);
          this.setAnimating(id, true);
        });
      }
      this.recomputeUpperPanelTransforms();
      this.layoutUpdateRequested = false;

      if (ids.length > 0) {
        setTimeout(() => {
          ids.forEach(id => {
            this.setAnimating(id, false);
            this.selectionAnimatingIds.delete(id);
          });
        }, InteractionPlaceValueComponent.CLICK_ANIMATION_MS);
      }

      // If another update was requested while the layout was being updated, schedule again
      if (this.layoutUpdateReschedule) {
        this.layoutUpdateReschedule = false;
        // Re-run without extra animating marks to smoothly reposition others
        this.scheduleLayoutUpdate();
      }
    }, 0);
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

  // eslint-disable-next-line class-methods-use-this
  private createDefaultParameters(): InteractionPlaceValueParams {
    return {
      variableId: 'PLACE_VALUE',
      value: 0,
      numberOfRows: 5,
      maxNumberOfTens: 3,
      maxNumberOfOnes: 20
    };
  }
}

type CountItem = { icon: IconButtonTypeEnum; id: number };
