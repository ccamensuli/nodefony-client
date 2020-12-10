export default (nodefony) => {
  class SipError extends nodefony.Error {
    constructor(message, code) {
      super(message, code);
    }
  }
  return SipError;
}
