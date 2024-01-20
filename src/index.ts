import { ThreeScene } from "./initScene"
import * as dat from "dat.gui"

export enum Mode {
	Draw = "draw",
	Move = "move",
	EditVertex = "editVertex",
	Extrude = "extrude",
}
interface IEnumMode {
	[key: string]: Mode
}
const editMode: IEnumMode = {
	Draw: Mode.Draw,
	Move: Mode.Move,
	["Edit Verted"]: Mode.EditVertex,
	Extrude: Mode.Extrude,
}
const threeScene = new ThreeScene()

const gui = new dat.GUI()
let modeController = gui.add(threeScene, "mode", Object.keys(editMode))
modeController.setValue(Mode.Draw).updateDisplay()
modeController.onChange((value) => {
	threeScene.updateMode(editMode[value])
})

const extrudeFolder = gui.addFolder("Extrude")
const extrudeOptions = {
	extrusionHeight: 5,
}
extrudeFolder.add(extrudeOptions, "extrusionHeight", 0, 5).onChange((value) => {
	// Update the extrusion height of the selected object
	threeScene.extrudeSelectedShape(value)
})

document.body.appendChild(threeScene.renderer.domElement)
window.addEventListener("pointermove", (e) => {
	threeScene.onPointerMove(e)
})
window.addEventListener("mousedown", threeScene.onPointerDown.bind(threeScene))
window.addEventListener("pointerup", threeScene.onPointerUp.bind(threeScene))
window.addEventListener("resize", () => {
	threeScene.camera.aspect = window.innerWidth / window.innerHeight
	threeScene.camera.updateProjectionMatrix()
	threeScene.renderer.setSize(window.innerWidth, window.innerHeight)
})
