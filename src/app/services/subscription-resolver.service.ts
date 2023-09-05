import { ElementRef, Injectable, OnDestroy, ViewChild } from '@angular/core';

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { Observable, Subscription, map, observable, of } from 'rxjs';
import { VideoPlayerComponent } from '../components/videoplayer/video-player.component';
import { SharedService } from './shared.service';
import { VideoTypes } from '../video-types';
import { MovieService } from './movie.service';
import { SubtitleInfo } from '../model/subtitle-info';

@Injectable()
export class SubscriptionResolverService{
  
  constructor(
    
    private sharedService: SharedService,
    private _movieService: MovieService,
    private dialog: MatDialog
  ) {}
  
  playVideo(videoUrl: string, type: string): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.width = '100%';
    dialogConfig.height = '100%';
    dialogConfig.maxHeight = '100vh';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.panelClass = 'full-screen-modal';
    dialogConfig.data = { videoUrl: videoUrl, type: type };
    this.dialog.open(VideoPlayerComponent, dialogConfig);
  }

  private loadSubtitle () : Observable<SubtitleInfo[]> {
    let playContentInfo: any = null;
    playContentInfo = this.sharedService.getPlayContent();
    if (playContentInfo == null) {
      return Observable.create([]);
    }


    if (playContentInfo.type == VideoTypes.Movie) {
        return this._movieService.getSubtitlesData(playContentInfo.data.id, VideoTypes.Movie);
    }
    if (playContentInfo.type == VideoTypes.Series) {
        return this._movieService.getSubtitlesData(playContentInfo.data.episode.id, VideoTypes.Episode);
    }
    if (playContentInfo.type == VideoTypes.Channel) {
        this.playContent();
    }
    return Observable.create([]);
  }

  getSubtitles(callback: () => void): void {
    

    let subtitleInfo: any = null;

    this.loadSubtitle().subscribe({
        next: (response: SubtitleInfo[]) => {
          if (response.length > 0) {
            subtitleInfo = response.map(
              (details: SubtitleInfo, index: number) => {
                const subtitle = {
                  src: details.subtitles?.[0]?.url || '',
                  srclang: details.language
                    ? details.language.substring(0, 2).toUpperCase()
                    : '',
                  label: details.language,
                  default: false,
                };

                return subtitle;
              }
            );
            // console.log(subtitleInfo);
            this.sharedService.setPlaySubtitle(subtitleInfo);
          } else {
            console.log('null response');
          }
        },
        error: (err: any) => {
          console.log(err);
        },
        complete: () => {
          // console.log('completed');
          callback();
        },
      });
  }

  private playContent() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.width = '100%';
    dialogConfig.height = '100%';
    dialogConfig.maxHeight = '100vh';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.panelClass = 'full-screen-modal';
    // dialogConfig.data = { type: VideoTypes.Movie };
    this.dialog.open(VideoPlayerComponent, dialogConfig);
  }

  play(): void {
    let currentContext = this;
    this.getSubtitles(function(){
        currentContext.playContent();
    });
  }
}


