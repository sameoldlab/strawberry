import { MeshStandardMaterial, NearestFilter, SphereGeometry, TextureLoader } from "three";
import roughness from "./assets/Poliigon_PlasticMoldDryBlast_7495_Roughness.png";

// const { scene, camera, renderer, animate } ;
const roughnessMap = new TextureLoader().load(roughness);
roughnessMap.magFilter = NearestFilter;
const glossyMat = (color = '#ae2a37') => new MeshStandardMaterial({
  color,
  roughness: 1,
  roughnessMap
});

export default glossyMat
