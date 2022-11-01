/* eslint-disable no-unused-vars */
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import maplibregl from 'maplibre-gl';
import { loadScript, loadStyles } from '../utils';

import 'maplibre-gl/dist/maplibre-gl.css';
import './MapView.scss';

declare global {
    const aerisweather: any;
}

const MAPSGL_URL = 'https://cdn.aerisapi.com/sdk/js/mapsgl/1.1.0/aerisweather.mapsgl.js';

const getAerisRasterLayer = (
    layer: string,
    keys: { id: string; secret: string; }
): { id: string; source: any; layer: any; } => {
    const id = `aeriswx-raster-${layer}`;
    const dpr = window.devicePixelRatio;
    const suffix = dpr > 1 ? '@2x' : '';

    return {
        id,
        source: {
            type: 'raster',
            tiles: [1, 2, 3, 4].map((server) => (
                `https://maps${server}.aerisapi.com/${keys.id}_${keys.secret}/${layer}/{z}/{x}/{y}/current${suffix}.png`
            )),
            tileSize: 256,
            attribution: '<a href="https://aerisweather.com/">AerisWeather</a>'
        },
        layer: {
            id,
            type: 'raster',
            source: id,
            minzoom: 0,
            maxzoom: 22
        }
    };
};

export type MapViewProps = {
    // Mapbox token when using the MapboxGL SDK
    token: string | undefined;

    // Map center coordinate
    center?: { lat: number; lon: number; };

    // Map zoom level
    zoom?: number;

    // Map style URL
    style?: string;

    // Whether pan/zoom should be enabled (default `true`)
    enableInteraction?: boolean;

    // Configures the map data to render
    data?: {

        // Array of source configurations per Mapbox/Maplibre spec
        sources?: any[];

        // Array of layer configiurations per Mapbox/Maplibre spec
        layers?: any[];

        // AerisWeather-specific content
        aeris?: {

            // AerisWeather account access keys
            keys: { id: string | undefined; secret: string | undefined; };

            // MapsGL controller configuration options
            // See https://www.aerisweather.com/docs/mapsgl/reference/map-controller/#configuration
            map?: any;

            // Array of AMP raster layer codes to add
            // See https://www.aerisweather.com/support/docs/aeris-maps/reference/map-layers/#all
            raster?: string[];

            // Array of MapsGL layers to add
            // See https://www.aerisweather.com/docs/mapsgl/getting-started/weather-layers/
            mapsgl?: (string | { code: string; options: any; })[];

            // Whether the map timeline should automatically start playing on init (default `false`)
            autoPlay?: boolean;

            // Whether the MapsGL legend view should be shown for active layers (default `true`)
            // See https://www.aerisweather.com/docs/mapsgl/controls/legend/
            showLegend?: boolean;

            // Configuration for the MapsGL data inspector control
            // See https://www.aerisweather.com/docs/mapsgl/controls/data-inspector/
            dataInspector?: {

                // Whether the control should be enabled on the map view (default `false`)
                enabled?: boolean;

                // Trigger event for the data inspector control (default `move`)
                event?: 'move' | 'click';
            };
        }
    }
};

const MapView = ({
    token,
    center = { lat: 30, lon: -30 },
    zoom = 2,
    style = 'https://demotiles.maplibre.org/style.json',
    enableInteraction = true,
    data = {},
    ...props
}: MapViewProps) => {
    const mapRef = useRef<any>(null);
    const mapsglRef = useRef<any>(null);

    const handleContainer = (el: any) => {
        if (el === null) {
            if (mapsglRef.current) {
                mapsglRef.current.dispose();
            }
            if (mapRef.current) {
                mapRef.current.remove();           
            }
            return;
        }

        mapboxgl.accessToken = token || '';
        const map = new maplibregl.Map({
            container: el,
            style,
            center: [center.lon, center.lat],
            zoom,
            // attributionControl: false
        });
        mapRef.current = map;

        // map.addControl(new mapboxgl.AttributionControl({
        //     compact: true
        // }));

        if (!enableInteraction) {
            map.scrollZoom.disable();
            map.dragPan.disable();
            map.touchPitch.disable();
            map.touchZoomRotate.disable();
        }

        map.on('load', () => {
            const { sources, layers, aeris } = data;

            if (sources && layers) {
                sources.forEach((source) => {
                    map.addSource(source.id, source);
                });
                layers.forEach((layer) => map.addLayer(layer));
            }

            if (aeris) {
                const {
                    keys, raster, mapsgl, map: mapOpts, autoPlay = false, showLegend = true, dataInspector = {
                        enabled: false,
                        event: 'move'
                    }
                } = aeris;

                if (raster) {
                    raster.forEach((code) => {
                        const layer = getAerisRasterLayer(code, keys as any);

                        try {
                            map.addSource(layer.id, layer.source);
                            map.addLayer(layer.layer);
                        } catch (error) {
                            console.warn(error);
                        }
                    });
                }

                if (mapsgl) {
                    loadScript(MAPSGL_URL).then(() => {
                        return loadStyles(MAPSGL_URL.replace(/\.js/, '.css'));
                    }).then(() => {
                        const account = new aerisweather.mapsgl.Account(keys.id, keys.secret);
                        const controller = new aerisweather.mapsgl.MaplibreMapController(map, { ...mapOpts, account });
                        mapsglRef.current = controller;

                        if (showLegend) {
                            controller.addLegendControl('.mapview', { width: 300 });
                        }

                        if (dataInspector.enabled) {
                            controller.addDataInspectorControl();
                        }

                        if (autoPlay) {
                            controller.timeline.play();
                        }

                        try {
                            mapsgl.forEach((code) => {
                                if (typeof code === 'string') {
                                    controller.addWeatherLayer(code);
                                } else {
                                    const item = code as any;
                                    controller.addWeatherLayer(item.code, item.options);
                                }
                            });
                            map.setCenter({ lat: center.lat, lng: center.lon });
                        } catch (error) {
                            console.warn(error);
                        }
                    });
                }
            }
        });
    };

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setCenter(center);
        }
    }, [center]);

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setZoom(zoom);
        }
    }, [zoom]);

    return (
        <div
            ref={handleContainer}
            className="mapview"
            style={{
                height: '100%',
                position: 'relative',
                overflow: 'visible'
            }}
            {...props}
        />
    );
};

export default MapView;
