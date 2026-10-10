import { StudioApp } from "@/components/studio/studio-app"
import { Providers } from "./providers"

export default function Home() {
  return (
    <Providers>
      <StudioApp />
    </Providers>
  )
}
