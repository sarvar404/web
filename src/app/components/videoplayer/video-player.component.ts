import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SubscriptionChangeEnum } from 'src/app/model/subscription-change-enum';
import { AuthService } from 'src/app/services/auth.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { DOCUMENT } from '@angular/common';
import { SharedService } from 'src/app/services/shared.service';
import { VideoTypes } from 'src/app/video-types';
import { ConfirmDurationComponent } from '../confirm-duration-dialog/confirm-dialog.component';
import { SubscriptionResolverService } from 'src/app/services/subscription-resolver.service';
import { URL } from 'url';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VideoPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('media') videoPlayer: ElementRef<HTMLVideoElement> | undefined;
  subscription: Subscription | undefined;
  video: any;
  videoUrl: string = '';
  videoType: string = '';
  toNextPlayEpisode: string = '';
  toCallFirstTimeForNextEpisode: boolean = false;
  pause: boolean = false;
  lastDuration: number = 0;
  dialogStatus: boolean = false;
  loaderAnimationDuration = '10s';
  imgUrlForNextEpisodeShow: string = '';
  playingNextEpisode: boolean = false;
  nextEpisodeTimeOut: any = null;
  static isDialogOpen: boolean = false;
  subtitles: { src: string; srclang: string; label: string; default: boolean }[] = [];

  isAudioAvailable: boolean = false;
  videos: { name: string; url: string }[] = [];
  showDropdown: boolean = false;
  byPassParameter: string = "?ngsw-bypass=true";


  constructor(
    @Inject(MAT_DIALOG_DATA)
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private authService: AuthService,
    private sharedService: SharedService,
    private subResolver: SubscriptionResolverService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<VideoPlayerComponent>,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document,
    private location: Location,
    private router: Router

  ) { }
  ngAfterViewInit(): void {
    // this.observeForFirebaseChanges();
    this.authService
      .onContentPlayed()
      .then((response) => {
        if (response) {
          this.observeForFirebaseChanges();
        } else {
        }
      })
      .catch((error) => {
        console.error('Error occurred while playing content:', error);
      });
  }
  ngOnInit(): void {

  }
  checkAudioAvailability(): void {

    let videoElement = document.createElement('video');
    if (videoElement && videoElement.canPlayType) {
      this.isAudioAvailable =
        videoElement.canPlayType('audio/mp4') === 'probably' ||
        videoElement.canPlayType('audio/mp4') === 'maybe';
    }
  }
  updateLoaderAnimationDuration(remainingTime: number) {
    // Calculate the new animation duration based on the remaining time
    const newDuration = Math.min(remainingTime, 10); // Limit the duration to 10 seconds
    this.loaderAnimationDuration = `${newDuration}s`;
  }

  // convertUrl(url: string): string {
  //   return url.replace(/^https?:\/\//, '/');
  // }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.authService.unsubscribeFirebaseEvents();
    VideoPlayerComponent.isDialogOpen = false;
  }

  observeForFirebaseChanges(): void {
    this.subscription = this.authService
      .observeSubscriptionChanges()
      .subscribe((event: SubscriptionChangeEnum) => {
        switch (event) {
          case SubscriptionChangeEnum.INVALID_USER:
            if (this.video) {
              this.video.pause();
              this.exitFullscreen();
            }
            this.showMessageDialog(
              'Your Subscription is no longer active. Please contact the admin to continue.'
            );
            break;
          case SubscriptionChangeEnum.Another_Device:
            if (this.video) {
              this.video.pause();
              this.exitFullscreen();
            }
            // showing user active in another device dialog
            this.showMessageDialog(
              'Someone else has logged in from another device using your credentials, Only one device is supported at one time.'
            );
            break;
          case SubscriptionChangeEnum.Expired:
            if (this.video) {
              this.video.pause();
              this.exitFullscreen();
            }
            this.showMessageDialog(
              'Your Subscription is no longer active. Please contact the admin to continue.'
            );
            // showing subscription expired dialog
            break;
          case SubscriptionChangeEnum.NOT_READY:
            // wait until the events are received
            break;
          case SubscriptionChangeEnum.Valid:
            if (this.videoPlayer) {
              const video = this.videoPlayer.nativeElement;

              if (video) {
                this.openVideoInFullscreen();
              }
            }
            break;
        }
      });
  }

  exitFullscreen() {
    if (this.document && this.document.exitFullscreen) {
      this.document.exitFullscreen();
    }
  }

  private showMessageDialog(
    message: string,
    subscriptionChange?: SubscriptionChangeEnum
  ): void {
    if (VideoPlayerComponent.isDialogOpen) {
      return;
    }
    const sanitizedMessage: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(message);

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.authService.unsubscribeFirebaseEvents();
    }
    VideoPlayerComponent.isDialogOpen = true;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'subscription-dialog-class',
      minWidth: '75vw',
      minHeight: '75vh',
      disableClose: true,
      data: {
        title: 'Notice',
        message: sanitizedMessage,
        showOkButton:
          subscriptionChange === SubscriptionChangeEnum.Another_Device,
      },

    });

    dialogRef.afterClosed().subscribe((dialogResult) => {
      VideoPlayerComponent.isDialogOpen = false;
      this.dialogRef.close();
    });
  }

  videoPlayerInit(data: any) {


    this.video = data;
    // this.video
    //   .getDefaultMedia()
    //   .subscriptions.loadedMetadata.subscribe(this.initVdo.bind(this));
    // Subscribe to player error events
    this.video.getDefaultMedia().subscriptions.canPlay.subscribe((player: any) => {

      this.openVideoInFullscreen();

      if (this.canPlayVideo(player.currentTarget.currentSrc)) {
        this.video.play();
      } else {
        this.video.pause();
        VideoPlayerComponent.isDialogOpen = false;
        this.showMessageDialog(
          "We're sorry, but we're unable to play the video you requested.<br/><br/> The video format is not supported by your browser."
        );
      }
      // You can handle the error here as needed
    });


    let playContentInfo: any = null;
    playContentInfo = this.sharedService.getPlayContent();
    if (playContentInfo == null) {
      return;
    }
    this.subtitles = playContentInfo.subtitle;

    if (playContentInfo.type == VideoTypes.Movie) {


      this.video.pause();
      let fetchMovieInfo: any = null;
      fetchMovieInfo = this.sharedService.getMovieProgress(
        playContentInfo.data
      );
      if (fetchMovieInfo && this.dialogStatus == false) {
        this.dialogIfVideoWatched(
          fetchMovieInfo,
          VideoTypes.Movie,
          playContentInfo.data.title
        );
      }





      if (playContentInfo.data.sources.length >= 2) {
        this.videos = playContentInfo.data.sources.map((source: any) => ({
          name: source.title,
          //url: this.convertUrl(source.url),
          url: source.url
        }));
        this.showDropdown = true;
      }
      const url = playContentInfo.data.sources[0].url;
      //const replacedUrl = this.convertUrl(url);
      this.videoUrl = url + this.byPassParameter;
      this.videoType = VideoTypes.Movie;
      this.cdr.detectChanges();
      this.video.subscriptions.timeUpdate.subscribe(() => {
        const currentTime = this.video.time.current;
        this.lastDuration = currentTime;

        if (fetchMovieInfo == null || fetchMovieInfo == 0) {

          this.video.play();

        }

        if (playContentInfo && this.lastDuration !== 0)
          this.sharedService.saveMovieProgress(
            playContentInfo.data,
            this.lastDuration
          );
      });
    } else if (playContentInfo.type == VideoTypes.Series) {
      this.video.pause();


      let fetchEpisodeInfo: any = null;
      fetchEpisodeInfo = this.sharedService.getEpisodeProgress(
        playContentInfo.data.episode
      );

      if (fetchEpisodeInfo && this.dialogStatus == false) {
        this.dialogIfVideoWatched(
          fetchEpisodeInfo,
          VideoTypes.Series,
          playContentInfo.data.episode.title
        );
      }


      if (playContentInfo.data.episode.sources.length >= 2) {


        this.videos = playContentInfo.data.episode.sources.map((source: any) => ({
          name: source.title,
          //url: this.convertUrl(source.url),
          url: source.url
        }));
        this.showDropdown = true;
      }

      const url = playContentInfo.data.episode.sources[0].url;
      //const replacedUrl = this.convertUrl(url);
      this.videoUrl = url + this.byPassParameter;
      this.videoType = VideoTypes.Movie;
      this.cdr.detectChanges();
      // this.video.currentTime = 1400; // 24 mint

      this.video.subscriptions.timeUpdate.subscribe(() => {
        const currentTime = this.video.time.current;
        this.lastDuration = currentTime;

        if (fetchEpisodeInfo == null || fetchEpisodeInfo == 0) {


          this.video.play();


        }

        if (playContentInfo && this.lastDuration !== 0)
          this.sharedService.saveEpisodeProgress(
            playContentInfo.data,
            this.lastDuration
          );

        this.videoPlayingStatus(this.lastDuration, this.video.duration);
      });
    } else if (playContentInfo.type == VideoTypes.Channel) {
      const url = playContentInfo.data.sources[0].url;
      this.videoUrl = url;
      this.videoType = VideoTypes.Channel;
      this.cdr.detectChanges();
    }
  }
  getFileExtensionFromUrl(url: string | undefined | null): string {
    if (!url) {
      return '';
    }

    const segments = url.split('/');
    const filenameWithQuery = segments.pop(); // Get the last segment (filename with query string)

    if (!filenameWithQuery) {
      return '';
    }

    const filename = filenameWithQuery.split('?')[0]; // Remove the query string if present
    const parts = filename.split('.');

    return parts.length > 1 ? parts?.pop()!.toLowerCase() : '';

  }

  canPlayVideo(url: string): boolean {
    //debugger;

    //removed the check to play video always

    if (true) {
      return true;
    }

    if (url?.startsWith('blob:')) {
      return true;
    }
    let videoElement = document.createElement('video');
    const extension = this.getFileExtensionFromUrl(url);
    let type = '';

    if (extension == 'mkv') {
      type = 'video/x-matroska';
    } else if (extension == 'mp4') {
      type = 'video/mp4';
    } else if (extension == 'avi') {
      type = 'video/x-msvideo';
    } else if (extension == 'mov') {
      type = 'video/quicktime';
    } else if (extension == 'wmv') {
      type = 'video/x-ms-wmv';
    } else if (extension == 'webm') {
      type = 'video/webm';
    } else if (extension == 'ogg') {
      type = 'video/ogg';
    }


    let canPlay = videoElement.canPlayType(type);

    console.log("Is Video format supported " + canPlay);
    if (canPlay === '') {
      return false; // Browser cannot play this media type
    } else {
      return true; // Browser can potentially play this media type
    }
  }


  changeVideoUrl(url: string) {

    this.videoUrl = url + this.byPassParameter;
    // Update the video source based on the selected URL
    if (this.videoType === VideoTypes.Movie) {
      // For movie player
      this.cdr.detectChanges();
      const videoElement = this.videoPlayer?.nativeElement;
      if (videoElement) {
        videoElement.load();

        const lastDurationIs = this.lastDuration / 1000;
        const lastDurationInMinutes = Math.floor(lastDurationIs / 60);
        this.video.currentTime = lastDurationIs; // Set the desired starting duration in seconds (5 minutes = 300 seconds)

      }
    }
  }




  playNextEpisode() {
    if (this.nextEpisodeTimeOut) {
      clearTimeout(this.nextEpisodeTimeOut);
    }
    this.nextEpisodeTimeOut = null;
    let nextEpisode = this.getNextEpisode();
    if (nextEpisode == null) return;

    let playContentInfo: any = null;
    playContentInfo = this.sharedService.getPlayContent();

    if (playContentInfo == null || playContentInfo.type !== VideoTypes.Series)
      return;
    this.sharedService.setPlayEpisode(
      playContentInfo.data.series,
      playContentInfo.data.seasons,
      nextEpisode
    );

    let savingEpisodeObj = {
      series: playContentInfo.data.series,
      seasons: playContentInfo.data.seasons,
      episode: nextEpisode,
    };

    this.sharedService.saveEpisodeProgress(savingEpisodeObj, 0);


    let currentContext = this;
    this.subResolver.getSubtitles(function () {
      currentContext.videoPlayerInit(currentContext.video);

      const player = document.getElementById('singleVideo') as HTMLVideoElement;
      player.currentTime = 0;
      player.load();
    });


  }

  videoPlayingStatus(processDuration: number, lengthDuration: number): void {
    // console.log(processDuration, "getting duration + fixed duration",lengthDuration)
    let getAmoutOfNumberToPlay = (lengthDuration * 98) / 100;

    const lastDurationIs = processDuration / 1000;

    // console.log(getAmoutOfNumberToPlay , "divided number + total ",lengthDuration);
    // console.log(lastDurationIs , "lastDurationIs ");

    if (lastDurationIs >= getAmoutOfNumberToPlay) {
      let nextEpisode: any = null;
      nextEpisode = this.getNextEpisode();

      if (nextEpisode !== null && this.playingNextEpisode == false) {
        this.playingNextEpisode = true;
        this.imgUrlForNextEpisodeShow = nextEpisode.image;

        this.toNextPlayEpisode = VideoTypes.Series;

        this.nextEpisodeTimeOut = setTimeout(() => {
          this.playNextEpisode();
        }, 10000); // 9000 milliseconds + 10000 milliseconds = 19000 milliseconds
      }
    } else {
      this.toNextPlayEpisode = '';
      this.playingNextEpisode = false;
      if (this.nextEpisodeTimeOut) {
        clearTimeout(this.nextEpisodeTimeOut);
      }
      this.nextEpisodeTimeOut = null;
    }
  }

  shouldShowPlayNextButton(): void { }

  getNextEpisode(): any {
    let playContentInfo: any = null;
    playContentInfo = this.sharedService.getPlayContent();
    if (playContentInfo == null || playContentInfo.type !== VideoTypes.Series)
      return;

    let currentEpisode = playContentInfo.data.episode;
    if (!currentEpisode) return; // Check if currentEpisode is undefined or null
    var episodeFound = false;
    var nextEpisode: any = null;
    playContentInfo.data.seasons.forEach((season: any) => {
      season.episodes.forEach((episode: any) => {
        if (episode.id == currentEpisode.id) {
          episodeFound = true;
        } else if (episodeFound && nextEpisode == null) {
          nextEpisode = episode;
        }
      });
    });
    return nextEpisode;
  }

  saveProgress() {
    let playContentInfo = this.sharedService.getPlayContent();
    if (playContentInfo == null) {
      return;
    }
    if (playContentInfo.type == VideoTypes.Movie) {
    } else if (playContentInfo.type == VideoTypes.Series) {
    }
  }

  dialogIfVideoWatched(
    fetchDurationInfo: number,
    types: string,
    title: string
  ) {
    const lastDurationIs = fetchDurationInfo / 1000;
    const lastDurationInMinutes = Math.floor(lastDurationIs / 60);
    if (lastDurationInMinutes < 1) return;
    const dialogRef = this.dialog.open(ConfirmDurationComponent, {
      panelClass: 'subscription-dialog-class',
      minWidth: '75vw',
      minHeight: '25vh',
      disableClose: true,
      data: {
        title: `${title}`,
        message: `Please Select`,
        duration: lastDurationInMinutes + ' minutes',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result == true) {
        this.video.currentTime = lastDurationIs;
        this.video.play();
      } else {
        this.video.play();
      }
    });

    this.dialogStatus = true;

    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      if (video) {
        this.openVideoInFullscreen();
      }
    }
  }

  openVideoInFullscreen() {
    const videoElement = this.elementRef.nativeElement.querySelector(
      '.vg-icon-fullscreen'
    );
    if (this.videoPlayer) {
      if (videoElement && this.renderer) {
        this.renderer.listen(videoElement, 'click', () => {
          this.initVdo();
        });

        videoElement.click();
      }
    }
  }
  initVdo() {
    if (this.video) {
      if (this.video.requestFullscreen) {
        this.video.requestFullscreen();
      } else if (this.video.msRequestFullscreen) {
        this.video.msRequestFullscreen();
      } else if (this.video.mozRequestFullScreen) {
        this.video.mozRequestFullScreen();
      } else if (this.video.webkitRequestFullScreen) {
        this.video.webkitRequestFullScreen();
      }
    }
  }
  // 5july2023:10:30


  handleIconClick() {
    // Close the video player 
    const videoPlayer = document.querySelector('.video-player-wrapper') as HTMLElement;
    if (videoPlayer) {
      videoPlayer.style.display = 'none';
    }
    if (this.video) {
      this.video.pause();
    }
    this.dialogRef.close();
    // Go back to the last page (details page)
    //this.location.replaceState('/details', '', { preservedState: true });
    // window.location.reload();
    //this.location.back();


  }

}










