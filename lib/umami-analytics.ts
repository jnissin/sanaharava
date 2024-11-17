type EventData = {
    [key: string]: string | number | boolean | object;
  };
  
  export async function trackEvent(eventName: string, eventData: EventData, url: string) {
    try {
      const response = await fetch('https://cloud.umami.is/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        body: JSON.stringify({
          type: 'event',
          payload: {
            hostname: process.env.SITE_URL,
            language: 'fi-FI',
            referrer: '',
            screen: '1920x1080',
            title: 'Sanakaivos',
            url: url,
            website: process.env.UMAMI_WEBSITE_ID,
            name: eventName,
            data: eventData
          }
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Umami tracking failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      } else {
        console.log('Umami event tracked successfully:', eventName);
      }
  
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }