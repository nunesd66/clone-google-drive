import {
    describe,
    test,
    expect,
    jest
} from '@jest/globals'
import fs from 'fs'
import Routes from './../../src/routes.js'
import FileHelper from '../../src/fileHelper.js'

describe('#FileHelper', () => {
    describe('#getFileStatus', () => {
        test('it should return files statuses in correct format', async () => {
            const statMock = {
                dev: 2069,
                mode: 33204,
                nlink: 1,
                uid: 1000,
                gid: 1000,
                rdev: 0,
                blksize: 4096,
                ino: 5257069,
                size: 1166723,
                blocks: 2280,
                atimeMs: 1631320990313.5757,
                mtimeMs: 1631320990265.572,
                ctimeMs: 1631320990265.572,
                birthtimeMs: 1631320990257.5715,
                atime: '2021-09-11T00:43:10.314Z',
                mtime: '2021-09-11T00:43:10.266Z',
                ctime: '2021-09-11T00:43:10.266Z',
                birthtime: '2021-09-11T00:43:10.258Z'
            }

            const mockUser = 'dev'
            process.env.USER = mockUser
            const filename = 'example.zip'

            jest.spyOn(fs.promises, fs.promises.readdir.name)
                .mockResolvedValue([filename])

            jest.spyOn(fs.promises, fs.promises.stat.name)
                .mockResolvedValue(statMock)

            const result = await FileHelper.getFilesStatus("/tmp")
            const expectedResult = [
                {
                    size: "1.17 MB",
                    lastModified: statMock.birthtime,
                    owner: mockUser,
                    file: filename
                }
            ]
            
            expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
            expect(result).toMatchObject(expectedResult)
        })
    })
})