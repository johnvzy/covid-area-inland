import { Injectable, OnInit } from '@angular/core';
import { MapInfo } from './map-info';

@Injectable({
  providedIn: 'root'
})
export class MapviewService implements OnInit {

  private mapInfo = MapInfo;

  constructor() {
  }

  ngOnInit(): void { }

  /*** zoom ***/
  set zoom(zoom: number) {
    this.mapInfo._zoom = zoom;
  }

  get zoom(): number {
    return this.mapInfo._zoom;
  }

  /*** center ***/
  set center(center: Array<number>) {
    this.mapInfo._center = center;
  }

  get center(): Array<number> {
    return this.mapInfo._center;
  }

  /*** basemap ***/
  set basemap(basemap: string) {
    this.mapInfo._basemap = basemap;
  }

  get basemap(): string {
    return this.mapInfo._basemap;
  }

  /*** editor_view ***/
  set editorHeight(height: number) {
    this.mapInfo._editorHeight = height;
  }

  get editorHeight(): number {
    return this.mapInfo._editorHeight;
  }

  set editorWidth(width: number) {
    this.mapInfo._editorWidth = width;
  }

  get editorWidth(): number {
    return this.mapInfo._editorWidth;
  }
}


