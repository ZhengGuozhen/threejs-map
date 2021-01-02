import * as THREE from "three/build/three.module.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import {
  CSS3DRenderer,
  CSS3DObject
} from "three/examples/jsm/renderers/CSS3DRenderer.js";




import 'ol/ol.css';
import Graticule from 'ol/layer/Graticule';
import OlMap from 'ol/Map';
import OSM from 'ol/source/OSM';
import Stroke from 'ol/style/Stroke';
import TileLayer from 'ol/layer/Tile';
import Tile from 'ol/layer/Tile';
import OlView from 'ol/View';
import {fromLonLat, transform} from 'ol/proj';
import XYZ from 'ol/source/XYZ';


var camera, scene, renderer;

var raycaster = new THREE.Raycaster();

var scene2, renderer2;

var controls;

var frustumSize = 500;

// 初始camera高度
var cameraY = 1000 * 10000;

// map缩放时的基准值，和mapDom的宽高共同决定map css3d元素在界面上的大小
var distanceRef = 1000;

var container = document.getElementById('container');

init();
animate();

function init() {
  var aspect = window.innerWidth / window.innerHeight;
  //正交相机
  // camera = new THREE.OrthographicCamera(
  //   (frustumSize * aspect) / -2,
  //   (frustumSize * aspect) / 2,
  //   frustumSize / 2,
  //   frustumSize / -2,
  //   1,
  //   10000
  // );
  //透视相机
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.001,
    999999999
  );

  camera.position.set(0, cameraY, 0);

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xf0f0f0);

  scene2 = new THREE.Scene();

  var material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    wireframeLinewidth: 1,
    side: THREE.DoubleSide
  });


  /*
  // bottom
  createPlane(
    300,
    300,
    "seagreen",
    new THREE.Vector3(0, 0, 0),
    new THREE.Euler(-90 * THREE.MathUtils.DEG2RAD, 0, 0)
  );
  */

  //

  renderer = new THREE.WebGLRenderer({
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //需要下面2行保证两个render对齐
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = 0;
  //设置zIndex
  renderer.domElement.style.zIndex = 0;
  container.appendChild(renderer.domElement);

  renderer2 = new CSS3DRenderer();
  renderer2.setSize(window.innerWidth, window.innerHeight);
  //需要下面2行保证两个render对齐
  renderer2.domElement.style.position = "absolute";
  renderer2.domElement.style.top = 0;
  //设置zIndex
  renderer2.domElement.style.zIndex = -1;
  container.appendChild(renderer2.domElement);

  //controls作用在最上层的domElement
  controls = new OrbitControls(camera, renderer.domElement);
  // var controls = new OrbitControls(camera, renderer2.domElement);

  // controls.minZoom = 1;
  // controls.maxZoom = 100;

  //定义当平移的时候摄像机的位置将如何移动
  controls.screenSpacePanning = false;

  function createPlane(width, height, cssColor, pos, rot) {
    var element = document.createElement("div");
    element.style.width = width + "px";
    element.style.height = height + "px";
    element.style.opacity = 0.5;
    element.style.background = cssColor;

    var object = new CSS3DObject(element);
    object.position.copy(pos);
    object.rotation.copy(rot);
    scene2.add(object);

    //创建一个与css3d对象相同大小、相同位置的对象，检查css3d对象是否正确
    var geometry = new THREE.PlaneBufferGeometry(width, height);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(object.position);
    mesh.rotation.copy(object.rotation);
    scene.add(mesh);
  }

  window.addEventListener("resize", onWindowResize, false);

}

function onWindowResize() {
  var aspect = window.innerWidth / window.innerHeight;

  //正交相机
  // camera.left = (-frustumSize * aspect) / 2;
  // camera.right = (frustumSize * aspect) / 2;
  // camera.top = frustumSize / 2;
  // camera.bottom = -frustumSize / 2;
  //透视相机
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer2.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
  renderer2.render(scene2, camera);

  controls.update();
}

///////////////////////////////////////////////////////////////



// map是墨卡托投影
// scene也需要转成墨卡托投影才能和地图对齐

/**
 * 经纬度转墨卡托
 * @param poi 经纬度
 * @returns {{}}
 * @private
 */
function _getMercator(poi) {//[114.32894, 30.585748]
  var mercator = {};
  var earthRad = 6378137.0;
  // console.log("mercator-poi",poi);
  mercator.x = poi.lng * Math.PI / 180 * earthRad;
  var a = poi.lat * Math.PI / 180;
  mercator.y = earthRad / 2 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
  // console.log("mercator",mercator);
  return mercator; //[12727039.383734727, 3579066.6894065146]
}
/**
* 墨卡托转经纬度
* @param poi 墨卡托
* @returns {{}}
* @private
*/
function _getLngLat(poi) {
  var lnglat = {};
  lnglat.lng = poi.x / 20037508.34 * 180;
  var mmy = poi.y / 20037508.34 * 180;
  lnglat.lat = 180 / Math.PI * (2 * Math.atan(Math.exp(mmy * Math.PI / 180)) - Math.PI / 2);
  return lnglat;
}


// world坐标系下单位经度长度对应的x轴范围
// var LONGITUDE_X = 10;

// 可以通过调节LONGITUDE_X + dq()实现缩放效果
// 可以改善之前的方法（camera controls缩放）放大到一定程度后卡顿错乱的问题
// 需要在缩放之后重新计算object的位置
var LONGITUDE_X = 111000;

// 根据{经度}计算world坐标系下的{position.x}值
function longitude2world(lon) {
  return lon * LONGITUDE_X;
}
function world2longitude(x) {
  return x / LONGITUDE_X;
}

// 计算{纬度}对应的{墨卡托y值}/{单位经度墨卡托x值}
// 意义：给定latitude，计算结果为该latitude在当前world坐标系下的{position.z}值
// 注意：z轴正值为南纬
function latitude2world(lat) {
  var a = lat * Math.PI / 180;
  var r = 180.0 / (2 * Math.PI) * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
  r *= LONGITUDE_X;
  r = -r;
  return r;
}
console.log(latitude2world(0))
console.log(latitude2world(30))
console.log(latitude2world(45))
console.log(latitude2world(60))
console.log(latitude2world(85))
// m函数的逆函数
function world2latitude(z) {
  var zz = -z;
  zz = zz / LONGITUDE_X;
  var a = Math.exp(2 * Math.PI * zz / 180);
  var lat = Math.asin((a - 1) / (a + 1));
  lat = lat * 180 / Math.PI;
  return lat;
}
console.log(world2latitude(latitude2world(30)));//30
console.log(world2latitude(latitude2world(45)));//45
console.log(world2latitude(latitude2world(60)));//60
console.log(world2latitude(latitude2world(85)));//85

//网格
// var gridHelper = new THREE.GridHelper(360 * LONGITUDE_X, 36, 0xff0000);
var gridHelper = new THREE.GridHelper(100, 100, 0xff0000);
gridHelper.position.x = longitude2world(121);
gridHelper.position.z = latitude2world(21);
// gridHelper.rotation.x = - Math.PI / 2;
scene.add(gridHelper);



//辅助线，检查纬度是否正确
function initLines(lat) {
  var material = new THREE.LineBasicMaterial({
    color: 0x0000ff
  });
  var points = [];
  points.push(new THREE.Vector3(longitude2world(- 180), 0, latitude2world(lat)));
  points.push(new THREE.Vector3(longitude2world(180), 0, latitude2world(lat)));
  var geometry = new THREE.BufferGeometry().setFromPoints(points);
  var line = new THREE.Line(geometry, material);
  scene.add(line);
}
// initLines(0);
initLines(10);
initLines(20);
initLines(30);
initLines(40);
initLines(50);
initLines(60);




// 测试用的小方块
// 方块size 对应地图上的约1分
for (let i = 0; i < 1000; i++) {
  var geometry = new THREE.BoxBufferGeometry(1/3600 * LONGITUDE_X, 1/3600 * LONGITUDE_X, 1/3600 * LONGITUDE_X);
  var material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
    wireframeLinewidth: 1,
    side: THREE.DoubleSide
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = longitude2world(121 + i * 1/3600)
  mesh.position.z = latitude2world(21)
  scene.add(mesh);
}




var mapDomWidth = 1000;
var mapDomHeight = 1000;
var element = document.getElementById("map");
element.style.width = mapDomWidth + "px";
element.style.height = mapDomWidth + "px";
element.style.opacity = 1;

//map
var map = new OlMap({
  target: "map",
  layers: [
    new Tile({
      source: new OSM({
        wrapX: true,
      }),
    }),
    new Tile({
      source: new XYZ({
        url:
          'http://pngchart.ehanghai.cn/htcx/{z}/{y}/{x}.png'
          // 'https://www.chart.msa.gov.cn/arcgis/rest/services/CHARTCELL/MapServer/tile/{z}/{x}/{y}'
      }),
    }),

    new Graticule({
      strokeStyle: new Stroke({
        color: 'rgba(255,120,0,0.9)',
        width: 1,
        lineDash: [0.5, 4],
      }),
      showLabels: true,
      wrapX: true,
    })
  ],
  view: new OlView({
    center: fromLonLat([121, 20]),
    zoom: 4
  })
});

//css3d对象
var mapObject = new CSS3DObject(element);
// mapObject.position.set(100,0,100);
// mapObject.rotation.copy(rot);
mapObject.rotation.x = -Math.PI / 2;
scene2.add(mapObject);




//
var axesHelper = new THREE.AxesHelper(300);
// scene.add( axesHelper );
//
var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var helper = new THREE.PlaneHelper(plane, 350, 0x000000);
// scene.add( helper );

//todo 无效，需要改源码
container.addEventListener("mousedown", function (e) {
  console.log(e);
}, true);

//点击显示坐标
container.addEventListener("click", function (event) {
  var mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  //鼠标点击点-->plane平面坐标
  raycaster.setFromCamera(mouse, camera);
  var pos = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, pos);
  console.log('center position', pos);

  var centerLongitude = world2longitude(pos.x);
  var centerLatitude = world2latitude(pos.z);
  console.log('long', centerLongitude, 'lat', centerLatitude);

}, true);





