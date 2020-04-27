'use strict';

import utils from '../utils';
import fse from 'fs-extra';
import path from 'path';

describe('Utils setError', () => {
	it('Should call the setError function', () => {
		expect(() => {
			utils.setError('message');
		}).toThrow(new Error('message'));
	});
});

describe('Utils isAbsolutePath', () => {
	it('Should call the isAbsolutePath function with relative path', () => {
		jest.spyOn(path, 'isAbsolute');

		const currentPath = 'dist/';

		expect(utils.isAbsolutePath(currentPath)).toBe(false);
		expect(path.isAbsolute).toHaveBeenCalledWith(currentPath);
	});

	it('Should call the isAbsolutePath function with absolute path', () => {
		jest.spyOn(path, 'isAbsolute');

		const currentPath = '/dist/';

		expect(utils.isAbsolutePath(currentPath)).toBe(true);
		expect(path.isAbsolute).toHaveBeenCalledWith(currentPath);
	});
});

describe('Utils getFileExtension', () => {
	it('Should call the getFileExtension function', () => {
		jest.spyOn(path, 'extname');

		const file = 'css/vendors~app-a~app-b.css';

		expect(utils.getFileExtension(file)).toBe('css');
		expect(path.extname).toHaveBeenCalledWith(file);
	});
});

describe('Utils writeFile', () => {
	it('Should call the writeFile function', () => {
		fse.outputFileSync = jest.fn();

		const outputPath = '/dist/file.html';
		const output = 'content';
		utils.writeFile({ outputPath, output });

		expect(fse.outputFileSync).toHaveBeenCalledWith(outputPath, output);
	});
});
