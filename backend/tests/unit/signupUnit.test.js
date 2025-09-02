// tests/unit/signupUnit.test.js
const { expect } = require('chai');
const { validateEmail } = require('../../utils/validation'); // adjust path

describe('Signup Unit Tests', function() {

    it('should pass for valid email', function() {
        expect(validateEmail('helani@example.com')).to.be.true;
    });

    it('should fail for invalid email', function() {
        expect(validateEmail('helaniexample.com')).to.be.false;
    });
});