//controls变化事件，平移、缩放时对齐map
var cameraPosition = new THREE.Vector3();
var cameraRotation = new THREE.Vector3();
controls.addEventListener("change", function (e) {
  // console.log(e);
  // console.log(e.target.object.rotation);

  // pan、rotate、zoom的判定
  var mode = "none";
  var NUMBER_MIN = 0.00000001;
  if (
    cameraPosition.y == e.target.object.position.y &&
    Math.abs(cameraRotation.x - e.target.object.rotation.x) < NUMBER_MIN &&
    Math.abs(cameraRotation.y - e.target.object.rotation.y) < NUMBER_MIN &&
    Math.abs(cameraRotation.z - e.target.object.rotation.z) < NUMBER_MIN
  ) {
    mode = "pan";
  } else {
    if (Math.abs(cameraRotation.x - e.target.object.rotation.x) < NUMBER_MIN &&
      Math.abs(cameraRotation.y - e.target.object.rotation.y) < NUMBER_MIN &&
      Math.abs(cameraRotation.z - e.target.object.rotation.z) < NUMBER_MIN) {
      mode = "zoom"
    } else {
      mode = "rotate";
    }
  }
  cameraPosition.copy(e.target.object.position);
  cameraRotation.copy(e.target.object.rotation);
  // console.log(mode);

  if (mode === "rotate") {
    return;
  }

  dq();
  
});

