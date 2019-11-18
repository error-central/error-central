/**
 * To test, run `npm run postinstall`
 */
const installer = require("./installer");
const prompt = require("./prompt");

/**
 * Install error-central
 * @param options
 */
const install = async (options = { name: "", completer: "" }) => {
  const { name, completer } = options;
  if (!name) throw new TypeError("options.name is required");
  if (!completer) throw new TypeError("options.completer is required");

  return prompt().then((x: any) => {
    let location = x.location;
    installer.install({
      name,
      completer,
      location
    });
  }
  );
};

install({
  name: "ec",
  completer: "ec-completer??"
});

