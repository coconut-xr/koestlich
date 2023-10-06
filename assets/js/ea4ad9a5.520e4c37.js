"use strict";(self.webpackChunknatuerlich_docs=self.webpackChunknatuerlich_docs||[]).push([[470],{2571:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>c,frontMatter:()=>a,metadata:()=>r,toc:()=>p});var n=i(7462),s=(i(7294),i(3905));i(5851),i(1361);const a={},o="Scaling & Sizing",r={unversionedId:"getting-started/gs-scaling",id:"getting-started/gs-scaling",title:"Scaling & Sizing",description:"TLDR: Use the optional paramters sizeX and sizeY to define a specific size of the UI in three.js units. Use pixelSize to scale the pixels units of the UI instead of increasing the size of the individual elements (normal text should have a default size of 16px like in the web).",source:"@site/docs/getting-started/gs-scaling.md",sourceDirName:"getting-started",slug:"/getting-started/gs-scaling",permalink:"/koestlich/getting-started/gs-scaling",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"mainSidebar",previous:{title:"First Layout",permalink:"/koestlich/getting-started/gs-first-layout"},next:{title:"Asynchronous Content",permalink:"/koestlich/getting-started/gs-async"}},l={},p=[],d={toc:p},h="wrapper";function c(e){let{components:t,...i}=e;return(0,s.kt)(h,(0,n.Z)({},d,i,{components:t,mdxType:"MDXLayout"}),(0,s.kt)("h1",{id:"scaling--sizing"},"Scaling & Sizing"),(0,s.kt)("p",null,(0,s.kt)("strong",{parentName:"p"},"TLDR"),": Use the optional paramters ",(0,s.kt)("inlineCode",{parentName:"p"},"sizeX")," and ",(0,s.kt)("inlineCode",{parentName:"p"},"sizeY")," to define a specific size of the UI in three.js units. Use ",(0,s.kt)("inlineCode",{parentName:"p"},"pixelSize")," to scale the pixels units of the UI instead of increasing the size of the individual elements (normal text should have a default size of ",(0,s.kt)("inlineCode",{parentName:"p"},"16px")," like in the web)."),(0,s.kt)("details",null,(0,s.kt)("summary",null,"In Depth Explanation"),(0,s.kt)("p",null,"  The size of the root element is specified in three.js units using the optional ",(0,s.kt)("inlineCode",{parentName:"p"},"sizeX")," and ",(0,s.kt)("inlineCode",{parentName:"p"},"sizeY")," parameters."),(0,s.kt)("p",null,"  Declaring the size of elements inside the root element using parameters, such as the ",(0,s.kt)("inlineCode",{parentName:"p"},"width")," of an image or the ",(0,s.kt)("inlineCode",{parentName:"p"},"fontSize")," of a text element, is based on ",(0,s.kt)("inlineCode",{parentName:"p"},"pixel")," units, which strongly relate to the ",(0,s.kt)("inlineCode",{parentName:"p"},"px")," unit in css. The relation between three.js units and pixel units can be set using the ",(0,s.kt)("inlineCode",{parentName:"p"},"pixelSize")," property. The property expresses the size of one pixel in three.js units and defaults to ",(0,s.kt)("inlineCode",{parentName:"p"},"0.002"),". With this default, ",(0,s.kt)("inlineCode",{parentName:"p"},"500px")," is equal to 1 three.js unit. To make interoperability between code bases and different component libraries easier, we encourage to use the intuition of pixel sizes from the web. For instance, the default text height relates to 16 pixels. If these pixel sizes appear too small or too high in the szene, the ",(0,s.kt)("inlineCode",{parentName:"p"},"pixelSize")," should be increased or decreased respectively."),(0,s.kt)("p",null,"  Another property exposed by the ",(0,s.kt)("inlineCode",{parentName:"p"},"RootContainer")," is the ",(0,s.kt)("inlineCode",{parentName:"p"},"precision"),", which expresses the resolution of the units. For instance, the default ",(0,s.kt)("inlineCode",{parentName:"p"},"precision")," of ",(0,s.kt)("inlineCode",{parentName:"p"},"0.1")," allows the layout engine to interprete the values ",(0,s.kt)("inlineCode",{parentName:"p"},"0.5")," and ",(0,s.kt)("inlineCode",{parentName:"p"},"0.4")," correctly but will misinterprete ",(0,s.kt)("inlineCode",{parentName:"p"},"0.45"),". Additionall,y the precision influeces the z-offset between nested components. If z-fighting occurs the precision should be increased.")))}c.isMDXComponent=!0}}]);