//地图对齐
function dq() {
  //屏幕中心点-->摄像机平面坐标
  // var a = new THREE.Vector3( 0.5, 0.5, 0 ).unproject( camera );
  // console.log(a);
  // mapObject.position.x = a.x;
  // mapObject.position.y = a.y;
  // mapObject.position.z = a.z;
  
  //屏幕中心点-->plane平面坐标
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  var pos = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, pos);
  // console.log(pos);
  
  var centerLongitude = world2longitude(pos.x);
  var centerLatitude = world2latitude(pos.z);
  // console.log('center long', centerLongitude, 'center lat', centerLatitude);
  
  var distance = raycaster.ray.distanceToPlane(plane);
  
  var scale = distance / distanceRef;
  
  var mapWidth = mapDomWidth * scale;//
  var mapHeight = mapDomHeight * scale;//
  
  var mapCenterLonLat = transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326')
  // console.log(mapCenterLonLat);
  
  //纬度限制
  if (world2latitude(pos.z - mapHeight / 2) < 85
  && world2latitude(pos.z + mapHeight / 2) > -85) {

    //平移、缩放mapObject，保持css3对象在屏幕坐标系的大小不变
    
    //地图对齐，中心点
    mapObject.position.x = pos.x;
    mapObject.position.z = pos.z;
    map.getView().setCenter(fromLonLat([centerLongitude, centerLatitude]));

    //地图对齐，zoomLevel
    // 限制最大zoomLevel
    let zoomLevel = Math.log2(360.0 * (mapDomWidth) / 256.0 / (mapWidth / LONGITUDE_X));
    console.log('zoomLevel', zoomLevel)
    if (zoomLevel < 5) {
      mapObject.scale.set(scale, scale, scale);
      
      map.getView().setZoom(zoomLevel);
    }

  } else {
    //平移mapObject，x轴
    mapObject.position.x = pos.x;

    //地图对齐，经度方向
    map.getView().setCenter(fromLonLat([centerLongitude, mapCenterLonLat[1]]));
    
    return;
  }

  return;
  
  //弃用，通过指定显示经纬度区域对齐
  // if (mode === 'zoom'){
  if (0) {
    var extent = ol.proj.transformExtent(
      [
        mapObject.position.x - lonSize / 2,
        -mapObject.position.z + latSize / 2,
        mapObject.position.x + lonSize / 2,
        -mapObject.position.z - latSize / 2
      ],
      "EPSG:4326", "EPSG:3857"
    );
    console.log([
      mapObject.position.x - lonSize / 2,
      -mapObject.position.z + latSize / 2,
      mapObject.position.x + lonSize / 2,
      -mapObject.position.z - latSize / 2
    ])
    map.getView().fit(extent, map.getSize());
    // map.getView().fit(extent, { constrainResolution: false });
  }

}




// camera初始位置
camera.position.set(longitude2world(121), cameraY, latitude2world(21));
controls.target = new THREE.Vector3(longitude2world(121), 0, latitude2world(21))
// camera.updateProjectionMatrix ()
// controls.update();

renderer.render(scene, camera);
renderer2.render(scene2, camera);


//初始对齐
// map.getView().setCenter(ol.proj.fromLonLat([121, 21]));
// mapObject.position.x = longitude2world(121);
// mapObject.position.z = latitude2world(21);
// mapObject.scale.set(100, 100, 100);
dq()