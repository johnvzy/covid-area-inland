import { Component, OnInit, Output, ElementRef, ViewChild, EventEmitter, Input } from '@angular/core';
import esri = __esri; // Esri TypeScript Types
import { loadModules } from "esri-loader";
import { async } from '@angular/core/testing';
import { Observable, observable, Observer, fromEvent, pipe, interval } from 'rxjs';
import { take, throttle } from 'rxjs/operators';
import { strict } from 'assert';

@Component({
  selector: 'app-mapview',
  templateUrl: './mapview.component.html',
  styleUrls: ['./mapview.component.scss']
})
export class MapviewComponent implements OnInit {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  @ViewChild("dateEvent", { static: false }) private dateViewElement: ElementRef;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   * _loaded provides map loaded status
   */
  private _zoom = 8;
  private _center: Array<number> = [117.3142, 5.2742];
  private _basemap = "streets-navigation-vector";
  private _loaded = false;
  private _view: esri.MapView = null;
  private appConfig: any;
  private switchButtonValue: string = "3D";

  sketcHShow: boolean = false;

  get mapLoaded(): boolean {
    return this._loaded;
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  get toogleButton(): string {
    return this.switchButtonValue;
  }

  constructor() { }

  async initializeMap() {


    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, SceneView, FeatureLayer, GraphicsLayer, Editor, WebScene] = await loadModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/views/SceneView",
        "esri/layers/FeatureLayer",
        "esri/layers/GraphicsLayer",
        "esri/widgets/Editor",
        "esri/WebScene"
      ]);

      const twoDLayer = new FeatureLayer({
        url: "https://services2.arcgis.com/Xp2D1uPq1orZ37XY/ArcGIS/rest/services/cvd_sabah/FeatureServer/0?token=DYnKBTc9hsbL5sO44utCY-0UnWT-lpgPqtDH4HptheYftc2pO29Bib8UpUM112VprmKbxre2m1tEXJXHrA3PeieIlqC96msGzxly9pK3Yc2rsNRfcD97GrkivjjxWYV9f0oMxh8kK9kfDcPmzEOcsCOMj796gFDEDKGTPgtFBsW2ZZEHY8MHnFFe_kaOGhhR4AsgOJPqemWSSIAkEzx14-N_2JsE8xjF_w6DGT_FhL1eyecjlims5D4Hzp5rnacH",
        outFields: ["title", "cvd_location"],
        popupTemplate: {
          "title": "{title}",
          "content": "<b>Description:</b> {cvd_location} <br> <b>Report Date:</b> {report_date}"
        }
      })

      const scene = new WebScene({
        portalItem: {
          // autocasts as new PortalItem()
          id: "d0aa45b4db7d44a7b1e4dd7c23037d90" //or 4eb475d9671349e38c819fa79ef3e522
        }
      });

      // initialize settings
      const appConfig = {
        mapView: null,
        sceneView: null,
        activeView: null,
        container: this.mapViewEl.nativeElement
      };

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: appConfig.container,
        center: this._center,
        zoom: this._zoom,
        // map: map
      };

      //Editor Widget
      const editorWidget = new Editor();

      // Configure the Map
      const mapProperties: esri.MapProperties = {
        basemap: this._basemap,
        // layers: [graphicsLayer]
      };
      const graphicsLayer = new GraphicsLayer();
      const currGeometry = [];
      const map: esri.Map = new EsriMap(mapProperties);

      map.add(twoDLayer)
      //initialize 2d properties
      appConfig.mapView = this.createView(mapViewProperties, "2d", EsriMapView, SceneView);
      appConfig.mapView.map = map;
      appConfig.activeView = appConfig.mapView;
      editorWidget.view = appConfig.mapView;
      appConfig.mapView.ui.add(editorWidget, "top-right");

      //initialize 3d properties
      mapViewProperties.container = null;
      mapViewProperties.map = scene;
      appConfig.sceneView = this.createView(mapViewProperties, "3d", EsriMapView, SceneView);

      return { appConfig }
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  createView(params, type, EsriMapView, SceneView) {
    let is2D = type === '2d';
    return is2D ? new EsriMapView(params) : new SceneView(params)
  }

  toggleView() {
    let is3D = this.appConfig.activeView.type === "3d";
    let activeViewpoint = this.appConfig.activeView.viewpoint.clone();

    this.appConfig.activeView.container = null;

    if (is3D) {
      this.appConfig.mapView.viewpoint = activeViewpoint;
      this.appConfig.mapView.container = this.appConfig.container;
      this.appConfig.activeView = this.appConfig.mapView;
      this.switchButtonValue = "3D";
    } else {
      this.appConfig.sceneView.viewpoint = activeViewpoint;
      this.appConfig.sceneView.container = this.appConfig.container;
      this.appConfig.activeView = this.appConfig.sceneView;
      this.switchButtonValue = "2D";
    }
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then((esriObject: any) => {
      // The map data has been initialized
      this.appConfig = esriObject.appConfig;
      console.log("mapView ready: ", esriObject.appConfig.mapView.ready);
      this.mapLoadedEvent.emit(true);
    });
  }

  showCoordinates(pt): void {
    //*** UPDATE ***//
    console.log(pt.latitude + " " + pt.longitude);
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }
}
