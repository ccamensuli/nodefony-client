
// dev
import Nodefony from "../../../../../src/nodefony.js";
//console.log(process.env.NODE_ENV)
const nodefony = new Nodefony(process.env.NODE_ENV, process.env.NODE_DEBUG);
import api from "../../../../../src/api/api.js";
api(nodefony);
console.log(nodefony)


window.nodefony = nodefony;


class App extends nodefony.Kernel {
  constructor() {
    super("App", {
      environment: process.env.NODE_ENV || "production",
      debug: process.env.NODE_DEBUG || false
    });
    this.on("load", () => {
      this.initialize();
    });
  }
  initialize(){
    this.log("initialize");
    this.api = new nodefony.Api("myapi",{
      baseUrl:"/api"
    },this);
    this.api.login(undefined, "admin", "admin")
    .then((result)=>{
      console.log(result)
      let interval = setInterval(async ()=>{
        let res = this.api.get("test")
        .then((res)=>{
          this.log(res);
          return res
        })
        .catch((e)=>{
          clearInterval(interval)
        });
      },100)
      return result;
    })
    .catch(e=>{
      this.log(e, "ERROR");
    })
  }

}
export default new App();
