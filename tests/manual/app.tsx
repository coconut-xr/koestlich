/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/no-unknown-property */
import { Suspense, useMemo, useRef, useState } from "react";
import {
  Image,
  Text,
  SVG,
  Container,
  useContainer,
  GLTF,
  ContainerNode,
  DefaultStyleProvider,
  buildComponent,
  flexAPI,
  Object,
  RootObject,
  RootContainer,
  RootText,
  KoestlichTestCanvas,
  noAnimation,
  SVGFromText,
} from "@coconut-xr/koestlich";
import { Canvas, useFrame } from "@react-three/fiber";
import { Fullscreen } from "./fullscreen.js";
import { OrbitControls } from "@react-three/drei";
import { Group, Mesh, MeshPhongMaterial, MOUSE, PlaneGeometry } from "three";
import { RoundedBoxGeometry } from "three-stdlib/geometries/RoundedBoxGeometry.js";
import { makeBorderMaterial } from "@coconut-xr/xmaterials";
import { XWebPointers, noEvents } from "@coconut-xr/xinteraction/react";

const text = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 133 78">
<path d="M23,72c-2,0-3,2-5,2c-1-2,2-4,2-7c-3,0-4,4-6,4c1-6,9-12,4-12c0,0-10,7-11,6c2-2,10-14,7-14c-1,0-7,4-9,4c0-2,9-10,10-11c2,0,3-2,2-3c-5,0-11,8-15,6l2-2c1-1,16-14,16-16c-3-2-13,6-18,6c22-24,38-33,47-35c7,0,14,2,21,3c0,3,12-1,13-1c5,0,9,4,11,8c0,1,0,2,0,4c3,11,31,7,35,19c0,5,1,9,2,14c-2,4-2,12-6,13c-4,1-4,1-4,1c-3,2-7,5-10,6c0,0-16-6-20-3c-12,4-16,8-19,20l-49-3"/>
<path fill="#FFF" d="M86,22l-1-2h3v2h-2M83,19l-2,1l-1-2h2l1,1M122,57l-1-2c-1,0-1,1-3,1c0-1,0-3,0-4h2l1,2c1-1,2-1,3-1c1,1,1,2,0,3l-2,1M113,56c0-1,0-2,0-3c0-1,1-2,3-2c0,4,0,4-3,5M109,55c0-1-1-3,0-4h2c1,2,0,4-2,4M106,54l-2-2c-1,0-2,1-3,0c-1,0-1-2,0-4c1,0,2,0,3,1v2c1,0,2-1,3-1c1,0,0,2,0,3l-1,1M96,50c-2-1-1-2-1-4c2,0,3,0,4,2c-1,1-2,2-3,2"/>
<path fill="#ED1C24" d="M40,75v-2c-2,0-9,2-9-2c0-2,5-8,3-8c-3-6-7-11-10-17c2-1,0-3,2-6c3-1,2,4,5,3c-4-17,5-22,5-22c-3,0-4,0-6,1c1-7,11-14,17-15c5-1,15-3,18,2c0,1-1,2-1,3c4,0,10-4,15-5c2-1,4-1,7,0l1,2c-7-3-17,3-23,6c-1,0-2,1-3,1l1,1c3,1,4,2,8,2c1,1,2,2,3,3c1,1,2,2,3,2c0-2,0-2-1-4c1-2-1-3,2-5c2,0,2,1,3,1c-4,4-2,8,10,9c1,0,3,1,3-2c-2,0-2-2-2-3l2,1c1,3,27,7,31,12c1,2,0,3-4,5c0,2,2,5,3,6l2-2l1,1c0,2,0,3,0,5v1c-1,0-2,0-3,0c-4-1-9-1-13-1c-11-5-25-16-36-20c-2-1-1-1-4-1c0,2,1,2,3,3c3,4,6,6,5,11l-1,2c-4,0-1-8-4-9c-10,8,5,25,13,20c-4-2-4-4-4-5c10,5,31,10,33,11c0,1-4,1-4,2c-5,1-13-2-17-4c-5-1-11,7-22,4c-2-1-13-8-15-8c0,4,9,12,11,13l0,2c-2,2-5,5-5,7"/>
<path d="M80,24c3,1,11,4,9,5c-3,0-8,0-9-3v-2m-36-4l-2,2c0-1,1-3,1-3c3-6,9-8,14-7l0,1c-8,2-6,12-7,12c-2-1-3-5-6-5m0,34c0-6-8-17,3-22c1,0-2,15,7,19v2c-2,0-3,0-5,0c-1-2-1-1-2-1c0,2,1,5,1,7c-1-1-3-3-4-5m14-26c0-2-2-3,0-4c2,0,3-2,3-4c2,0,5,2,6,3c0,2-1,2-2,4c1,2,1,2,1,4h-1c-2,0-8-1-8,1c-2,0-3,0-5,0c-1-1,1-2,1-3c2,0,3-1,5-1"/>
</svg>`

const imageClass = {
  height: 0.3,
};

const customAPI = {
  ...flexAPI,
  variant: (target: any, value: "danger" | "success") => {
    target.backgroundColor = {
      danger: 0xff0000,
      success: 0x00ff00,
    }[value];
  },
}; //satisfies PropertyAPI

const CustomContainer = buildComponent(ContainerNode, useContainer, customAPI);

export function Test() {
  const [row, setRow] = useState(true);

  return (
    <Canvas
      events={noEvents}
      shadows
      dpr={window.devicePixelRatio}
      gl={{ localClippingEnabled: true }}
      style={{ height: "100vh" }}
    >
      <color attach="background" args={[0]} />
      <XWebPointers />
      <directionalLight shadow-mapSize={2048} castShadow intensity={0.5} position={[0.1, 0.1, 1]} />
      <ambientLight color={0xffffff} intensity={0.5} />
      <Fullscreen
        camera={(ratio) => (
          <OrbitControls
            target={[0, 0, 0]}
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            minDistance={1}
            maxDistance={1}
            mouseButtons={{
              LEFT: MOUSE.RIGHT,
              MIDDLE: MOUSE.MIDDLE,
              RIGHT: MOUSE.LEFT,
            }}
          />
        )}
      >
        {(width, height) => (
          <RootContainer
            pixelSize={1}
            precision={0.001}
            sizeX={width}
            sizeY={height}
            backgroundColor="green"
            alignItems="stretch"
          >
            <Container
              backgroundColor="black"
              gapRow={0}
              gapColumn={0}
              flexDirection={row ? "row" : "column"}
            >
              <Container
                aspectRatio={1}
                height={0.1}
                onClick={() => setRow(!row)}
                backgroundColor="red"
              />
              <Container aspectRatio={1} height={0.1} backgroundColor="red" />
            </Container>
          </RootContainer>
        )}
      </Fullscreen>
    </Canvas>
  );
}

export default function Index() {
  const [show, setShow] = useState(true);
  const [red, setRed] = useState(true);
  const [bold, setBold] = useState(false);

  const obj = useMemo(() => {
    const x = new Mesh(
      new RoundedBoxGeometry(0.2, 0.2, 0.05),
      new MeshPhongMaterial({
        toneMapped: false,
      }),
    );
    x.castShadow = true;
    return x;
  }, []);

  const bgObj = useMemo(() => {
    const x = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshPhongMaterial({
        toneMapped: false,
      }),
    );
    x.receiveShadow = true;
    return x;
  }, []);

  return (
    <>
      <button
        style={{ zIndex: 1, position: "absolute", right: 10, bottom: 10 }}
        onClick={() => setShow((show) => !show)}
      >
        toggle show
      </button>
      <Canvas
        events={noEvents}
        shadows
        dpr={window.devicePixelRatio}
        gl={{ localClippingEnabled: true }}
        style={{ height: "100vh" }}
      >
        <color attach="background" args={[0]} />
        <XWebPointers />
        <RotateUI />
        <AppleUI />
        <directionalLight
          shadow-mapSize={2048}
          castShadow
          intensity={0.5}
          position={[0.1, 0.1, 1]}
        />
        <ambientLight color={0xffffff} intensity={0.5} />
        <Fullscreen
          camera={(ratio) => (
            <OrbitControls
              target={[0.5 * ratio, -0.5, 0]}
              enableZoom={false}
              enablePan={false}
              minDistance={1}
              maxDistance={1}
              mouseButtons={{
                LEFT: MOUSE.RIGHT,
                MIDDLE: MOUSE.MIDDLE,
                RIGHT: MOUSE.LEFT,
              }}
            />
          )}
        >
          {(width, height) =>
            show ? (
              <>
                {false && (
                  <group position={[0, 0, 0]}>
                    <RootContainer
                      padding={0.03}
                      id="root"
                      overflow="scroll"
                      anchorX="left"
                      anchorY="top"
                      pixelSize={1}
                      sizeX={width}
                      sizeY={height}
                    >
                      <Suspense>
                        <Text index={1} fontSize={0.05} color={"white"} id="lorem-ipsum">
                          "But I must explain to you how all this mistaken idea of denouncing
                          pleasure and praising pain was born and I will give you a complete account
                          of the system, and expound the actual teachings of the great explorer of
                          the truth, the master-builder of human happiness."
                        </Text>
                      </Suspense>
                    </RootContainer>
                  </group>
                )}
                <group position={[0, 0, -1]}>
                  <RootObject
                    padding={50}
                    color="gray"
                    id="root"
                    object={bgObj}
                    overflow="scroll"
                    anchorX="left"
                    anchorY="top"
                    sizeX={width}
                    sizeY={height}
                  >
                    <Container flexDirection={red ? "row" : "column"}>
                      <DefaultStyleProvider>
                        <Suspense fallback={null}>
                          <Image index={1} id="image0" classes={[imageClass]} url="example.png">
                            <Text positionType="absolute" positionLeft={30} positionTop={30}>
                              I am outside of the picture
                            </Text>
                          </Image>
                        </Suspense>

                        <Object
                          object={obj}
                          width={200}
                          height={100}
                          index={1.5}
                          color={red ? "red" : "blue"}
                          id="rounded"
                          onClick={() => setRed((red) => !red)}
                        ></Object>

                        <Suspense fallback={null}>
                          <Image
                            borderRadius={50}
                            border={10}
                            borderColor="green"
                            index={2}
                            id="image1"
                            classes={[imageClass]}
                            url="example.png"
                          />
                        </Suspense>
                        <Suspense fallback={null}>
                          <Image
                            borderRadius={10}
                            border={10}
                            borderColor="red"
                            index={2.5}
                            id="image2"
                            width={100}
                            url="test.png"
                          />
                        </Suspense>

                        <Suspense fallback={null}>
                          <SVG id="svg1" index={3} url="example.svg" height={100} />
                          <SVG
                            id="svg2"
                            index={4}
                            color={0xffff00}
                            url="example.svg"
                            height={200}
                          />
                          <SVGFromText id="svg3" index={4} text={text} height={200} />
                        </Suspense>
                        <CustomContainer
                          borderRadius={10}
                          padding={10}
                          index={5}
                          id="x"
                          variant="success"
                        >
                          <Suspense fallback={null}>
                            {bold && (
                              <Text
                                backgroundColor="red"
                                index={0}
                                padding={10}
                                paddingLeft={20}
                                color={0x0}
                                fontSize={16}
                                fontFamily="roboto"
                                onClick={() => setBold(!bold)}
                              >
                                Coconut {"XR"}!
                              </Text>
                            )}
                            {!bold && (
                              <Text
                                backgroundColor="red"
                                index={0}
                                padding={10}
                                paddingLeft={20}
                                color={0x0}
                                fontSize={32}
                                fontFamily="opensans"
                                onClick={() => setBold(!bold)}
                              >
                              Coconut {"XR"}!
                              </Text>
                            )}
                          </Suspense>
                          <Suspense>
                            <Text index={1} color={0x0} id="lorem-ipsum">
                              "But I must explain to you how all this mistaken idea of denouncing
                              pleasure and praising pain was born and I will give you a complete
                              account of the system, and expound the actual teachings of the great
                              explorer of the truth, the master-builder of human happiness."
                            </Text>
                          </Suspense>
                        </CustomContainer>
                        <Container index={6}>
                          <Suspense fallback={null}>
                            <GLTF
                              scaleX={1}
                              scaleY={1}
                              alignItems="center"
                              justifyContent="center"
                              id="gltf"
                              url="example.glb"
                              width={200}
                              index={5}
                              height={200}
                            >
                              <Suspense fallback={null}>
                                <Text index={0} fontSize={8} id="text2" color={0x0}>
                                  COCONUT XR
                                </Text>
                              </Suspense>
                            </GLTF>
                          </Suspense>
                        </Container>
                      </DefaultStyleProvider>
                    </Container>
                  </RootObject>
                </group>
              </>
            ) : (
              <></>
            )
          }
        </Fullscreen>
      </Canvas>
      <KoestlichTestCanvas>
        <Text color="white">Sample Text</Text>
      </KoestlichTestCanvas>
    </>
  );
}

const FancyMaterial = makeBorderMaterial(MeshPhongMaterial, {
  specular: 0x111111,
  shininess: 100,
});

function AppleUI() {
  return (
    <group position={[1, -0.5, 0]}>
      <RootText
        backgroundColor="black"
        color="white"
        anchorX="center"
        anchorY="center"
        padding={16}
        paddingLeft={undefined}
        id="root"
        borderRadius={16}
        borderColor="black"
        borderBend={0.3}
        border={4}
        material={FancyMaterial}
      >
        I look fancy
      </RootText>
    </group>
  );
}

function RotateUI() {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current == null) {
      return;
    }
    ref.current.rotation.y = state.clock.getElapsedTime() * 5;
    ref.current.rotation.x = state.clock.getElapsedTime() * 5;
  });
  return (
    <group position={[0, -0.5, 0]} ref={ref}>
      <RootContainer
        backgroundColor="red"
        anchorX="center"
        anchorY="center"
        padding={0.03}
        id="root"
        pixelSize={0.005}
        overflow="scroll"
      >
        <Suspense>
          <Text index={1} color={"white"} id="lorem-ipsum">
            Hello World!
          </Text>
        </Suspense>
      </RootContainer>
    </group>
  );
}
