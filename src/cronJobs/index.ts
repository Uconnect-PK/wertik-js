import get from "lodash.get"
import nodeCron from "node-cron"
import { UseCronJobsProps } from "../types/cronJobs"
import { iObject, WertikApp, WertikConfiguration } from "../types"

export const useCronJob = (cron: UseCronJobsProps) => {
  return ({
    configuration,
    wertikApp,
  }: {
    configuration: WertikConfiguration
    wertikApp: WertikApp
  }) => {
    return nodeCron.schedule(cron.expression, () => {
      get(cron, "beforeRun", () => {})(wertikApp)
      cron.handler(wertikApp)
      get(cron, "afterRun", () => {})(wertikApp)
    }) as iObject
  }
}
