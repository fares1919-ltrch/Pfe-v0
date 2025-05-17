import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    botpressWebChat: {
      init: (config: any) => void;
    };
  }
}

@Component({
  selector: 'app-chatbot',
  template: ''
})
export class ChatbotComponent implements OnInit, OnDestroy {
  private script1: HTMLScriptElement | null = null;
  private script2: HTMLScriptElement | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Create first script (Botpress Web Chat library)
      this.script1 = document.createElement('script');
      this.script1.src = 'https://cdn.botpress.cloud/webchat/v2.5/inject.js';
      this.script1.async = true;
      document.head.appendChild(this.script1);

      // Create second script (Botpress configuration)
      this.script2 = document.createElement('script');
      this.script2.src = 'https://files.bpcontent.cloud/2025/05/07/19/20250507193227-AWCTCBPT.js';
      this.script2.async = true;
      document.head.appendChild(this.script2);

      // Initialize Botpress with custom configuration
      window.botpressWebChat.init({
        host: 'https://cdn.botpress.cloud/webchat/v2.5',
        clientId: '4d703667-03ae-4416-b042-571574f5fea3',
        configUrl: 'https://files.bpcontent.cloud/2025/05/07/19/20250507193227-YK0IH9X3.json',
        theme: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          backgroundColor: '#ffffff',
          textColor: '#212529'
        },
        locale: 'fr',
        showPoweredBy: true,
        enableTranscriptDownload: true,
        enableConversationDeletion: true,
        showConversationsButton: true,
        showResetButton: true,
        showCloseButton: true,
        showTimestamp: true,
        showUserAvatar: true,
        showBotAvatar: true,
        containerWidth: '400px',
        containerHeight: '600px',
        layoutWidth: '100%',
        layoutHeight: '100%',
        chatId: 'default',
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        customStyles: {
          chatContainer: {
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
          }
        }
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      // Clean up scripts to prevent memory leaks
      if (this.script1 && document.head.contains(this.script1)) {
        document.head.removeChild(this.script1);
      }
      if (this.script2 && document.head.contains(this.script2)) {
        document.head.removeChild(this.script2);
      }
    }
  }
}
