// https://forum.babylonjs.com/t/drawing-a-polygon-in-3d-space-and-extruding-it/27666
import * as BABYLON from "babylonjs"
import { Scene } from "babylonjs"

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement
const engine = new BABYLON.Engine(canvas, true)
export let scene: Scene = new BABYLON.Scene(engine)
var light = new BABYLON.PointLight('light', new BABYLON.Vector3(0, 1, 0), scene);
light.position = new BABYLON.Vector3(0, 5, 0);

let camera = new BABYLON.ArcRotateCamera(
	"Camera",
	Math.PI / 2,
	Math.PI / 2,
	2,
	new BABYLON.Vector3(0, 0, 0),
	scene
)
camera.setPosition(new BABYLON.Vector3(0, 0, -20))
camera.attachControl(canvas, true)

const createScene = () => {
	const myPoints = [
		new BABYLON.Vector3(-2, 0, 0),
		new BABYLON.Vector3(0, 1, 0),
		new BABYLON.Vector3(2, -1, 0),
		new BABYLON.Vector3(2, 1, 0),
		new BABYLON.Vector3(12, 1, 0),
		new BABYLON.Vector3(-2, 0, 0),
	]
	let lines = BABYLON.MeshBuilder.CreateLines("lines", { points: myPoints }, scene);
};

createScene();

engine.runRenderLoop(() => {
	scene.render();
});
