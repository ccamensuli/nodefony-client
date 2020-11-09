/**
 *	@class appController
 *	@constructor
 *	@param {class} container
 *	@param {class} context
 */
class sipController extends nodefony.Controller {

  constructor(container, context) {
    super(container, context);
    // start session
    this.startSession();
  }

  /**
   *    @Route ("/sip",
   *      name="sip")
   */
  async indexAction() {
    const readme = path.resolve(__dirname, "..", "..","docker", "asterisk", "README.md");
    const md = new nodefony.File(readme);
    const content = await md.content();
    return this.render("app::sip.html.twig", {
      name: this.kernel.projectName,
      description: this.kernel.package.description,
      readme: await this.htmlMdParser(content)
    });
  }
}

module.exports = sipController;
