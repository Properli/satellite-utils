import chai from 'chai';
import { example } from '../src/index';
import 'mocha';

describe('example', () => {
    it('should return hello world', () => {
        chai.expect(example()).to.be.equal('Hello World');
    })
});