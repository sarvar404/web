import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Actor } from 'src/app/model/actor';
import { Poster } from 'src/app/model/poster';
import { MovieService } from 'src/app/services/movie.service';
import { SharedService } from 'src/app/services/shared.service';
import { TvShowsService } from 'src/app/services/tv-shows.service';
import { Observable } from 'rxjs/internal/Observable';
import { SubscriptionResolverService } from 'src/app/services/subscription-resolver.service';
import { Location } from '@angular/common';
import { VideoTypes } from 'src/app/video-types';
import { AppContants } from 'src/app/utils/app-contants';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit, OnDestroy {
  item$: Observable<any> | undefined;
  loading: boolean = false;
  selectedPoster: Poster | undefined;
  relatedMoviePosters: Poster[] = [];
  actors: Actor[] = [];
  seasons: any[] = [];
  selectedSeason: any;
  _openSeasonsDropdown: boolean = false;
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  constructor(
    private sharedService: SharedService,
    private _movieService: MovieService,
    private _tvShoesService: TvShowsService,
    private router: Router,
    private subscriptionResolverService: SubscriptionResolverService,
    private location: Location
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
  }
  ngOnInit(): void {
    this.selectedPoster = this.sharedService.getSharedObject();
    if (typeof this.selectedPoster !== 'undefined' && this.selectedPoster) {
      if (this.selectedPoster.type == 'movie') {
        this.getCastByPoster(this.selectedPoster?.id!);
      } else {
        this.getSeasonsBySerie(this.selectedPoster?.id!);
      }
    } else {
      this.router.navigateByUrl('/');
    }
  }
  ngOnDestroy(): void { }

  goBack(): void {
    this.location.back();
  }

  getSeasonsBySerie(id: number): void {
    this.seasons = [];
    this._tvShoesService.getSeasonsBySerie(id).subscribe({
      next: (resp: any[]) => {
        this.seasons = resp;
        this.selectedSeason = resp[0];
      },
      error: (err: any) => { },
      complete: () => {
        window.scrollTo(0, 0);
      },
    });
  }
  playEpisode(episode: any): void {
    if (this.selectedPoster) {
      this.sharedService.setPlayEpisode(
        this.selectedPoster,
        this.seasons,
        episode
      );
      this.subscriptionResolverService.play();
    }
  }

  getWatchNowButtonText(): string {
    var buttonText = 'Watch Now';
    if (this.selectedPoster?.type == 'serie') {
      let lastEpisode = this.sharedService.getLastEpisodeForSeries(
        this.selectedPoster
      );

      if (lastEpisode !== null) {
        var seasonIndex = 1;
        this.seasons.forEach((season) => {
          var episodeIndex = 1;
          season.episodes.forEach((episode: any) => {
            if (episode.id == lastEpisode.id) {
              buttonText = 'Resume S' + seasonIndex + ':E' + episodeIndex;
            }
            episodeIndex++;
          });
          seasonIndex++;
        });
      }
    }
    return buttonText;
  }

  watchNowDialog(poster: Poster): void {
    if (
      poster.type == VideoTypes.Series &&
      this.seasons &&
      this.seasons.length > 0
    ) {
      let episode = this.seasons[0].episodes[0];

      let lastEpisode = this.sharedService.getLastEpisodeForSeries(poster);

      if (lastEpisode !== null) {
        episode = lastEpisode;
      }

      this.sharedService.setPlayEpisode(poster, this.seasons, episode);
    } else {
      this.sharedService.setPlayMovie(poster);
    }
    this.subscriptionResolverService.play();
  }
  
  getDetails(poster: Poster) {
    if (typeof poster !== 'undefined') {
      this.sharedService.setSharedObject(poster);
      this.router.onSameUrlNavigation = 'reload';
      this.router.navigate(['/details']);
    }
  }
  changeSeason(season: any): void {
    this.selectedSeason = season;
    this._openSeasonsDropdown = false;
  }
  openSeasonsDropdown(): void {
    this._openSeasonsDropdown = !this._openSeasonsDropdown;
  }
  getCastByPoster(posterId: number): void {
    this.actors = [];
    this._movieService.getCastByPoster(posterId).subscribe({
      next: (resp: Actor[]) => {
        this.actors = resp;
        if (this.actors && this.actors.length > 0) {
          this.getRelatedMoviesByActor(this.actors[0]?.id!);
        }
      },
      error: (err: any) => { },
      complete: () => {
        window.scrollTo(0, 0);
      },
    });
  }

  getRelatedMoviesByActor(actorId: number): void {
    this.relatedMoviePosters = [];
    this._movieService.getRelatedMoviesByActor(actorId).subscribe({
      next: (resp: Poster[]) => {
        this.relatedMoviePosters = resp;
      },
      error: (err: any) => { },
      complete: () => { },
    });
  }
}
