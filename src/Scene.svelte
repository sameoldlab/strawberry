<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { interactivity, OrbitControls } from "@threlte/extras";
  import { spring } from "svelte/motion";

  interactivity();
  const scale = spring(1);

  let rotation = 0;
  useTask((delta) => {
    rotation += delta;
  });
</script>

<T.PerspectiveCamera makeDefault position.y={16} fov={50}>
  <OrbitControls enableZoom={false} enablePan={false} />
</T.PerspectiveCamera>
<T.Mesh
  rotation.y={rotation}
  rotation.z={rotation}
  rotation.x={rotation}
  position.y={2}
  scale={$scale}
  castShadow
  onpointerenter={() => {
    scale.set(4);
  }}
  onpointerleave={() => {
    scale.set(1);
  }}
>
  <T.BoxGeometry />
  <T.MeshStandardMaterial color="#ff0000" />
</T.Mesh>

<!-- Floor -->
<T.GridHelper args={[100, 100]} />

<T.DirectionalLight position={[0, 10, 10]} castShadow />
<T.AmbientLight intensity={0.3} />
