import {
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  RepeatWrapping,
  sRGBEncoding,
  Texture,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { BaseNode } from "../node.js";
import { buildRoot } from "../root.js";
import { Vector1 } from "../vector.js";
import { buildComponent } from "../component.js";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { useLoader } from "@react-three/fiber";
import { ReactNode, useEffect, useMemo } from "react";
import { flexAPI } from "../properties/index.js";
import {
  ContainerProperties,
  ContainerState,
  updateContainerProperties,
  updateEventProperties,
} from "./container.js";
import { linkBackground, updateBackgroundValues } from "../background.js";
import { BackgroundMaterial } from "../background-material.js";
import { InvertOptional } from "./text.js";
import { applyEventHandlers } from "../events.js";

const geometry = new PlaneGeometry();
geometry.translate(0.5, -0.5, 0);

export type ImageState = {
  opacity: Vector1;
  imageOffset: Vector2;
  imageScale: Vector2;
} & ContainerState;

export type ImageFit = "cover" | "contain" | "fill";

export class ImageNode extends BaseNode<ImageState> {
  public target: Readonly<ImageState> = {
    opacity: new Vector1(),
    translate: new Vector3(),
    scale: new Vector3(),
    imageOffset: new Vector2(),
    imageScale: new Vector2(),
    backgroundColor: new Vector3(),
    backgroundOpacity: new Vector1(),
    borderColor: new Vector3(),
    borderOpacity: new Vector1(),
    borderRadius: new Vector4(),
    borderSize: new Vector4(),
  };
  private material = new MeshBasicMaterial({
    transparent: true,
    toneMapped: false,
  });
  private mesh = new Mesh(geometry, this.material);

  private backgroundMaterial = new BackgroundMaterial({
    transparent: true,
    toneMapped: false,
  });
  private backgroundMesh = new Mesh(geometry, this.backgroundMaterial);

  private fit: ImageFit = "fill";

  applyRenderOrder(renderOrder: number): void {
    this.mesh.renderOrder = renderOrder + 0.5;
    this.backgroundMesh.renderOrder = renderOrder;
  }

  applyClippingPlanes(planes: Plane[] | null): void {
    this.backgroundMaterial.clippingPlanes = planes;
    this.backgroundMaterial.needsUpdate = true;

    this.material.clippingPlanes = planes;
    this.material.needsUpdate = true;
  }

  linkCurrent(current: ImageState): void {
    //link global transformation directly (more efficiently then in onUpdate)
    linkBackground(current, this.backgroundMesh, this.backgroundMaterial);
  }

  setTexture(texture: Texture): void {
    if (this.material.map === texture) {
      return;
    }
    this.material.map = texture;
    this.material.needsUpdate = true;
    this.computeImageTransformation();
  }

  setFit(fit: ImageFit): void {
    if (this.fit === fit) {
      return;
    }
    this.fit = fit;
    this.computeImageTransformation();
  }

  onInit() {
    this.bucket.add(this.mesh);
    this.bucket.add(this.backgroundMesh);
    applyEventHandlers(this.mesh, this, this.root);
  }

  onLayout(): void {
    this.computeImageTransformation();
  }

  computeImageTransformation(): void {
    this.target.imageScale.set(1, 1);
    this.target.imageOffset.set(0, 0);

    const meshRatio = this.target.scale.y === 0 ? 0 : this.target.scale.x / this.target.scale.y;

    const texture = this.material.map;
    texture?.matrix.identity();
    if (this.fit === "fill" || texture == null) {
      return;
    }

    const textureRatio = texture.image.width / texture.image.height;

    if (this.fit === "cover") {
      if (textureRatio > meshRatio) {
        texture.matrix
          .translate(-(0.5 * (meshRatio - textureRatio)) / meshRatio, 0)
          .scale(meshRatio / textureRatio, 1);
      } else {
        texture.matrix
          .translate(0, -(0.5 * (textureRatio - meshRatio)) / textureRatio)
          .scale(1, textureRatio / meshRatio);
      }
      return;
    }

    //contain
    if (textureRatio > meshRatio) {
      this.target.imageScale.y *= meshRatio / textureRatio;
      this.target.imageOffset.y -= (0.5 * (textureRatio - meshRatio)) / textureRatio;
    } else {
      this.target.imageScale.x *= textureRatio / meshRatio;
      this.target.imageOffset.x += (0.5 * (meshRatio - textureRatio)) / meshRatio;
    }
  }

  onUpdate(current: ImageState): void {
    this.mesh.position
      .set(current.imageOffset.x, current.imageOffset.y, 1) //the "1" offset in z gets scaled with the depth which is minimal
      .multiply(current.scale)
      .add(current.translate);
    this.mesh.scale.set(current.imageScale.x, current.imageScale.y, 1).multiply(current.scale);

    this.material.opacity = current.opacity.x;
    this.mesh.visible = current.opacity.x > 0.001;

    updateBackgroundValues(current, this.backgroundMesh, this.backgroundMaterial);
  }

  onCleanup(): void {
    this.bucket.remove(this.mesh);
  }
}

export const imageDefaults: Omit<InvertOptional<ImageProperties>, keyof ContainerProperties> = {
  fit: "fill",
  opacity: 1,
};

export type ImageProperties = {
  fit?: "cover" | "contain" | "fill";
  url: string;
  opacity?: number;
} & ContainerProperties;

export function useImage(
  node: ImageNode,
  { url, opacity, fit, ...props }: ImageProperties,
  children: ReactNode | undefined,
): ReactNode | undefined {
  const t = useLoader(TextureLoader, url);
  const texture = useMemo(() => t.clone(), [t]); //clone since we change parameters on the texture (can be removed when we use instancing for the images)
  texture.encoding = sRGBEncoding;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.matrixAutoUpdate = false;
  useEffect(() => {
    //updates in use effect to respect the lifcycles
    updateContainerProperties(node, props);
    updateEventProperties(node, props);

    node.target.opacity.set(opacity ?? imageDefaults["opacity"]);
    node.setTexture(texture);
    props.aspectRatio = texture.image.width / texture.image.height;
    node.setFit(fit ?? imageDefaults["fit"]);
    node.computeImageTransformation();
    node.setProperties(props);
  });
  return children;
}

export const Image = buildComponent(ImageNode, useImage, flexAPI);
export const RootImage = buildRoot(ImageNode, useImage, flexAPI);
