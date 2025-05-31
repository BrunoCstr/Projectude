// globals.d.ts
import "next/server"

declare module "next/server" {
  interface NextRequest {
    /** 
     * Dados de geolocalização injetados pelo Next.js Edge Runtime 
     * (latitude, longitude, country, region, city etc)
     */
    geo?: {
      latitude?: number
      longitude?: number
      country?: string
      region?: string
      city?: string
      /** e quaisquer outras que você precise… */
    }
  }
}
