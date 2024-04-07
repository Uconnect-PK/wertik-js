import Queue from "bull"
import { isPackageInstalled } from "../utils/checkInstalledPackages"
import { WertikApp, WertikConfiguration } from "../types"
import { WithQueueProps } from "./../types/queue"
import { wLog } from "../utils/log"

/**
 * @param name
 * @param url
 * @param opts
 * @returns Queue
 */

export const withQueue = (props: WithQueueProps) => {
  return () => new Queue(props.name, props.url, props.options)
}

export const initializeBullBoard = (props: {
  wertikApp: WertikApp
  configuration: WertikConfiguration
}) => {
  let isInstalledBullBoardExpress = isPackageInstalled("@bull-board/express")
  if (!isInstalledBullBoardExpress) {
    throw new Error(
      "Please install package @bull-board/express to initialize Bull Board for Queue"
    )
  }
  const {
    express,
    queue: { jobs: QueueJobs },
  } = props.wertikApp

  const queueJobsArr = []

  const { createBullBoard } = require("@bull-board/api")
  const { BullAdapter } = require("@bull-board/api/bullAdapter")
  const { ExpressAdapter } = require("@bull-board/express")

  if (QueueJobs) {
    const queuePath =
      props?.configuration?.queue?.options?.uiPath ?? "/admin/queues"
    for (const queueName of Object.keys(QueueJobs || {})) {
      queueJobsArr.push(new BullAdapter(QueueJobs[queueName]))
    }
    const serverAdapter = new ExpressAdapter()
    const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard(
      {
        queues: queueJobsArr,
        serverAdapter: serverAdapter,
      }
    )
    serverAdapter.setBasePath(queuePath)
    express.use(queuePath, serverAdapter.getRouter())

    wLog(
      `Queue UI Monitoring Bull Board running at: http://localhost:${props.configuration.port}${queuePath}`
    )

    return { addQueue, removeQueue, setQueues, replaceQueues }
  }
}
