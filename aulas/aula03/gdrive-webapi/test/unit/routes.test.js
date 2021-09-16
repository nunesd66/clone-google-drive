import {
    describe,
    test,
    beforeEach,
    expect,
    jest
} from '@jest/globals'
import UploadHandler from '../../src/uploadHandler.js'
import TestUtil from '../_util/testUtil'
import Routes from './../../src/routes.js'
import { logger } from '../../src/logger.js'

describe('#Routes test suite', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info')
            .mockImplementation()
    })

    const request = TestUtil.generateReadableStream([ 'some file bytes'])
    const response = TestUtil.generateWritableStream(() => {})

    const defaultParams = {
        request: Object.assign(request, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            method: '',
            body: {}
        }),
        response: Object.assign(response, {
            setHeader: jest.fn(),
            writeHead: jest.fn(),
            end: jest.fn()
        }),
        values: () => Object.values(defaultParams)
    }
    
    describe('#setSocketInstance', () => {
        test('setSocket should store io instance', () => {
            const routes = new Routes()
            const ioObj = {
                to: (id) => ioObj,
                emit: (event, message) => {}
            }

            routes.setSocketInstance(ioObj)
            expect(routes.io).toStrictEqual(ioObj)
        })
    })

    describe('#handler', () => {
        test('given an inexistent route it should choose default route', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }

            params.request.method = 'inexistent'
            await routes.handler(...params.values())
            expect(params.response.end).toHaveBeenCalledWith('hello world')
        })

        test('it should set any request with CORS enabled', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }

            params.request.method = 'inexistent'
            await routes.handler(...params.values())
            expect(params.response.setHeader)
                .toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
        })

        test('given method OPTIONS is should choose options route', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }

            params.request.method = 'OPTIONS'
            await routes.handler(...params.values())
            expect(params.response.writeHead).toHaveBeenCalledWith(204)
            expect(params.response.end).toHaveBeenCalled()
        })

        test('given method POST is should choose post route', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }

            params.request.method = 'POST'
            jest.spyOn(routes, routes.post.name).mockResolvedValue()

            await routes.handler(...params.values())
            expect(routes.post).toHaveBeenCalled()
        })

        test('given method GET is should choose get route', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }
            jest.spyOn(routes, routes.get.name).mockResolvedValue()

            params.request.method = 'GET'
            await routes.handler(...params.values())
            expect(routes.get).toHaveBeenCalled()
        })
    })

    describe('#get', () => {
        test('given method GET it should list all files downloaded', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }
            const filesStatusesMock = [
                {
                    size: "1.17 MB",
                    lastModified: '2021-09-11T00:43:10.258Z',
                    owner: 'mockUser',
                    file: 'filename.txt'
                }
            ]
            jest.spyOn(routes.fileHelper, routes.fileHelper.getFilesStatus.name)
                .mockResolvedValue(filesStatusesMock)

            params.request.method = 'GET'
            await routes.handler(...params.values())


            expect(params.response.writeHead).toHaveBeenCalledWith(200)
            expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(filesStatusesMock))
        })
    })

    describe('#post', () => {
        test('it should validade post route workflow', async () => {
            const routes = new Routes('/tmp')
            const options = {
                ...defaultParams
            }
            options.request.method = 'POST'
            options.request.url = '?socketId=10'

            jest.spyOn(
                UploadHandler.prototype,
                UploadHandler.prototype.registerEvents.name
            ).mockImplementation((headers, onFinish) => {
                const writable = TestUtil.generateWritableStream(() => {})
                writable.on("finish", onFinish)

                return writable
            })

            await routes.handler(...options.values()) 

            expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
            expect(options.response.writeHead).toHaveBeenCalledWith(200)

            const expectResult = JSON.stringify({ result: 'Files uploaded with success! '})
            expect(options.response.end).toHaveBeenCalledWith(expectResult)
        })
    })
})