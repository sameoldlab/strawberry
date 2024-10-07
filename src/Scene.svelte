<script lang="ts">
  import { getThree } from "./lib/threeCtx";
  import * as T from "three/src/Three.js";
  import { OrbitControls } from "three/addons/controls/OrbitControls.js";
  import roughness from "./assets/Poliigon_PlasticMoldDryBlast_7495_Roughness.png";

  const ctx = getThree();
  const { scene, camera, renderer, animate } = ctx;

  const origin = new T.Vector3(0, 3, 0);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enablePan = false;
  orbit.enableDamping = true;
  orbit.target = origin;
  orbit.maxZoom = 16;
  orbit.maxDistance = 16;
  orbit.minDistance = 4;
  orbit.minZoom = 4;
  orbit.update();

  const boxGeo = new T.SphereGeometry(3, 32, 32);
  const glossy = new T.MeshStandardMaterial({
    color: "#ae2a37",
    roughness: 1,
  });

  const roughnessMap = new T.TextureLoader().load(roughness);
  roughnessMap.magFilter = T.NearestFilter;
  glossy.roughnessMap = roughnessMap;

  const box = $state(new T.Mesh(boxGeo, glossy));
  box.position.y = 4;
  box.castShadow = true;

  // Floor
  const shadowCatcher = new T.Mesh(
    new T.CircleGeometry(100, 100),
    new T.ShadowMaterial({
      opacity: 0.4,
    }),
  );
  shadowCatcher.receiveShadow = true;
  shadowCatcher.rotation.x = -Math.PI / 2;
  // plane

  // Light
  let light = new T.DirectionalLight(0xffffff, 3);
  light.position.set(10, 20, 10);
  light.target.position.set(0, 4, 0);
  light.castShadow = true;
  const D = 10;
  light.shadow.camera.left = -D;
  light.shadow.camera.right = D;
  light.shadow.camera.top = D;
  light.shadow.camera.bottom = -D;
  // const ambient = new T.AmbientLight("pink", 0.5);
  let t = 0;
  animate(() => {
    t++;
    box.position.y += Math.cos(t * 0.005 - Math.random()) / 250;
    orbit.update();

    // box.rotation.x += 0.002;
    // box.rotation.y += 0.002;
    // orbit.update();
  });

  scene.add(light, box, shadowCatcher);
</script>
