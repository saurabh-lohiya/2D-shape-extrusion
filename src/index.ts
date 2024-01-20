import { ThreeScene } from "./initScene"
import * as dat from "dat.gui"

const threeScene = new ThreeScene()
const gui = new dat.GUI()

const extrudeFolder = gui.addFolder("Extrude")
const extrudeOptions = {
	extrusionHeight: 5,
}

var drawModeController = gui
	.add(threeScene, "drawMode", false)
	.onChange((value) => {
		threeScene.drawMode = value
		// Update move mode to false when draw mode is enabled
		if (value) {
			threeScene.moveMode = false
			moveModeController.updateDisplay()
		}
	})
var moveModeController = gui
	.add(threeScene, "moveMode", false)
	.onChange((value) => {
		threeScene.moveMode = value
		// Update drawmode to false when move mode is enabled
		if (value) {
			threeScene.drawMode = false
			drawModeController.updateDisplay()
		}
	})

extrudeFolder.add(extrudeOptions, "extrusionHeight", 0, 5).onChange((value) => {
	// Update the extrusion height of the selected object
	console.log(threeScene.selectedObject)
	if (threeScene.selectedObject) {
		threeScene.selectedObject.scale.y = value
	}
})

document.body.appendChild(threeScene.renderer.domElement)

threeScene.addHorizontalPlane()

threeScene.renderer.setAnimationLoop(() => {
	threeScene.renderer.render(threeScene.scene, threeScene.camera)
})

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
