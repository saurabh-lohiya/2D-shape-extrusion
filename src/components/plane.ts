import * as THREE from "three"

export function createPlane() {
	const geometry = new THREE.PlaneGeometry(50, 50)
	const material = new THREE.MeshStandardMaterial({
		color: new THREE.Color(0xffffff),
		side: THREE.DoubleSide,
	})
	const plane = new THREE.Mesh(geometry, material)
	plane.rotateX(-Math.PI / 2)
	plane.position.y = 0
	return plane
}
