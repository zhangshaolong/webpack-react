import React from 'react'
import utils from 'utils'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw'
import service from 'service'
import geo from '../../common/geo'
import 'mousetrap'
import '../../mapbox-gl.css'
import '../../mapbox-gl-draw.css'

var CustomPointMode = require('./CustomPointMode');

class MAP extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
  componentDidMount () {
    const map = new mapboxgl.Map({
      container: 'map-container',
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              '/static/map_editor_tiles/zone/1/tiles/{z}/{x}/{y}.png'
            ],
            tileSize: 256
          }
        },
        layers: [{
          id: 'simple-tiles',
          type: 'raster',
          source: 'raster-tiles',
          minzoom: 0,
          maxzoom: 6
        }]
      },
      tileSize: 256,
      minZoom: 0,
      maxZoom: 6,
      interactive: true,
      bearingSnap: 100,
      pitchWithRotate: true,
      attributionControl: false,
      logoPosition: 'top-left',
      failIfMajorPerformanceCaveat: true,
      preserveDrawingBuffer: false,
      refreshExpiredTiles: true,
      // maxBounds: new mapboxgl.LngLatBounds(
      //   new mapboxgl.LngLat(-73.9876, 40.7661),
      //   new mapboxgl.LngLat(-73.9397, 40.8002)
      // )
      scrollZoom: true,
      boxZoom: true,
      dragRotate: true,
      dragPan: true,
      keyboard: true,
      trackResize: true,
      center: [-30, 0],
      zoom: 3,
      bearing: 0,
      pitch: 0,
      transformRequest: () => {
      }
    })

    geo.bind(map)

    // map.showTileBoundaries = true
    // map.showCollisionBoxes = true

    
    // alert(map.getCenter())

    // new BoxZoomHandler(map)
    // map.addControl(new mapboxgl.FullscreenControl());
    // map.addControl(new mapboxgl.AttributionControl({
    //     compact: true
    // }))
    utils.bindFun(window, 'resize', () => {
      map._container.style.height = window.innerHeight + 'px'
    }, 10)

    const modes = MapboxDraw.modes
    modes.custompoint = CustomPointMode
    const Draw = new MapboxDraw({modes: modes})
    map.addControl(Draw)

    map.on('load', (e) => {

      Draw.changeMode('custompoint')

      service.get('semantic_maps', geo.getShowRange()).then((resp) => {
        let curbs = resp.data.curbs
        let features = []
        
        let featureCollection = {
          type: 'FeatureCollection',
          features: features
        }
        let coordinates = []
        for (let i = 0; i < curbs.length; i++) {
          let curb = curbs[i]
          let nodes = curb.nodes
          let coordinate = []
          coordinates.push(coordinate)
          for (let j =0; j < nodes.length; j++) {
            let lnglat = geo.utm2lnglat({
              utmX: nodes[j].utm_x,
              utmY: nodes[j].utm_y
            })
            coordinate.push([lnglat.lng, lnglat.lat])
          }
        }
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coordinates
          }
        })

        let lanemarkings = resp.data.lanemarkings
        for (let i = 0; i < lanemarkings.length; i++) {
          let lanemarking = lanemarkings[i]
          let nodes = lanemarking.nodes
          coordinates = []
          features.push({
            type: 'Feature',
            properties: {
              name: 'lanemarking' + lanemarking.id,
              clicked: 'lanemarking' + lanemarking.id
            },
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          })
          for (let j =0; j < nodes.length; j++) {
            let lnglat = geo.utm2lnglat({
              utmX: nodes[j].utm_x,
              utmY: nodes[j].utm_y
            })
            coordinates.push([lnglat.lng, lnglat.lat])
          }
        }

        map.addSource('map-overview', {
          type: 'geojson',
          data: featureCollection
        })

        map.addLayer({
          'id': 'polygon',
          'type': 'fill',
          'source': 'map-overview',
          'layout': {},
          'paint': {
              'fill-color': '#088',
              'fill-opacity': 0.8
          },
          filter: ['==', '$type', 'Polygon']
        })

        map.addLayer({
          id: 'line',
          type: 'line',
          source: 'map-overview',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
              'line-color': '#0f0',
              'line-width': 1
          },
          filter: ['==', '$type', 'LineString']
        })

        map.addLayer({
          id: 'line-hover',
          type: 'line',
          source: 'map-overview',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
              'line-color': '#ff0',
              'line-width': 1
          },
          filter: [
            'all',
            ['==', '$type', 'LineString'],
            ['!=', 'clicked', ''],
            ['==', 'name', '']
          ]
        })

        map.addLayer({
          id: 'line-click',
          type: 'line',
          source: 'map-overview',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
              'line-color': '#00f',
              'line-width': 1
          },
          filter: [
            'all',
            ['==', '$type', 'LineString'],
            ['==', 'clicked', '']
          ]
        })

        let hoverTimer
        map.on('mousemove', 'line', (e) => {
          clearTimeout(hoverTimer)
          hoverTimer = setTimeout(() => {
            map.setFilter('line-hover', ['==', 'name', e.features[0].properties.name])
          }, 17)
        })

        let leaveTimer
        map.on('mouseleave', 'line', function(e) {
          clearTimeout(leaveTimer)
          leaveTimer = setTimeout(() => {
            map.setFilter('line-hover', ['==', 'name', ''])
          }, 100)
        })

        map.on('click', 'line', (e) => {
            map.setFilter('line-click', ['==', 'clicked', e.features[0].properties.clicked])
        })

        Mousetrap.bind('esc', () => {
          map.setFilter('line-click', ['==', 'clicked', ''])
        }, 'keyup')

        // map.addLayer({
        //   id: 'point',
        //   type: 'circle',
        //   source: 'map-overview',
        //   layout: {},
        //   paint: {
        //       'circle-color': 'rgba(0,255,0,0.5)',
        //       'circle-radius': 20,
        //       'circle-blur': 1
        //   },
        //   filter: ['==', '$type', 'Point']
        // })
      })

    })

    //   map.addSource('map-overview', {
    //     type: 'geojson',
    //     data: {
    //       type: 'FeatureCollection',
    //       features: [
    //         {
    //           type: 'Feature',
    //           geometry: {
    //             type: 'Polygon',
    //             coordinates: [
    //               [
    //                 [-67.13734351262877, 45.137451890638886],
    //                 [-66.96466, 44.8097],
    //                 [-68.03252, 44.3252],
    //                 [-69.06, 43.98],
    //                 [-70.11617, 43.68405],
    //                 [-70.64573401557249, 43.090083319667144],
    //                 [-70.75102474636725, 43.08003225358635],
    //                 [-70.79761105007827, 43.21973948828747],
    //                 [-70.98176001655037, 43.36789581966826],
    //                 [-70.94416541205806, 43.46633942318431],
    //                 [-71.08482, 45.3052400000002],
    //                 [-70.6600225491012, 45.46022288673396],
    //                 [-70.30495378282376, 45.914794623389355],
    //                 [-70.00014034695016, 46.69317088478567],
    //                 [-69.23708614772835, 47.44777598732787],
    //                 [-68.90478084987546, 47.184794623394396],
    //                 [-68.23430497910454, 47.35462921812177],
    //                 [-67.79035274928509, 47.066248887716995],
    //                 [-67.79141211614706, 45.702585354182816],
    //                 [-67.13734351262877, 45.137451890638886]
    //               ]
    //             ]
    //           }
    //         },
    //         {
    //           type: 'Feature',
    //           geometry: {
    //             type: 'Point',
    //             coordinates: [-55.414, 43.776]
    //           }
    //         },
    //         {
    //           type: 'Feature',
    //           properties: {
    //             name: 'line1',
    //             clicked: 'line1'
    //           },
    //           geometry: {
    //             type: 'LineString',
    //             coordinates: [
    //               [-57.13734351262877, 55.137451890638886],
    //               [-56.96466, 54.8097],
    //               [-58.03252, 54.3252],
    //               [-59.06, 53.98],
    //               [-50.11617, 53.68405],
    //               [-50.64573401557249, 53.090083319667144],
    //               [-50.75102474636725, 53.08003225358635],
    //               [-50.79761105007827, 53.21973948828747],
    //               [-50.98176001655037, 53.36789581966826],
    //               [-50.94416541205806, 53.46633942318431],
    //               [-51.08482, 55.3052400000002],
    //               [-50.6600225491012, 55.46022288673396],
    //               [-50.30495378282376, 55.914794623389355],
    //               [-50.00014034695016, 56.69317088478567],
    //               [-59.23708614772835, 57.44777598732787],
    //               [-58.90478084987546, 57.184794623394396],
    //               [-58.23430497910454, 57.35462921812177],
    //               [-57.79035274928509, 57.066248887716995],
    //               [-57.79141211614706, 55.702585354182816],
    //               [-57.13734351262877, 55.137451890638886]
    //             ]
    //           }
    //         },
    //         {
    //           type: 'Feature',
    //           properties: {
    //             name: 'line2',
    //             clicked: 'line2'
    //           },
    //           geometry: {
    //             type: 'LineString',
    //             coordinates: [
    //               [-57.13734351262877, 45.137451890638886],
    //               [-56.96466, 44.8097],
    //               [-58.03252, 44.3252],
    //               [-59.06, 43.98],
    //               [-50.11617, 43.68405],
    //               [-50.64573401557249, 43.090083319667144],
    //               [-50.75102474636725, 43.08003225358635],
    //               [-50.79761105007827, 43.21973948828747],
    //               [-50.98176001655037, 43.36789581966826],
    //               [-50.94416541205806, 43.46633942318431],
    //               [-51.08482, 45.3052400000002],
    //               [-50.6600225491012, 45.46022288673396],
    //               [-50.30495378282376, 45.914794623389355],
    //               [-50.00014034695016, 46.69317088478567],
    //               [-59.23708614772835, 47.44777598732787],
    //               [-58.90478084987546, 47.184794623394396],
    //               [-58.23430497910454, 47.35462921812177],
    //               [-57.79035274928509, 47.066248887716995],
    //               [-57.79141211614706, 45.702585354182816],
    //               [-57.13734351262877, 45.137451890638886]
    //             ]
    //           }
    //         }
    //       ]
    //     }
    //   })

    //   map.addLayer({
    //     'id': 'polygon',
    //     'type': 'fill',
    //     'source': 'map-overview',
    //     'layout': {},
    //     'paint': {
    //         'fill-color': '#088',
    //         'fill-opacity': 0.8
    //     },
    //     filter: ['==', '$type', 'Polygon']
    //   })

    //   map.addLayer({
    //     id: 'line',
    //     type: 'line',
    //     source: 'map-overview',
    //     layout: {
    //       'line-join': 'round',
    //       'line-cap': 'round'
    //     },
    //     paint: {
    //         'line-color': '#0f0',
    //         'line-width': 10
    //     },
    //     filter: ['==', '$type', 'LineString']
    //   })

    //   map.addLayer({
    //     id: 'line-hover',
    //     type: 'line',
    //     source: 'map-overview',
    //     layout: {
    //       'line-join': 'round',
    //       'line-cap': 'round'
    //     },
    //     paint: {
    //         'line-color': '#ff0',
    //         'line-width': 10
    //     },
    //     filter: [
    //       'all',
    //       ['==', '$type', 'LineString'],
    //       ['!=', 'clicked', ''],
    //       ['==', 'name', '']
    //     ]
    //   })

    //   map.addLayer({
    //     id: 'line-click',
    //     type: 'line',
    //     source: 'map-overview',
    //     layout: {
    //       'line-join': 'round',
    //       'line-cap': 'round'
    //     },
    //     paint: {
    //         'line-color': '#00f',
    //         'line-width': 10
    //     },
    //     filter: [
    //       'all',
    //       ['==', '$type', 'LineString'],
    //       ['==', 'clicked', '']
    //     ]
    //   })

    //   map.addLayer({
    //     id: 'point',
    //     type: 'circle',
    //     source: 'map-overview',
    //     layout: {},
    //     paint: {
    //         'circle-color': 'rgba(0,255,0,0.5)',
    //         'circle-radius': 20,
    //         'circle-blur': 1
    //     },
    //     filter: ['==', '$type', 'Point']
    //   })
    // })

    // let hoverTimer
    // map.on('mousemove', 'line', (e) => {
    //   clearTimeout(hoverTimer)
    //   hoverTimer = setTimeout(() => {
    //     map.setFilter('line-hover', ['==', 'name', e.features[0].properties.name])
    //   }, 17)
    // })

    // let leaveTimer
    // map.on('mouseleave', 'line', function(e) {
    //   clearTimeout(leaveTimer)
    //   leaveTimer = setTimeout(() => {
    //     map.setFilter('line-hover', ['==', 'name', ''])
    //   }, 100)
    // })

    // map.on('click', 'line', (e) => {
    //     map.setFilter('line-click', ['==', 'clicked', e.features[0].properties.clicked])
    // })

    // Mousetrap.bind('esc', () => {
    //   map.setFilter('line-click', ['==', 'clicked', ''])
    // }, 'keyup')

    // map.on('contextmenu', 'line', (e) => {
    //   var div = document.createElement('div')
    //   div.className = 'contextmenu'
    //   div.style.left = e.point.x + 'px'
    //   div.style.top = e.point.y + 'px'
    //   map._container.appendChild(div)
    //   console.log('contextmenu', e)
    // })



    // map.on('click', 'line', (e) => {
    //     map.setFilter('line-hover', ['==', 'clicked', true]);
    // })


    
    // map.on('click', (e) => {
    //   console.log('click', e)
    // })
    // map.on('mousemove', (e) => {
    //   console.log('mousemove', e)
    // })
    // map.on('mousedown', (e) => {
    //   console.log('mousedown', e)
    // })
    // map.on('mouseup', (e) => {
    //   console.log('mouseup', e)
    // })
    // map.on('mouseenter', (e) => {
    //   console.log('mouseenter', e)
    // })
    // map.on('mouseover', (e) => {
    //   console.log('mouseover', e)
    // })
    // map.on('mouseleave', (e) => {
    //   console.log('mouseleave', e)
    // })
    // map.on('mouseout', (e) => {
    //   console.log('mouseout', e)
    // })
    // map.on('contextmenu', (e) => {
    //   console.log('contextmenu', e)
    // })
    // map.on('dragstart', (e) => {
    //   console.log('dragstart', e)
    // })
    // map.on('drag', (e) => {
    //   console.log('drag', e)
    // })
    // map.on('dragend', (e) => {
    //   console.log('dragend', e)
    // })
    // map.on('data', (e) => {
    //   console.log('data', e)
    // })
  }

  componentWillUnmount () {
    Mousetrap.unbind('esc')
  }
  render() {
    return (
      <div id="map-container" style={{height: window.innerHeight}}></div>
    )
  }
}

export default MAP