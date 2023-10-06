"use strict";(self.webpackChunknatuerlich_docs=self.webpackChunknatuerlich_docs||[]).push([[467],{7890:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>l,default:()=>h,frontMatter:()=>s,metadata:()=>m,toc:()=>p});var o=n(7462),a=(n(7294),n(3905)),i=n(5851),r=n(1361);const s={},l="Animations",m={unversionedId:"getting-started/gs-animations",id:"getting-started/gs-animations",title:"Animations",description:"Animations are built into koestlich and work out of the box. Almost all properties can be animated. In contrast to HTML/CSS, elements can transition from one place in a layout to another, a feature often referred to as AutoTransition. To declare how UI elements relate between two different layouts, the id property is used. Placing the same id property on two UI components in different layouts will keep the underlying UI element alive and automatically transition. However, both UI components need to have the same type. Therefore, it is impossible to transition an Image to a Text component.",source:"@site/docs/getting-started/gs-animations.md",sourceDirName:"getting-started",slug:"/getting-started/gs-animations",permalink:"/koestlich/getting-started/gs-animations",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"mainSidebar",previous:{title:"Text",permalink:"/koestlich/getting-started/gs-text"},next:{title:"3D Content",permalink:"/koestlich/getting-started/gs-3d-content"}},d={},p=[],c={toc:p},u="wrapper";function h(e){let{components:t,...s}=e;return(0,a.kt)(u,(0,o.Z)({},c,s,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"animations"},"Animations"),(0,a.kt)("p",null,"Animations are built into ",(0,a.kt)("strong",{parentName:"p"},"koestlich")," and work out of the box. Almost all properties can be animated. In contrast to HTML/CSS, elements can transition from one place in a layout to another, a feature often referred to as AutoTransition. To declare how UI elements relate between two different layouts, the ",(0,a.kt)("inlineCode",{parentName:"p"},"id")," property is used. Placing the same ",(0,a.kt)("inlineCode",{parentName:"p"},"id")," property on two UI components in different layouts will keep the underlying UI element alive and automatically transition. However, both UI components need to have the same type. Therefore, it is impossible to transition an Image to a Text component.\nAll Koestlich components have the ",(0,a.kt)("inlineCode",{parentName:"p"},"animation")," property, which can either be set to one of the default animations (",(0,a.kt)("inlineCode",{parentName:"p"},"noAnimation"),", ",(0,a.kt)("inlineCode",{parentName:"p"},"distanceFadeAnimation")," - default) or can be set to a custom animation."),(0,a.kt)("p",null,"The following example shows how the state is controlled via a button, which changes the ordering of components via the index parameter and animates the button's color between green and red."),(0,a.kt)(r.w,{path:"koestlich-animations-gnthy9",mdxType:"CodesandboxEmbed"}),(0,a.kt)(i.Z,{img:n(9332),mdxType:"Image"}),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-tsx"},'import { Canvas } from "@react-three/fiber";\nimport { OrbitControls } from "@react-three/drei";\nimport { RootContainer, Container, Image } from "@coconut-xr/koestlich";\nimport { Suspense, useState } from "react";\n\nexport default function App() {\n  const [state, setState] = useState(true);\n  return (\n    <Canvas>\n      <OrbitControls />\n      <RootContainer backgroundColor="black" sizeX={2} sizeY={1} flexDirection="row">\n        <Container\n          index={0}\n          id="btn"\n          onClick={() => setState(!state)}\n          flexGrow={state ? 2 : 1}\n          margin={48}\n          backgroundColor={state ? "green" : "red"}\n        />\n        <Suspense>\n          <Image\n            index={state ? -1 : 1}\n            id="img"\n            flexBasis={0}\n            flexGrow={1}\n            margin={48}\n            url="example.png"\n          />\n        </Suspense>\n      </RootContainer>\n    </Canvas>\n  );\n}\n')))}h.isMDXComponent=!0},9332:(e,t,n)=>{n.r(t),n.d(t,{default:()=>o});const o=n.p+"assets/images/animations-e729f076b06f4a5febaea3750985931a.gif"}}]);