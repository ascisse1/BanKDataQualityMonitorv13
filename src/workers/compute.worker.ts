// Web Worker for CPU-intensive tasks
self.onmessage = async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'PROCESS_DATA':
      // Use 70% of available threads for processing
      const numThreads = Math.floor(navigator.hardwareConcurrency * 0.7);
      const chunkSize = Math.ceil(data.length / numThreads);
      
      // Process data in parallel
      const results = await Promise.all(
        new Array(numThreads).fill(null).map(async (_, i) => {
          const start = i * chunkSize;
          const end = start + chunkSize;
          const chunk = data.slice(start, end);
          
          // Intensive computation here
          return chunk.map((item: any) => ({
            ...item,
            processed: true
          }));
        })
      );

      self.postMessage({
        type: 'PROCESS_COMPLETE',
        data: results.flat()
      });
      break;

    default:
      break;
  }
};