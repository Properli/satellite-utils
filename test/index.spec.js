import chai from 'chai';
import { example } from '../dist'

describe('example', () => {
    it('should return hello world', () => {
        chai.expect(example()).to.be.equal('Hello World');
    })
});