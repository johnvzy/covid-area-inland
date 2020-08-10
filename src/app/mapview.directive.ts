import { Directive, Input, OnInit } from '@angular/core';
import { MapviewService } from './mapview.service'
@Directive({
  selector: '[appMapview]'
})
export class MapviewDirective {

  constructor(private mapViewService: MapviewService) { }

  @Input()
  set zoom(zoom: number) {
    this.mapViewService.zoom = zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this.mapViewService.center = center;
  }

  @Input()
  set basemap(basemap: string) {
    this.mapViewService.basemap = basemap;
  }

}
