import { ThreeScene } from "./initScene"
import * as dat from "dat.gui"
import { Mode, editMode } from "./utils/interface"

const threeScene = new ThreeScene()

const gui = new dat.GUI()
let modeController = gui.add(threeScene, "mode", Object.keys(editMode))
modeController.setValue(Mode.Draw)
gui.updateDisplay()
gui.domElement.style.opacity = "1"
gui.add(threeScene, "extrusionHeight", 1, 20, 1).setValue(5)

modeController.onChange((value: Mode) => {
	threeScene.updateMode(editMode[value])
})

document.body.appendChild(threeScene.renderer.domElement)

gui.domElement.addEventListener(
	"mousedown",
	function (event) {
		event.stopPropagation()
	},
	false
)

window.addEventListener("pointermove", (e) => {
	threeScene.onPointerMove(e)
})
window.addEventListener("mousedown", threeScene.onPointerDown.bind(threeScene))
window.addEventListener("keyup", threeScene.onKeyUp.bind(threeScene))
window.addEventListener("pointerup", threeScene.onPointerUp.bind(threeScene))
window.addEventListener("keypress", (e) => {
	threeScene.moveObjectsInThreeD(e)
})
window.addEventListener(
	"resize",
	threeScene.updateOnWindowResize.bind(threeScene)
)
