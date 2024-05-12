import { QueueOptions } from "bull"

export interface WithQueueProps {
  name: string
  url?: string
  options?: QueueOptions
}
