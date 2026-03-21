interface Window {
  DEMO_MODE?: boolean;
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}