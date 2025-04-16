declare module 'shepherd.js' {
  interface Step {
    options: StepOptions;
  }

  interface StepOptions {
    id?: string;
    text?: string;
    title?: string;
    attachTo?: {
      element: string | HTMLElement;
      on: string;
    };
    buttons?: {
      text: string;
      action: () => void;
    }[];
    classes?: string;
    scrollTo?: boolean;
    cancelIcon?: {
      enabled: boolean;
    };
  }

  interface TourOptions {
    useModalOverlay?: boolean;
    defaultStepOptions?: Partial<StepOptions>;
  }

  export default class Tour {
    constructor(options: TourOptions);
    addStep(options: StepOptions): Step;
    start(): void;
    next(): void;
    back(): void;
    complete(): void;
  }
}
