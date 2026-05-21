import { SVGProps } from "react"

const Default = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    width="512mm"
    height="512mm"
    viewBox="0 0 512 512"
    {...props}
  >
    <circle
      cx={256}
      cy={256}
      r={256}
      style={{
        fill: "#1a1a1a",
        fillOpacity: 1,
        stroke: "none",
        strokeWidth: 1.211,
      }}
    />
    <g
      style={{
        color: "currentColor",
        fill: "#fff",
        stroke: "none",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }}
    >
      <path
        d="M4 17.98V9.709c0-3.634 0-5.45 1.172-6.58C6.343 2 8.229 2 12 2c3.771 0 5.657 0 6.828 1.129C20 4.257 20 6.074 20 9.708v8.273c0 2.306 0 3.459-.773 3.871-1.497.8-4.304-1.867-5.637-2.67-.773-.465-1.16-.698-1.59-.698-.43 0-.817.233-1.59.698-1.333.803-4.14 3.47-5.637 2.67C4 21.44 4 20.287 4 17.981Z"
        style={{
          fill: "#fff",
          stroke: "none",
        }}
        transform="translate(110.37 110.37) scale(12.14)"
      />
    </g>
  </svg>
)
export default Default
