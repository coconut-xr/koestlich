# Advanced

## Classes, DefaultStyleProvider, and Custom Property APIs

The developer experience of the web with CSS is widely adopted. Therefore we implemented supports for classes and inherited property values. The following code shows how classes and the DefaultStyleProvider can reduce style descriptions. In the following example, the DefaultStyleProvider sets the padding values of all descendants to 0.1, and the "blue" class provides a blue backgroundColor to two components.

```tsx
import { Canvas } from "";
import { OrbitControls } from "";
import { RootContainer, Container, FLEX, DefaultStyleProvider } from "@coconut-xr/koestlich";

const blue: FLEX = {
  backgroundColor: "blue",
};

export default function Index() {
  return (
    <Canvas>
      <OrbitControls />

      <DefaultStyleProvider<typeof flexAPI> padding={0.1}>
        <RootContainer backgroundColor="red" width={2} height={1} flexDirection="row">
          <Container flexGrow={1} padding={0.1} classes={[blue]} />
          <Container flexGrow={1} padding={0.1} backgroundColor="green" />
          <Container flexGrow={1} padding={0.1} classes={[blue]} />
        </RootContainer>
      </DefaultStyleProvider>
    </Canvas>
  );
}
```

Additionally, we allow overwriting the property API to create custom properties for multiple component types.

```tsx
import { Canvas } from "";
import { OrbitControls } from "";
import { Suspense } from "react";
import {
  RootContainer,
  useContainer,
  useImage,
  flexApi,
  ContainerNode,
  ImageNode,
  buildComponent,
} from "@coconut-xr/koestlich";

const customAPI = {
  ...flexAPI,
  variant: (target: any, value: "danger" | "success") => {
    target.backgroundColor = {
      danger: 0xff0000,
      success: 0x00ff00,
    }[value];
  },
};

const CustomContainer = buildComponent(ContainerNode, useContainer, customAPI);
const CustomImage = buildComponent(ImageNode, useImage, customAPI);

export default function Index() {
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer width={2} height={1} flexDirection="row">
        <CustomContainer index={0} flexGrow={1} variant="danger" />
        <Suspense>
          <Image index={1} flexGrow={1} variant="success" padding={0.1} url="example.png" />
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```
