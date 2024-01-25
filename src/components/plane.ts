import * as THREE from "three"

export function createPlane(
	color: number = 0xffffff,
	transparent: boolean = false,
	opacity: number = 1,
	rotation: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
) {
	const geometry = new THREE.PlaneGeometry(2000, 2000)
	const material = new THREE.MeshStandardMaterial({
		color: new THREE.Color(color),
		side: THREE.DoubleSide,
		transparent,
		opacity,
	})
	const plane = new THREE.Mesh(geometry, material)
	plane.rotation.set(rotation.x, rotation.y, rotation.z)
	// plane.position.y = 0
	return plane
}
