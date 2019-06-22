const { commands, window, Uri } = require("vscode");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const slugify = require("slugify");

const createUrl = (title, product) => {
  // TODO: Remove product from title slug

  // @ts-ignore
  const titleSlug = slugify(title.trim(), {
    lower: true
  });
  // @ts-ignore
  const productSlug = slugify(product.trim(), {
    lower: true
  });
  return "/" + [productSlug, titleSlug].join("/") + "/";
};

async function activate(context) {
  //  const createDraft = async (uri) => {

  // }

  let disposable = commands.registerCommand(
    "extension.createDraft",
    async uri => {
      // TODO: Default to a user-defined directory
      if (!uri) {
        uri["path"] = "...";
        return;
      }

      // Ask the user for a title
      const title = await window.showInputBox({
        placeHolder: "Title",
        prompt: "Choose a title for the topic."
      });

      // Return error if a title hasn't been defined
      if (!title) {
        window.showErrorMessage("You need to choose a title for the topic.");
        return;
      }

      // Ask the user for a product
      const product = await window.showQuickPick(
        ["Analytics", "Exchange", "Maestro", "Manager", "Workspaces"],
        { placeHolder: "Product" }
      );

      // Ask the user for a persona
      const persona = await window.showQuickPick(
        ["Form Builder", "Platform Developer", "Template Designer"],
        { placeHolder: "Persona" }
      );

      // If uri.path is a file path, get its parent directory
      const directoryPath = fs.statSync(uri.path).isFile()
        ? path.dirname(uri.path)
        : uri.path;

      // Define the directory and file paths
      // EXAMPLE:
      // title/
      // 	images/
      // 		.keep
      // 	index.md
      const topicDirectoryPath = path.join(directoryPath, title);
      const topicImagesDirectoryPath = path.join(topicDirectoryPath, "images");
      const topicImagesKeepPath = path.join(topicImagesDirectoryPath, ".keep");
      const topicPath = path.join(topicDirectoryPath, "index.md");

      // Return error if the topic already exists
      if (fs.existsSync(topicDirectoryPath)) {
        window.showErrorMessage("A topic by that name already exists.");
        return;
      }

      // Create the document
      // const document = new Document({ title, product, persona }).markdown();
      const document =
        "---\n" +
        yaml.safeDump({
          title: title,
          product: product,
          persona: persona,
          version_available: "",
          version_updated: "",
          version_deprecated: "",
          version_removed: "",
          url: createUrl(title, product),
          type: "topic"
        }) +
        "---\n";

      // Create the relevant directories and files
      fs.mkdirSync(topicDirectoryPath);
      fs.mkdirSync(topicImagesDirectoryPath);
      fs.writeFileSync(topicImagesKeepPath, "");
      fs.writeFileSync(topicPath, document);

      // Show the file in the editor
      window.showTextDocument(Uri.parse(topicPath));
    }
  );

  context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
