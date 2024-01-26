import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Config } from '../../config/app'
import { Logger } from '../domain/interfaces/logger'
import * as apis from '../service/apis'

export class AwsS3 {
  private cfg: Config
  private logger: Logger
  private s3: S3Client

  constructor(config: Config, logger: Logger) {
    this.cfg = config
    this.logger = logger
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.cfg.awsS3.accessKeyId,
        secretAccessKey: this.cfg.awsS3.secretAccessKey,
      },
      region: this.cfg.awsS3.region,
    })
  }

  uploadFile = async (opt: apis.UploadFileOptions) => {
    const logger = this.logger.named('uploadFile')

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.cfg.awsS3.bucketName,
          Key: opt.key,
          Body: opt.data,
        })
      )

      const fileUrl = getFileUrl(this.cfg.awsS3.bucketName, this.cfg.awsS3.region, opt.key)

      return fileUrl
    } catch (err) {
      logger.error('Failed to upload file through API', err)
      throw Error('Failed to upload file through API')
    }
  }
}

const getFileUrl = (bucket: string, region: string, key: string) => {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}
