const maxZoom = 6
const tileSize = 256
const basePointUtm = [303473.7, 3515505.5]

let map

export default {

  getShowRange: function () {
    let topleftUtm = this.lnglat2utm({
      lng: -180,
      lat: 85
    })
    let rightbottomUtm = this.lnglat2utm({
      lng: 180,
      lat: -85
    })
    return {
      utm_x_start: topleftUtm.utmX,
      utm_y_start: topleftUtm.utmY,
      utm_x_end: rightbottomUtm.utmX,
      utm_y_end: rightbottomUtm.utmY
    }
  },

  getRealWorldSize: function () {
    return Math.pow(2, maxZoom) * tileSize
  },

  realxy2lnglat: function (xy) {
    const y2 = 180 - xy.y * 360 / this.getRealWorldSize()
    return {
      lng: xy.x * 360 / this.getRealWorldSize() - 180,
      lat: 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90 // copy map.transform.yLat(y)
    }
  },

  lnglat2realxy: function (lnglat) {
    return {
      x: map.transform.lngX(lnglat.lng) / map.transform.worldSize * this.getRealWorldSize(),
      y: map.transform.latY(lnglat.lat) / map.transform.worldSize * this.getRealWorldSize()
    }
  },

  lnglat2utm: function (lnglat) {
    var xy = this.lnglat2realxy(lnglat)
    return this.realxy2utm(xy)
  },

  realxy2utm: function (xy) {
    return {
      utmX: xy.x / 10 + basePointUtm[0],
      utmY: basePointUtm[1] - xy.y / 10
    }
  },

  utm2realxy: function (utm) {
    return {
      x: (utm.utmX - basePointUtm[0]) * 10,
      y: (basePointUtm[1] - utm.utmY) * 10
    }
  },

  utm2lnglat: function (utm) {
    var xy = this.utm2realxy(utm)
    return this.realxy2lnglat(xy)
  },

  bind: function (m) {
    map = m
  }
}
