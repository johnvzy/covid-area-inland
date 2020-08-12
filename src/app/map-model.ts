/**
 * _zoom sets map zoom
 * _center sets map center
 * _basemap sets type of map
 */

export interface MapModel {
    _zoom: number;
    _center: Array<number>;
    _basemap: string;
    _view: any;
    _editorObject: any,
}