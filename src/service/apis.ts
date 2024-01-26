export interface Apis {
  file: FilerApi
}

export interface UploadFileOptions {
  data: Buffer
  key: string
}

export interface GetFileLinkOptions {
  bucket: string
  key: string
}

export interface FilerApi {
  uploadFile: (opt: UploadFileOptions) => Promise<string>
}
