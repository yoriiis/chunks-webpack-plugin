'use strict'

import utils from '../utils'
import fse from 'fs-extra'

describe('Utils', () => {
	it('should init the setError function', () => {
		expect(() => {
			utils.setError('message')
		}).toThrow(new Error('message'))
	})

	it('should init the writeFile function', () => {
		fse.outputFileSync = jest.fn()

		utils.writeFile({
			outputPath: '/dist/file.html',
			output: 'content'
		})

		expect(fse.outputFileSync).toHaveBeenCalled()
	})
})
