import { Component, OnInit, Output, ElementRef, ViewChild, EventEmitter, Input } from '@angular/core';
import esri = __esri; // Esri TypeScript Types
import { loadModules } from "esri-loader";
import { EMPTY, interval, pipe, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { MapviewService } from '../mapview.service'
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-mapview',
  templateUrl: './mapview.component.html',
  styleUrls: ['./mapview.component.scss'],
  animations: [
    trigger('editorMain', [
      state('enter', style({ right: 0, visibility: 'visible' })),
      state('leave', style({ right: '{{editorWidth}}px', visibility: 'hidden' }), { params: { editorWidth: 0 } }),
      transition("enter => leave", animate('1s ease')),
      transition("leave => enter", animate('1s ease'))
    ]),
    trigger('editorButton', [
      state('enter', style({ right: '{{editorWidth}}px' }), { params: { editorWidth: 0 } }),
      state('leave', style({ right: 0 })),
      transition("enter => leave", animate('1s ease')),
      transition("leave => enter", animate('1s ease'))
    ])
  ]
})

export class MapviewComponent implements OnInit {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  @ViewChild("editorView", { static: false }) private editorViewElement: ElementRef;

  @Input() test: string;

  private _loaded = false;                /* _loaded provides map loaded status */
  private appConfig: any;
  private switchButtonValue: string = "3D";
  private editorShow: boolean = true;
  private domRepresentation: any;
  private currentPositon: number;
  private currentWidth: number;


  constructor(private mapViewService: MapviewService) { }

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, SceneView, FeatureLayer, Editor, WebScene] = await loadModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/views/SceneView",
        "esri/layers/FeatureLayer",
        "esri/widgets/Editor",
        "esri/WebScene",
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
        center: this.mapViewService.center,
        zoom: this.mapViewService.zoom,
        // map: map
      };

      //Editor Widget
      const editorWidget = new Editor();

      // Configure the Map
      const mapProperties: esri.MapProperties = {
        basemap: this.mapViewService.basemap
      };
      const map: esri.Map = new EsriMap(mapProperties);

      map.add(twoDLayer)
      //initialize 2d properties
      appConfig.mapView = this.createView(mapViewProperties, "2d", EsriMapView, SceneView);
      appConfig.mapView.map = map;
      appConfig.activeView = appConfig.mapView;

      editorWidget.view = appConfig.mapView;
      editorWidget.container = this.editorViewElement.nativeElement.id

      appConfig.mapView.ui.add(editorWidget);

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

      /// await element of ersi-view
      let stop = interval(250).subscribe(() => {
        if (this.editorViewElement.nativeElement.offsetHeight !== 0) {
          this.mapViewService.editorObj = this.editorViewElement.nativeElement
          this._loaded = true;
          this.currentPositon = this.appConfig.mapView.width - this.mapViewService.editorObj.offsetWidth - this.mapViewService.editorObj.offsetLeft;
          this.domRepresentation = document.getElementsByClassName('esri-editor__feature-list-item');
          stop.unsubscribe();
        }
      })
    });
  }

  showCoordinates(pt): void {
    //*** UPDATE ***//
    console.log(pt.latitude + " " + pt.longitude);
  }

  // *test get width after page rendered

  ngAfterViewInit() {
    this.mapViewService.zoom;
  }

  ngOnDestroy() {
    if (this.appConfig.mapView) {
      // destroy the map view
      this.appConfig.mapView.container = null;
    }
  }

  setEditorToggleShow() {
    this.editorShow = !this.editorShow;

    if (this.editorShow) {
      this.currentPositon = 0;
    } else {
      this.currentPositon = this.currentPositon - this.mapViewService.editorObj.offsetWidth;
    }
  }

  get editorToggleShow(): boolean {
    return this.editorShow;
  }

  get mapLoaded(): boolean {
    return this._loaded;
  }

  get toogleButton(): string {
    return this.switchButtonValue;
  }

  get editorMainView(): number {
    return this.currentPositon ? this.currentPositon : 0
  }

  get editorButtonViewPostion(): number {
    return this.currentPositon + this.mapViewService.editorObj.offsetWidth
  }

  get editorButtonViewHeight(): number {
    return this.mapViewService.editorObj.offsetHeight
  }
}