/* eslint-disable react/no-unknown-property */
import React, {
  createContext,
  forwardRef,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Bucket } from "./bucket.js";
import { UseComponent } from "./component.js";
import { BaseNode, NodeClass, useNode } from "./node.js";
import { Euler, useFrame, useThree, Vector3, Vector3Props } from "@react-three/fiber";
import {
  flexAPI,
  PropertiesFromAPI,
  PropertyAPI,
  translateProperties,
} from "./properties/index.js";
import { YogaProperties, loadYoga as loadYogaFromGHP } from "@coconut-xr/flex";
import { Yoga } from "yoga-wasm-web";
import { suspend } from "suspend-react";
import { cameraWorldPosition, patchRenderOrder } from "./index.js";

const BaseNodeContext = createContext<BaseNode>(null as any);

export const BaseNodeContextProvider = BaseNodeContext.Provider;

export function useBaseNodeContext(): BaseNode {
  const context = useContext(BaseNodeContext);
  if (context == null) {
    throw `unable to find flex context. Missing a BaseNodeContextProvider.`;
  }
  return context;
}

export type RootStorage = {
  yoga: Yoga;
  requestLayoutCalculation: () => void;
  precision: number;
  nodeMap: Map<string, BaseNode>;
  bucket: Bucket;
};

const storageContext = createContext<RootStorage>(null as any);
const defaultStyleContext = createContext<any>(null as any);

export const useDefaultStyles = useContext.bind(null, defaultStyleContext);

export function DefaultStyleProvider<P = YogaProperties, A extends PropertyAPI = typeof flexAPI>({
  children,
  ...props
}: PropsWithChildren<P & PropertiesFromAPI<P, A>>) {
  const existingDefaultSytles = useDefaultStyles();
  const value = useMemo(
    () => (existingDefaultSytles == null ? props : { ...existingDefaultSytles, ...props }),
    [existingDefaultSytles, props],
  );
  return <defaultStyleContext.Provider value={value}>{children}</defaultStyleContext.Provider>;
}

export const useRootStorage = () => useContext(storageContext);

const LoadYogaSymbol = Symbol("loadYoga");

const anchorXMap = { left: 0, center: -0.5, right: -1 };
const anchorYMap = { top: 0, center: 0.5, bottom: 1 };

export function buildRoot<T extends BaseNode, P extends YogaProperties, C, A extends PropertyAPI>(
  nodeClass: NodeClass<T>,
  useComponent: UseComponent<T, P, C>,
  api: A,
) {
  // eslint-disable-next-line react/display-name
  return forwardRef<
    T | undefined,
    Omit<P & PropertiesFromAPI<P, A>, "width" | "height"> & {
      precision?: number;
      id?: string;
      children?: C;
      classes?: Array<Partial<P & PropertiesFromAPI<P, A>>>;
      loadYoga?: () => Promise<Yoga>;
      anchorX?: keyof typeof anchorXMap;
      anchorY?: keyof typeof anchorYMap;
      sizeX?: number;
      sizeY?: number;
      pixelSize?: number;
      position?: Vector3;
      rotation?: Euler;
      dragThreshold?: number;
    }
  >(
    (
      {
        loadYoga = loadYogaFromGHP,
        precision = 0.1,
        id = "root",
        anchorX = "center",
        anchorY = "center",
        position,
        rotation,
        pixelSize = 0.002,
        sizeX,
        sizeY,
        children,
        classes,
        dragThreshold = 16,
        ...props
      },
      ref,
    ) => {
      (props as any).width = sizeX == null ? undefined : sizeX / pixelSize;
      (props as any).height = sizeY == null ? undefined : sizeY / pixelSize;
      const yoga = suspend(loadYoga, [loadYoga, LoadYogaSymbol]);
      const dirtyRef = useRef(false);
      const renderer = useThree(({ gl }) => gl);
      const rootStorage = useMemo<RootStorage>(
        () => ({
          yoga,
          nodeMap: new Map(),
          bucket: new Bucket(),
          precision,
          requestLayoutCalculation: () => (dirtyRef.current = true),
        }),
        [precision, yoga],
      );
      rootStorage.bucket.pixelDragThresholdSquared = dragThreshold * dragThreshold;
      const defaultProperties = useDefaultStyles();
      const properties = translateProperties<P, A>(
        api,
        props as any,
        defaultProperties ?? {},
        ...(classes ?? []),
      );
      const node = useNode(rootStorage, undefined, undefined, id, nodeClass, ref);
      const reactChildren = useComponent(node, properties, children);

      useFrame((state, deltaTime) => {
        cameraWorldPosition.setFromMatrixPosition(state.camera.matrixWorld);
        if (dirtyRef.current) {
          node.calculateLayout();
          dirtyRef.current = false;
        }
        node.update(deltaTime);
        //reset
        rootStorage.bucket.screenSpaceZ = undefined;
        const currentAnimationState = node["current"];
        if (currentAnimationState == null) {
          return;
        }
        rootStorage.bucket.position.x = currentAnimationState.scale.x * anchorXMap[anchorX];
        rootStorage.bucket.position.y = currentAnimationState.scale.y * anchorYMap[anchorY];
        rootStorage.bucket.updateInverseMatrixWorld();
      });
      useEffect(() => patchRenderOrder(renderer), [renderer]);

      useEffect(() => {
        if (node.setParent(undefined)) {
          rootStorage.requestLayoutCalculation();
        }
      });

      return (
        <>
          <storageContext.Provider value={rootStorage}>
            {<BaseNodeContextProvider value={node}>{reactChildren}</BaseNodeContextProvider>}
          </storageContext.Provider>
          {
            <group position={position} scale={pixelSize} rotation={rotation} {...emptyHandlers}>
              {
                // eslint-disable-next-line react/no-unknown-property
                <primitive object={rootStorage.bucket} />
              }
            </group>
          }
        </>
      );
    },
  );
}

const emptyHandlers = {
  onClick: empty,
  onContextMenu: empty,
  onDoubleClick: empty,
  onPointerLeave: empty,
  onPointerUp: empty,
  onPointerOver: empty,
  onPointerEnter: empty,
  onPointerDown: empty,
  onPointerCancel: empty,
  onPointerOut: empty,
};

function empty() {
  //
}
