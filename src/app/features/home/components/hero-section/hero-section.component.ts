import { Component, ViewChild, ElementRef, AfterViewInit, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('backgroundVideo') videoElement!: ElementRef<HTMLVideoElement>;

  private destroy$ = new Subject<void>();
  showFallback = false;
  private videoPlayAttempted = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Add event listener for visibility change
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions and event listeners
    this.destroy$.next();
    this.destroy$.complete();

    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  ngAfterViewInit() {
    // Attempt to play video after view initialization
    this.setupVideoPlayback();
  }

  setupVideoPlayback() {
    if (!isPlatformBrowser(this.platformId)) return;

    const video = this.videoElement?.nativeElement;
    if (!video) {
      console.warn('Video element not found');
      this.showFallback = true;
      return;
    }

    // Ensure video is muted and plays inline
    video.muted = true;
    video.playsInline = true;

    // Attempt to play video with error handling
    this.tryPlayVideo(video);
  }

  private tryPlayVideo(video: HTMLVideoElement) {
    // Prevent multiple play attempts
    if (this.videoPlayAttempted) return;

    this.videoPlayAttempted = true;

    // Check if the page is visible
    if (document.visibilityState === 'visible') {
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playback started successfully');
            this.showFallback = false;
          })
          .catch(error => {
            console.warn('Autoplay was prevented:', error);
            this.showFallback = true;
            this.handlePlaybackError(video);
          });
      }
    }
  }

  private handlePlaybackError(video: HTMLVideoElement) {
    // Add a user interaction listener to try playing again
    const tryPlayOnInteraction = () => {
      video.play()
        .then(() => {
          this.showFallback = false;
          // Remove the event listener after successful play
          document.removeEventListener('click', tryPlayOnInteraction);
        })
        .catch(e => console.warn('Manual play failed:', e));
    };

    document.addEventListener('click', tryPlayOnInteraction);
  }

  private handleVisibilityChange = () => {
    // Retry video playback when page becomes visible
    if (document.visibilityState === 'visible') {
      const video = this.videoElement?.nativeElement;
      if (video) {
        this.videoPlayAttempted = false;
        this.tryPlayVideo(video);
      }
    }
  }

  onVideoCanPlay() {
    console.log('Video is ready to play');
    this.showFallback = false;
  }

  onVideoError(error?: any) {
    console.error('Error loading video:', error || 'Unknown error');
    this.showFallback = true;
  }

  manualPlayVideo() {
    if (isPlatformBrowser(this.platformId)) {
      const video = this.videoElement?.nativeElement;
      video?.play()
        .then(() => this.showFallback = false)
        .catch(e => console.warn('Manual play failed:', e));
    }
  }
}