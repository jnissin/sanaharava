import { trackEvent } from '@/lib/umami-analytics';


type AnalyticsEvent = {
    name: string;
    properties: Record<string, any>;
    url: string;
  };
  

class AnalyticsService {
    private eventQueue: AnalyticsEvent[] = [];
    private isProcessing = false;
  
    private async processQueue() {
      if (this.isProcessing || this.eventQueue.length === 0) return;
  
      this.isProcessing = true;
      
      try {
        while (this.eventQueue.length > 0) {
          const event = this.eventQueue.shift();
          if (!event) continue;
  
          await trackEvent(
            event.name,
            event.properties,
            event.url
          ).catch(error => {
            console.error('Failed to track event:', event.name, error);
          });
        }
      } finally {
        this.isProcessing = false;
      }
    }
  
    public track(name: string, properties: Record<string, any>, url: string) {
      this.eventQueue.push({ name, properties, url });
      
      // Start processing in the background
      Promise.resolve().then(() => this.processQueue());
    }
}
  
  // Create a singleton instance
  export const analytics = new AnalyticsService();