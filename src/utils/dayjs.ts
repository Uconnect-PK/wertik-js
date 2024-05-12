import dayjs from "dayjs"
import localizedFormat from "dayjs/plugin/localizedFormat"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(localizedFormat)
dayjs.extend(timezone)

export default dayjs
