import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { SignInComponent } from 'src/app/components/sign-in/sign-in.component';
import { Channel } from 'src/app/model/channel';
import { Genere } from 'src/app/model/genere';
import { HomeResponseBody } from 'src/app/model/home-response-body';
import { Slide } from 'src/app/model/slide';
import { AuthService } from 'src/app/services/auth.service';

import { HomeService } from 'src/app/services/home.service';
import { SharedService } from 'src/app/services/shared.service';
import { SubscriptionResolverService } from 'src/app/services/subscription-resolver.service';
import { VideoTypes } from 'src/app/video-types';

@Component({
  selector: 'app-livetv',
  templateUrl: './livetv.component.html',
  styleUrls: ['./livetv.component.scss'],
})
export class LivetvComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoPlayer: ElementRef<HTMLVideoElement> | undefined;
  loading: boolean = true;
  slides: Slide[] = [];
  channels: Channel[] = [];
  genres: Genere[] = [];
  order: string = 'id';
  channelsGroupByCategory: any = [];
  defaultLiveTVChannel: Channel = {};
  defalutMedia: string = '';
  selectedCategory: string = 'All Category';
  listneractivated: boolean = false;
  
  @ViewChild('myModal') modalElement!: ElementRef;
  constructor(
    private _homeService: HomeService,
    private _authService: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private sharedService: SharedService,
    private subscriptionResolverService: SubscriptionResolverService
  ) {}


  closeModelAutomatically() {
    const modal: any = this.modalElement.nativeElement;
    modal.click();
  }

  ngOnInit(): void {
    this.loading = true;
    this.listneractivated = false;
    this.loadLiveTVPageData();
  }
  ngAfterViewInit(): void {
    console.log(this.modalElement);
    
  }
  ngOnDestroy() {
    this.listneractivated = false;
  }
  listenToFullScreenEvent(): void {
    if (this.listneractivated) {
      return;
    }

    this.listneractivated = true;
    setTimeout(() => {
      if (this.videoPlayer) {
        const video = this.videoPlayer?.nativeElement;
        document.addEventListener('fullscreenchange', () => {
          console.log(document.fullscreenElement);
          if (document.fullscreenElement === video) {
            video.muted = false;
          } else {
            console.log('Full screen exited');
            if (video) {
              video.muted = true;
            }
          }
        });
      }
    }, 500);
  }
  enableFullScreen() {
    if (this.defaultLiveTVChannel) {
      this.sharedService.setPlayChannel(this.defaultLiveTVChannel);
      this.subscriptionResolverService.play();
    }
  }
  toggleFullScreen() {
    this._authService.check().subscribe((_authenticated) => {
      if (!_authenticated) {
        console.log(' Not logged in');
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.data = { custom: true };
        const signInDialog = this.dialog.open(SignInComponent, dialogConfig);
        signInDialog.afterClosed().subscribe((res) => {
          // this.enableFullScreen();
        });
      } else {
        this.enableFullScreen();
      }
    });
  }
  onCardClick(channel: Channel): void {
    console.log(channel);
    this.defaultLiveTVChannel = channel;
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      this.defalutMedia =
        this.defaultLiveTVChannel.sources &&
        this.defaultLiveTVChannel.sources?.length > 0
          ? this.defaultLiveTVChannel.sources[0].url!
          : '';
      video.load();
      video.muted = true;
      video.play();
    }
  }
  onCategoryClick(category: any): void {
    this.selectedCategory = category.category;
    window.scrollTo(0, 0);
    this.closeModelAutomatically();
  }
  filterLiveTvChannels(channels: Channel[]): Channel[] {
    
    let filteredChannels: Channel[] = [];

    filteredChannels = channels.filter((channel) => {
      //console.log(channel);
      const sources = channel.sources?.filter(
        (source) => source.type === 'm3u8'
      );
      const categories = channel.categories?.filter(
        (category) => category.title === 'Sports'
      );
      return (categories && categories?.length === 0) && (sources && sources?.length >0);
    });

    return filteredChannels;
  }
  groupChannelsByCategory(channels: Channel[]): void {
    let newChannels:Channel[] = [];
    channels.forEach((channel) => {
      if (channel.categories) { // Check if categories exist for the current channel
      channel.categories?.filter((category) => category.title != 'Sports').forEach((category) => {
        const newChannel: Channel = { ...channel }; // Create a new channel object
        newChannel.category = category.title; // Assign the current category
        newChannels.push(newChannel);
      });
    }
    });
    const groupByKey = 'category';   // category field is the key to group
    const categoryGroup = newChannels   //  from newChannels array group by category
      // .filter((channel) => channel.categories?.length == 1)
      .reduce((map: any, e: Channel) => {
        const key = JSON.stringify({ [groupByKey]: e[groupByKey] });
        if (!map[key]) {
          map[key] = { [groupByKey]: e[groupByKey], data: [] };
        }
        map[key].data.push(e);
        return map;
      }, {});
      console.log(categoryGroup);
    this.channelsGroupByCategory = [];
    const allCategory = { category: 'All Category', data: [] };
    Object.values(categoryGroup).forEach((c: any) => {
      allCategory.data = allCategory.data.concat(c?.data);
    });
    this.channelsGroupByCategory.push(allCategory);
    this.channelsGroupByCategory = this.channelsGroupByCategory.concat(
      Object.values(categoryGroup)
    );
    this.defaultLiveTVChannel = this.channelsGroupByCategory[0].data[0];
    this.defalutMedia =
      this.defaultLiveTVChannel.sources &&
      this.defaultLiveTVChannel.sources?.length > 0
        ? this.defaultLiveTVChannel.sources[0].url!
        : '';

    this.onCardClick(this.defaultLiveTVChannel);   
  }

  loadLiveTVPageData(): void {
    this.slides = [];
    this.loading = true;
    this._homeService.getCacheHomePageData().subscribe({
      next: (resp: HomeResponseBody) => {
        this.channels = this.filterLiveTvChannels(resp.channels!);
        this.groupChannelsByCategory(this.channels);
        this.slides = resp.slides!;
        this.genres = resp.genres!;
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {
        this.loading = false;
        this.listenToFullScreenEvent();
      },
    });
  }
}
