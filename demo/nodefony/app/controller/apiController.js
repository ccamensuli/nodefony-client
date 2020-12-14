/**
 *	@class apiController
 *	@constructor
 *	@param {class} container
 *	@param {class} context
 */
class apiController extends nodefony.Controller {

  constructor(container, context) {
    super(container, context);
    // start session
    this.startSession();
    this.myApi =  new nodefony.api.Json({
      name:"myApi",
      version :"1.0.0",
      description:"Test json api"
    }, this);
  }

  /**
   *    @Route ("/demo/api",
   *      name="api")
   */
  indexAction() {
    this.setContextHtml()
    return this.render("app::api.html.twig", {
      name: this.myApi.name,
      description: this.myApi.description

    });
  }

  /**
   *    @Route ("/api/test",
   *      name="api-test")
   */
  testAction(){
    return this.myApi.render({foo:"bar"});
  }
}

module.exports = apiController;
