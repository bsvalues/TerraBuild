import { jsPDF } from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    text(
      text: string | string[] | undefined,
      x: number,
      y: number,
      options?: {
        align?: 'left' | 'center' | 'right' | 'justify';
        baseline?: 'alphabetic' | 'top' | 'hanging' | 'middle' | 'ideographic' | 'bottom';
        angle?: number;
        renderingMode?: 'fill' | 'stroke' | 'fillThenStroke' | 'invisible' | 'fillAndAddForClipping' | 'strokeAndAddPathForClipping' | 'fillThenStrokeAndAddToPathForClipping' | 'addToPathForClipping';
        maxWidth?: number;
      }
    ): jsPDF;
  }
}