import { Group, InstancedMesh, Matrix4, Vector3 } from "three";

export class Bucket extends Group {
  public screenSpaceZ?: number;
  public inverseMatrixWorld = new Matrix4();

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
