import { Vector2 } from "three"

export enum Mode {
	Draw = "draw",
	Move = "move",
	EditVertex = "editVertex",
	Extrude = "extrude",
}

export interface IPolygon {
	[key: number]: Vector2[]
}

export interface IPolygonCords {
	[key: string]: number
}

interface IEnumMode {
	[key: string]: Mode
}

export const editMode: IEnumMode = {
	Draw: Mode.Draw,
	Move: Mode.Move,
	["Edit Vertex"]: Mode.EditVertex,
	Extrude: Mode.Extrude,
}

export enum ObjectType {
	ControlPoint = "controlPoint",
	Fixed = "fixed",
	Polygon = "polygon",
	ExtrudedPolygon = "extrudedPolygon",
}