import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { HomeService } from '../../services/home.service';
import { HomeResponseBody } from '../../model/home-response-body';
import { Slide } from '../../model/slide';
import { Channel } from '../../model/channel';
import { Genere } from '../../model/genere';
import * as Hammer from 'hammerjs';
import { Carousel } from 'primeng/carousel';
import { Poster } from 'src/app/model/poster';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { AuthService } from 'src/app/services/auth.service';
import { SignInComponent } from 'src/app/components/sign-in/sign-in.component';
import { FirebaseService } from 'src/app/services/firebase.service';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { TvShowsService } from 'src/app/services/tv-shows.service';
import { SubscriptionResolverService } from 'src/app/services/subscription-resolver.service';
import { fadeInOut } from 'src/app/animations/fade-in-out';

@Component({
  selector: 'app-new-home',
  templateUrl: './new-home.component.html',
  styleUrls: ['./new-home.component.scss'],
})
export class NewHomeComponent implements OnInit {
  slides: Slide[] = [];
  channels: Channel[] = [];
  genres: Genere[] = [];
  order: string = 'id';
  moviesByGenre: any = {};
  loading: boolean = true;
  bannerResponsiveOptions: any[] = [];
  posterResponsiveOptions: any[] = [];
  excludeGenre = [
    -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 25, 45, 70 , 71
  ];
  isMobile: boolean = false;

  reloadOnce: boolean = true;

  switchlang = 'en'

  

  constructor(
    private _homeService: HomeService,
    private sharedService: SharedService,
    private router: Router,
    private dialog: MatDialog,
    private _authService: AuthService,
    private _tvShowsService: TvShowsService,
    private renderer: Renderer2,
    private el: ElementRef,
    private subscriptionResolverService: SubscriptionResolverService
  ) {
    this.isMobile = window.innerWidth <= 768; 
    //this.hammerConfig.buildHammer
    //this.hammerConfig.set({swipeVelocityX: 0.3,swipeVelocityY: 0.3});
  }

  ngOnInit(): void {
    this.loadHomePageData();
    
    this.bannerResponsiveOptions = [
      {
        breakpoint: '1199px',
        numVisible: 1,
        numScroll: 1,
      },
      {
        breakpoint: '991px',
        numVisible: 1,
        numScroll: 1,
      },
      {
        breakpoint: '767px',
        numVisible: 1,
        numScroll: 1,
      },
      {
        transitionOptions: '1s ease-in-out',
        slideshowInterval: 2000,
        slideshowActive: true,
        slideshowAutoPlay: true,
      },
    ];

    this.posterResponsiveOptions = [
      {
        breakpoint: '767px',
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: '390px',
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: '1536px',
        numVisible: 7,
        numScroll: 8,
      },
      {
        breakpoint: '1920px',
        numVisible: 10,
        numScroll: 11,
      }
    ];
  }
  ngAfterViewInit(): void {
    // const link = this.renderer.createElement('link');
    // link.rel = 'stylesheet';
    // link.href = './modify.css';
    // this.renderer.appendChild(document.head, link);
    
  }
  openHlsVideoDialog(channel: any): void {
    console.log(channel);
    this._authService.check().subscribe((_authenticated) => {
      if (!_authenticated) {
        console.log(' Not logged in');
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.data = { custom: true };
        const signInDialog = this.dialog.open(SignInComponent, dialogConfig);
        signInDialog.afterClosed().subscribe((res) => {
          if (res) {
            // this.playHlsVideo(channel);

            if (channel) {
              this.sharedService.setPlayChannel(channel);
              this.subscriptionResolverService.play();
            }
          }
        });
      } else {
        this.sharedService.setPlayChannel(channel);
        this.subscriptionResolverService.play();
        // this.playHlsVideo(channel);
      }
    });
  }

  openVideoDialog(poster: any): void {
    this._authService.check().subscribe((_authenticated) => {
      if (!_authenticated) {
        console.log(' Not logged in');
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.data = { custom: true };
        const signInDialog = this.dialog.open(SignInComponent, dialogConfig);
        signInDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.playVideo(poster);
          }
        });
      } else {
        this.playVideo(poster);
      }
    });
  }
  playHlsVideo(channel: any): void {

    this.sharedService.setPlayChannel(channel);
    this.subscriptionResolverService.play();
  }
  playVideo(poster: any): void {
    if (poster.type == 'movie') {
      this.sharedService.setPlayMovie(poster);
      this.subscriptionResolverService.play();
    } else {
      this.getSeasonsBySerie(poster);
    }
  }

  getSeasonsBySerie(poster: any): void {
    this._tvShowsService.getSeasonsBySerie(poster.id).subscribe({
      next: (resp: any[]) => {
        this.playEpisode(poster, resp);
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {
        console.log('completed');
      },
    });
  }
  playEpisode(serie: any, season: any): void {
    

    if (season.length > 0) {

      this.sharedService.setPlayEpisode(serie, season, season[0].episodes[0]);

      this.subscriptionResolverService.play();
    }
  }
  getDetails(poster: Poster) {
    if (typeof poster !== 'undefined') {
      this.sharedService.setSharedObject(poster);
      this.router.navigate(['/details']);
    }
  }
  // show only channels with source has m3u8
  filterOnlyM3u8SourceTypeChannels(channels: Channel[]): Channel[] {
    let filteredChannels: Channel[] = [];

    filteredChannels = channels.filter((channel) => {
      const channels = channel.sources?.filter(
        (source) => source?.type === 'm3u8'
      );
      return channels && channels?.length > 0;
    });
    return filteredChannels;
  }
  // exclude generes from movies
  filterGenres(genres: Genere[]): Genere[] {
    let filteredGenres: Genere[] = [];
    filteredGenres = genres.filter(
      (genre) => (this.excludeGenre.indexOf(genre.id!) < 0  && genre?.posters!?.length>0) 
    );
    return filteredGenres;
  }
  loadHomePageData(): void {
    this.slides = [];
    this.loading = true;
    this._homeService.getHomePageData(true).subscribe({
      next: (resp: HomeResponseBody) => {
        //console.log(resp);
        this.channels = this.filterOnlyM3u8SourceTypeChannels(resp.channels!);
        this.slides = resp.slides!;
        // debugger;
        this.genres = this.filterGenres(resp.genres!);
        this.loadHomePageContinueWatchingData();
        //this.loadMoviesByGenre(this.genres);
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {
        this.loading = false;
        if(this.isMobile ){
          setTimeout(() => {
            this.applyOverflowStyles();  
          }, 5000);
              
        }
      },
    });
  }

   applyOverflowStyles(): void {
    const elements = this.el.nativeElement.querySelectorAll('div.genre div.p-carousel-items-content');
    
    for (const element of elements) {
      this.renderer.setStyle(element, 'overflowX', 'auto');
      this.renderer.setStyle(element, 'overflowY', 'hidden');
    }
  }
  loadHomePageContinueWatchingData(): void {
    let continueWatching = this.sharedService.getContinueList();

    if (continueWatching != null && continueWatching.length > 0) {
      const continueWatchingSection = {
        id: -1,
        title: 'Continue Watching',
        posters: continueWatching,
      };
      console.log(continueWatchingSection.posters.length, 'total records');
      this.genres.unshift(continueWatchingSection);
    }
  }

  loadMoviesByGenre(genres: Genere[]): void {
    for (let i = 0; i < genres.length; i++) {
      const genre = genres[i];
      this._homeService.getPostersByGenre(genre.id!).subscribe({
        next: (resp: any) => {
          console.log(resp);
        },
        error: (err: any) => {},
        complete: () => {},
      });
    }
  }
}
