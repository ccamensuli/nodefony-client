try {
  //var assert = require('assert');
  var chai = require('chai');
  var assert = chai.assert;
  var Nodefony = require('../../src/nodefony.js').default;
  var nodefony = new Nodefony(process.env.NODE_ENV);
} catch (e) {
  var chai = window.chai;
  var assert = chai.assert;
  var mocha = window.mocha;
}

const defaultOptions = {
  severity: {
    operator: "<=",
    data: "7"
  }
};

describe("NODEFONY SYSLOG", function () {

  before(function () {
    let self = this ;
    global.syslog = new nodefony.Syslog();
    let ret = global.syslog.listenWithConditions( defaultOptions,
      (pdu) => {
        assert.strictEqual(this, self);
        //nodefony.Syslog.normalizeLog(pdu);
        return true
      });
    global.logger = () => {
      global.syslog.log('info', "INFO");
      global.syslog.log('debug', "DEBUG");
      global.syslog.log('notice', "NOTICE");
      global.syslog.log('warning', "WARNING");
      global.syslog.log('error', "ERROR");
      global.syslog.log('alert', "ALERT");
      global.syslog.log('critic', "CRITIC");
      global.syslog.log('emergency', "EMERGENCY");
    }
  });

  describe('CONTRUSTROR ', function () {
    it("Constructor ", function (done) {
      let inst = new nodefony.Syslog({})
      assert.strictEqual(inst.ringStack.length, 0);
      done();
    });
    it("Check options moduleName ", function (done) {
      let inst = new nodefony.Syslog({
        moduleName: "MYMODULE"
      });
      inst.listenWithConditions( defaultOptions,
        (pdu) => {
          assert.strictEqual(pdu.moduleName, 'MYMODULE');
          assert.strictEqual(pdu.severity, 7);
          assert.strictEqual(pdu.payload, "test");
        });
      inst.log("test");
      done();
    });
    it("Check options sevirity ", function (done) {
      let inst = new nodefony.Syslog({
        moduleName: "MYMODULE2",
        defaultSeverity: "ALERT",
      });
      inst.listenWithConditions( defaultOptions,
        (pdu) => {
          assert.strictEqual(pdu.moduleName, 'MYMODULE2');
          assert.strictEqual(pdu.severity, 1);
          assert.strictEqual(pdu.payload, "test");
        });
      inst.log("test");
      done();
    });

    it("Change stack size ", function (done) {
      let inst = new nodefony.Syslog({
        maxStack: 500,
      });
      for (let i = 0; i < 1000; i++) {
        inst.log(i);
      }
      assert.strictEqual(inst.ringStack.length, 500);
      done();
    });
  });

  describe('RING STACK', function () {
    beforeEach(function () {
      //global.syslog.log(this.currentTest.title)
    });
    before(function () {});
    it("100 entries ", function (done) {
      for (let i = 0; i < 100; i++) {
        let pdu = global.syslog.log(i, i % 2 ? "INFO" : "DEBUG");
        assert.strictEqual(pdu.payload, i);
        //assert.strictEqual(pdu.uid, i + 1);
        assert.strictEqual(pdu.severity, i % 2 ? 6 : 7);
        assert.strictEqual(pdu.severityName, i % 2 ? "INFO" : "DEBUG");
        assert.strictEqual(pdu.status, 'ACCEPTED');
        assert.strictEqual(pdu.moduleName, 'SYSLOG');
        assert.strictEqual(pdu.typePayload, "number");
        assert.strictEqual(pdu.msgid, "");
        assert.strictEqual(pdu.msg, "");
      }
      assert.strictEqual(global.syslog.ringStack[0].payload, 0);
      assert.strictEqual(global.syslog.ringStack[99].payload, 99);
      assert.strictEqual(global.syslog.missed, 0);
      assert.strictEqual(global.syslog.invalid, 0);
      assert.strictEqual(global.syslog.valid, 100);
      assert.strictEqual(global.syslog._eventsCount, 1);
      assert.strictEqual(global.syslog._events["onLog"].length, 1);
      done();
    });

    it("1000  entries ", function (done) {
      let i = 0;
      let res = global.syslog.on("onLog",
        (pdu) => {
          return i++
        });
      for (let i = 0; i < 1000; i++) {
        let pdu = global.syslog.log(i, i % 2 ? "INFO" : "DEBUG");
      }
      assert.strictEqual(global.syslog.ringStack.length, 100);
      assert.strictEqual(global.syslog.ringStack[0].payload, 900);
      assert.strictEqual(global.syslog.ringStack[99].payload, 999);
      assert.strictEqual(global.syslog.missed, 0);
      assert.strictEqual(global.syslog.invalid, 0);
      assert.strictEqual(global.syslog.valid, 1100);
      assert.strictEqual(global.syslog._events["onLog"].length, 2);
      assert.strictEqual(i, 1000);
      done();
    });
  });

  describe('getLogStack', function () {
    it("reload 1000  entries ", function (done) {
      let res = global.syslog.getLogStack();
      assert.strictEqual(res.payload, 999);
      res = global.syslog.getLogStack(0, 10);
      assert.strictEqual(res[0].payload, 900);
      assert.strictEqual(res[9].payload, 909);
      res = global.syslog.getLogStack(0);
      assert.strictEqual(res[0].payload, 900);
      assert.strictEqual(res[99].payload, 999);
      res = global.syslog.getLogStack(50);
      assert.strictEqual(res[0].payload, 950);
      assert.strictEqual(res[49].payload, 999);
      res = global.syslog.getLogStack(10, 10);
      assert.strictEqual(res.payload, 989);
      done()
    });
  });

  describe('getLogs conditions ', function () {
    it("getLogs 1000  entries ", function (done) {
      let res = global.syslog.getLogs({
        severity: {
          data: "INFO"
        }
      });
      assert.strictEqual(res.length, 50);
      done();
    });
  });

  describe('loadStack ', function () {

    it("loadStack 1000  entries ", function (done) {
      let inst = new nodefony.Syslog({
        maxStack: 100
      });
      inst.loadStack(global.syslog.ringStack);
      assert.strictEqual(inst.ringStack.length, 100);
      done();
    });
    it("loadStack 1000 events  ", function (done) {
      let inst = new nodefony.Syslog({
        maxStack: 100
      });
      let i = 0;
      inst.listenWithConditions( {
        severity: {
          data: "INFO"
        }
      }, (pdu) => {
        i++;
        //nodefony.Syslog.normalizeLog(pdu);
      });
      inst.loadStack(global.syslog.ringStack, true);
      assert.strictEqual(inst.ringStack.length, 100);
      assert.strictEqual(i, 50);
      done();
    });
    it("loadStack 1000 events  ", function (done) {
      let inst = new nodefony.Syslog({
        maxStack: 100
      });
      let i = 0;
      inst.listenWithConditions( {
        severity: {
          data: "INFO"
        }
      }, (pdu) => {
        i++;
        //nodefony.Syslog.normalizeLog(pdu);
      });
      inst.loadStack(global.syslog.ringStack, true, (pdu) => {
        pdu.before = "add";
      });
      assert.strictEqual(inst.ringStack.length, 100);
      assert.strictEqual(i, 50);
      assert.strictEqual(inst.getLogStack().before, "add");
      done();
    });
  });

  describe('BASE', function () {
    before(function () {
      global.syslog.reset();
    });
    it("LOG sevirity ", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( defaultOptions,
        (pdu) => {
          switch (pdu.severityName) {
          case "EMERGENCY":
            {
              assert.strictEqual(pdu.severity, 0);
              assert.strictEqual(pdu.msgid, "MYMODULE0");
              i++;
              break;
            }
          case "ALERT":
            {
              i++;
              assert.strictEqual(pdu.severity, 1);
              assert.strictEqual(pdu.msgid, "MYMODULE1");
              break;
            }
          case "CRITIC":
            {
              assert.strictEqual(pdu.severity, 2);
              assert.strictEqual(pdu.msgid, "MYMODULE2");
              i++;
              break;
            }
          case "ERROR":
            {
              assert.strictEqual(pdu.severity, 3);
              assert.strictEqual(pdu.msgid, "MYMODULE3");
              i++;
              break;
            }
          case "WARNING":
            {
              assert.strictEqual(pdu.severity, 4);
              assert.strictEqual(pdu.msgid, "MYMODULE4");
              i++;
              break;
            }
          case "NOTICE":
            {
              assert.strictEqual(pdu.severity, 5);
              assert.strictEqual(pdu.msgid, "MYMODULE5");
              i++;
              break;
            }
          case "INFO":
            {
              assert.strictEqual(pdu.severity, 6);
              assert.strictEqual(pdu.msgid, "MYMODULE6");
              i++;
              break;
            }
          case "DEBUG":
            {
              assert.strictEqual(pdu.severity, 7);
              assert.strictEqual(pdu.msgid, "MYMODULE7");
              i++;
              break;
            }
          }
        });
      global.syslog.log("test", "EMERGENCY", "MYMODULE0");
      global.syslog.log("test", "ALERT", "MYMODULE1");
      global.syslog.log("test", "CRITIC", "MYMODULE2");
      global.syslog.log("test", "ERROR", "MYMODULE3");
      global.syslog.log("test", "WARNING", "MYMODULE4");
      global.syslog.log("test", "NOTICE", "MYMODULE5");
      global.syslog.log("test", "INFO", "MYMODULE6");
      global.syslog.log("test", "DEBUG", "MYMODULE7");
      assert.strictEqual(i, 8);
      done();
    });

  });

  describe('SEVERITY', function () {
    beforeEach(function () {
      global.syslog.reset();
      assert.strictEqual(global.syslog._eventsCount, 0);
    });

    it("listener ", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( defaultOptions,
        (pdu) => {
          return i++
        });
      assert.strictEqual(global.syslog._eventsCount, 1);
      for (let i = 0; i < 10; i++) {
        let pdu = global.syslog.log(i, i % 2 ? "INFO" : "DEBUG");
      }
      assert.strictEqual(i, 10);
      done();
    });

    it("Other listener 2 ", function (done) {
      let i = 0;
      global.syslog.listenWithConditions({
          severity: {
            operator: "<=",
            data: "INFO"
          }
        },
        (pdu) => {
          return i++
        });
      assert.strictEqual(global.syslog._eventsCount, 1);
      for (let i = 0; i < 10; i++) {
        let pdu = global.syslog.log(i, i % 2 ? "INFO" : "DEBUG");
      }
      assert.strictEqual(i, 5);
      done();
    });

    it("Other listener 3 ", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            operator: "<=",
            data: "INFO"
          }
        },
        (pdu) => {
          assert.strictEqual(pdu.severity, 6);
          assert.strictEqual(pdu.severityName, "INFO");
          return i++
        });
      assert.strictEqual(global.syslog._eventsCount, 1);
      for (let i = 0; i < 10; i++) {
        let pdu = global.syslog.log(i, i % 2 ? "INFO" : "DEBUG");
      }
      assert.strictEqual(i, 5);
      done();
    });

    it("listener condition severity interger ", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            data: 6
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          assert.strictEqual(pdu.severity, 6);
          assert.strictEqual(pdu.severityName, "INFO");
          return i++
        });
      for (let i = 0; i < 10; i++) {
        let pdu = global.syslog.log(i, i % 2 ? "INFO" : "DEBUG");
      }
      assert.strictEqual(i, 5);
      done();
    });

    it("listener condition severity operator == ", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            operator: "==",
            data: "7"
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          assert.strictEqual(pdu.severity, 7);
          assert.strictEqual(pdu.severityName, "DEBUG");
          return i++
        });
      assert.strictEqual(global.syslog._eventsCount, 1);
      for (let i = 0; i < 10; i++) {
        let pdu = global.syslog.log(i, i % 2 ? "INFO" : "DEBUG");
      }
      assert.strictEqual(i, 5);
      done();
    });
    it("listener condition severity listerner1 ", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            data: "INFO,DEBUG,WARNING"
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 3);
      done();
    });
    it("listener condition severity listerner tab", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            data: ["INFO", "WARNING", "DEBUG"]
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 3);
      done();
    });
    it("listener condition severity listerner tab string", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            data: ["6", "4", "7"]
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 3);
      done();
    });
    it("listener condition severity listerner tab integer", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            data: [6, 4, 7]
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 3);
      done();
    });

    it("listener condition severity listerner >=", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            operator: ">=",
            data: 4
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 4);
      done();
    });
    it("listener condition severity listerner >", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            operator: ">",
            data: 4
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 3);
      done();
    });
    it("listener condition severity listerner <", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            operator: "<",
            data: 4
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 4);
      done();
    });
    it("listener condition severity listerner < string", function (done) {
      let i = 0;
      global.syslog.listenWithConditions( {
          severity: {
            operator: "<",
            data: "WARNING"
          }
        },
        (pdu) => {
          //nodefony.Syslog.normalizeLog(pdu);
          return i++
        });
      global.logger();
      assert.strictEqual(i, 4);
      done();
    });

  });

  describe('MSGID', function () {
    it("listener condition MSGID ", () => {
      return new Promise((resolve, reject) => {
        let i = 0
        global.syslog.listenWithConditions( {
            msgid: {
              data: "NODEFONY"
            }
          },
          (pdu) => {
            i++;
            //nodefony.Syslog.normalizeLog(pdu);
            assert.strictEqual(pdu.msgid, "NODEFONY");
            assert.strictEqual(pdu.payload, "pass");
            if (i === 2) {
              resolve();
            }
          });
        global.syslog.log("pass", "INFO", "NODEFONY")
        global.syslog.log("nopass", "INFO")
        global.syslog.log("pass", "INFO", "NODEFONY")
      })
    });

    it("listener condition MSGID array ", () => {
      return new Promise((resolve, reject) => {
        let i = 0
        global.syslog.listenWithConditions( {
            msgid: {
              data: ["NODEFONY","SIP"]
            }
          },
          (pdu) => {
            i++;
            //nodefony.Syslog.normalizeLog(pdu);
            assert(pdu.msgid === "NODEFONY" || pdu.msgid === "SIP");
            assert.strictEqual(pdu.payload, "pass");
            if (i === 4) {
              resolve();
            }
          });
        global.syslog.log("pass", "INFO", "NODEFONY")
        global.syslog.log("nopass", "INFO")
        global.syslog.log("pass", "INFO", "NODEFONY")
        global.syslog.log("pass", "INFO", "SIP")
        global.syslog.log("nopass", "INFO")
        global.syslog.log("pass", "INFO", "SIP")
      })
    });

  });



  /*    controller.logIntance.listenWithConditions(context,{
   *        checkConditions: "&&",
   *        severity:{
   *            data:"CRITIC,ERROR"
   *            //data:"1,7"
   *        },
   *        date:{
   *            operator:">=",
   *            data:new Date()
   *        },
   *        msgid:{
   *            data:"myFunction"
   *        }*/

});
