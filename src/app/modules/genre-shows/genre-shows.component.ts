import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Genere } from 'src/app/model/genere';
import { Poster } from 'src/app/model/poster';
import { GenreService } from 'src/app/services/genre.service';
import { MovieService } from 'src/app/services/movie.service';
import { Location } from '@angular/common';
import { SharedService } from 'src/app/services/shared.service';
import { TvShowsService } from 'src/app/services/tv-shows.service';
import { AppContants } from 'src/app/utils/app-contants';

@Component({
  selector: 'app-genre-shows',
  templateUrl: './genre-shows.component.html',
  styleUrls: ['./genre-shows.component.scss']
})
export class GenreShowsComponent implements OnInit{
  
  loading: boolean = true;
  genres: Genere[] = [];
  posters: Poster[] = [];
  dataloading: boolean = false;
  paginationLoading: boolean = false;
  currentPage: number = 0;
  selectedGenre: Genere = {};
  temp: Poster[] = [];
  paginatedPosters: any = [];
  type: string = 'movie';
  switchlang = 'en'
  constructor(private route: ActivatedRoute,
    private _tvShoesService: TvShowsService,
    private _movieService: MovieService,
    private sharedService: SharedService,
    private router: Router,
    private location: Location)
  {
    
  }
  onchangeCategory(category: string): void {
    this.type = category;
    this.temp = [];
    this.paginatedPosters = [];
    this.selectedGenre = { id: AppContants.GENRE_ADULT, title: "Adults", posters: [] };
    this.loading = true;
    if(this.type == 'movie'){
      this.loadMoviePageData({ genre: this.selectedGenre?.id!, order: 'created', page: 0 });
      }else{
        this.loadTvShowPageData({ genre: this.selectedGenre?.id!, order: 'created', page: 0 });
      }
  }
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log('params received '+params);
      const id = params['id'];
      this.temp = [];
      this.paginatedPosters = [];
      this.loading = true;
      this.selectedGenre = { id: id, title: "Adults", posters: [] };
      this.loadMoviePageData({ genre: id, order: 'created', page: 0 });
    });
    this.location.replaceState('/');
    
  }
  ngOnDestroy() {
    window.removeEventListener('scroll', this.scroll, true);
  }
  scroll = (event: any): void => {
    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    const windowBottom = windowHeight + window.pageYOffset;
    if (!this.dataloading) {
      if (windowBottom >= docHeight) {
        // console.log("do something when scroll to the bottom of the page");

        this.paginationLoading = true;
        if(this.type == 'movie'){
        this.loadMoviePageData({ genre: this.selectedGenre?.id!, order: 'created', page: this.paginatedPosters.length + 1 });
        }else{
          this.loadTvShowPageData({ genre: this.selectedGenre?.id!, order: 'created', page: this.paginatedPosters.length + 1 });
        }
      }
    }
  };
  getDetails(poster: Poster) {
    if (typeof poster !== 'undefined') {
      this.sharedService.setSharedObject(poster);
      this.router.navigate(['/details']);
    }
  }
  chunkArray<T>(posters: Poster[], size: number): any {
    const results: any = [];
    for (let i = 0; i < posters.length; i += size) {
      const chunk = posters.slice(i, i + size);
      results.push(chunk);
    }

    return results;
  }
  loadTvShowPageData(data: { genre: number, order: string, page: number }): void {
    // this.posters =[];
    console.log('data', data);
    // if(msg == 'fromGenre'){
    //  this.posters =[];
    // }
    this._tvShoesService.getTvShowsData(data).subscribe({
      next: (resp: Poster[]) => {
        console.log(resp);
        if (resp.length > 0) {
          this.posters = [...this.temp, ...resp];
          this.temp = this.posters;
          this.paginatedPosters = this.chunkArray(this.temp, 30);

        }
        else {

        }

      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {
        this.loading = false;
        this.dataloading = false;
        this.paginationLoading = false;
        console.log("completed");
      }
    })
  }
  loadMoviePageData(data: { genre: number, order: string, page: number }): void {
    // this.posters =[];
    console.log('data', data);
    // if(msg == 'fromGenre'){
    //  this.posters =[];
    // }
    this._movieService.getMovieData(data).subscribe({
      next: (resp: Poster[]) => {
        console.log(resp);
        if (resp.length > 0) {
          this.posters = [...this.temp, ...resp];
          this.temp = this.posters;
          this.paginatedPosters = this.chunkArray(this.temp, 30);

        }
        else {

        }

      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => {
        this.loading = false;
        this.dataloading = false;
        this.paginationLoading = false;
        //this.selectItem();
        console.log("completed");
      }
    })
  }
}
