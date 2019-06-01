import Model from "./../model/model";
import {models} from "./../database/connection";
import {join} from "path";

let modules = process.env.MODULES_ENABLED.split(",");
let predefinedModules = process.env.PREDEFINED_MODULES.split(",");
let allModels = {};

predefinedModules.forEach((moduleName, index) => {
  if (moduleName !== "auth") {
    allModels[`${moduleName}Model`] = new Model({
      models: models,
      tableName: moduleName.toLowerCase(moduleName)
    });
  }
});

export default allModels;