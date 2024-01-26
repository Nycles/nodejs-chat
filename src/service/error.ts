import { Err } from './service'

export enum ErrCode {
  FileIsTooLarge = 'file_is_too_large',
  NoFileUploaded = 'no_file_uploaded',
  InvalidMimeType = 'invalid_mime_type',
}

export const expectedErrs = {
  uploadFile: {
    FileIsTooLarge: Err.new('File is too large', ErrCode.FileIsTooLarge),
    NoFileUploaded: Err.new('No file uploaded', ErrCode.NoFileUploaded),
    InvalidMimeType: Err.new('Mime type is not allowed', ErrCode.InvalidMimeType),
  },
}
