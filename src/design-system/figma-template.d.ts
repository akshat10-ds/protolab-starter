/** Authoring helper types for colocated Code Connect templates.
 * Mirrors the connected Figma template API; templates are never UI runtime imports.
 */
declare module 'figma' {
  interface SelectorOptions { traverseInstances?: boolean; path?: string[]; }
  type ResultSection =
    | { type: 'CODE'; code: string }
    | { type: 'INSTANCE'; guid: string; symbolId: string }
    | { type: 'ERROR'; message: string }
    | { type: 'SLOT'; name: string };
  interface ErrorHandle { type: 'ERROR'; name: string; }
  interface TextHandle { type: 'TEXT'; name: string; textContent: string; }
  interface TemplateMetadata { nestable?: boolean; props?: Record<string, unknown>; }
  interface InstanceHandle {
    type: 'INSTANCE';
    name: string;
    getString(name: string): string;
    getBoolean(name: string): boolean;
    getBoolean<T extends Record<string, unknown>>(name: string, values: T): T[keyof T];
    getEnum<T extends Record<string, unknown>>(name: string, values: T): T[keyof T];
    getInstanceSwap(name: string): InstanceHandle | null;
    getSlot(name: string): ResultSection[] | undefined;
    getPropertyValue(name: string): string | boolean | undefined;
    hasCodeConnect(): boolean;
    codeConnectId(): string | null;
    findText(name: string, options?: SelectorOptions): TextHandle | ErrorHandle;
    findInstance(name: string, options?: SelectorOptions): InstanceHandle | ErrorHandle;
    findConnectedInstance(id: string, options?: SelectorOptions): InstanceHandle | ErrorHandle;
    findConnectedInstances(predicate: (node: InstanceHandle) => boolean, options?: SelectorOptions): InstanceHandle[];
    findLayers(predicate: (node: InstanceHandle | TextHandle) => boolean, options?: SelectorOptions): (InstanceHandle | TextHandle)[];
    executeTemplate(): { example: ResultSection[]; metadata: TemplateMetadata };
  }
  type CodeTag = (strings: TemplateStringsArray, ...values: unknown[]) => ResultSection[];
  const figma: { selectedInstance: InstanceHandle; code: CodeTag; tsx: CodeTag; jsx: CodeTag; html: CodeTag; swift: CodeTag; kotlin: CodeTag; };
  export default figma;
}
