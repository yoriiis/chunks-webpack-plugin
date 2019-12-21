'use strict';

var _utils = _interopRequireDefault(require("../utils"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Utils', () => {
  it('should call the setError function', () => {
    expect(() => {
      _utils.default.setError('message');
    }).toThrow(new Error('message'));
  });
  it('should call the writeFile function', () => {
    _fsExtra.default.outputFileSync = jest.fn();

    _utils.default.writeFile({
      outputPath: '/dist/file.html',
      output: 'content'
    });

    expect(_fsExtra.default.outputFileSync).toHaveBeenCalled();
  });
});