/**
 * Preload dynamic route chunks on user hover or navigation intent.
 * Triggers Vite's module loader ahead of time to make client-side route transitions instantaneous.
 */
export const preloadChunk = (target) => {
  switch (target) {
    case 'stock-detail':
    case 'StockPage':
      return import('../components/StockPage');
    case 'ai-analysis':
    case 'AICommandCenter':
      return import('../components/AICommandCenter');
    case 'paper-trading':
    case 'PaperTrading':
      return import('../components/PaperTrading');
    case 'algo-academy':
    case 'AlgoAcademy':
      return import('../components/AlgoAcademy');
    default:
      return Promise.resolve();
  }
};

export default preloadChunk;
