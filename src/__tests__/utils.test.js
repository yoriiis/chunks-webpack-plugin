'use strict'

import utils from '../utils'
import fse from 'fs-extra'

describe('Utils', () => {
	it('Initialize the setError function', () => {
		expect(() => {
			utils.setError('message')
		}).toThrow(new Error('message'))
	})

	it('Initialize the isAbsolutePath function', () => {
		expect(utils.isAbsolutePath('dist')).toBe(false)
	})

	it('Initialize the getFileExtension function', () => {
		expect(utils.getFileExtension('css/vendors~app-a~app-b.css')).toBe('css')
	})

	it('Initialize the writeFile function', () => {
		fse.outputFileSync = jest.fn()

		utils.writeFile({
			outputPath: '/dist/file.html',
			output: 'content'
		})

		expect(fse.outputFileSync).toHaveBeenCalled()
	})
})
