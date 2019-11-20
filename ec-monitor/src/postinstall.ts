/**
 * To test, run `npm run postinstall`
 */
const installer = require("./installer");
const prompt = require("./prompt");

/**
 * Install error-central
 * @param options
 */
const install = async (options = { name: "" }) => {
  const { name } = options;
  if (!name) throw new TypeError("options.name is required");

  return prompt().then((x: any) => {
    let location = x.location;
    installer.install({
      name,
      location
    });
  }
  );
};

install({
  name: "ec"
});

