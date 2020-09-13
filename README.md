# threejs-map
在Threejs中嵌入Openlayers地图

## 快速开始
```
npm install

npm run start
```
## 说明
-实现了在Threejs场景中添加Openlayers地图
-Openlayers地图元素作为Threejs的css3d对象置入scene
-在平移、缩放、旋转操作时，保持该css3d对象在屏幕坐标的位置和大小不变，同时根据该css3d对象在Threejs world坐标中位置计算Openlayers中地图的显示区域
-最终效果等同于在Threejs的world中添加了一个地图图层
