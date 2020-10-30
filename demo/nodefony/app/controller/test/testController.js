const Path = path.resolve("..", ".." , "package.json");
const Package = require(Path);
/**
 *	@class appController
 *	@constructor
 *	@param {class} container
 *	@param {class} context
 *  @Route ("/test")
 */
class testController extends nodefony.Controller {

  constructor(container, context) {
    super(container, context);
    // start session
    this.startSession();
  }

  /**
   *    @Route ("",
   *      name="test")
   */
  indexAction() {
    return this.render("app:test:index.html.twig", {
      name: this.kernel.projectName,
      description: this.kernel.package.description,
      package : Package
    });
  }
}

module.exports = testController;
