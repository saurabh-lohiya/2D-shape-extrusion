import { ThreeScene } from "./initScene"
import * as dat from "dat.gui"
import { Mode, editMode } from "./utils/interface"

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

extrudeFolder
	.add(extrudeOptions, "extrusionHeight", 0.5, 5)
	.onChange((value) => {
		// Update the extrusion height of the selected object
		threeScene.extrudeSelectedShape(value)
	})

document.body.appendChild(threeScene.renderer.domElement)
window.addEventListener("pointermove", (e) => {
	threeScene.onPointerMove(e)
})
window.addEventListener("mousedown", threeScene.onPointerDown.bind(threeScene))
window.addEventListener("pointerup", threeScene.onPointerUp.bind(threeScene))
window.addEventListener(
	"resize",
	threeScene.updateOnWindowResize.bind(threeScene)
)
