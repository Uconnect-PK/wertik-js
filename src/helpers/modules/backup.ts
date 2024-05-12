import dayjs from "./../../utils/dayjs"
import { withModule } from "../../modules/modules"
import mysqldump from "mysqldump"
import fs from "fs"
import { wLog } from "../../utils/log"

const dumpDatabase = async (
  dbName: string,
  model: any,
  credentials: {
    host: string
    username: string
    password: string
    name: string
  }
) => {
  const filename = `backups/${dayjs().format(
    "MMMM-DD-YYYY-h-mm-ss-a"
  )}-database-${dbName}.sql`.toLowerCase()

  const backupInstance = await model.create({
    uploaded_filename: filename,
    uploaded_to: "local",
  })

  await mysqldump({
    connection: {
      host: credentials.host,
      user: credentials.username,
      password: credentials.password,
      database: credentials.name,
    },
    dumpToFile: filename,
  })

  return {
    message: "Backup was successfull",
    filename,
    backup: backupInstance,
  }
}
const uploadDumpToDigitalOceanSpaces = async (
  filename,
  digitaloceanInstance,
  Bucket,
  ACL
) => {
  const data = fs.readFileSync(filename)

  const params = {
    Bucket: Bucket,
    Key: `${filename}`,
    Body: data,
    ACL: ACL,
  }

  const response = await digitaloceanInstance.s3.upload(params).promise()

  return response
}
const uploadDumpToDropbox = async (filename, dropboxInstance) => {
  const data: Buffer = fs.readFileSync(filename)
  const response = await dropboxInstance.dropbox.filesUpload({
    strict_conflict: false,
    path: `/${filename}`,
    contents: data,
  })
  return response
}

export const WertikBackupModule = (
  database: string,
  table: string,
  tableOptions: any = {}
) =>
  withModule({
    name: "Backup",
    useDatabase: true,
    database: database,
    table: table,
    tableOptions: tableOptions,
    on: function ({ extendSchema, addMutation }) {
      extendSchema(`
      type BackupSuccessResponse {
        message: String
        filename: String
        backup: BackupModule
      }
    `)
      addMutation({
        name: "backupLocal",
        query: "backupLocal(database: [String]!): [BackupSuccessResponse]",
        async resolver(_, args, context) {
          const push = []
          for (const dbName of args.database) {
            const database = context.wertik.database[dbName]
            if (!database) {
              throw new Error(`No such database ${dbName}`)
            }
            push.push(
              await dumpDatabase(
                dbName,
                context.wertik.database[dbName].instance.models.Backup,
                context.wertik.database[dbName].credentials
              )
            )
          }
          return push
        },
      })
      addMutation({
        name: "backupDigitalOceanSpaces",
        query:
          "backupDigitalOceanSpaces(ACL: String!, Bucket: String!, storage: String!, database: [String]!): [BackupSuccessResponse]",
        async resolver(_, args, context) {
          try {
            const push = []
            const storage = context.wertik.storage[args.storage]
            if (!storage) {
              throw new Error("No such storage found: " + args.storage)
            }

            for (const dbName of args.database) {
              const database = context.wertik.database[dbName]
              if (!database) {
                throw new Error(`No such database ${dbName}`)
              }
              const dump = await dumpDatabase(
                dbName,
                context.wertik.database[dbName].instance.models.Backup,
                context.wertik.database[dbName].credentials
              )
              push.push(dump)

              const uploadToDigitalOcean = await uploadDumpToDigitalOceanSpaces(
                dump.filename,
                storage,
                args.Bucket,
                args.ACL
              )
              await dump.backup.update({
                uploaded_to: "digitalocean",
                uploaded_filename: uploadToDigitalOcean.Tag,
              })
              dump.backup.uploaded_to = "digitalocean"
              dump.backup.uploaded_filename = uploadToDigitalOcean.key
            }

            return push
          } catch (e) {
            throw new Error(e)
          }
        },
      })
      addMutation({
        name: "backupDropbox",
        query:
          "backupDropbox(storage: String!, database: [String]): [BackupSuccessResponse]",
        async resolver(_, args, context) {
          try {
            const push = []
            const storage = context.wertik.storage[args.storage]
            if (!storage) {
              throw new Error("No such storage found: " + args.storage)
            }

            for (const dbName of args.database) {
              const database = context.wertik.database[dbName]
              if (!database) {
                throw new Error(`No such database ${dbName}`)
              }
              const dump = await dumpDatabase(
                dbName,
                context.wertik.database[dbName].instance.models.Backup,
                context.wertik.database[dbName].credentials
              )
              push.push(dump)
              const uploadToDropbox = await uploadDumpToDropbox(
                dump.filename,
                storage
              )
              await dump.backup.update({
                uploaded_to: "dropbox",
                uploaded_filename: uploadToDropbox.result.path_lower,
              })
              dump.backup.uploaded_to = "dropbox"
              dump.backup.uploaded_filename = uploadToDropbox.result.path_lower
            }

            return push
          } catch (e) {
            wLog(e)
            throw new Error(e)
          }
        },
      })
    },
  })
