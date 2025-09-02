export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loadUnit(value: string): Chainable<JQuery<HTMLElement>>;
      openPlayer(): Chainable<JQuery<HTMLElement>>;
      saveUnit(filepath?: string): Chainable<JQuery<HTMLElement>>;
      switchToTabbedViewMode(): Chainable<JQuery<HTMLElement>>;
      getByAlias(alias: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}
