import { ObjectType } from "./../utils/interface"
import * as THREE from "three"

export function createExtrudedPolygon(controlPoints: THREE.Mesh[]) {
	const cps = controlPoints.map((cp) => {
		return new THREE.Vector2(cp.position.x, -1 * cp.position.z)
	})
	const shape = new THREE.Shape(cps)
	const extrudeSettings = {
		steps: 20,
		depth: 1,
		amount: 5,
		bevelEnabled: false,
	}
	const extrudeGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
	extrudeGeom.rotateX(-Math.PI / 2)
	const polygon = new THREE.Mesh(
		extrudeGeom,
		new THREE.MeshStandardMaterial({
			color: 0x00a9ff,
			wireframe: false,
			side: THREE.DoubleSide,
		})
	)
	for (let i = 0; i < controlPoints.length; i++) {
		polygon.add(controlPoints[i])
	}
	polygon.userData.controlPoints = controlPoints
	polygon.userData.extrudeSettings = extrudeSettings
	polygon.userData.objectType = ObjectType.Polygon
	return polygon
}
