import { WertikApp } from "."

export interface UseCronJobsProps {
  expression: string
  name: string
  beforeRun?: (app: WertikApp) => void
  afterRun?: (app: WertikApp) => void
  handler: (app: WertikApp) => void
}
