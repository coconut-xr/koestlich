import Image from '@theme/IdealImage';
import { CodesandboxEmbed } from '../CodesandboxEmbed.tsx'

# Text

The Text component enables rendering text using multi-channel signed distance functions (MSDF). A font can be created from a .ttf file to an MSDF representation as a JSON and a corresponding texture using [`msdf-bmfont-xml`](https://www.npmjs.com/package/msdf-bmfont-xml). We provide a set of precompiled MSDF fonts from [here](https://github.com/coconut-xr/msdf-fonts). In the following, a Text is rendered with the Roboto font family.

<CodesandboxEmbed path="koestlich-text-b8ymnm"/>

<Image img={require('@site/static/images/text.png')}/>

```tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RootContainer, Container, Text } from "@coconut-xr/koestlich";
import { Suspense } from "react";

export default function App() {
  return (
    <Canvas>
      <OrbitControls />
      <RootContainer backgroundColor="red" sizeX={2} sizeY={1} flexDirection="row">
        <Container index={0} flexGrow={1} margin={48} backgroundColor="green" />
        <Suspense>
          <Text fontSize={64} index={1} margin={48} marginLeft={0}>
            Coconut XR
          </Text>
        </Suspense>
      </RootContainer>
    </Canvas>
  );
}
```

Via the `FontFamilyProvider`, additional MSDF fonts can be added.

```tsx
<FontFamilyProvider
  fontFamilies={{
    otherFont: ["<baseUrl>", "<pathToJson>"],
  }}
  defaultFontFamily="otherFont"
></FontFamilyProvider>
```

For text fields and text areas, we provide the [@coconut-xr/input](https://github.com/coconut-xr/input) library.

<CodesandboxEmbed path="koestlich-input-example-4ubrt0"/>

<Image img={require('@site/static/images/text.gif')}/>
