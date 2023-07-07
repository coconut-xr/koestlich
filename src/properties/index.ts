import { YogaProperties } from "@coconut-xr/flex";

export type PropertyAPISet<T, V> = (target: T, value: V, key: string) => void;

export type GetPropertyAPISetTarget<P extends PropertyAPISet<any, any>> = P extends (
  target: infer T,
  value: any,
  key: any,
) => void
  ? T
  : never;

export type GetPropertyAPISetValue<P extends PropertyAPISet<any, any>> = P extends (
  target: any,
  value: infer V,
  key: any,
) => void
  ? V
  : never;

export type PropertyAPI = {
  [Key in string]: PropertyAPISet<any, any>;
};

export type PropertiesFromAPI<T, A extends PropertyAPI> = {
  [Key in keyof A as T extends GetPropertyAPISetTarget<A[Key]>
    ? undefined extends GetPropertyAPISetValue<A[Key]>
      ? Key
      : never
    : never]?: GetPropertyAPISetValue<A[Key]> | never;
} & {
  [Key in keyof A as T extends GetPropertyAPISetTarget<A[Key]>
    ? undefined extends GetPropertyAPISetValue<A[Key]>
      ? never
      : Key
    : never]: GetPropertyAPISetValue<A[Key]> | never;
};

export type First<T extends Array<any>> = ((...val: T) => void) extends (
  first: infer F,
  ...rest: Array<any>
) => void
  ? F
  : never;
export type Rest<T extends Array<any>> = ((...val: T) => void) extends (
  first: any,
  ...rest: infer R
) => void
  ? R
  : never;

export type ObjectAssign<A> = A extends Array<unknown>
  ? A["length"] extends 0
    ? Record<string, never>
    : A["length"] extends 1
    ? First<A>
    : First<A> & ObjectAssign<Rest<A>>
  : Record<string, never>;

export function combinePropertyAPIs<T extends Array<PropertyAPI>>(...apis: T): ObjectAssign<T> {
  return Object.assign({}, ...apis);
}

export function alias<T = YogaProperties, K extends keyof T = keyof T>(
  ...keys: Array<K>
): PropertyAPISet<{ [Key in K]: T[Key] }, T[K]> {
  return (target, value) => {
    if (value == null) {
      return;
    }
    for (const key of keys) {
      target[key] = value;
    }
  };
}

export function flag<K extends string, V>(
  key: K,
  value: V,
): PropertyAPISet<{ [Key in K]: V }, boolean | undefined> {
  return (target, flag) => {
    if (flag) {
      target[key] = value;
    }
  };
}

export function translateProperties<P extends YogaProperties, A extends PropertyAPI>(
  api: A,
  ...propertiesList: Array<Partial<P & PropertiesFromAPI<P, A>>>
): P {
  const result = {} as P;
  for (const properties of propertiesList) {
    for (const [key, value] of Object.entries(properties)) {
      const apiEntry = api[key];
      if (apiEntry == null) {
        //no translation necassary just assign property to result:
        result[key as keyof YogaProperties] = (value as any) ?? result[key as keyof YogaProperties];
        continue;
      }
      api[key]?.(result, value, key);
    }
  }
  return result;
}

export * from "./flex.js";
export * from "./tailwind.js";
