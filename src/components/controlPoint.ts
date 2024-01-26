import { ObjectType } from "./../utils/interface"
import * as THREE from "three"

export function addControlPoint(position: THREE.Vector3) {
	const cp = new THREE.Mesh(
		new THREE.SphereGeometry(0.3, 80, 80),
		new THREE.MeshStandardMaterial({ color: "red" })
	)
	cp.position.copy(position)
	cp.userData.objectType = ObjectType.ControlPoint
	return cp
}
