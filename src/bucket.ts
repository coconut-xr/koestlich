import { Group, InstancedMesh, Matrix4, Vector3 } from "three";
import { ScrollHandler } from "./scroll-handler.js";

export class Bucket extends Group {
  public screenSpaceZ?: number;
  public inverseMatrixWorld = new Matrix4();

  /**
   * maps the pointer id to the first point where the ui was pressed
   */
  pointerStateMap = new Map<
    number,
    { pressPoint: Vector3; pressedHandlers: Set<ScrollHandler>; isDrag: boolean }
  >();

  pixelDragThresholdSquared = 0;

  updateInverseMatrixWorld(): void {
    this.updateWorldMatrix(true, false);
    this.inverseMatrixWorld.copy(this.matrixWorld).invert();
  }

  worldToLocal(vector: Vector3): Vector3 {
    return vector.applyMatrix4(this.inverseMatrixWorld);
  }

  /*addInstancedMesh(): Control {
        //finds a bucket to put this in
    }

    removeInstancedMesh(control: Control): void {

    }*/
}

export type ControlledInstancedMesh = InstancedMesh & {
  add(): void;
  update(): void;
  remove(): void;
};
