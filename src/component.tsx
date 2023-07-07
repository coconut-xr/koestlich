import { forwardRef, ReactNode, useEffect } from "react";
import { BaseNode, NodeClass, useNode } from "./node.js";
import React from "react";
import {
  BaseNodeContextProvider,
  useBaseNodeContext,
  useDefaultStyles,
  useRootStorage,
} from "./root.js";
import { PropertiesFromAPI, PropertyAPI, translateProperties } from "./properties/index.js";
import { YogaProperties } from "@coconut-xr/flex";
import { MutableRefObject } from "react";

export type UseComponent<T extends BaseNode, P, C> = (
  node: T,
  properties: P,
  children: C | undefined,
) => ReactNode | undefined;

export function buildComponent<
  T extends BaseNode,
  P extends YogaProperties,
  C,
  A extends PropertyAPI,
>(nodeClass: NodeClass<T>, useComponent: UseComponent<T, P, C>, api: A) {
  // eslint-disable-next-line react/display-name
  return forwardRef<
    T | undefined,
    P &
      PropertiesFromAPI<P, A> & {
        index?: number;
        id?: string;
        children?: C;
        classes?: Array<Partial<P & PropertiesFromAPI<P, A>>>;
        ref?: MutableRefObject<T | undefined>;
      }
  >(({ id, index, children, classes, ...props }, ref) => {
    const defaultProperties = useDefaultStyles();
    const properties = translateProperties<P, A>(
      api,
      defaultProperties ?? {},
      ...(classes ?? []),
      props as any,
    );
    const storage = useRootStorage();
    const parent = useBaseNodeContext();
    const node = useNode(storage, parent.id, index, id, nodeClass, ref);
    const reactChildren = useComponent(node, properties, children);

    useEffect(() => {
      if (node.setParent(parent) || node.index != index) {
        node.index = index ?? 0;
        storage.requestLayoutCalculation();
      }
    });

    useEffect(
      () => () => {
        node.destroy();
        storage.requestLayoutCalculation();
      },
      [node],
    );
    return children == null ? null : (
      <BaseNodeContextProvider value={node}>{reactChildren}</BaseNodeContextProvider>
    );
  });
}
