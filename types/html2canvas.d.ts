declare module 'html2canvas' {
  interface Html2CanvasOptions { scale?: number; useCORS?: boolean; [key: string]: any }
  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>
  export = html2canvas
}
