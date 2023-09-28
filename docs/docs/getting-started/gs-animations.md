import Image from '@theme/IdealImage';
import { CodesandboxEmbed } from '../CodesandboxEmbed.tsx'

# Animations

Animations are built into **koestlich** and work out of the box. Almost all properties can be animated. In contrast to HTML/CSS, elements can transition from one place in a layout to another, a feature often referred to as AutoTransition. To declare how UI elements relate between two different layouts, the `id` property is used. Placing the same `id` property on two UI components in different layouts will keep the underlying UI element alive and automatically transition. However, both UI components need to have the same type. Therefore, it is impossible to transition an Image to a Text component.
All Koestlich components have the `animation` property, which can either be set to one of the default animations (`noAnimation`, `distanceFadeAnimation` - default) or can be set to a custom animation.

The following example shows how the state is controlled via a button, which changes the ordering of components via the index parameter and animates the button's color between green and red.

<CodesandboxEmbed path="koestlich-animations-gnthy9"/>

<Image img={require('@site/static/images/animations.gif')}/>

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootContainer, Container, Image } from "@coconut-xr/koestlich";
import { Suspense, useState } from "react";

export default function App() {
  const [state, setState] = useState(true);
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="black" sizeX={2} sizeY={1} flexDirection="row">
        <Container
          index={0}
          id="btn"
          onClick={() => setState(!state)}
          flexGrow={state ? 2 : 1}
          margin={48}
          backgroundColor={state ? "green" : "red"}
        />
        <Suspense>
          <Image
            index={state ? -1 : 1}
            id="img"
            flexBasis={0}
            flexGrow={1}
            margin={48}
            url="example.png"
          />
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```
