import * as React from "react"
import { SVGProps } from "react"

const BrandWord = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 70.366" {...props}>
    <text
      xmlSpace="preserve"
      x={256}
      y={291.442}
      style={{
        fontStyle: "normal",
        fontWeight: 700,
        fontSize: "94px",
        fontFamily: "var(--font-space-mono), monospace",
        textAnchor: "middle",
        fill: "currentColor",
        writingMode: "horizontal-tb",
      }}
      transform="matrix(1.005 0 0 .995 0 -220.8)"
    >
      <tspan x={256} y={291.442}>
        {"REWAY"}
      </tspan>
    </text>
  </svg>
)

export default BrandWord
